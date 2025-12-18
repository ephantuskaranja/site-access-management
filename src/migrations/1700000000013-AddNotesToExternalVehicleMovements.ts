import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddNotesToExternalVehicleMovements1700000000013 implements MigrationInterface {
  name = 'AddNotesToExternalVehicleMovements1700000000013'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn('external_vehicle_movements', new TableColumn({
      name: 'notes',
      type: 'nvarchar',
      length: '1000',
      isNullable: true,
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('external_vehicle_movements', 'notes');
  }
}
