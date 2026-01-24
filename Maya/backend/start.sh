#!/bin/bash

# Maya Backend Server Start Script
# This script properly stops any existing server, starts a new one, and opens the browser

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting Maya Backend Server...${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Get port from environment or use default (matching production)
PORT=${PORT:-3000}

# Step 1: Find and kill any processes using the port
echo -e "${YELLOW}📋 Checking for processes on port ${PORT}...${NC}"
PIDS=$(lsof -ti:${PORT} 2>/dev/null || true)

if [ -n "$PIDS" ]; then
    echo -e "${YELLOW}🛑 Stopping existing processes on port ${PORT}...${NC}"
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
    sleep 1
    
    # Verify port is free
    if lsof -ti:${PORT} >/dev/null 2>&1; then
        echo -e "${RED}❌ Failed to free port ${PORT}${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Port ${PORT} is now free${NC}"
    fi
else
    echo -e "${GREEN}✅ Port ${PORT} is free${NC}"
fi

# Step 2: Wait a moment for port to be fully released
sleep 1

# Step 3: Start the server in the background
echo -e "${YELLOW}🔄 Starting server on port ${PORT}...${NC}"
export PORT=${PORT}
npm start > server.log 2>&1 &
SERVER_PID=$!

# Step 4: Wait for server to be ready
echo -e "${YELLOW}⏳ Waiting for server to start...${NC}"
MAX_WAIT=60
WAIT_COUNT=0
CPU_WARNING_SHOWN=false

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    # Check if server is responding
    if curl -s http://localhost:${PORT}/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Server is ready!${NC}"
        break
    fi
    
    # Monitor CPU usage (check every 3 seconds to avoid overhead)
    if [ $((WAIT_COUNT % 3)) -eq 0 ] && [ -n "$SERVER_PID" ]; then
        # Get CPU usage percentage (works on macOS and Linux)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS: ps -p PID -o %cpu= | tr -d ' '
            CPU_USAGE=$(ps -p $SERVER_PID -o %cpu= 2>/dev/null | tr -d ' ' | cut -d. -f1 || echo "0")
        else
            # Linux: ps -p PID -o %cpu= | tr -d ' '
            CPU_USAGE=$(ps -p $SERVER_PID -o %cpu= 2>/dev/null | tr -d ' ' | cut -d. -f1 || echo "0")
        fi
        
        # Check if CPU usage is 95% or higher
        if [ -n "$CPU_USAGE" ] && [ "$CPU_USAGE" != "0" ] && [ "$CPU_USAGE" -ge 95 ]; then
            if [ "$CPU_WARNING_SHOWN" = false ]; then
                echo -e "\n${RED}⚠️  WARNING: Server process is consuming ${CPU_USAGE}% CPU${NC}"
                echo -e "${YELLOW}   This may indicate the server is stuck in a loop.${NC}"
                echo -e "${YELLOW}   Checking server logs for errors...${NC}"
                tail -10 server.log 2>/dev/null || echo "   (No logs available yet)"
                echo -e "${YELLOW}   Consider stopping with: kill $SERVER_PID${NC}"
                CPU_WARNING_SHOWN=true
            fi
        fi
    fi
    
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    echo -n "."
done

if [ $WAIT_COUNT -eq $MAX_WAIT ]; then
    echo -e "\n${RED}❌ Server failed to start within ${MAX_WAIT} seconds${NC}"
    
    # Check final CPU usage
    if [ -n "$SERVER_PID" ]; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            CPU_USAGE=$(ps -p $SERVER_PID -o %cpu= 2>/dev/null | tr -d ' ' | cut -d. -f1 || echo "N/A")
        else
            CPU_USAGE=$(ps -p $SERVER_PID -o %cpu= 2>/dev/null | tr -d ' ' | cut -d. -f1 || echo "N/A")
        fi
        
        if [ -n "$CPU_USAGE" ] && [ "$CPU_USAGE" != "N/A" ] && [ "$CPU_USAGE" != "0" ]; then
            if [ "$CPU_USAGE" -ge 95 ]; then
                echo -e "${RED}⚠️  Server process is consuming ${CPU_USAGE}% CPU - likely stuck in a loop${NC}"
            else
                echo -e "${YELLOW}📊 Server CPU usage: ${CPU_USAGE}%${NC}"
            fi
        fi
    fi
    
    echo -e "${YELLOW}📋 Checking server logs...${NC}"
    tail -20 server.log
    echo -e "\n${YELLOW}💡 Troubleshooting tips:${NC}"
    echo -e "   1. Check server.log for errors: tail -f server.log"
    echo -e "   2. Verify environment variables are set correctly"
    echo -e "   3. Try manual start: npm start"
    kill $SERVER_PID 2>/dev/null || true
    exit 1
fi

# Step 5: Display server info
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Maya Backend Server Started Successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Server PID: ${SERVER_PID}"
echo -e "Port: ${PORT}"
echo -e "Health Check: http://localhost:${PORT}/health"
echo -e "Chat Interface: http://localhost:${PORT}/maya.html"
echo -e "Chat Logs Dashboard: http://localhost:${PORT}/chat_logs.html"
echo -e "Logs: tail -f $SCRIPT_DIR/server.log"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Step 6: Open browser
echo -e "${YELLOW}🌐 Opening Chat Logs Dashboard...${NC}"
sleep 2  # Give server a moment to fully initialize

# Detect OS and open browser accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:${PORT}/chat_logs.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open http://localhost:${PORT}/chat_logs.html 2>/dev/null || sensible-browser http://localhost:${PORT}/chat_logs.html 2>/dev/null || true
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows (Git Bash/Cygwin)
    start http://localhost:${PORT}/chat_logs.html
else
    echo -e "${YELLOW}⚠️  Could not auto-open browser. Please manually open:${NC}"
    echo -e "   http://localhost:${PORT}/chat_logs.html"
fi

# Step 7: Show how to stop the server
echo -e "\n${YELLOW}💡 To stop the server:${NC}"
echo -e "   kill $SERVER_PID"
echo -e "   or run: ./stop.sh"
echo -e "\n${YELLOW}📋 To view logs:${NC}"
echo -e "   tail -f server.log"

# Keep script running (server runs in background)
wait $SERVER_PID
