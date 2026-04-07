@echo off
set "ROOT_DIR=%~dp0"
set "MAVEN_BIN=%ROOT_DIR%tools\apache-maven-3.9.9\bin"
set "PATH=%MAVEN_BIN%;%PATH%"

echo ==========================================
echo   Smart Campus Unified QR-Based Service
echo ==========================================
echo.

echo [1/2] Starting Backend (Spring Boot on Port 8080)...
start "Backend - Smart Campus" cmd /k "cd /d "%ROOT_DIR%backend" && mvn spring-boot:run"

echo [2/2] Starting Frontend (Expo Web)...
start "Frontend - Smart Campus" cmd /k "cd /d "%ROOT_DIR%" && npx expo start --web"

echo.
echo Both servers are starting in separate windows.
echo You can close this window now.
echo.
pause
