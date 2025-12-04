"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEmployeesTable1700000000002 = void 0;
class CreateEmployeesTable1700000000002 {
    constructor() {
        this.name = 'CreateEmployeesTable1700000000002';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1 FROM sys.tables t
        INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
        WHERE t.name = 'employees' AND s.name = 'dbo'
      )
      BEGIN
        CREATE TABLE [dbo].[employees] (
          [id] uniqueidentifier NOT NULL CONSTRAINT [PK_employees_id] PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
          [employeeId] nvarchar(20) NOT NULL,
          [firstName] nvarchar(50) NOT NULL,
          [lastName] nvarchar(50) NOT NULL,
          [email] nvarchar(100) NOT NULL,
          [phone] nvarchar(20) NULL,
          [department] nvarchar(100) NOT NULL,
          [position] nvarchar(100) NULL,
          [isActive] bit NOT NULL CONSTRAINT [DF_employees_isActive] DEFAULT 1,
          [createdAt] datetime2 NOT NULL CONSTRAINT [DF_employees_createdAt] DEFAULT getdate(),
          [updatedAt] datetime2 NOT NULL CONSTRAINT [DF_employees_updatedAt] DEFAULT getdate(),
          CONSTRAINT [UQ_employees_employeeId] UNIQUE ([employeeId]),
          CONSTRAINT [UQ_employees_email] UNIQUE ([email])
        );

        CREATE INDEX [IDX_employees_department] ON [dbo].[employees] ([department]);
      END
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.tables t
        INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
        WHERE t.name = 'employees' AND s.name = 'dbo'
      )
      BEGIN
        DROP TABLE [dbo].[employees];
      END
    `);
    }
}
exports.CreateEmployeesTable1700000000002 = CreateEmployeesTable1700000000002;
//# sourceMappingURL=1700000000002-CreateEmployeesTable.js.map