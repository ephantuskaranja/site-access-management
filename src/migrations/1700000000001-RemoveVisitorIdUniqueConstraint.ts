import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveVisitorIdUniqueConstraint1700000000001 implements MigrationInterface {
  name = 'RemoveVisitorIdUniqueConstraint1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop the unique constraint on idNumber to allow repeat visitors (if it exists)
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.objects o
        WHERE o.type = 'UQ' AND o.name = 'UQ_visitors_idNumber'
      )
      ALTER TABLE "visitors" DROP CONSTRAINT "UQ_visitors_idNumber";
    `);

    // Drop the unique index for idNumber if present
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1
        FROM sys.indexes i
        INNER JOIN sys.objects o ON i.object_id = o.object_id
        WHERE o.name = 'visitors' AND i.name = 'IDX_visitors_idNumber'
      )
      DROP INDEX "IDX_visitors_idNumber" ON "visitors";
    `);

    // Ensure a regular (non-unique) index exists for better query performance
    await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes i
        INNER JOIN sys.objects o ON i.object_id = o.object_id
        WHERE o.name = 'visitors' AND i.name = 'IDX_visitors_idNumber'
      )
      CREATE INDEX "IDX_visitors_idNumber" ON "visitors" ("idNumber");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the regular index if present
    await queryRunner.query(`
      IF EXISTS (
        SELECT 1
        FROM sys.indexes i
        INNER JOIN sys.objects o ON i.object_id = o.object_id
        WHERE o.name = 'visitors' AND i.name = 'IDX_visitors_idNumber'
      )
      DROP INDEX "IDX_visitors_idNumber" ON "visitors";
    `);
    
    // Note: We cannot simply recreate the unique constraint because there might be 
    // duplicate idNumbers in the database after this migration has been run.
    // If rollback is needed, manual data cleanup would be required first.
    
    // Recreate unique constraint (this will fail if duplicates exist)
    await queryRunner.query(`ALTER TABLE "visitors" ADD CONSTRAINT "UQ_visitors_idNumber" UNIQUE ("idNumber")`);
    
    // Recreate unique index
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_visitors_idNumber" ON "visitors" ("idNumber")`);
  }
}