import AppError from '../errors/AppError';
import { getCustomRepository } from 'typeorm';
import TransactionsRepository from './../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    //se existir apaga, senão devolve erro
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const transaction = await transactionsRepository.findOne(id);

    if (!transaction) throw new AppError('Transaction does not exixts');

    await transactionsRepository.remove(transaction);
  }
}

export default DeleteTransactionService;
