import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveVisitorIdUniqueConstraint1700000000001 implements MigrationInterface {
  name = 'RemoveVisitorIdUniqueConstraint1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the unique constraint on idNumber to allow repeat visitors
    await queryRunner.query(`ALTER TABLE "visitors" DROP CONSTRAINT "UQ_visitors_idNumber"`);
    
    // Drop the unique index that was created for idNumber
    await queryRunner.query(`DROP INDEX "IDX_visitors_idNumber" ON "visitors"`);
    
    // Create a regular (non-unique) index for better query performance
    await queryRunner.query(`CREATE INDEX "IDX_visitors_idNumber" ON "visitors" ("idNumber")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the regular index
    await queryRunner.query(`DROP INDEX "IDX_visitors_idNumber" ON "visitors"`);
    
    // Note: We cannot simply recreate the unique constraint because there might be 
    // duplicate idNumbers in the database after this migration has been run.
    // If rollback is needed, manual data cleanup would be required first.
    
    // Recreate unique constraint (this will fail if duplicates exist)
    await queryRunner.query(`ALTER TABLE "visitors" ADD CONSTRAINT "UQ_visitors_idNumber" UNIQUE ("idNumber")`);
    
    // Recreate unique index
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_visitors_idNumber" ON "visitors" ("idNumber")`);
  }
}