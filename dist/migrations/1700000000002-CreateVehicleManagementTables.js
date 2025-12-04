"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateVehicleManagementTables1700000000002 = void 0;
class CreateVehicleManagementTables1700000000002 {
    constructor() {
        this.name = 'CreateVehicleManagementTables1700000000002';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE "vehicles" (
        "id" uniqueidentifier NOT NULL DEFAULT NEWID(),
        "licensePlate" nvarchar(20) NOT NULL,
        "make" nvarchar(50),
        "model" nvarchar(50),
        "year" int,
        "color" nvarchar(30),
        "type" nvarchar(20) NOT NULL DEFAULT 'car',
        "status" nvarchar(20) NOT NULL DEFAULT 'active',
        "department" nvarchar(100),
        "assignedDriver" nvarchar(100),
        "currentMileage" decimal(10,2),
        "notes" ntext,
        "isActive" bit NOT NULL DEFAULT 1,
        "createdAt" datetime2 NOT NULL DEFAULT getdate(),
        "updatedAt" datetime2 NOT NULL DEFAULT getdate(),
        CONSTRAINT "PK_vehicles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_vehicles_licensePlate" UNIQUE ("licensePlate"),
        CONSTRAINT "CHK_vehicles_type" CHECK ("type" IN ('car', 'truck', 'van', 'motorcycle', 'bus', 'other')),
        CONSTRAINT "CHK_vehicles_status" CHECK ("status" IN ('active', 'inactive', 'maintenance', 'retired'))
      )
    `);
        await queryRunner.query(`
      CREATE TABLE "vehicle_movements" (
        "id" uniqueidentifier NOT NULL DEFAULT NEWID(),
        "vehicleId" uniqueidentifier NOT NULL,
        "area" nvarchar(100) NOT NULL,
        "movementType" nvarchar(20) NOT NULL,
        "status" nvarchar(20) NOT NULL DEFAULT 'completed',
        "mileage" decimal(10,2) NOT NULL,
        "driverName" nvarchar(100) NOT NULL,
        "driverPhone" nvarchar(20),
        "driverLicense" nvarchar(100),
        "purpose" ntext,
        "notes" ntext,
        "recordedById" uniqueidentifier NOT NULL,
        "recordedAt" datetime2 NOT NULL,
        "createdAt" datetime2 NOT NULL DEFAULT getdate(),
        "updatedAt" datetime2 NOT NULL DEFAULT getdate(),
        CONSTRAINT "PK_vehicle_movements" PRIMARY KEY ("id"),
        CONSTRAINT "CHK_vehicle_movements_movementType" CHECK ("movementType" IN ('entry', 'exit')),
        CONSTRAINT "CHK_vehicle_movements_status" CHECK ("status" IN ('pending', 'completed', 'cancelled')),
        CONSTRAINT "FK_vehicle_movements_vehicle" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_vehicle_movements_user" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE NO ACTION
      )
    `);
        await queryRunner.query(`CREATE INDEX "IDX_vehicles_licensePlate" ON "vehicles" ("licensePlate")`);
        await queryRunner.query(`CREATE INDEX "IDX_vehicles_status" ON "vehicles" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_vehicles_type" ON "vehicles" ("type")`);
        await queryRunner.query(`CREATE INDEX "IDX_vehicles_isActive" ON "vehicles" ("isActive")`);
        await queryRunner.query(`CREATE INDEX "IDX_vehicle_movements_vehicleId" ON "vehicle_movements" ("vehicleId")`);
        await queryRunner.query(`CREATE INDEX "IDX_vehicle_movements_area" ON "vehicle_movements" ("area")`);
        await queryRunner.query(`CREATE INDEX "IDX_vehicle_movements_movementType" ON "vehicle_movements" ("movementType")`);
        await queryRunner.query(`CREATE INDEX "IDX_vehicle_movements_status" ON "vehicle_movements" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_vehicle_movements_recordedAt" ON "vehicle_movements" ("recordedAt")`);
        await queryRunner.query(`CREATE INDEX "IDX_vehicle_movements_recordedById" ON "vehicle_movements" ("recordedById")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_vehicle_movements_recordedById" ON "vehicle_movements"`);
        await queryRunner.query(`DROP INDEX "IDX_vehicle_movements_recordedAt" ON "vehicle_movements"`);
        await queryRunner.query(`DROP INDEX "IDX_vehicle_movements_status" ON "vehicle_movements"`);
        await queryRunner.query(`DROP INDEX "IDX_vehicle_movements_movementType" ON "vehicle_movements"`);
        await queryRunner.query(`DROP INDEX "IDX_vehicle_movements_area" ON "vehicle_movements"`);
        await queryRunner.query(`DROP INDEX "IDX_vehicle_movements_vehicleId" ON "vehicle_movements"`);
        await queryRunner.query(`DROP INDEX "IDX_vehicles_isActive" ON "vehicles"`);
        await queryRunner.query(`DROP INDEX "IDX_vehicles_type" ON "vehicles"`);
        await queryRunner.query(`DROP INDEX "IDX_vehicles_status" ON "vehicles"`);
        await queryRunner.query(`DROP INDEX "IDX_vehicles_licensePlate" ON "vehicles"`);
        await queryRunner.query(`DROP TABLE "vehicle_movements"`);
        await queryRunner.query(`DROP TABLE "vehicles"`);
    }
}
exports.CreateVehicleManagementTables1700000000002 = CreateVehicleManagementTables1700000000002;
//# sourceMappingURL=1700000000002-CreateVehicleManagementTables.js.map