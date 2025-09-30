@echo off
echo ========================================
echo Site Access Management System
echo NSSM Service Setup Script
echo ========================================

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with administrator privileges...
) else (
    echo ERROR: This script must be run as administrator!
    echo Right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo.
echo Setting up Site Access Management as Windows Service...

REM Set variables
set SERVICE_NAME=SiteAccessManagement
set APP_PATH=C:\inetpub\site-access-management
set NODE_PATH=%APP_PATH%\dist\server.js
set LOG_PATH=%APP_PATH%\logs

echo.
echo Service Name: %SERVICE_NAME%
echo Application Path: %APP_PATH%
echo Node.js Entry Point: %NODE_PATH%
echo Log Path: %LOG_PATH%

echo.
echo Step 1: Stopping service if it exists...
nssm stop %SERVICE_NAME% 2>nul

echo.
echo Step 2: Removing existing service if it exists...
nssm remove %SERVICE_NAME% confirm 2>nul

echo.
echo Step 3: Installing new service...
nssm install %SERVICE_NAME% node %NODE_PATH%

echo.
echo Step 4: Configuring service parameters...

REM Set working directory
nssm set %SERVICE_NAME% AppDirectory %APP_PATH%

REM Set environment
nssm set %SERVICE_NAME% AppEnvironmentExtra NODE_ENV=production

REM Configure logging
nssm set %SERVICE_NAME% AppStdout %LOG_PATH%\service-output.log
nssm set %SERVICE_NAME% AppStderr %LOG_PATH%\service-error.log

REM Set service description
nssm set %SERVICE_NAME% Description "Site Access Management System - Node.js Application"

REM Configure service recovery options
nssm set %SERVICE_NAME% AppExit Default Restart
nssm set %SERVICE_NAME% AppRestartDelay 5000
nssm set %SERVICE_NAME% AppThrottle 10000

REM Set service to start automatically
nssm set %SERVICE_NAME% Start SERVICE_AUTO_START

REM Configure service dependencies (wait for SQL Server to start)
nssm set %SERVICE_NAME% DependOnService MSSQLSERVER

echo.
echo Step 5: Starting service...
nssm start %SERVICE_NAME%

echo.
echo Step 6: Checking service status...
timeout /t 5 /nobreak > nul
nssm status %SERVICE_NAME%

echo.
echo ========================================
echo Service setup completed!
echo ========================================
echo.
echo Service commands:
echo   Start:   nssm start %SERVICE_NAME%
echo   Stop:    nssm stop %SERVICE_NAME%
echo   Restart: nssm restart %SERVICE_NAME%
echo   Status:  nssm status %SERVICE_NAME%
echo   Edit:    nssm edit %SERVICE_NAME%
echo   Remove:  nssm remove %SERVICE_NAME% confirm
echo.
echo Log files:
echo   Output:  %LOG_PATH%\service-output.log
echo   Errors:  %LOG_PATH%\service-error.log
echo.
echo You can also manage the service through Windows Services (services.msc)
echo.
pause