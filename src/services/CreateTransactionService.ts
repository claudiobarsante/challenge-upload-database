import AppError from '../errors/AppError';
import Transaction from '../models/Transaction';
import { getRepository, getCustomRepository } from 'typeorm';
import Category from './../models/Category';
import TransactionsRepository from './../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}
export default class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    //Verificando se a categoria existe, se existir pego só id senão gravo e retorno o id
    const categoryRepository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('You do not have enough balance');
    }

    let transactionCategory = await categoryRepository.findOne({
      where: { title: category },
    });

    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(transactionCategory);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: transactionCategory, //como lá na módel tá mapeado category:Category p coluna category_id
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}
