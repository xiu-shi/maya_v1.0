# Deployment API Key Reference
**Date**: January 18, 2026

---

## 🔑 Your API Keys

### 1. AI_BUILDER_TOKEN (Maya Backend)
**Purpose**: Powers Maya's AI responses  
**Found**: Via MCP configuration  
**Value**: Stored securely in `.env` file (not committed to git). Old key revoked January 24, 2026.  
**Status**: ⚠️ **EXPOSED IN GIT HISTORY - MUST BE REVOKED**

**Location**: 
- Stored in: `Maya/backend/.env` (local, gitignored)
- Used by: Backend server for AI API calls

---

### 2. Deployment API Key (AI Builder Space)
**Purpose**: Deploy Maya to AI Builder Space  
**Keys You Mentioned**:
- `maya` - Possibly for Maya service
- `deploy_maya` - Likely for deployment

**Where to Find**:
1. Go to: https://space.ai-builders.com
2. Sign in with your portal email
3. Navigate to: **Settings → API Keys**
4. Look for keys named:
   - `maya`
   - `deploy_maya`
   - Or any key starting with `sk_live_`

**Format**: Should start with `sk_live_`

---

## 🚀 Use deploy_maya Key for Deployment

Based on your mention of `deploy_maya`, this is likely the correct key:

```bash
cd /Users/eupirate/Desktop/Cloud/my_site_3_bot_maya_repo/Maya
./deploy-to-space.sh sk_live_[your_deploy_maya_key_here]
```

**Or using curl**:
```bash
curl -X POST "https://space.ai-builders.com/backend/v1/deployments" \
  -H "Authorization: Bearer sk_live_[your_deploy_maya_key]" \
  -H "Content-Type: application/json" \
  -d '{
  "repo_url": "https://github.com/xiu-shi/maya_v1.0",
  "service_name": "maya-agent",
  "branch": "main",
  "port": 3000
}'
```

---

## ⚠️ Important Notes

1. **AI_BUILDER_TOKEN**: Exposed in git history - must be revoked
2. **Deployment Keys**: Should be kept secret, never committed
3. **Private Repository**: Since repo is private, ensure deployment platform has access

---

## 📝 Next Steps

1. **Get deploy_maya key** from https://space.ai-builders.com
2. **Use it for deployment** (replace placeholder in command)
3. **Revoke AI_BUILDER_TOKEN** that was exposed
4. **Generate new AI_BUILDER_TOKEN** for backend

---

**Status**: Need to retrieve `deploy_maya` key from AI Builder Space dashboard
