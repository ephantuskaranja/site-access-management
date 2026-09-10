import { DataSourceOptions } from 'typeorm';

/**
 * Shared TypeORM connection options for the CLI / migration datasources.
 *
 * Reads `process.env` lazily (only when called), so every caller must load the
 * appropriate `.env` file(s) BEFORE invoking this.
 */
export function buildMigrationDataSourceOptions(): DataSourceOptions {
  return {
    type: 'mssql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    username: process.env.DB_USERNAME || 'sa',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'site_access',
    synchronize: false, // Always false for migrations
    logging: process.env.DB_LOGGING === 'true',
    entities: ['src/entities/*.ts'],
    migrations: ['src/migrations/*.ts'],
    subscribers: ['src/subscribers/*.ts'],
    options: {
      encrypt: false, // Use true for Azure SQL
      trustServerCertificate: true, // self-signed / on-prem SQL Server
    },
  };
}
