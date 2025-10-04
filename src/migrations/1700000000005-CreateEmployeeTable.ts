import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmployeeTable1700000000005 implements MigrationInterface {
  name = 'CreateEmployeeTable1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create employees table
    await queryRunner.query(`
      CREATE TABLE "employees" (
        "id" uniqueidentifier NOT NULL CONSTRAINT "DF_employees_id" DEFAULT NEWID(),
        "employeeId" nvarchar(20) NOT NULL,
        "firstName" nvarchar(50) NOT NULL,
        "lastName" nvarchar(50) NOT NULL,
        "email" nvarchar(100) NOT NULL,
        "phone" nvarchar(20) NULL,
        "department" nvarchar(100) NOT NULL,
        "position" nvarchar(100) NULL,
        "isActive" bit NOT NULL CONSTRAINT "DF_employees_isActive" DEFAULT 1,
        "createdAt" datetime2 NOT NULL CONSTRAINT "DF_employees_createdAt" DEFAULT getdate(),
        "updatedAt" datetime2 NOT NULL CONSTRAINT "DF_employees_updatedAt" DEFAULT getdate(),
        CONSTRAINT "PK_employees" PRIMARY KEY ("id")
      )
    `);

    // Create unique constraints
    await queryRunner.query(`
      ALTER TABLE "employees" 
      ADD CONSTRAINT "UQ_employees_email" UNIQUE ("email")
    `);

    await queryRunner.query(`
      ALTER TABLE "employees" 
      ADD CONSTRAINT "UQ_employees_employeeId" UNIQUE ("employeeId")
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_employees_email" ON "employees" ("email")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_employees_employeeId" ON "employees" ("employeeId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_employees_department" ON "employees" ("department")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`DROP INDEX "IDX_employees_department" ON "employees"`);
    await queryRunner.query(`DROP INDEX "IDX_employees_employeeId" ON "employees"`);
    await queryRunner.query(`DROP INDEX "IDX_employees_email" ON "employees"`);
    
    // Drop constraints
    await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "UQ_employees_employeeId"`);
    await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "UQ_employees_email"`);
    
    // Drop table
    await queryRunner.query(`DROP TABLE "employees"`);
  }
}