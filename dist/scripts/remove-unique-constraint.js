"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const config_1 = __importDefault(require("../config"));
async function removeUniqueConstraint() {
    const AppDataSource = new typeorm_1.DataSource({
        type: 'mssql',
        host: config_1.default.database.host,
        port: config_1.default.database.port,
        username: config_1.default.database.username,
        password: config_1.default.database.password,
        database: config_1.default.database.database,
        options: {
            encrypt: true,
            trustServerCertificate: true,
        },
        synchronize: false,
        logging: true,
    });
    try {
        await AppDataSource.initialize();
        console.log('Connected to database');
        const queryRunner = AppDataSource.createQueryRunner();
        const allConstraints = await queryRunner.query(`
      SELECT 
        tc.CONSTRAINT_NAME,
        ccu.COLUMN_NAME
      FROM INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE ccu
      INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc 
        ON ccu.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
      WHERE tc.TABLE_NAME = 'visitors' 
      AND tc.CONSTRAINT_TYPE = 'UNIQUE'
    `);
        console.log('Found unique constraints on visitors table:', allConstraints);
        const uniqueIndexes = await queryRunner.query(`
      SELECT 
        i.name as INDEX_NAME,
        c.name as COLUMN_NAME
      FROM sys.indexes i
      INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
      INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      INNER JOIN sys.tables t ON i.object_id = t.object_id
      WHERE t.name = 'visitors' 
      AND i.is_unique = 1
      AND i.is_primary_key = 0
    `);
        console.log('Found unique indexes on visitors table:', uniqueIndexes);
        if (allConstraints.length > 0 || uniqueIndexes.length > 0) {
            for (const constraint of allConstraints) {
                console.log(`Removing unique constraint: ${constraint.CONSTRAINT_NAME} on column: ${constraint.COLUMN_NAME}`);
                try {
                    await queryRunner.query(`ALTER TABLE "visitors" DROP CONSTRAINT "${constraint.CONSTRAINT_NAME}"`);
                    console.log(`✅ Constraint ${constraint.CONSTRAINT_NAME} removed successfully`);
                }
                catch (error) {
                    console.log(`⚠️  Error removing constraint ${constraint.CONSTRAINT_NAME}:`, error);
                }
            }
            for (const index of uniqueIndexes) {
                console.log(`Removing unique index: ${index.INDEX_NAME} on column: ${index.COLUMN_NAME}`);
                try {
                    await queryRunner.query(`DROP INDEX "${index.INDEX_NAME}" ON "visitors"`);
                    console.log(`✅ Index ${index.INDEX_NAME} removed successfully`);
                }
                catch (error) {
                    console.log(`⚠️  Error removing index ${index.INDEX_NAME}:`, error);
                }
            }
            try {
                await queryRunner.query(`CREATE INDEX "IDX_visitors_idNumber" ON "visitors" ("idNumber")`);
                console.log('✅ Regular index created successfully');
            }
            catch (error) {
                console.log('ℹ️ Index may already exist:', error.message);
            }
        }
        else {
            console.log('ℹ️ No unique constraints or indexes found on visitors table');
        }
        await queryRunner.release();
        await AppDataSource.destroy();
        console.log('✅ Database migration completed successfully!');
        console.log('🎉 Visitors can now register multiple times with the same ID number');
    }
    catch (error) {
        console.error('❌ Error during migration:', error);
        process.exit(1);
    }
}
removeUniqueConstraint();
//# sourceMappingURL=remove-unique-constraint.js.map