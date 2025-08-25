#!/bin/bash

# Chiang Mai Tourism Management System - Stop All Services
# This script stops all running components gracefully

echo "🛑 Stopping Chiang Mai Tourism Management System..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to kill process by PID
kill_process() {
    local pid=$1
    local name=$2
    
    if [ ! -z "$pid" ] && kill -0 $pid 2>/dev/null; then
        kill $pid 2>/dev/null
        sleep 2
        if kill -0 $pid 2>/dev/null; then
            kill -9 $pid 2>/dev/null
        fi
        echo -e "${GREEN}✅ $name stopped (PID: $pid)${NC}"
    else
        echo -e "${YELLOW}⚠️  $name was not running${NC}"
    fi
}

# Read PIDs from file if it exists
if [ -f ".pids" ]; then
    PIDS=$(cat .pids)
    IFS=',' read -r BACKEND_PID FRONTEND_PID ADMIN_PID <<< "$PIDS"
    
    echo -e "${BLUE}📋 Stopping services from PID file...${NC}"
    kill_process $BACKEND_PID "Backend API"
    kill_process $FRONTEND_PID "Frontend"
    kill_process $ADMIN_PID "Admin Shadcn Dashboard"
    
    rm -f .pids
else
    echo -e "${YELLOW}⚠️  No PID file found, stopping processes by name...${NC}"
fi

# Kill any remaining processes by name/port
echo -e "${BLUE}🔍 Checking for remaining processes...${NC}"

# Kill processes by name
pkill -f "npm run dev" 2>/dev/null && echo -e "${GREEN}✅ Stopped npm dev processes${NC}"
pkill -f "live-server" 2>/dev/null && echo -e "${GREEN}✅ Stopped live-server processes${NC}"
pkill -f "webpack-dev-server" 2>/dev/null && echo -e "${GREEN}✅ Stopped webpack-dev-server processes${NC}"
pkill -f "nodemon" 2>/dev/null && echo -e "${GREEN}✅ Stopped nodemon processes${NC}"

# Kill processes by port
for port in 3000 3001 3002; do
    PID=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$PID" ]; then
        kill $PID 2>/dev/null
        echo -e "${GREEN}✅ Stopped process on port $port (PID: $PID)${NC}"
    fi
done

# Clean up log files (optional)
read -p "$(echo -e ${YELLOW}"🗑️  Do you want to clear log files? (y/N): "${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf logs/*.log 2>/dev/null
    echo -e "${GREEN}✅ Log files cleared${NC}"
fi

echo ""
echo -e "${GREEN}🎉 All services stopped successfully!${NC}"
echo -e "${BLUE}💡 To start all services again, run: ./start-all.sh${NC}"