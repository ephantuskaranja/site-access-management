"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const path_1 = __importDefault(require("path"));
const index_1 = __importDefault(require("./index"));
const User_1 = require("../entities/User");
const Visitor_1 = require("../entities/Visitor");
const Employee_1 = require("../entities/Employee");
const AccessLog_1 = require("../entities/AccessLog");
const Alert_1 = require("../entities/Alert");
const CompanySettings_1 = require("../entities/CompanySettings");
const Vehicle_1 = require("../entities/Vehicle");
const VehicleMovement_1 = require("../entities/VehicleMovement");
exports.AppDataSource = new typeorm_1.DataSource({
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
//# sourceMappingURL=data-source.js.map