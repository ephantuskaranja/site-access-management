# Site Access Management System

A Node.js + TypeScript application for managing visitor access, vehicles, and user roles (Admin, Security Guard, Receptionist) with an EJS frontend and SQL Server via TypeORM.

## Tech Stack
- Node.js (>= 18), TypeScript, Express, EJS, Socket.IO
- SQL Server (MSSQL) via TypeORM
- Helmet, CORS, Compression, Winston logging, JWT auth

## Prerequisites
- Node.js 18+ and npm
- SQL Server reachable from the app host
- Create a database and a SQL login with permissions

## Configuration
Copy `.env.example` to `.env` (dev) or create `.env.production` (prod) and set:
- Database: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- JWT: `JWT_SECRET`, `REFRESH_TOKEN_SECRET`
- Optional email: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
- Ports and limits: `PORT`, `RATE_LIMIT_WINDOW`, `RATE_LIMIT_MAX`

### Generate Strong Secrets (PowerShell)
Run these to generate long random secrets and paste into `.env`:

```powershell
# Generate a 64-character Base64 secret for JWT
$jwt=[Convert]::ToBase64String((1..48|%{[byte](Get-Random 256)})); Write-Host "JWT_SECRET=$jwt"

# Generate a different 64-character Base64 secret for refresh tokens
$refresh=[Convert]::ToBase64String((1..48|%{[byte](Get-Random 256)})); Write-Host "REFRESH_TOKEN_SECRET=$refresh"
```

Recommended token lifetimes:
- `JWT_EXPIRE=15m`
- `REFRESH_TOKEN_EXPIRE=7d`
- `IDLE_TIMEOUT_MINUTES=15` (client idle logout)

## Install
```powershell
npm ci
```

## Run (Development)
```powershell
npm run dev
```
Server runs with ts-node via nodemon.

## Build and Run (Production/Live)
```powershell
npm run build
$env:NODE_ENV="production"
node .\dist\server.js
```
Health check: `GET /health`
API docs: `GET /api-docs`

## Migrations
Development (TypeScript sources):
```powershell
npm run migration:run
npm run migration:revert
npm run migration:generate --name MyChange
```
Production (compiled):
```powershell
npm run build
$env:NODE_ENV="production"
npm run migration:run:prod
```

## Seed Data
Development (TypeScript):
```powershell
npm run seed
```

Production (compiled JS):
```powershell
npm run build
node .\dist\seeders\index.js
```

Quick setup:
```powershell
npm run setup
```
This installs dependencies and runs the development seeder.

## Scripts
- `dev`: start with nodemon (TS)
- `build`: compile to `dist/`
- `start`: run compiled server
- `migration:*`: TypeORM helper scripts
 - `seed`: run the development seeders
 - `setup`: install deps then seed (dev)

## Folders
- `src/` server source (controllers, routes, entities, middleware, views)
- `public/` static assets (CSS/JS/images)
- `dist/` compiled output
- `deploy/` `web.config` and setup helpers for IIS/Windows

## Notes
- Rate limiting uses a simple in-memory limiter compatible with CommonJS builds.
- Default view engine is EJS; UI served from `src/views` and `public`.
- Ensure SQL Server encryption settings align with your environment (see `src/config/database.ts`).

## License
MIT
