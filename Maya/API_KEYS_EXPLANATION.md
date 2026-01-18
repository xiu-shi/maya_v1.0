# API Keys Explanation - January 17, 2026

## Two Different API Keys

You have **two different API keys**:

### 1. Maya Development Key
- **Purpose**: For local development
- **Location**: `mcp_config.json` or `.env` file
- **Token**: `sk_937d9f12_5e4fc7f11ca47cf77cefec16b8611132466d`
- **Used for**: Local testing, development, MCP client connection

### 2. Maya Deployment Key  
- **Purpose**: For deployment platform authentication
- **Token**: `sk_259ddd3c_5abfc7663d0b30308f61254f4d4e4bc92374`
- **Used for**: Calling deployment API, authenticating with space.ai-builders.com

## Important Question

**Are these the same token or different?**

According to the deployment platform:
> "AI_BUILDER_TOKEN is injected into your container with the API Key used to call this endpoint."

This means:
- If you used the **deployment key** (`sk_259ddd3c_...`) to deploy
- The platform **should** inject that same key as `AI_BUILDER_TOKEN`
- But it might not be working correctly

## Which Token Should Be Used?

### Option 1: Use Deployment Key (If Platform Auto-Injects)
- Platform says it auto-injects the deployment API key
- If this works, no manual configuration needed
- **Test**: Check if chat works without setting env var

### Option 2: Use Development Key (If Platform Doesn't Auto-Inject)
- If auto-injection doesn't work, manually set `AI_BUILDER_TOKEN`
- Use your **development key** (`sk_937d9f12_...`)
- This is the token that works for local development

## How to Determine Which One to Use

### Step 1: Check Current Status
```bash
curl https://maya-agent.ai-builders.space/health
```

Look for `"tokenConfigured": true` or `false`

### Step 2: Test Chat Without Manual Config
Try chatting - if it works, deployment key is auto-injected correctly.

### Step 3: If Chat Doesn't Work
Manually set `AI_BUILDER_TOKEN` to your **development key**:
- Go to deployment dashboard
- Set environment variable: `AI_BUILDER_TOKEN = sk_937d9f12_5e4fc7f11ca47cf77cefec16b8611132466d`
- Restart service

## Recommendation

**Try this order:**

1. **First**: Test if chat works now (deployment key might be auto-injected)
2. **If not working**: Manually set `AI_BUILDER_TOKEN` to your **development key** (`sk_937d9f12_...`)
3. **Reason**: Development key is the one that works for local MCP client connections

## Why Two Keys?

- **Deployment Key**: Platform-specific, for authentication with deployment API
- **Development Key**: AI Builder API token, for actual LLM/MCP connections

They might be the same token, or they might be different depending on how the platform works.

---

**Action**: Test chat first, then manually set development key if needed.
