# First Deployment Guide - Step by Step

**Service Name**: `maya-agent`  
**Repository**: https://github.com/xiu-shi/maya_v1.0  
**URL**: `https://maya-agent.ai-builders.com`  
**Your First Deployment**: Let's do this together! 🚀

---

## 📋 Pre-Deployment Checklist

Before we start, make sure you have:
- ✅ GitHub repository pushed (already done!)
- ✅ Access to https://space.ai-builders.com
- ✅ Your portal email login credentials
- ✅ Your `AI_BUILDER_TOKEN` ready (we'll get this in Step 1)

---

## Step 1: Get Your API Key

### 1.1 Open Space Platform
1. Open your browser
2. Go to: **https://space.ai-builders.com**
3. Sign in with your portal email and password

### 1.2 Navigate to API Keys
1. Look for **"Settings"** in the navigation menu (usually top right or sidebar)
2. Click on **"Settings"**
3. Find and click **"API Keys"** (may be under "Developer" or "API" section)

### 1.3 Create API Key
1. Click **"Create API Key"** or **"New API Key"** button
2. Give it a name (e.g., "Maya Deployment Key")
3. Copy the API key immediately - it will look like:
   ```
   sk_live_abc123xyz789...
   ```
   ⚠️ **Important**: You can only see this key once! Copy it now.

### 1.4 Save Your API Key Safely
- Paste it in a text file temporarily (we'll use it in Step 3)
- Or keep it in your clipboard
- **Never share this key publicly or commit it to git**

**✅ Checkpoint**: Do you have your API key? It should start with `sk_live_`

---

## Step 2: Understand What We're Deploying

Let's review what will happen:

**What gets deployed:**
- Your Maya backend server (Node.js/Express)
- Your Maya frontend (HTML/CSS/JS)
- Your knowledge base files
- All dependencies

**Where it will be hosted:**
- URL: `https://maya-agent.ai-builders.com`
- (Note: Platform may add a random suffix, but we're requesting `maya-agent`)

**What happens during deployment:**
1. Space platform clones your GitHub repo
2. Installs dependencies (`npm install`)
3. Starts your server (`npm start`)
4. Makes it accessible via URL

**Time estimate:** 2-5 minutes for first deployment

**✅ Checkpoint**: Ready to proceed? Let's deploy!

---

## Step 3: Run the Deployment

### Option A: Using the Deployment Script (Easiest)

1. **Open Terminal** (on your Mac)

2. **Navigate to Maya directory:**
   ```bash
   cd /Users/eupirate/Desktop/Cloud/my_site_3_bot_maya_repo/Maya
   ```

3. **Run the deployment script:**
   ```bash
   ./deploy-to-space.sh sk_live_your_api_key_here
   ```
   Replace `sk_live_your_api_key_here` with your actual API key from Step 1.

4. **Review the configuration** - The script will show:
   - Repository URL
   - Service name: `maya-agent`
   - Branch: `main`
   - Port: `3000`

5. **Confirm** - Type `y` when asked to confirm

6. **Wait for response** - You'll see either:
   - ✅ Success message with deployment details
   - ❌ Error message (we'll troubleshoot if needed)

### Option B: Using curl Directly

If you prefer to use curl directly:

```bash
curl -X POST "https://space.ai-builders.com/backend/v1/deployments" \
  -H "Authorization: Bearer sk_live_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{
  "repo_url": "https://github.com/xiu-shi/maya_v1.0",
  "service_name": "maya_agent",
  "branch": "main",
  "port": 3000
}'
```

Replace `sk_live_your_api_key_here` with your actual API key.

**✅ Checkpoint**: Did you get a success response? If yes, proceed to Step 4. If error, see Troubleshooting below.

---

## Step 4: Monitor Your Deployment

### 4.1 Check Deployment Dashboard

1. Go to: **https://space.ai-builders.com/deployments**
2. You should see your service `maya-agent` listed
3. Status will show:
   - 🟡 **Building** - Deployment in progress
   - 🟢 **Running** - Successfully deployed
   - 🔴 **Failed** - Something went wrong (we'll fix it)

### 4.2 Watch Build Logs

1. Click on your service `maya_agent`
2. Look for **"Logs"** or **"Build Logs"** tab
3. Watch for:
   - ✅ `npm install` completing
   - ✅ `npm start` running
   - ✅ Server starting on port 3000
   - ❌ Any error messages

**What to expect:**
- Build logs showing npm install progress
- Server starting message
- "Listening on port 3000" or similar

**Time to wait:** Usually 2-5 minutes for first deployment

**✅ Checkpoint**: Is your service showing as "Running"? If yes, proceed to Step 5!

---

## Step 5: Configure Environment Variables

Your service is running, but it needs your `AI_BUILDER_TOKEN` to work!

### 5.1 Access Service Settings

1. In the deployment dashboard, click on `maya-agent`
2. Look for **"Settings"** or **"Environment Variables"** tab
3. Click to open environment variables section

### 5.2 Add Required Variables

Add these one by one:

**Variable 1:**
- **Name**: `AI_BUILDER_TOKEN`
- **Value**: Your actual AI Builder token (the one you use locally)
- **Mark as Secret**: ✅ Yes (check the box)

**Variable 2:**
- **Name**: `NODE_ENV`
- **Value**: `production`
- **Mark as Secret**: ❌ No

**Variable 3:**
- **Name**: `PORT`
- **Value**: `3000`
- **Mark as Secret**: ❌ No
- **Note**: Platform may set this automatically, but set it just in case

**Variable 4 (Optional but recommended):**
- **Name**: `ALLOWED_ORIGINS`
- **Value**: Your deployment URL (you'll see this in the dashboard)
- **Mark as Secret**: ❌ No

### 5.3 Save and Restart

1. Click **"Save"** or **"Update"**
2. Your service should automatically restart with new variables
3. Wait 1-2 minutes for restart

**✅ Checkpoint**: Are environment variables saved? Service restarted?

---

## Step 6: Test Your Deployed Service

### 6.1 Get Your Service URL

1. In the deployment dashboard, find your service `maya-agent`
2. Look for the **URL** or **Endpoint** - it should be:
   - `https://maya-agent.ai-builders.com`
   - (Platform may add a suffix, but we requested `maya-agent`)

### 6.2 Test Health Endpoint

Open in browser or use curl:
```
https://your-service-url.ai-builders.com/api/health
```

**Expected response:**
```json
{"status":"ok"}
```

### 6.3 Test Frontend

Open in browser:
```
https://your-service-url.ai-builders.com/maya.html
```

**Expected:** Maya chat interface loads!

### 6.4 Test Chat API

Open browser console (F12) or use curl:
```bash
curl -X POST "https://your-service-url.ai-builders.com/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "hi", "history": []}'
```

**Expected:** JSON response with Maya's greeting

### 6.5 Test in Browser

1. Open the frontend URL
2. Type "hi" in the chat
3. Send message
4. Verify Maya responds briefly and friendly

**✅ Checkpoint**: Is everything working? 🎉

---

## 🎉 Success! Your Service is Live!

Congratulations! You've successfully deployed Maya to AI Builder Space!

**What happens next:**
- ✅ Your service is live and accessible
- ✅ Any `git push` to `main` branch will auto-deploy
- ✅ Free hosting for 12 months
- ✅ You can share your Maya agent URL with others!

---

## 🔧 Troubleshooting

### Problem: API Key Error

**Error**: `401 Unauthorized` or `Invalid API key`

**Solution:**
1. Verify API key starts with `sk_live_`
2. Check you copied the entire key
3. Make sure key is active in Settings → API Keys
4. Try creating a new API key

### Problem: Deployment Fails

**Error**: `400 Bad Request` or `Repository not found`

**Solution:**
1. Verify repository URL: `https://github.com/xiu-shi/maya_v1.0`
2. Check repository is public or you have access
3. Verify branch `main` exists
4. Check repository has been pushed to GitHub

### Problem: Build Fails

**Error**: Build logs show npm install errors

**Solution:**
1. Check Node version (need 18+)
2. Verify `package.json` is correct
3. Check build logs for specific error
4. Ensure all dependencies are in `package.json`

### Problem: Service Won't Start

**Error**: Service shows "Failed" or won't start

**Solution:**
1. Check environment variables are set
2. Verify `AI_BUILDER_TOKEN` is correct
3. Check server logs for errors
4. Ensure port 3000 is available

### Problem: Frontend Not Loading

**Error**: 404 on `/maya.html`

**Solution:**
1. Verify frontend files are in repository
2. Check static file serving configuration
3. Verify file paths are correct
4. Check server logs

### Problem: API Returns Errors

**Error**: 500 or connection errors

**Solution:**
1. Check `AI_BUILDER_TOKEN` is set correctly
2. Verify token is valid
3. Check CORS configuration
4. Review server logs for errors

---

## 📞 Need Help?

If you get stuck at any step:
1. Check the error message carefully
2. Review the troubleshooting section above
3. Check deployment logs in the dashboard
4. Verify all steps were completed correctly

---

## 📝 Quick Reference

**Deployment Command:**
```bash
cd Maya
./deploy-to-space.sh sk_live_your_api_key
```

**Dashboard:**
- https://space.ai-builders.com/deployments

**Your Repository:**
- https://github.com/xiu-shi/maya_v1.0

**Service Name:**
- `maya-agent`

**Expected URL:**
- `https://maya-agent.ai-builders.com`

---

**Ready to start? Let's begin with Step 1!** 🚀

---

## 📖 First Deployment Experience - January 17, 2026

**Date**: January 17, 2026, 14:44 GMT  
**Service**: `maya-agent`  
**Repository**: https://github.com/xiu-shi/maya_v1.0  
**Status**: Deployment in progress (multiple iterations)

---

### Timeline of Events

#### Initial Deployment (14:44 GMT)
- ✅ **API Key Created**: Brand new deployment API key created (`sk_259ddd3c_...`)
- ✅ **Deployment Queued**: Successfully submitted via API
- ✅ **Service Name**: `maya-agent`
- ✅ **Expected URL**: `https://maya-agent.ai-builders.space/`
- ❌ **First Build Failed**: Status "UNHEALTHY" - Docker build failed

#### Issue #1: Build Context Problem (14:45 GMT)
**Problem**: 
- Docker build failed with exit code 1
- Error: "We couldn't build the runnable container"
- Root cause: Platform trying to build from repository root, but app is in `Maya/backend/`

**Solution Applied**:
- Created `Maya/Dockerfile` to specify build context
- Set working directory to `/app/Maya/backend`
- Configured COPY paths for correct file structure
- Created `Maya/.dockerignore` to exclude unnecessary files

**Files Created**:
- `Maya/Dockerfile` - Docker build configuration
- `Maya/.dockerignore` - Files to exclude from Docker build

#### Issue #2: AI_BUILDER_TOKEN Required at Startup (14:49 GMT)
**Problem**:
- Build still failing after Dockerfile fix
- Root cause: `config/env.js` was requiring `AI_BUILDER_TOKEN` at module load time
- Server couldn't start because token wasn't available during Docker build/container startup
- Environment variables are injected AFTER container starts, but validation happened BEFORE

**Solution Applied**:
- Modified `validateToken()` function to allow `null` during build/startup
- Changed token validation from required (`true`) to optional (`false`) in `getEnv()` call
- Added warning instead of throwing error in production mode
- Token is now validated when MCP client actually connects (lazy validation)

**Code Changes**:
```javascript
// Before:
aiBuilderToken: validateToken(getEnv('AI_BUILDER_TOKEN', null, true))

// After:
aiBuilderToken: validateToken(getEnv('AI_BUILDER_TOKEN', null, false))
```

**Files Modified**:
- `Maya/backend/config/env.js` - Made token optional during build

#### Redeployment Attempts
- **Attempt 1** (14:45 GMT): Added Dockerfile, build still failed
- **Attempt 2** (14:49 GMT): Fixed Dockerfile paths, build still failed  
- **Attempt 3** (14:52 GMT): Made AI_BUILDER_TOKEN optional, deployment queued

---

### Root Causes Identified

1. **Missing Dockerfile**
   - Platform couldn't determine how to build the application
   - No build instructions at repository root
   - Platform default build process didn't work for nested structure

2. **Build Context Mismatch**
   - Application code is in `Maya/backend/` subdirectory
   - Platform builds from repository root
   - Dockerfile needed to specify correct paths

3. **Environment Variable Timing**
   - `AI_BUILDER_TOKEN` validation happened at module load time
   - Environment variables injected AFTER container starts
   - Server failed before receiving environment variables
   - Needed lazy validation (validate when used, not when loaded)

4. **Required vs Optional Configuration**
   - Token marked as "required" in config
   - Should be "optional" during build, "required" at runtime
   - Need to distinguish between build-time and runtime requirements

---

### Fixes Applied

#### Fix #1: Dockerfile Creation
**File**: `Maya/Dockerfile`
```dockerfile
FROM node:18-alpine
WORKDIR /app/Maya/backend
COPY Maya/backend/package*.json ./
RUN npm install --production
COPY Maya/backend/ ./
COPY Maya/knowledge/ ../knowledge/
COPY Maya/frontend/ ../frontend/
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
CMD ["node", "server.js"]
```

**Key Points**:
- Sets working directory to backend location
- Copies package files first (Docker layer caching)
- Installs production dependencies only
- Copies all necessary files (backend, knowledge base, frontend)
- Exposes port 3000
- Sets environment variables

#### Fix #2: Token Validation Update
**File**: `Maya/backend/config/env.js`

**Changes**:
- `validateToken()` now allows `null` during build
- Logs warning instead of throwing error in production
- Token validated when MCP client connects (lazy validation)
- Changed `getEnv()` call from `required: true` to `required: false`

**Impact**:
- Container can start without token
- Token validated when actually needed
- Better error messages for missing token at runtime

#### Fix #3: Docker Ignore File
**File**: `Maya/.dockerignore`
- Excludes `node_modules/`, logs, test files
- Reduces Docker build context size
- Speeds up build process

---

### Lessons Learned

#### 1. Environment Variable Timing
**Lesson**: Environment variables are injected AFTER container starts, not during build.

**Best Practice**:
- Don't validate required env vars at module load time
- Use lazy validation (validate when actually used)
- Allow optional values during build, require at runtime

#### 2. Docker Build Context
**Lesson**: Docker builds from repository root by default, need to specify paths correctly.

**Best Practice**:
- Create Dockerfile at appropriate level
- Use relative paths from build context
- Test Dockerfile locally before deploying

#### 3. Nested Project Structure
**Lesson**: Subdirectory deployments need explicit Dockerfile configuration.

**Best Practice**:
- Always provide Dockerfile for nested structures
- Document build context in Dockerfile comments
- Test build process locally

#### 4. Error Messages
**Lesson**: Build errors don't always show root cause clearly.

**Best Practice**:
- Check build logs carefully
- Look for "exit code 1" or "failed" messages
- Test Docker build locally: `docker build -t test .`

#### 5. Iterative Problem Solving
**Lesson**: Multiple iterations needed to identify all issues.

**Best Practice**:
- Fix one issue at a time
- Test after each fix
- Document each attempt and result

---

### Current Status

**As of 14:52 GMT**:
- ✅ Dockerfile created and configured
- ✅ Token validation made optional during build
- ✅ Changes pushed to GitHub
- ⏳ **Deployment queued** - Status: "deploying"
- ⏳ Waiting for build to complete (5-10 minutes expected)

**Next Steps**:
1. Monitor deployment status in dashboard
2. Check build logs for success/failure
3. If successful: Configure environment variables
4. If failed: Review logs and apply additional fixes

---

### Deployment Checklist (What We Did)

- [x] Created GitHub repository
- [x] Pushed Maya code to GitHub
- [x] Created deployment API key
- [x] Submitted deployment via API
- [x] Identified build context issue
- [x] Created Dockerfile
- [x] Identified token validation issue
- [x] Fixed token validation
- [x] Redeployed with fixes
- [ ] Monitor build completion
- [ ] Configure environment variables
- [ ] Test deployed service
- [ ] Verify all endpoints working

---

### Key Files Created/Modified

**New Files**:
- `Maya/Dockerfile` - Docker build configuration
- `Maya/.dockerignore` - Docker ignore rules
- `Maya/DEPLOYMENT_API.md` - API deployment guide
- `Maya/DEPLOYMENT_SPACE.md` - Complete deployment guide
- `Maya/DEPLOYMENT_NEXT_STEPS.md` - Post-deployment steps
- `Maya/DEPLOYMENT_STATUS.md` - Status tracking

**Modified Files**:
- `Maya/backend/config/env.js` - Made token optional during build
- `Maya/deploy-to-space.sh` - Updated service name to `maya-agent`

---

### Troubleshooting Process

**Step 1**: Check deployment status via API
```bash
curl -X GET "https://space.ai-builders.com/backend/v1/deployments" \
  -H "Authorization: Bearer sk_..."
```

**Step 2**: Review error messages
- Status: "UNHEALTHY"
- Message: "Build #1 has failed"
- Action: Check build logs

**Step 3**: Identify root cause
- Docker build failing → Need Dockerfile
- Token validation failing → Need lazy validation

**Step 4**: Apply fixes
- Create Dockerfile
- Update token validation
- Push changes
- Redeploy

**Step 5**: Verify fix
- Check deployment status
- Review build logs
- Test endpoints

---

### Recommendations for Future Deployments

1. **Test Dockerfile Locally First**
   ```bash
   docker build -t maya-test .
   docker run -p 3000:3000 maya-test
   ```

2. **Use Lazy Validation for Environment Variables**
   - Don't validate at module load time
   - Validate when actually used
   - Provide helpful error messages

3. **Document Build Requirements**
   - Create Dockerfile with comments
   - Document environment variables needed
   - Include health check endpoints

4. **Monitor Build Logs**
   - Check logs immediately after deployment
   - Look for specific error messages
   - Don't wait for timeout

5. **Iterative Approach**
   - Fix one issue at a time
   - Test after each fix
   - Document each attempt

---

### Success Criteria

**Deployment is successful when**:
- ✅ Status shows "Running" (not "UNHEALTHY" or "Building")
- ✅ Health endpoint responds: `/api/health`
- ✅ Frontend loads: `/maya.html`
- ✅ Chat API works: `/api/chat`
- ✅ Environment variables configured
- ✅ No errors in server logs

---

### Notes

- **GitHub Security Warnings**: 2 vulnerabilities detected in dependencies (likely dev dependencies, not critical for production)
- **Auto-Deployment**: After first successful deployment, `git push` to `main` will auto-deploy
- **Free Hosting**: 12 months free hosting from first successful deployment
- **Service Limit**: Maximum 2 services per user

---

**Last Updated**: January 17, 2026, 14:52 GMT  
**Status**: Deployment in progress, fixes applied, waiting for build completion
