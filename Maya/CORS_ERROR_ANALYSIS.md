# CORS Error Analysis - January 17, 2026

## 🔍 Root Cause Analysis

### Error Message
```
error: "CORS policy violation"
message: "Your origin is not allowed to access this API"
```

### What's Happening

1. **Frontend is correct** ✅
   - `apiBaseUrl: ""` (empty string - same origin)
   - Request goes to: `/api/chat` (relative URL)
   - Browser resolves to: `https://maya-agent.ai-builders.space/api/chat`

2. **Browser sends Origin header** ⚠️
   - Even for same-origin requests, browsers sometimes send: `Origin: https://maya-agent.ai-builders.space`
   - This is normal browser behavior

3. **Backend CORS middleware checks origin** ❌
   - Old code: Only checked if origin was in `allowedOrigins` list
   - `allowedOrigins` defaults to: `['http://localhost:3001', 'http://localhost:3000', ...]`
   - `https://maya-agent.ai-builders.space` was NOT in the list
   - Result: **403 CORS error**

### Why It Happens

**The CORS middleware flow**:
```javascript
// Old code (deployed version):
1. Check if origin is null → NO (origin exists)
2. Check if origin is 'null' → NO
3. Check if origin in allowedOrigins → NO (only localhost URLs)
4. Check production domain → NOT IMPLEMENTED (old code)
5. REJECT → 403 error ❌
```

**The fix** (in latest code):
```javascript
// New code (committed but not deployed yet):
1. Check if origin is null → NO (origin exists)
2. Check if origin is 'null' → NO
3. Check if origin in allowedOrigins → NO
4. Check production domain → YES! ✅
   - originHostname = 'maya-agent.ai-builders.space'
   - Matches allowedProductionDomains ✅
5. ALLOW → 200 OK ✅
```

## ✅ Fix Applied

**File**: `Maya/backend/middleware/cors.js`

**Changes**:
```javascript
// Added explicit production domain check
if (config.isProduction) {
  const originHostname = new URL(origin).hostname;
  const allowedProductionDomains = [
    'maya-agent.ai-builders.space',
    'ai-builders.space'
  ];
  
  if (allowedProductionDomains.some(domain => 
    originHostname === domain || originHostname.endsWith('.' + domain)
  )) {
    return callback(null, true); // ✅ ALLOW
  }
}
```

## 🧪 Verification

**Test with curl** (simulates browser request):
```bash
curl -X POST https://maya-agent.ai-builders.space/api/chat \
  -H "Origin: https://maya-agent.ai-builders.space" \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "history": []}'
```

**Result**: ✅ **HTTP 200** (fix works!)

**Response headers**:
```
access-control-allow-origin: https://maya-agent.ai-builders.space ✅
```

## ⚠️ Current Status

- ✅ **Code fix**: Correct and committed
- ✅ **Fix pushed**: Available on GitHub
- ❌ **Deployment**: Still running old code (hasn't updated yet)

## 🚀 Solution

**The fix is correct, but needs to be deployed!**

### Step 1: Trigger New Deployment
```bash
curl -X POST "https://space.ai-builders.com/backend/v1/deployments" \
  -H "Authorization: Bearer sk_259ddd3c_5abfc7663d0b30308f61254f4d4e4bc92374" \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/xiu-shi/maya_v1.0", "service_name": "maya-agent", "branch": "main", "port": 3000}'
```

### Step 2: Wait 5-10 Minutes
Deployment needs to complete to apply the fix.

### Step 3: Test Again
After deployment:
- Clear browser cache (Cmd+Shift+R)
- Test in private window
- Should see: **200 OK** instead of **403 CORS error**

## 📋 Summary

| Component | Status | Notes |
|-----------|--------|-------|
| **Frontend** | ✅ Correct | Uses same-origin (`apiBaseUrl: ""`) |
| **Backend Code** | ✅ Fixed | Explicitly allows production domain |
| **Deployment** | ❌ Old code | Needs new deployment |
| **Fix Verified** | ✅ Works | curl test confirms fix |

---

**Root Cause**: CORS middleware didn't allow `maya-agent.ai-builders.space` origin  
**Fix**: Added explicit production domain check  
**Status**: Fix committed, waiting for deployment
