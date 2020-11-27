import { getCustomRepository, getRepository, In } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';
import Transaction from '../models/Transaction';
import TransactionsRepository from './../repositories/TransactionsRepository';
import Category from './../models/Category';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);
    const contactsReadStream = fs.createReadStream(filePath);

    const parsers = csvParse({
      delimiter: ',',
      from_line: 2, //começa na linha 2 e ignora o cabeçalho
    });

    //vai lendo as linhas
    //conforme elas estão disponíveis
    const parseCSV = contactsReadStream.pipe(parsers);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      //tirando os espaços em branco dos campos
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );
      //se por acaso não tiver alguns desses campos não dá p importar
      if (!title || !type || !value) return;

      //fazendo uma book transaction q ao invés de abrir e fechar a conexão
      //para cada linha ou transação, junto tudo e faço de uma vez
      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    //como o método parseCSV é assincrono eu tenho q criar uma promise
    //para poder ter acesso ao categories e transactions assim q o
    //parseCSV emitir o evento 'end'
    await new Promise(resolve => parseCSV.on('end', resolve));

    //verificar se todas as categorias exitem no banco de dados
    const existentCategories = await categoriesRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTitles = existentCategories.map(
      (category: Category) => category.title,
    );

    const categoriesToAdd = categories
      .filter(category => !existentCategoriesTitles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index); //para tirar categorias duplicadas

    //começando o book insert
    //mapeando as categorias
    const newCategories = categoriesRepository.create(
      categoriesToAdd.map(title => ({ title })),
    );

    await categoriesRepository.save(newCategories);

    const allCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionsRepository.save(createdTransactions);

    //apagando o arquivo csv
    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
