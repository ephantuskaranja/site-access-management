import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { buildMigrationDataSourceOptions } from './ormconfig.options';

// Development / default migration datasource: load the base .env only.
dotenv.config();

export const AppDataSource = new DataSource(buildMigrationDataSourceOptions());
