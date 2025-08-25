@echo off
title Chiang Mai Tourism Management System

echo 🚀 Starting Chiang Mai Tourism Management System...
echo ==================================================

REM Check if we're in the correct directory
if not exist "backend" (
    echo ❌ Backend directory not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ❌ Frontend directory not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

if not exist "admin-frontend" (
    echo ❌ Admin Frontend directory not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Create logs directory
if not exist "logs" mkdir logs

echo 📦 Installing dependencies...

REM Install backend dependencies
echo 📦 Checking Backend dependencies...
cd backend
if not exist "node_modules" (
    echo ⚠️  Installing Backend dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install Backend dependencies
        pause
        exit /b 1
    )
    echo ✅ Backend dependencies installed
) else (
    echo ✅ Backend dependencies already installed
)
cd ..

REM Install frontend dependencies
echo 📦 Checking Frontend dependencies...
cd frontend
if not exist "node_modules" (
    echo ⚠️  Installing Frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install Frontend dependencies
        pause
        exit /b 1
    )
    echo ✅ Frontend dependencies installed
) else (
    echo ✅ Frontend dependencies already installed
)
cd ..

REM Install admin-frontend dependencies
echo 📦 Checking Admin Frontend dependencies...
cd admin-frontend
if not exist "node_modules" (
    echo ⚠️  Installing Admin Frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ Failed to install Admin Frontend dependencies
        pause
        exit /b 1
    )
    echo ✅ Admin Frontend dependencies installed
) else (
    echo ✅ Admin Frontend dependencies already installed
)
cd ..

echo.
echo 🎯 Starting all services...
echo.

REM Start Backend API Server (Port 3000)
echo 🔧 Starting Backend API Server on port 3000...
start "Backend API" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak > nul

REM Start Frontend Development Server (Port 3001)
echo 🎨 Starting Frontend on port 3001...
start "Frontend" cmd /k "cd frontend && npm run dev"

REM Wait a moment for frontend to start
timeout /t 3 /nobreak > nul

REM Start Admin Frontend (Port 3002)
echo ⚙️  Starting Admin Frontend on port 3002...
start "Admin Frontend" cmd /k "cd admin-frontend && npx live-server --port=3002"

echo.
echo 🎉 All services started successfully!
echo ==================================================
echo 📱 Tourist Website:     http://localhost:3001
echo 🔧 Admin Panel:         http://localhost:3002
echo 🚀 API Server:          http://localhost:3000
echo 🏥 Health Check:        http://localhost:3000/api/health
echo.
echo 📋 Default Admin Credentials:
echo    Username: admin
echo    Password: password
echo.
echo 💡 Each service is running in a separate command window
echo 🛑 Close the command windows to stop the services
echo.

pause