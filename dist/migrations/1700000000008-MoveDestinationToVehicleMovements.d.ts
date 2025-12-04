import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class MoveDestinationToVehicleMovements1700000000008 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
