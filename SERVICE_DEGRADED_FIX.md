# Service Degraded Status - Fix Guide
**Date**: January 18, 2026  
**Service**: maya-agent  
**Status**: Degraded  
**Last Updated**: 18/1/2026, 14:44:15

---

## 🔍 Current Status

- **Service**: `maya-agent`
- **Status**: **Degraded** (automatically synced from Koyeb)
- **Endpoint**: https://maya-agent.ai-builders.space/
- **Port**: 3000
- **Repository**: `xiu-shi/maya_v1.0` (Branch: main)
- **Last Updated**: 18/1/2026, 14:44:15
- **Hosting Expires**: 17/1/2027, 14:44:38

---

## 🔍 Possible Causes

### 1. Health Check Failing
- Service not responding to `/health` endpoint
- Port configuration issue
- Service crashed

### 2. Missing Environment Variables
- `AI_BUILDER_TOKEN` not configured
- Other required env vars missing

### 3. Application Errors
- Runtime errors in code
- Dependency issues
- Configuration problems

### 4. Resource Limits
- Memory limit exceeded (256 MB)
- Container restarting

---

## ✅ Fix Options

### Option 1: Redeploy (Recommended)

**Using the `maya` key** (since service exists, we can try redeploying):

```bash
cd /Users/eupirate/Desktop/Cloud/my_site_3_bot_maya_repo/Maya
./deploy-to-space.sh [REDACTED - Token revoked Jan 24, 2026]
```

**Or using curl**:
```bash
curl -X POST "https://space.ai-builders.com/backend/v1/deployments" \
  -H "Authorization: Bearer [REDACTED - Token revoked Jan 24, 2026]" \
  -H "Content-Type: application/json" \
  -d '{
  "repo_url": "https://github.com/xiu-shi/maya_v1.0",
  "service_name": "maya-agent",
  "branch": "main",
  "port": 3000
}'
```

### Option 2: Check Logs via Dashboard

1. Go to: https://space.ai-builders.com/deployments
2. Click on `maya-agent` service
3. Check logs for errors
4. Identify the specific issue

### Option 3: Manual Redeploy via Dashboard

1. Go to: https://space.ai-builders.com/deployments
2. Find service: `maya-agent`
3. Click "Redeploy" or "Rebuild" button
4. Wait for deployment to complete

---

## 🚀 Quick Redeploy Command

**Ready to use** (using the `maya` key we found):

```bash
cd /Users/eupirate/Desktop/Cloud/my_site_3_bot_maya_repo/Maya
./deploy-to-space.sh [REDACTED - Token revoked Jan 24, 2026]
```

---

## 📋 Verification After Redeploy

1. **Check health endpoint**:
   ```bash
   curl https://maya-agent.ai-builders.space/health
   ```

2. **Test chat endpoint**:
   ```bash
   curl -X POST https://maya-agent.ai-builders.space/api/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Hello", "history": []}'
   ```

3. **Check service status**:
   - Go to: https://space.ai-builders.com/deployments
   - Verify status changes from "Degraded" to "Healthy"

---

**Status**: Service exists but degraded - ready to redeploy  
**Action**: Use `maya` key to redeploy and fix the issue
