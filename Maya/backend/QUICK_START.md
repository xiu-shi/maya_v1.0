# Quick Start Guide

## Starting the Server

### Option 1: Use the start script (Recommended)
```bash
cd Maya/backend
./start.sh
```

This script will:
- ✅ Stop any existing processes on port 3000
- ✅ Start the server
- ✅ Wait for server to be ready
- ✅ Automatically open `http://localhost:3000/maya.html` in your browser
- ✅ Show server status and PID

### Option 2: Use npm script
```bash
cd Maya/backend
npm run start:script
```

### Option 3: Manual start
```bash
cd Maya/backend
npm start
```

## Stopping the Server

### Option 1: Use the stop script (Recommended)
```bash
cd Maya/backend
./stop.sh
```

### Option 2: Use npm script
```bash
cd Maya/backend
npm run stop
```

### Option 3: Manual stop
```bash
# Find the process
lsof -ti:3000

# Kill it
kill -9 $(lsof -ti:3000)
```

## Viewing Logs

```bash
cd Maya/backend
tail -f server.log
```

## Restart Server

### Quick Restart Script
```bash
cd Maya/backend
./stop.sh && ./start.sh
```

This will:
- ✅ Stop any existing server processes
- ✅ Start a fresh server instance
- ✅ Automatically open the frontend in your browser

## Troubleshooting

### Chat Not Working / API Errors
**Issue**: If you see "connectivity issues" error messages in the chat interface.

**Solution**:
1. Check server logs: `tail -f server.log`
2. Verify API parameters are correct (see Issue #8 in `Implementation.md`)
3. Restart server: `cd Maya/backend && ./stop.sh && ./start.sh`
4. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

**Common Cause**: Unsupported API parameters causing 400 Bad Request errors. Fixed in Issue #8 (January 6, 2025, 12:05).

### Port 3000 Already in Use
If you get `EADDRINUSE` error:
```bash
cd Maya/backend
./stop.sh    # Stop all processes
./start.sh   # Start fresh
```

### Server Won't Start
1. Check if port is free: `lsof -ti:3000`
2. Check logs: `tail -20 server.log`
3. Verify environment: `cat .env | grep AI_BUILDER_TOKEN`

### Browser Won't Open Automatically
The script tries to auto-open the browser, but if it fails:
- Manually open: `http://localhost:3000/maya.html`

## Server URLs

- **Frontend**: http://localhost:3000/maya.html
- **Health Check**: http://localhost:3000/health
- **API Endpoint**: http://localhost:3000/api/chat

## Quick Commands Reference

```bash
# Start server (with auto-open browser)
./start.sh

# Stop server
./stop.sh

# View logs
tail -f server.log

# Check server status
curl http://localhost:3000/health

# Test API
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello Maya!", "history": []}'
```

