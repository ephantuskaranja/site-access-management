import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRequirePasswordChangeColumn1700000000003 implements MigrationInterface {
  name = 'AddRequirePasswordChangeColumn1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add requirePasswordChange column to users table
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD "requirePasswordChange" bit NOT NULL 
      CONSTRAINT "DF_users_requirePasswordChange" DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the requirePasswordChange column
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP CONSTRAINT "DF_users_requirePasswordChange"
    `);
    
    await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "requirePasswordChange"
    `);
  }
}