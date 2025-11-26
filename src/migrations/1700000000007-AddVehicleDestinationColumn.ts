import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVehicleDestinationColumn1700000000007 implements MigrationInterface {
  name = 'AddVehicleDestinationColumn1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add destination column to vehicles
    await queryRunner.query(`ALTER TABLE "vehicles" ADD "destination" nvarchar(100)`);

    // Create index for destination
    await queryRunner.query(`CREATE INDEX "IDX_vehicles_destination" ON "vehicles" ("destination")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index then column
    await queryRunner.query(`DROP INDEX "IDX_vehicles_destination" ON "vehicles"`);
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "destination"`);
  }
}
