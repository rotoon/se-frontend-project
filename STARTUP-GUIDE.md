# 🚀 Quick Start Scripts

This directory contains scripts to easily start and manage all components of the Chiang Mai Tourism Management System.

## 📋 Available Scripts

### Unix/Linux/macOS

#### Start All Services

```bash
# Method 1: Using shell script
./start-all.sh

# Method 2: Using npm script
npm start

# Method 3: Using concurrently (after installing dependencies)
npm install
npm run dev
```

#### Stop All Services

```bash
# Method 1: Using shell script
./stop-all.sh

# Method 2: Press Ctrl+C in the terminal running start-all.sh
```

### Windows

#### Start All Services

```cmd
# Double-click the file or run from command prompt
start-all.bat
```

## 🎯 What Each Script Does

### `start-all.sh` / `start-all.bat`

- ✅ Checks port availability (3000, 3001, 3002)
- 📦 Installs dependencies if needed
- 🔧 Starts Backend API Server (port 3000)
- 🎨 Starts Frontend Website (port 3001)
- ⚙️ Starts Admin Panel (port 3002)
- 📝 Creates log files in `logs/` directory
- 🎉 Opens services in separate terminals/windows

### `stop-all.sh`

- 🛑 Gracefully stops all running services
- 🧹 Cleans up process IDs
- 📁 Optionally clears log files

## 📊 Service URLs

After starting, you can access:

- **🌐 Tourist Website**: http://localhost:3001
- **🔧 Admin Panel**: http://localhost:3002
- **🚀 API Server**: http://localhost:3000
- **🏥 Health Check**: http://localhost:3000/api/health

## 🔑 Default Credentials

- **Username**: `admin`
- **Password**: `password`

## 📝 Logs

All service logs are saved in the `logs/` directory:

- `backend.log` - Backend API server logs
- `frontend.log` - Frontend development server logs
- `admin-frontend.log` - Admin panel server logs

## 🔧 Individual Service Commands

If you prefer to start services individually:

```bash
# Backend only
npm run start:backend

# Frontend only
npm run start:frontend

# Admin panel only
npm run start:admin

# Install all dependencies
npm run install:all

# Build frontend for production
npm run build:frontend

# View live logs
npm run logs

# Check API health
npm run health

# Clean everything
npm run clean
```

## 🆘 Troubleshooting

### Port Already in Use

If you get port errors, stop any running services:

```bash
# Check what's using the ports
lsof -i :3000
lsof -i :3001
lsof -i :3002

# Kill processes using ports
kill -9 $(lsof -ti:3000,3001,3002)

# Or use the stop script
./stop-all.sh
```

### Dependencies Issues

```bash
# Clean and reinstall all dependencies
npm run clean
npm run install:all
```

### Permission Issues (Unix/Linux/macOS)

```bash
# Make scripts executable
chmod +x start-all.sh stop-all.sh
```

## 🎉 Happy Development!

The scripts automatically handle dependency installation, port checking, and service coordination so you can focus on development.
