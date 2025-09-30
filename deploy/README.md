# Site Access Management System - Windows Server Deployment

## Quick Deployment Steps

### 1. Prerequisites Installation (Run as Administrator)
```cmd
# Run the automated setup script
cd deploy
windows-setup.bat
```

### 2. Application Deployment
```cmd
# Copy application files
xcopy /E /I /H /Y . C:\inetpub\site-access-management\

# Navigate to application directory
cd C:\inetpub\site-access-management

# Install production dependencies
npm install --production

# Build the application
npm run build:prod
```

### 3. Database Setup
1. Open SQL Server Management Studio
2. Create database: `site_access_prod`
3. Update `.env.production` with database credentials
4. Run migrations:
```cmd
npm run migration:run:prod
```

### 4. Configure Windows Service
```cmd
# Run service setup script (as Administrator)
cd deploy
service-setup.bat
```

### 5. Configure IIS
1. Open IIS Manager
2. Add Website:
   - Name: `Site Access Management`
   - Physical Path: `C:\inetpub\site-access-management`
   - Binding: Port 80 (HTTP) and 443 (HTTPS)
3. Copy `web.config` to the website root
4. Install SSL certificate and configure HTTPS

### 6. Service Management Commands
```cmd
# Start service
nssm start SiteAccessManagement

# Stop service
nssm stop SiteAccessManagement

# Restart service
nssm restart SiteAccessManagement

# Check status
nssm status SiteAccessManagement

# Edit service configuration
nssm edit SiteAccessManagement

# View logs
type C:\inetpub\site-access-management\logs\service-output.log
type C:\inetpub\site-access-management\logs\service-error.log
```

## Why NSSM over PM2?

### Advantages of NSSM:
1. **Native Windows Integration**: Built specifically for Windows services
2. **Better Service Management**: Integrates with Windows Service Manager
3. **Automatic Recovery**: Built-in service recovery options
4. **Environment Variables**: Easy environment configuration
5. **Log Management**: Built-in stdout/stderr redirection
6. **Dependencies**: Can wait for other services (like SQL Server)
7. **No Node.js Dependency**: Doesn't require global Node.js packages
8. **Windows Event Log**: Integrates with Windows logging system

### NSSM Features:
- **Auto-restart** on failure
- **Service dependencies** (waits for SQL Server)
- **Delayed start** options
- **Custom environment variables**
- **Working directory** configuration
- **Log file rotation**
- **Service recovery actions**

## Monitoring and Maintenance

### Windows Event Viewer
1. Open Event Viewer (`eventvwr.msc`)
2. Navigate to: Windows Logs → Application
3. Filter by Source: `SiteAccessManagement`

### Performance Monitor
1. Open Performance Monitor (`perfmon.msc`)
2. Add counters for Node.js process
3. Monitor CPU, Memory, and Network usage

### Log Files
- Service Output: `C:\inetpub\site-access-management\logs\service-output.log`
- Service Errors: `C:\inetpub\site-access-management\logs\service-error.log`
- Application Logs: `C:\inetpub\site-access-management\logs\app.log`

### Regular Maintenance
1. **Weekly**: Check service status and logs
2. **Monthly**: Review performance metrics
3. **Quarterly**: Update dependencies and security patches
4. **Database**: Regular backups and maintenance

## Troubleshooting

### Service Won't Start
1. Check logs: `C:\inetpub\site-access-management\logs\service-error.log`
2. Verify Node.js path: `where node`
3. Test manually: `node C:\inetpub\site-access-management\dist\server.js`
4. Check database connection
5. Verify environment variables

### Application Not Accessible
1. Check IIS is running
2. Verify port 3027 is available: `netstat -an | findstr 3027`
3. Test reverse proxy: `curl http://localhost:3027`
4. Check firewall rules
5. Review IIS error logs

### Performance Issues
1. Monitor CPU and memory usage
2. Check database performance
3. Review application logs for errors
4. Consider scaling options

## Security Checklist

- [ ] SSL certificate installed and configured
- [ ] Firewall configured (only ports 80, 443 open)
- [ ] Database user has minimal permissions
- [ ] Strong passwords for all accounts
- [ ] Windows updates applied
- [ ] Antivirus software running
- [ ] Security headers configured in IIS
- [ ] Regular security audits scheduled