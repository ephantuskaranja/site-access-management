@echo off
echo ========================================
echo Site Access Management System
echo Windows Server Deployment Script
echo ========================================

echo.
echo Step 1: Creating application directory...
if not exist "C:\inetpub\site-access-management" (
    mkdir "C:\inetpub\site-access-management"
    echo Created: C:\inetpub\site-access-management
) else (
    echo Directory already exists: C:\inetpub\site-access-management
)

echo.
echo Step 2: Creating logs directory...
if not exist "C:\inetpub\site-access-management\logs" (
    mkdir "C:\inetpub\site-access-management\logs"
    echo Created: C:\inetpub\site-access-management\logs
)

echo.
echo Step 3: Creating uploads directory...
if not exist "C:\inetpub\site-access-management\uploads" (
    mkdir "C:\inetpub\site-access-management\uploads"
    echo Created: C:\inetpub\site-access-management\uploads
)

echo.
echo Step 4: Setting directory permissions...
icacls "C:\inetpub\site-access-management" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\site-access-management\logs" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\site-access-management\uploads" /grant "IIS_IUSRS:(OI)(CI)F" /T

echo.
echo Step 5: Downloading and setting up NSSM...
if not exist "C:\tools" mkdir "C:\tools"
if not exist "C:\tools\nssm" (
    echo Downloading NSSM...
    powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'C:\tools\nssm.zip'"
    powershell -Command "Expand-Archive -Path 'C:\tools\nssm.zip' -DestinationPath 'C:\tools\'"
    move "C:\tools\nssm-2.24" "C:\tools\nssm"
    del "C:\tools\nssm.zip"
    echo NSSM installed to C:\tools\nssm
) else (
    echo NSSM already installed
)

echo.
echo Adding NSSM to PATH...
setx PATH "%PATH%;C:\tools\nssm\win64" /M

echo.
echo ========================================
echo Deployment preparation completed!
echo ========================================
echo.
echo Next steps:
echo 1. Copy your application files to C:\inetpub\site-access-management\
echo 2. Copy .env.production to the application directory
echo 3. Run: npm install --production
echo 4. Run: npm run build:prod
echo 5. Configure IIS using the provided configuration
echo 6. Create Windows Service using NSSM (see service-setup.bat)
echo.
pause