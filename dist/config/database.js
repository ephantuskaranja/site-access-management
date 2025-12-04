"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const path_1 = __importDefault(require("path"));
const index_1 = __importDefault(require("./index"));
const logger_1 = __importDefault(require("./logger"));
const User_1 = require("../entities/User");
const Visitor_1 = require("../entities/Visitor");
const Employee_1 = require("../entities/Employee");
const AccessLog_1 = require("../entities/AccessLog");
const Alert_1 = require("../entities/Alert");
const CompanySettings_1 = require("../entities/CompanySettings");
const Vehicle_1 = require("../entities/Vehicle");
const VehicleMovement_1 = require("../entities/VehicleMovement");
class Database {
    constructor() {
        this.dataSource = null;
    }
    async connect() {
        try {
            if (this.dataSource && this.dataSource.isInitialized) {
                logger_1.default.info('Database already connected');
                return this.dataSource;
            }
            this.dataSource = new typeorm_1.DataSource({
                type: index_1.default.database.type,
                host: index_1.default.database.host,
                port: index_1.default.database.port,
                username: index_1.default.database.username,
                password: index_1.default.database.password,
                database: index_1.default.database.database,
                synchronize: index_1.default.database.synchronize,
                logging: index_1.default.database.logging,
                entities: [User_1.User, Visitor_1.Visitor, Employee_1.Employee, AccessLog_1.AccessLog, Alert_1.Alert, CompanySettings_1.CompanySettings, Vehicle_1.Vehicle, VehicleMovement_1.VehicleMovement],
                migrations: [path_1.default.join(__dirname, '../migrations/*.{ts,js}')],
                subscribers: [path_1.default.join(__dirname, '../subscribers/*.{ts,js}')],
                options: {
                    encrypt: false,
                    trustServerCertificate: true,
                    connectTimeout: index_1.default.database.connectionTimeout,
                },
                pool: {
                    max: index_1.default.database.maxConnections,
                    min: 2,
                    idleTimeoutMillis: index_1.default.database.idleTimeout,
                },
            });
            await this.dataSource.initialize();
            logger_1.default.info(`Connected to SQL Server database: ${index_1.default.database.host}:${index_1.default.database.port}/${index_1.default.database.database}`);
            return this.dataSource;
        }
        catch (error) {
            logger_1.default.error('Failed to connect to SQL Server:', error);
            process.exit(1);
        }
    }
    async disconnect() {
        try {
            if (this.dataSource && this.dataSource.isInitialized) {
                await this.dataSource.destroy();
                this.dataSource = null;
                logger_1.default.info('Disconnected from SQL Server');
            }
        }
        catch (error) {
            logger_1.default.error('Error disconnecting from SQL Server:', error);
        }
    }
    getDataSource() {
        return this.dataSource;
    }
    isConnected() {
        return this.dataSource !== null && this.dataSource.isInitialized;
    }
    async runMigrations() {
        if (!this.dataSource || !this.dataSource.isInitialized) {
            throw new Error('Database not connected');
        }
        try {
            await this.dataSource.runMigrations();
            logger_1.default.info('Database migrations completed successfully');
        }
        catch (error) {
            logger_1.default.error('Error running database migrations:', error);
            throw error;
        }
    }
    async revertMigration() {
        if (!this.dataSource || !this.dataSource.isInitialized) {
            throw new Error('Database not connected');
        }
        try {
            await this.dataSource.undoLastMigration();
            logger_1.default.info('Last migration reverted successfully');
        }
        catch (error) {
            logger_1.default.error('Error reverting migration:', error);
            throw error;
        }
    }
}
exports.default = new Database();
//# sourceMappingURL=database.js.map