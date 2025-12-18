import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateExternalVehicleMovements1700000000012 implements MigrationInterface {
  name = 'CreateExternalVehicleMovements1700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "external_vehicle_movements" (
        "id" uniqueidentifier NOT NULL DEFAULT NEWID(),
        "vehiclePlate" nvarchar(50) NOT NULL,
        "area" nvarchar(100) NOT NULL,
        "movementType" nvarchar(20) NOT NULL,
        "status" nvarchar(20) NOT NULL DEFAULT 'completed',
        "driverName" nvarchar(100) NOT NULL,
        "destination" nvarchar(100),
        "recordedById" uniqueidentifier NOT NULL,
        "recordedAt" datetime2 NOT NULL,
        "createdAt" datetime2 NOT NULL DEFAULT getdate(),
        "updatedAt" datetime2 NOT NULL DEFAULT getdate(),
        CONSTRAINT "PK_external_vehicle_movements" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_external_vehicle_movements_movementType" CHECK ("movementType" IN ('entry', 'exit')),
        CONSTRAINT "CHK_external_vehicle_movements_status" CHECK ("status" IN ('pending', 'completed', 'cancelled')),
        CONSTRAINT "FK_external_vehicle_movements_user" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE NO ACTION
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_external_vehicle_movements_vehiclePlate" ON "external_vehicle_movements" ("vehiclePlate")`);
    await queryRunner.query(`CREATE INDEX "IDX_external_vehicle_movements_area" ON "external_vehicle_movements" ("area")`);
    await queryRunner.query(`CREATE INDEX "IDX_external_vehicle_movements_movementType" ON "external_vehicle_movements" ("movementType")`);
    await queryRunner.query(`CREATE INDEX "IDX_external_vehicle_movements_status" ON "external_vehicle_movements" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_external_vehicle_movements_recordedAt" ON "external_vehicle_movements" ("recordedAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_external_vehicle_movements_recordedById" ON "external_vehicle_movements" ("recordedById")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_external_vehicle_movements_recordedById" ON "external_vehicle_movements"`);
    await queryRunner.query(`DROP INDEX "IDX_external_vehicle_movements_recordedAt" ON "external_vehicle_movements"`);
    await queryRunner.query(`DROP INDEX "IDX_external_vehicle_movements_status" ON "external_vehicle_movements"`);
    await queryRunner.query(`DROP INDEX "IDX_external_vehicle_movements_movementType" ON "external_vehicle_movements"`);
    await queryRunner.query(`DROP INDEX "IDX_external_vehicle_movements_area" ON "external_vehicle_movements"`);
    await queryRunner.query(`DROP INDEX "IDX_external_vehicle_movements_vehiclePlate" ON "external_vehicle_movements"`);
    await queryRunner.query(`DROP TABLE "external_vehicle_movements"`);
  }
}
