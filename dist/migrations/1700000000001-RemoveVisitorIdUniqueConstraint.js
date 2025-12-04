"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveVisitorIdUniqueConstraint1700000000001 = void 0;
class RemoveVisitorIdUniqueConstraint1700000000001 {
    constructor() {
        this.name = 'RemoveVisitorIdUniqueConstraint1700000000001';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      IF EXISTS (
        SELECT 1 FROM sys.objects o
        WHERE o.type = 'UQ' AND o.name = 'UQ_visitors_idNumber'
      )
      ALTER TABLE "visitors" DROP CONSTRAINT "UQ_visitors_idNumber";
    `);
        await queryRunner.query(`
      IF EXISTS (
        SELECT 1
        FROM sys.indexes i
        INNER JOIN sys.objects o ON i.object_id = o.object_id
        WHERE o.name = 'visitors' AND i.name = 'IDX_visitors_idNumber'
      )
      DROP INDEX "IDX_visitors_idNumber" ON "visitors";
    `);
        await queryRunner.query(`
      IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes i
        INNER JOIN sys.objects o ON i.object_id = o.object_id
        WHERE o.name = 'visitors' AND i.name = 'IDX_visitors_idNumber'
      )
      CREATE INDEX "IDX_visitors_idNumber" ON "visitors" ("idNumber");
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      IF EXISTS (
        SELECT 1
        FROM sys.indexes i
        INNER JOIN sys.objects o ON i.object_id = o.object_id
        WHERE o.name = 'visitors' AND i.name = 'IDX_visitors_idNumber'
      )
      DROP INDEX "IDX_visitors_idNumber" ON "visitors";
    `);
        await queryRunner.query(`ALTER TABLE "visitors" ADD CONSTRAINT "UQ_visitors_idNumber" UNIQUE ("idNumber")`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_visitors_idNumber" ON "visitors" ("idNumber")`);
    }
}
exports.RemoveVisitorIdUniqueConstraint1700000000001 = RemoveVisitorIdUniqueConstraint1700000000001;
//# sourceMappingURL=1700000000001-RemoveVisitorIdUniqueConstraint.js.map