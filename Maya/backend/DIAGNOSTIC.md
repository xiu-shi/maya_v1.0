# Server Diagnostic Guide

## Issue: Server Stuck After Repo Rename

### Symptoms
- Server process consuming 100% CPU
- Server appears to start but hangs at "Lazy loading MCP client module..."
- Health check endpoint hangs

### Root Cause
The health check endpoint was calling `getMCPClient()` which tried to connect to the MCP server synchronously, causing the server to hang if the MCP connection was slow or stuck.

### Fixes Applied

1. **Health Check Endpoint** (`server.js`)
   - Changed to not wait for MCP client connection
   - Now uses existing instance if available, but doesn't block

2. **MCP Connection Timeout** (`mcp-client.js`)
   - Added 10-second timeout to prevent indefinite hanging
   - Added proper cleanup on connection failure

### How to Check for Stuck Processes

```bash
# Check for processes on port 3000
lsof -ti:3000

# Check for Node.js server processes
ps aux | grep "node server.js" | grep -v grep

# Check for MCP server processes
ps aux | grep "mcp-coach-server" | grep -v grep

# Kill all processes on port 3000
cd Maya/backend && ./stop.sh

# Or manually kill specific PIDs
kill -9 <PID>
```

### How to Start Server Safely

```bash
cd Maya/backend
./stop.sh  # Ensure no existing processes
./start.sh  # Start fresh
```

### Monitoring

- Check server logs: `tail -f Maya/backend/server.log`
- Monitor CPU usage: Activity Monitor or `top -pid <PID>`
- Test health endpoint: `curl http://localhost:3000/health`

### If Server Still Hangs

1. Kill all Node.js processes: `pkill -9 node`
2. Wait 5 seconds
3. Restart: `cd Maya/backend && ./start.sh`
4. Check logs for errors: `tail -f server.log`
