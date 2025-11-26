import { MigrationInterface, QueryRunner } from 'typeorm';

export class MoveDestinationToVehicleMovements1700000000008 implements MigrationInterface {
  name = 'MoveDestinationToVehicleMovements1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add destination column to vehicle_movements
    await queryRunner.query(`ALTER TABLE "vehicle_movements" ADD "destination" nvarchar(100)`);
    await queryRunner.query(`CREATE INDEX "IDX_vehicle_movements_destination" ON "vehicle_movements" ("destination")`);

    // Copy destination from vehicles to the latest movement for each vehicle where applicable
    // This attempts to set destination on the most recent movement (by recordedAt) for each vehicle
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

    // Drop destination index and column from vehicles
    await queryRunner.query(`IF EXISTS (SELECT name FROM sys.indexes WHERE name = 'IDX_vehicles_destination') DROP INDEX "IDX_vehicles_destination" ON "vehicles"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN IF EXISTS "destination"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate destination column on vehicles
    await queryRunner.query(`ALTER TABLE "vehicles" ADD "destination" nvarchar(100)`);
    await queryRunner.query(`CREATE INDEX "IDX_vehicles_destination" ON "vehicles" ("destination")`);

    // Attempt to copy destination back from vehicle_movements to vehicles (most recent movement)
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

    // Drop destination from vehicle_movements
    await queryRunner.query(`DROP INDEX "IDX_vehicle_movements_destination" ON "vehicle_movements"`);
    await queryRunner.query(`ALTER TABLE "vehicle_movements" DROP COLUMN "destination"`);
  }
}
