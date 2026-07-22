import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLifeSaverAndPadlocksToVehicleMovements1700000000023 implements MigrationInterface {
  name = 'AddLifeSaverAndPadlocksToVehicleMovements1700000000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicle_movements"
      ADD "toolLifeSaver" bit NOT NULL
      CONSTRAINT "DF_vehicle_movements_toolLifeSaver" DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_movements"
      ADD "toolPadlocksCount" int NOT NULL
      CONSTRAINT "DF_vehicle_movements_toolPadlocksCount" DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "vehicle_movements"
      DROP CONSTRAINT "DF_vehicle_movements_toolPadlocksCount"
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_movements"
      DROP COLUMN "toolPadlocksCount"
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_movements"
      DROP CONSTRAINT "DF_vehicle_movements_toolLifeSaver"
    `);
    await queryRunner.query(`
      ALTER TABLE "vehicle_movements"
      DROP COLUMN "toolLifeSaver"
    `);
  }
}
