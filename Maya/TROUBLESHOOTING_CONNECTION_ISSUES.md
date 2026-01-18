# Troubleshooting Maya Connection Issues - Step by Step

## 🎯 Current Problem

Maya shows: "I apologize, but I'm experiencing connection issues at the moment."

## 🔍 Diagnostic Checklist

### Step 1: Check Browser Console (F12)

**What to look for**:
1. Open browser console (F12)
2. Look for this log:
   ```
   🔧 Maya Chat Configuration: {
     apiBaseUrl: "...",
     protocol: "https:",
     hostname: "maya-agent.ai-builders.space"
   }
   ```

**Expected**:
- `apiBaseUrl: ""` (empty string) ✅
- `protocol: "https:"` ✅
- `hostname: "maya-agent.ai-builders.space"` ✅

**If you see**:
- `apiBaseUrl: "https://api.janetxiushi.me"` ❌ → **Old code cached, clear browser cache**

### Step 2: Check Network Tab (F12 → Network)

**What to do**:
1. Open Network tab
2. Send a message in Maya
3. Look for request to `/api/chat`

**Check**:
- **Request URL**: Should be `https://maya-agent.ai-builders.space/api/chat`
- **Status Code**: 
  - `200` = Success ✅
  - `503` = Service Unavailable (likely `AI_BUILDER_TOKEN` not set) ⚠️
  - `404` = Endpoint not found ❌
  - `500` = Server error ❌

**Response Body** (if status is not 200):
```json
{
  "error": "Service temporarily unavailable",
  "message": "AI service token is not configured. Please contact support."
}
```
This means `AI_BUILDER_TOKEN` is not set! ⚠️

### Step 3: Check Server Health

**Command**:
```bash
curl https://maya-agent.ai-builders.space/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-17T...",
  "environment": "production",
  "mcpConnected": true,
  "tokenConfigured": true,  ← Should be TRUE
  "kb": { ... }
}
```

**If `tokenConfigured: false`**: 
- ⚠️ **AI_BUILDER_TOKEN is not set in deployment environment variables**

### Step 4: Verify Environment Variables

**In Deployment Dashboard**:
1. Go to your deployment dashboard
2. Find "Environment Variables" section
3. Look for `AI_BUILDER_TOKEN`

**Should be set to**:
- Your development key: `sk_937d9f12_...` (the one that starts with `sk_`)
- **NOT** the deployment API key: `sk_259ddd3c_...`

**If missing**:
1. Click "Add Environment Variable"
2. Name: `AI_BUILDER_TOKEN`
3. Value: `sk_937d9f12_...` (your development key)
4. Save
5. Restart service (or wait for auto-restart)

## 🐛 Common Issues & Fixes

### Issue 1: AI_BUILDER_TOKEN Not Set ⚠️ MOST COMMON

**Symptom**: 
- Error: "I apologize, but I'm experiencing connection issues"
- Network tab shows: Status 503
- Health check shows: `tokenConfigured: false`

**Fix**:
1. Go to deployment dashboard
2. Add environment variable: `AI_BUILDER_TOKEN = sk_937d9f12_...`
3. Save and wait for restart (or manually restart)

### Issue 2: Browser Cache (Old Code)

**Symptom**:
- Browser console shows: `apiBaseUrl: "https://api.janetxiushi.me"`
- Network tab shows request to `api.janetxiushi.me`

**Fix**:
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. Or clear browser cache completely
3. Or use incognito/private window

### Issue 3: Server Not Running

**Symptom**:
- Health check fails or times out
- Network tab shows: Request failed

**Fix**:
1. Check deployment status in dashboard
2. Should be "Healthy"
3. If "Unhealthy", check deployment logs

### Issue 4: Wrong API Key

**Symptom**:
- `AI_BUILDER_TOKEN` is set, but still getting errors
- Health check shows: `tokenConfigured: true` but `mcpConnected: false`

**Fix**:
1. Verify you're using the **development key** (`sk_937d9f12_...`)
2. **NOT** the deployment API key (`sk_259ddd3c_...`)
3. The deployment key is only for deploying, not for AI Builder API

## 📋 Quick Diagnostic Script

Run this to check everything:

```bash
# 1. Check server health
echo "=== Server Health ==="
curl -s https://maya-agent.ai-builders.space/health | python3 -m json.tool

# 2. Check if endpoint exists
echo -e "\n=== API Endpoint Test ==="
curl -X POST https://maya-agent.ai-builders.space/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","history":[]}' \
  -s | python3 -m json.tool
```

## 🎯 Most Likely Fix

Based on the error message, **99% chance** it's:

**AI_BUILDER_TOKEN not configured in deployment environment variables**

**To fix**:
1. Go to deployment dashboard
2. Environment Variables → Add
3. Name: `AI_BUILDER_TOKEN`
4. Value: `sk_937d9f12_...` (your development key)
5. Save
6. Wait 1-2 minutes for restart
7. Test again

---

**Remember**: Take it step by step! Check each item in order. 🚀
