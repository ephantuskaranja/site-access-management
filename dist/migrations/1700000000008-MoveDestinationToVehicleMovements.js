"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoveDestinationToVehicleMovements1700000000008 = void 0;
class MoveDestinationToVehicleMovements1700000000008 {
    constructor() {
        this.name = 'MoveDestinationToVehicleMovements1700000000008';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "vehicle_movements" ADD "destination" nvarchar(100)`);
        await queryRunner.query(`CREATE INDEX "IDX_vehicle_movements_destination" ON "vehicle_movements" ("destination")`);
        await queryRunner.query(`
      WITH LatestMovement AS (
        SELECT vm.id, vm.vehicleId, v.destination,
               ROW_NUMBER() OVER (PARTITION BY vm.vehicleId ORDER BY vm.recordedAt DESC) as rn
        FROM vehicle_movements vm
        JOIN vehicles v ON v.id = vm.vehicleId
        WHERE v.destination IS NOT NULL
      )
      UPDATE vehicle_movements
      SET destination = lm.destination
      FROM LatestMovement lm
      WHERE vehicle_movements.id = lm.id AND lm.rn = 1
    `);
        await queryRunner.query(`IF EXISTS (SELECT name FROM sys.indexes WHERE name = 'IDX_vehicles_destination') DROP INDEX "IDX_vehicles_destination" ON "vehicles"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "destination"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "destination" nvarchar(100)`);
        await queryRunner.query(`CREATE INDEX "IDX_vehicles_destination" ON "vehicles" ("destination")`);
        await queryRunner.query(`
      WITH LatestMovement AS (
        SELECT vm.vehicleId, vm.destination,
               ROW_NUMBER() OVER (PARTITION BY vm.vehicleId ORDER BY vm.recordedAt DESC) as rn
        FROM vehicle_movements vm
        WHERE vm.destination IS NOT NULL
      )
      UPDATE vehicles
      SET destination = lm.destination
      FROM LatestMovement lm
      WHERE vehicles.id = lm.vehicleId AND lm.rn = 1
    `);
        await queryRunner.query(`DROP INDEX "IDX_vehicle_movements_destination" ON "vehicle_movements"`);
        await queryRunner.query(`ALTER TABLE "vehicle_movements" DROP COLUMN "destination"`);
    }
}
exports.MoveDestinationToVehicleMovements1700000000008 = MoveDestinationToVehicleMovements1700000000008;
//# sourceMappingURL=1700000000008-MoveDestinationToVehicleMovements.js.map