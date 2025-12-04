"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddRequirePasswordChangeColumn1700000000003 = void 0;
class AddRequirePasswordChangeColumn1700000000003 {
    constructor() {
        this.name = 'AddRequirePasswordChangeColumn1700000000003';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "users" 
      ADD "requirePasswordChange" bit NOT NULL 
      CONSTRAINT "DF_users_requirePasswordChange" DEFAULT 0
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "users" 
      DROP CONSTRAINT "DF_users_requirePasswordChange"
    `);
        await queryRunner.query(`
      ALTER TABLE "users" 
      DROP COLUMN "requirePasswordChange"
    `);
    }
}
exports.AddRequirePasswordChangeColumn1700000000003 = AddRequirePasswordChangeColumn1700000000003;
//# sourceMappingURL=1700000000003-AddRequirePasswordChangeColumn.js.map