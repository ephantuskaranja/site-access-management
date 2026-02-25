import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDriversTable1700000000016 implements MigrationInterface {
  name = 'CreateDriversTable1700000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "drivers" (
        "id" uniqueidentifier NOT NULL DEFAULT NEWID(),
        "name" nvarchar(100) NOT NULL,
        "status" nvarchar(20) NOT NULL DEFAULT 'active',
        "passCode" nvarchar(4) NOT NULL,
        "createdAt" datetime2 NOT NULL DEFAULT getdate(),
        "updatedAt" datetime2 NOT NULL DEFAULT getdate(),
        CONSTRAINT "PK_drivers" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_drivers_status" CHECK ("status" IN ('active', 'inactive'))
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_drivers_name" ON "drivers" ("name")`);
    await queryRunner.query(`CREATE INDEX "IDX_drivers_status" ON "drivers" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_drivers_passCode" ON "drivers" ("passCode")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_drivers_passCode" ON "drivers"`);
    await queryRunner.query(`DROP INDEX "IDX_drivers_status" ON "drivers"`);
    await queryRunner.query(`DROP INDEX "IDX_drivers_name" ON "drivers"`);
    await queryRunner.query(`DROP TABLE "drivers"`);
  }
}
