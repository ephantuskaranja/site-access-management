import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import config from './index';
import { User } from '../entities/User';
import { Visitor } from '../entities/Visitor';
import { Employee } from '../entities/Employee';
import { AccessLog } from '../entities/AccessLog';
import { Alert } from '../entities/Alert';
import { CompanySettings } from '../entities/CompanySettings';
import { Vehicle } from '../entities/Vehicle';
import { VehicleMovement } from '../entities/VehicleMovement';
import { ExternalVehicleMovement } from '../entities/ExternalVehicleMovement';
import { Driver } from '../entities/Driver';

// Export a DataSource instance for TypeORM CLI
export const AppDataSource = new DataSource({
  type: config.database.type,
  host: config.database.host,
  port: config.database.port,
  username: config.database.username,
  password: config.database.password,
  database: config.database.database,
  synchronize: config.database.synchronize,
  logging: config.database.logging,
  entities: [User, Visitor, Employee, AccessLog, Alert, CompanySettings, Vehicle, VehicleMovement, ExternalVehicleMovement, Driver],
  migrations: [path.join(__dirname, '../migrations/*.{ts,js}')],
  subscribers: [path.join(__dirname, '../subscribers/*.{ts,js}')],
  options: {
    encrypt: false,
    trustServerCertificate: true,
    connectTimeout: config.database.connectionTimeout,
  },
  pool: {
    max: config.database.maxConnections,
    min: 2,
    idleTimeoutMillis: config.database.idleTimeout,
  },
});
