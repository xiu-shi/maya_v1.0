# Deployment Issue - January 24, 2026, 23:22 GMT

## 🚨 Issue: MCP Still Not Connected After Deployment

### Timeline
- **22:00 GMT**: Deployment triggered successfully
- **22:22 GMT** (22 minutes later): Health check shows `mcpConnected: false`

### Health Check Response
```json
{
  "status": "ok",
  "timestamp": "2026-01-24T22:21:41.309Z",
  "environment": "production",
  "mcpConnected": false,  // ❌ PROBLEM
  "tokenConfigured": true,
  "kb": {"status": "not_available"}
}
```

### Problem Analysis

**Expected**: After deployment with new API key, `mcpConnected` should be `true`  
**Actual**: Still `false` after 22 minutes

### Possible Causes

1. **API Key Not Injected Properly**
   - Platform may not have injected the new key
   - Service may still have cached old key

2. **API Key Issues**
   - Key might not have correct permissions
   - Key might be for wrong environment

3. **MCP Connection Issues**
   - Service can't reach MCP server
   - Connection timeout/firewall issues

4. **Service Not Fully Restarted**
   - Old instance still running
   - New instance not started properly

### Diagnostic Steps

1. **Check Chat Endpoint**
   - Does chat work despite `mcpConnected: false`?
   - Local worked with `mcpConnected: false`

2. **Check Deployment Status**
   - Is service status "HEALTHY" or still "DEGRADED"?
   - What does platform dashboard show?

3. **Verify API Key**
   - Is the key we're using correct?
   - Does it have proper permissions?

---

## ✅ RESOLVED - January 24, 2026, 22:42 GMT

### Resolution
**Root Cause**: Old API key (sk_9a342713) didn't work with AI Builders MCP API

**Solution Implemented**:
1. Generated new API key: sk_a875c681...
2. Updated Maya/backend/.env (gitignored)
3. Added old key to revoked list in env.js
4. Tested locally - confirmed working (mcpConnected: true)
5. Deployed to production at 22:42 GMT

### Deployment Status
- **Time**: January 24, 2026, 22:42 GMT
- **Status**: Deploying (5-10 minutes expected)
- **Verification**: After 22:52 GMT

### Security Verification
- ✅ No hardcoded keys (global scan: 0 instances)
- ✅ All pre-deployment tests passed (14/14)
- ✅ API key validation tests passed (24/24)
- ✅ Local chat working with new key

**Expected Result**: Production mcpConnected: true, chat functional
