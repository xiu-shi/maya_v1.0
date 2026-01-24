# Deployment Troubleshooting - Invalid Credentials
**Date**: January 18, 2026  
**Error**: HTTP 401 - Invalid credentials

---

## 🔍 Problem Analysis

**Error**: `{"detail":"Invalid credentials"}`  
**HTTP Status**: 401 Unauthorized

This means the API key authentication failed.

---

## ✅ Solutions

### Solution 1: Verify API Key Format

**Required Format**: `sk_live_` followed by alphanumeric characters

**Check**:
```bash
# Your API key should look like:
sk_live_abc123def456ghi789...
```

**Common Mistakes**:
- ❌ Using placeholder: `sk_live_your_api_key_here`
- ❌ Missing `sk_live_` prefix
- ❌ Extra spaces or newlines
- ❌ Using old/expired key

---

### Solution 2: Get a Fresh API Key

1. **Go to**: https://space.ai-builders.com
2. **Sign in** with your portal email
3. **Navigate to**: Settings → API Keys
4. **Create new API key** (or regenerate existing)
5. **Copy the ENTIRE key** (starts with `sk_live_`)
6. **Use it immediately** (some keys expire if not used)

---

### Solution 3: Check API Key Permissions

Ensure your API key has:
- ✅ Deployment permissions
- ✅ Repository access permissions
- ✅ Service creation permissions

**Note**: If repository is private, the API key might need additional GitHub access.

---

### Solution 4: Private Repository Access

Since `maya_v1.0` is now **PRIVATE**, the deployment platform needs access:

**Option A: Grant GitHub Access to Platform**
1. Go to: https://github.com/xiu-shi/maya_v1.0/settings/access
2. Add deployment service as collaborator
3. Or configure GitHub App integration

**Option B: Use GitHub Personal Access Token**
1. Create GitHub PAT with `repo` scope
2. Use PAT for repository access
3. API key for deployment authentication

---

## 🧪 Test Your API Key

### Test Authentication:
```bash
# Test if API key works
curl -X GET "https://space.ai-builders.com/backend/v1/deployments" \
  -H "Authorization: Bearer YOUR_ACTUAL_API_KEY" \
  -H "Content-Type: application/json"
```

**Expected**: List of deployments (or empty array)  
**If 401**: API key is invalid

---

## 📋 Correct Deployment Command

**Replace `YOUR_ACTUAL_API_KEY` with your real key**:

```bash
curl -X POST "https://space.ai-builders.com/backend/v1/deployments" \
  -H "Authorization: Bearer YOUR_ACTUAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
  "repo_url": "https://github.com/xiu-shi/maya_v1.0",
  "service_name": "maya-agent",
  "branch": "main",
  "port": 3000
}'
```

**Or using the script**:
```bash
cd /Users/eupirate/Desktop/Cloud/my_site_3_bot_maya_repo/Maya
./deploy-to-space.sh YOUR_ACTUAL_API_KEY
```

---

## ⚠️ Common Issues

### Issue 1: Placeholder Key
**Problem**: Using `sk_live_your_api_key_here`  
**Fix**: Replace with actual API key from https://space.ai-builders.com

### Issue 2: Expired Key
**Problem**: Key was created but not used, or expired  
**Fix**: Generate a new API key

### Issue 3: Wrong Account
**Problem**: API key from different account  
**Fix**: Ensure you're using the key from the account that has access

### Issue 4: Private Repository
**Problem**: Repository is private, platform can't access it  
**Fix**: Grant platform access or use GitHub PAT

---

## 🔐 Security Reminder

**NEVER**:
- ❌ Commit API keys to git
- ❌ Share API keys in screenshots
- ❌ Use API keys in public documentation
- ❌ Hardcode API keys in scripts

**ALWAYS**:
- ✅ Use environment variables
- ✅ Keep keys secret
- ✅ Rotate keys regularly
- ✅ Use different keys for different environments

---

## 📞 Next Steps

1. **Verify API key** at https://space.ai-builders.com
2. **Get fresh API key** if needed
3. **Check repository access** (if private)
4. **Retry deployment** with correct key

---

**Status**: Authentication issue - verify API key  
**Action**: Get fresh API key from https://space.ai-builders.com
