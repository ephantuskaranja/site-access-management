import { MigrationInterface, QueryRunner } from 'typeorm';

export class RelaxUserEmployeeIdConstraint1700000000017 implements MigrationInterface {
  public readonly name = 'RelaxUserEmployeeIdConstraint1700000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the unique constraint on users.employeeId if it exists
    await queryRunner.query(`IF EXISTS (SELECT 1 FROM sys.objects WHERE name = 'UQ_users_employeeId')
      ALTER TABLE "users" DROP CONSTRAINT "UQ_users_employeeId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate the unique constraint if the migration is rolled back
    await queryRunner.query(`IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE name = 'UQ_users_employeeId')
      ALTER TABLE "users" ADD CONSTRAINT "UQ_users_employeeId" UNIQUE ("employeeId")`);
  }
}
