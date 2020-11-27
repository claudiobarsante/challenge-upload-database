import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class CreateColumnTypeInTransactions1606440702521
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'transactions',
      new TableColumn({
        name: 'type',
        type: 'varchar',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('transactions', 'type');
  }
}
