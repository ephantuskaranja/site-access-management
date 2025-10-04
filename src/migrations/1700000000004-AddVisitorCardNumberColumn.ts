import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVisitorCardNumberColumn1700000000004 implements MigrationInterface {
  name = 'AddVisitorCardNumberColumn1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add visitorCardNumber column to visitors table
    await queryRunner.query(`
      ALTER TABLE "visitors" 
      ADD "visitorCardNumber" nvarchar(50) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the visitorCardNumber column
    await queryRunner.query(`
      ALTER TABLE "visitors" 
      DROP COLUMN "visitorCardNumber"
    `);
  }
}