import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { buildMigrationDataSourceOptions } from './ormconfig.options';

/**
 * Production migration datasource.
 *
 * Loads the base `.env` and then layers `.env.production` on top (override),
 * regardless of NODE_ENV. This means `npm run migration:run:prod` behaves
 * identically in cmd.exe, PowerShell and bash with no `NODE_ENV=...` prefix.
 *
 * `__dirname` is `<root>/src/config` under ts-node and `<root>/dist/config`
 * once compiled, so `../..` resolves to the application root either way.
 */
const appRoot = path.resolve(__dirname, '../..');

for (const file of ['.env', '.env.production']) {
  const fullPath = path.join(appRoot, file);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath, override: true });
  }
}

export const AppDataSource = new DataSource(buildMigrationDataSourceOptions());
