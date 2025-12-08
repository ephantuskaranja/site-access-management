import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Resolve project root .env from both src and dist executions
const rootEnvPath = path.resolve(__dirname, '../.env');

// Load base .env if present
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
}

// Optionally load environment-specific file, e.g., .env.production
const envName = process.env.NODE_ENV || process.env.nodeEnv || '';
if (envName) {
  const envSpecificPath = path.resolve(__dirname, `../.env.${envName}`);
  if (fs.existsSync(envSpecificPath)) {
    dotenv.config({ path: envSpecificPath, override: true });
  }
}

// Fallback: if essential DB vars are absent, do nothing here; server will log errors.
