"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddVisitorCardNumberColumn1700000000004 = void 0;
class AddVisitorCardNumberColumn1700000000004 {
    constructor() {
        this.name = 'AddVisitorCardNumberColumn1700000000004';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "visitors" 
      ADD "visitorCardNumber" nvarchar(50) NULL
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "visitors" 
      DROP COLUMN "visitorCardNumber"
    `);
    }
}
exports.AddVisitorCardNumberColumn1700000000004 = AddVisitorCardNumberColumn1700000000004;
//# sourceMappingURL=1700000000004-AddVisitorCardNumberColumn.js.map