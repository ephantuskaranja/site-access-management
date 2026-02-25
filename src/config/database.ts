import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import config from './index';
import logger from './logger';

// Import entities (we'll create these next)
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

class Database {
  private dataSource: DataSource | null = null;

  public async connect(): Promise<DataSource> {
    try {
      if (this.dataSource && this.dataSource.isInitialized) {
        logger.info('Database already connected');
        return this.dataSource;
      }

      this.dataSource = new DataSource({
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
          encrypt: false, // Use true for Azure SQL
          trustServerCertificate: true, // Use true for local dev / self-signed certs
          connectTimeout: config.database.connectionTimeout,
        },
        pool: {
          max: config.database.maxConnections,
          min: 2,
          idleTimeoutMillis: config.database.idleTimeout,
        },
      });

      await this.dataSource.initialize();
      logger.info(`Connected to SQL Server database: ${config.database.host}:${config.database.port}/${config.database.database}`);

      return this.dataSource;

    } catch (error) {
      logger.error('Failed to connect to SQL Server:', error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.dataSource && this.dataSource.isInitialized) {
        await this.dataSource.destroy();
        this.dataSource = null;
        logger.info('Disconnected from SQL Server');
      }
    } catch (error) {
      logger.error('Error disconnecting from SQL Server:', error);
    }
  }

  public getDataSource(): DataSource | null {
    return this.dataSource;
  }

  public isConnected(): boolean {
    return this.dataSource !== null && this.dataSource.isInitialized;
  }

  public async runMigrations(): Promise<void> {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      throw new Error('Database not connected');
    }
    
    try {
      await this.dataSource.runMigrations();
      logger.info('Database migrations completed successfully');
    } catch (error) {
      logger.error('Error running database migrations:', error);
      throw error;
    }
  }

  public async revertMigration(): Promise<void> {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      throw new Error('Database not connected');
    }
    
    try {
      await this.dataSource.undoLastMigration();
      logger.info('Last migration reverted successfully');
    } catch (error) {
      logger.error('Error reverting migration:', error);
      throw error;
    }
  }
}

export default new Database();