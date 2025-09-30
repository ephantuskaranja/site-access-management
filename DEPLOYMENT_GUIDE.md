# Site Access Management System - Windows Server Deployment Guide

## Overview
This guide will help you deploy the Site Access Management System on Windows Server with IIS, SQL Server, and PM2 for production use.

## Prerequisites
- Windows Server 2019/2022
- Administrator access
- Internet connection for downloading dependencies

## Architecture
```
Internet → IIS (Port 80/443) → NSSM Service → Node.js App (Port 3027) → SQL Server (Port 1433)
```

## Step 1: Install Prerequisites

### 1.1 Install Node.js
1. Download Node.js LTS from https://nodejs.org/
2. Run the installer with administrator privileges
3. Verify installation:
```cmd
node --version
npm --version
```

### 1.2 Install SQL Server
1. Download SQL Server 2019/2022 Express or Standard
2. During installation:
   - Enable Mixed Mode Authentication
   - Set a strong SA password
   - Enable TCP/IP protocol
   - Note the instance name (usually SQLEXPRESS)

### 1.3 Install SQL Server Management Studio (SSMS)
1. Download from Microsoft website
2. Install for database management

### 1.4 Install IIS
1. Open "Server Manager"
2. Click "Add roles and features"
3. Select "Web Server (IIS)" role
4. Include these features:
   - Application Development → URL Rewrite Module
   - Security → Request Filtering
   - Common HTTP Features → All features

### 1.5 Install URL Rewrite Module for IIS
1. Download from https://www.iis.net/downloads/microsoft/url-rewrite
2. Install the module

## Step 2: Prepare Application for Production

### 2.1 Create Production Environment File
Create `.env.production` in your project root with production settings.

### 2.2 Build Scripts
Update package.json with production scripts.

### 2.3 Production Configuration
Configure logging, security, and performance settings for production.

## Step 3: Database Setup

### 3.1 Create Production Database
1. Open SQL Server Management Studio
2. Connect to your SQL Server instance
3. Create new database: `site_access_prod`
4. Create application user with limited permissions

### 3.2 Configure Database Security
- Create dedicated database user
- Grant only necessary permissions
- Configure connection encryption

## Step 4: Deploy Application

### 4.1 Transfer Files
1. Copy application files to `C:\inetpub\site-access-management\`
2. Install dependencies with production flag

### 4.2 Configure Application
1. Set environment variables
2. Test database connection
3. Run database migrations

## Step 5: Configure IIS

### 5.1 Create Application Pool
- Dedicated app pool for isolation
- Configure identity and settings

### 5.2 Create Website
- Point to application directory
- Configure bindings and SSL

### 5.3 Set up Reverse Proxy
- Configure URL rewrite rules
- Forward requests to Node.js application

## Step 6: Process Management

### 6.1 Install NSSM
Download and install NSSM (Non-Sucking Service Manager) for Windows service management.

### 6.2 Configure NSSM Service
- Set up Node.js application as Windows service
- Configure auto-restart and service recovery options

## Step 7: Security Configuration

### 7.1 Firewall Rules
- Configure Windows Firewall
- Allow only necessary ports

### 7.2 SSL Certificate
- Install SSL certificate
- Configure HTTPS redirection

### 7.3 Security Headers
- Configure security headers in IIS
- Set up Content Security Policy

## Step 8: Monitoring and Maintenance

### 8.1 Logging
- Configure application logging
- Set up log rotation

### 8.2 Monitoring
- Set up performance monitoring
- Configure health checks

### 8.3 Backup Strategy
- Database backup schedule
- Application backup procedures

## Troubleshooting

Common issues and solutions for Windows Server deployment.

## Maintenance

Regular maintenance tasks and update procedures.