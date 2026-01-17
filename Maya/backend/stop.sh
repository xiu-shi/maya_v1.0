#!/bin/bash

# Maya Backend Server Stop Script
# This script stops all processes using the configured port (default: 3001)

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get port from environment or use default
PORT=${PORT:-3001}

echo -e "${YELLOW}🛑 Stopping Maya Backend Server (port ${PORT})...${NC}"

# Find all processes using the port
PIDS=$(lsof -ti:${PORT} 2>/dev/null || true)

if [ -z "$PIDS" ]; then
    echo -e "${GREEN}✅ No processes found on port ${PORT}${NC}"
    exit 0
fi

echo -e "${YELLOW}📋 Found processes: $PIDS${NC}"

# Kill the processes
for PID in $PIDS; do
    echo -e "${YELLOW}   Killing process $PID...${NC}"
    kill -9 $PID 2>/dev/null || true
done

# Wait a moment
sleep 1

# Verify port is free
if lsof -ti:${PORT} >/dev/null 2>&1; then
    echo -e "${RED}❌ Some processes may still be running${NC}"
    exit 1
else
    echo -e "${GREEN}✅ All processes stopped. Port ${PORT} is now free.${NC}"
fi



