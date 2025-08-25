#!/bin/bash

# Chiang Mai Tourism Management System - Start All Services
# This script starts all three components: Backend API, Frontend, and Admin Frontend

echo "🚀 Starting Chiang Mai Tourism Management System..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Port $port is available${NC}"
        return 0
    fi
}

# Function to install dependencies if needed
install_dependencies() {
    local dir=$1
    local name=$2
    
    echo -e "${BLUE}📦 Checking dependencies for $name...${NC}"
    cd "$dir"
    
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}⚠️  Installing dependencies for $name...${NC}"
        npm install
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Dependencies installed for $name${NC}"
        else
            echo -e "${RED}❌ Failed to install dependencies for $name${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Dependencies already installed for $name${NC}"
    fi
    
    cd - > /dev/null
}

# Check if we're in the correct directory
if [ ! -f "package.json" ] && [ ! -d "backend" ] && [ ! -d "frontend" ] && [ ! -d "admin-shadcn" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

# Check port availability
echo -e "${BLUE}🔍 Checking port availability...${NC}"
check_port 3000 && check_port 3001 && check_port 3002

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Some ports are not available. Please stop other services and try again.${NC}"
    exit 1
fi

# Install dependencies for all components
install_dependencies "backend" "Backend API"
install_dependencies "frontend" "Frontend"
install_dependencies "admin-shadcn" "Admin Shadcn Dashboard"

# Create log directory
mkdir -p logs

echo -e "${BLUE}🎯 Starting all services...${NC}"

# Start Backend API Server (Port 3000)
echo -e "${YELLOW}🔧 Starting Backend API Server on port 3000...${NC}"
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✅ Backend API started (PID: $BACKEND_PID)${NC}"

# Wait a moment for backend to start
sleep 3

# Start Frontend Development Server (Port 3001)
echo -e "${YELLOW}🎨 Starting Frontend on port 3001...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"

# Wait a moment for frontend to start
sleep 3

# Start Admin Shadcn Dashboard (Port 3002)
echo -e "${YELLOW}⚙️  Starting Admin Shadcn Dashboard on port 3002...${NC}"
cd admin-shadcn
npm run dev > ../logs/admin-shadcn.log 2>&1 &
ADMIN_PID=$!
cd ..
echo -e "${GREEN}✅ Admin Shadcn Dashboard started (PID: $ADMIN_PID)${NC}"

# Save PIDs for cleanup
echo "$BACKEND_PID,$FRONTEND_PID,$ADMIN_PID" > .pids

echo ""
echo -e "${GREEN}🎉 All services started successfully!${NC}"
echo "=================================================="
echo -e "${BLUE}📱 Tourist Website:${NC}     http://localhost:3001"
echo -e "${BLUE}🔧 Admin Dashboard:${NC}      http://localhost:3002"
echo -e "${BLUE}🚀 API Server:${NC}          http://localhost:3000"
echo -e "${BLUE}🏥 Health Check:${NC}        http://localhost:3000/api/health"
echo ""
echo -e "${YELLOW}📋 Default Admin Credentials:${NC}"
echo -e "   Username: ${GREEN}admin${NC}"
echo -e "   Password: ${GREEN}password${NC}"
echo ""
echo -e "${BLUE}📝 Logs are available in the 'logs' directory${NC}"
echo -e "${BLUE}🛑 To stop all services, run: ./stop-all.sh${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Function to cleanup processes on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping all services...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend stopped${NC}"
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend stopped${NC}"
    fi
    
    if [ ! -z "$ADMIN_PID" ]; then
        kill $ADMIN_PID 2>/dev/null
        echo -e "${GREEN}✅ Admin Shadcn Dashboard stopped${NC}"
    fi
    
    # Clean up any remaining processes
    pkill -f "npm run dev" 2>/dev/null
    pkill -f "live-server" 2>/dev/null
    
    # Remove PID file
    rm -f .pids
    
    echo -e "${GREEN}🎉 All services stopped successfully!${NC}"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
while true; do
    sleep 1
done