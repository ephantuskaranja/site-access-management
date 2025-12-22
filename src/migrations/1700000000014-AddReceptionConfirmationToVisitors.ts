import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddReceptionConfirmationToVisitors1700000000014 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('visitors', [
      new TableColumn({
        name: 'receptionConfirmedAt',
        type: 'datetime',
        isNullable: true,
      }),
      new TableColumn({
        name: 'receptionConfirmedById',
        type: 'varchar',
        length: '36',
        isNullable: true,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('visitors', 'receptionConfirmedById');
    await queryRunner.dropColumn('visitors', 'receptionConfirmedAt');
  }
}
