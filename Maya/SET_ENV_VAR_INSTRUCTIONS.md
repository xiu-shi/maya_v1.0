# How to Set AI_BUILDER_TOKEN Environment Variable

## Quick Fix Steps

### Step 1: Get Your AI Builder Token

You need your actual AI Builder API token (not the deployment API key). This is the token you use for local development.

**Where to find it:**
- Check your local `.env` file: `Maya/backend/.env`
- Or check `mcp_config.json` in repository root
- It should start with `sk_` and be different from the deployment API key

### Step 2: Set Environment Variable in Dashboard

1. **Go to Deployment Dashboard**
   - Visit: https://space.ai-builders.com/deployments
   - Click on service: `maya-agent`

2. **Navigate to Environment Variables**
   - Look for **"Settings"** or **"Configuration"** tab
   - Find **"Environment Variables"** section
   - Click **"Add Variable"** or **"Edit"**

3. **Add the Variable**
   - **Name**: `AI_BUILDER_TOKEN`
   - **Value**: Your actual AI Builder token (e.g., `sk_937d9f12_5e4fc7f11ca47cf77cefec16b8611132466d`)
   - **Mark as Secret**: ✅ Yes (check the box)
   - Click **"Save"** or **"Update"**

4. **Wait for Restart**
   - Service should automatically restart (1-2 minutes)
   - Check dashboard - status should show "Healthy"

### Step 3: Verify It's Working

After restart, test:

```bash
curl -X POST "https://maya-agent.ai-builders.space/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "hi", "history": []}'
```

**Expected Response**:
```json
{
  "response": "Hi! I'm Maya, Janet's digital twin. How can I help you today?",
  "warnings": []
}
```

### Step 4: Check Health Endpoint

The health endpoint now shows token status:

```bash
curl https://maya-agent.ai-builders.space/health
```

Look for:
```json
{
  "status": "ok",
  "config": {
    "hasToken": true,
    "nodeEnv": "production"
  }
}
```

If `hasToken` is `false`, the token isn't set correctly.

## Troubleshooting

### If Dashboard Doesn't Have Environment Variables Section
- Some platforms require you to set env vars during deployment
- Try triggering a new deployment with env vars in the API call
- Or contact platform support

### If Token Still Doesn't Work
1. Verify token format (should start with `sk_`)
2. Check server logs for specific error messages
3. Ensure token is the same one used for local development
4. Verify token hasn't expired

### If Service Doesn't Restart
- Manually trigger restart via dashboard
- Or trigger new deployment:
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

---

**Important**: The deployment API key (`sk_259ddd3c_...`) is different from the AI Builder token. You need your actual AI Builder API token for the `AI_BUILDER_TOKEN` environment variable.
