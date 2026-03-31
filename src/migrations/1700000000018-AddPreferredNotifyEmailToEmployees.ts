import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddPreferredNotifyEmailToEmployees1700000000018 implements MigrationInterface {
  name = 'AddPreferredNotifyEmailToEmployees1700000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'employees',
      new TableColumn({
        name: 'preferredNotifyEmail',
        type: 'varchar',
        length: '100',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('employees', 'preferredNotifyEmail');
  }
}
