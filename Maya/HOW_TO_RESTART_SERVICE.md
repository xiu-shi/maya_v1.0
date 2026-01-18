# How to Restart Maya Service - January 17, 2026

## Quick Restart Methods

### Method 1: Via Deployment Dashboard (Recommended)

1. **Go to Deployment Dashboard**
   - Visit: https://space.ai-builders.com/deployments
   - Find your service: `maya-agent`

2. **Look for Restart Button**
   - Click on the service `maya-agent`
   - Look for a **"Restart"**, **"Redeploy"**, or **"Rebuild"** button
   - Click it to restart the service

3. **Wait for Restart**
   - Service will restart automatically
   - Status will change: "Healthy" → "Restarting" → "Healthy"
   - Usually takes 1-2 minutes

### Method 2: Trigger New Deployment (Alternative)

If there's no restart button, trigger a new deployment:

```bash
curl -X POST "https://space.ai-builders.com/backend/v1/deployments" \
  -H "Authorization: Bearer sk_259ddd3c_5abfc7663d0b30308f61254f4d4e4bc92374" \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/xiu-shi/maya_v1.0",
    "service_name": "maya-agent",
    "branch": "main",
    "port": 3000
  }'
```

This will trigger a new deployment which will restart the service with updated environment variables.

### Method 3: Update Environment Variable (Auto-Restart)

Some platforms automatically restart when you update environment variables:

1. Go to deployment dashboard
2. Click on `maya-agent`
3. Go to **Settings** → **Environment Variables**
4. Add or update `AI_BUILDER_TOKEN`
5. Click **Save**
6. Service should automatically restart

## Verify Restart

After restarting, check:

1. **Dashboard Status**
   - Should show "Healthy" status
   - "UPDATED" timestamp should be recent

2. **Test API**
   ```bash
   curl -X POST "https://maya-agent.ai-builders.space/api/chat" \
     -H "Content-Type: application/json" \
     -d '{"message": "hi", "history": []}'
   ```

3. **Test in Browser**
   - Visit: https://maya-agent.ai-builders.space/maya.html
   - Try sending a message
   - Should get a response from Maya (not error message)

## Expected Timeline

- **Restart Time**: 1-2 minutes
- **Total Wait**: 2-3 minutes (including restart + DNS propagation)

## Troubleshooting

### If Service Doesn't Restart
- Check deployment logs for errors
- Verify environment variable is saved correctly
- Try Method 2 (trigger new deployment)

### If Still Getting Connection Errors
- Verify `AI_BUILDER_TOKEN` is set correctly
- Check token format (should start with `sk_`)
- Check server logs for specific error messages
- Ensure token is marked as "secret"

---

**Quick Command Reference**:
- Dashboard: https://space.ai-builders.com/deployments
- Service URL: https://maya-agent.ai-builders.space/maya.html
- Health Check: https://maya-agent.ai-builders.space/health
