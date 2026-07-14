import { MigrationInterface, QueryRunner } from 'typeorm';

const TOOL_COLUMNS = [
  'toolWheelSpanner',
  'toolJackHandle',
  'toolSpareWheel',
  'toolCable',
  'toolFirstAidKit',
  'toolFireExtinguisher',
  'toolDent',
];

export class AddToolsCheckToVehicleMovements1700000000022 implements MigrationInterface {
  name = 'AddToolsCheckToVehicleMovements1700000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const column of TOOL_COLUMNS) {
      await queryRunner.query(`
        ALTER TABLE "vehicle_movements"
        ADD "${column}" bit NOT NULL
        CONSTRAINT "DF_vehicle_movements_${column}" DEFAULT 0
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const column of TOOL_COLUMNS) {
      await queryRunner.query(`
        ALTER TABLE "vehicle_movements"
        DROP CONSTRAINT "DF_vehicle_movements_${column}"
      `);
      await queryRunner.query(`
        ALTER TABLE "vehicle_movements"
        DROP COLUMN "${column}"
      `);
    }
  }
}
