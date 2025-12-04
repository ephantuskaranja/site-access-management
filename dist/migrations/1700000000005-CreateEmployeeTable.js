"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEmployeeTable1700000000005 = void 0;
class CreateEmployeeTable1700000000005 {
    constructor() {
        this.name = 'CreateEmployeeTable1700000000005';
    }
    async up(queryRunner) {
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
        await queryRunner.query(`
      ALTER TABLE "employees" 
      ADD CONSTRAINT "UQ_employees_email" UNIQUE ("email")
    `);
        await queryRunner.query(`
      ALTER TABLE "employees" 
      ADD CONSTRAINT "UQ_employees_employeeId" UNIQUE ("employeeId")
    `);
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
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_employees_department" ON "employees"`);
        await queryRunner.query(`DROP INDEX "IDX_employees_employeeId" ON "employees"`);
        await queryRunner.query(`DROP INDEX "IDX_employees_email" ON "employees"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "UQ_employees_employeeId"`);
        await queryRunner.query(`ALTER TABLE "employees" DROP CONSTRAINT "UQ_employees_email"`);
        await queryRunner.query(`DROP TABLE "employees"`);
    }
}
exports.CreateEmployeeTable1700000000005 = CreateEmployeeTable1700000000005;
//# sourceMappingURL=1700000000005-CreateEmployeeTable.js.map