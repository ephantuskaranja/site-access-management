"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddVehicleDestinationColumn1700000000007 = void 0;
class AddVehicleDestinationColumn1700000000007 {
    constructor() {
        this.name = 'AddVehicleDestinationColumn1700000000007';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "vehicles" ADD "destination" nvarchar(100)`);
        await queryRunner.query(`CREATE INDEX "IDX_vehicles_destination" ON "vehicles" ("destination")`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_vehicles_destination" ON "vehicles"`);
        await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "destination"`);
    }
}
exports.AddVehicleDestinationColumn1700000000007 = AddVehicleDestinationColumn1700000000007;
//# sourceMappingURL=1700000000007-AddVehicleDestinationColumn.js.map