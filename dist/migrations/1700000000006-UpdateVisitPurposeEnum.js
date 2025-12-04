"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateVisitPurposeEnum1700000000006 = void 0;
class UpdateVisitPurposeEnum1700000000006 {
    constructor() {
        this.name = 'UpdateVisitPurposeEnum1700000000006';
    }
    async up(queryRunner) {
        const constraints = await queryRunner.query(`
      SELECT name 
      FROM sys.check_constraints 
      WHERE parent_object_id = OBJECT_ID('visitors') 
      AND definition LIKE '%visitPurpose%'
    `);
        if (constraints.length > 0) {
            const constraintName = constraints[0].name;
            await queryRunner.query(`ALTER TABLE "visitors" DROP CONSTRAINT "${constraintName}"`);
        }
        await queryRunner.query(`
      ALTER TABLE "visitors" 
      ADD CONSTRAINT "CHK_visitors_visitPurpose" 
      CHECK ("visitPurpose" IN (
        'meeting', 
        'delivery', 
        'maintenance', 
        'interview', 
        'pig_delivery', 
        'contract_works', 
        'pig_order', 
        'other'
      ))
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "visitors" DROP CONSTRAINT "CHK_visitors_visitPurpose"`);
        await queryRunner.query(`
      ALTER TABLE "visitors" 
      ADD CONSTRAINT "CHK_visitors_visitPurpose_original" 
      CHECK ("visitPurpose" IN (
        'meeting', 
        'delivery', 
        'maintenance', 
        'interview', 
        'other'
      ))
    `);
    }
}
exports.UpdateVisitPurposeEnum1700000000006 = UpdateVisitPurposeEnum1700000000006;
//# sourceMappingURL=1700000000006-UpdateVisitPurposeEnum.js.map