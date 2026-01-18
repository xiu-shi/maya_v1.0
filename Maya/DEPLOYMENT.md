# Maya Deployment Guide - Complete Reference

**Last Updated**: January 18, 2026  
**Service**: `maya-agent`  
**Repository**: https://github.com/xiu-shi/maya_v1.0  
**Production URL**: https://maya-agent.ai-builders.space  
**Platform**: AI Builder Space (https://space.ai-builders.com)

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Prerequisites](#prerequisites)
4. [Deployment Methods](#deployment-methods)
5. [Configuration](#configuration)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)
8. [Security](#security)
9. [Frontend Deployment](#frontend-deployment)
10. [Feature Deployments](#feature-deployments)
11. [Monitoring & Maintenance](#monitoring--maintenance)
12. [Deployment History](#deployment-history)
13. [Reference](#reference)

---

## Overview

This guide covers deploying Maya (Janet Xiu Shi's Digital Twin) to AI Builder Space. Maya consists of:
- **Backend**: Node.js/Express API server
- **Frontend**: HTML/CSS/JS chat interface
- **Knowledge Base**: Markdown documents and configuration files

**Deployment Platform**: AI Builder Space (Koyeb-based infrastructure)  
**Auto-Deployment**: Enabled via GitHub webhooks after first deployment  
**Hosting**: Free for 12 months from first successful deployment

---

## Quick Start

### Option 1: Using Deployment Script

```bash
cd Maya
./deploy-to-space.sh sk_live_your_api_key_here
```

### Option 2: Using curl Directly

```bash
curl -X POST "https://space.ai-builders.com/backend/v1/deployments" \
  -H "Authorization: Bearer sk_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
  "repo_url": "https://github.com/xiu-shi/maya_v1.0",
  "service_name": "maya-agent",
  "branch": "main",
  "port": 3000
}'
```

### Get Your API Key

1. Go to **https://space.ai-builders.com**
2. Sign in with your portal email
3. Navigate to **Settings → API Keys**
4. Create a new API key
5. Copy the key (starts with `sk_live_`)

**⚠️ Important**: Keep your API key secret! Never commit it to git.

---

## Prerequisites

### Required

- ✅ GitHub repository: `xiu-shi/maya_v1.0`
- ✅ AI Builders account with Space access
- ✅ Portal email login credentials
- ✅ API key for deployment (create in Settings → API Keys)
- ✅ `AI_BUILDER_TOKEN` (will be auto-injected by platform)

### Repository Setup

```bash
# Check current git status
cd /Users/eupirate/Desktop/Cloud/my_site_3_bot_maya_repo
git status

# Add Maya remote (if not already added)
git remote add maya-space git@github.com:xiu-shi/maya_v1.0.git

# Verify remotes
git remote -v
```

### .gitignore Configuration

Verify `.gitignore` excludes sensitive files:
- `.env` files (contains `AI_BUILDER_TOKEN`)
- `node_modules/`
- `server.log` and `*.log` files
- `.DS_Store`
- Knowledge base PDFs (if large)

---

## Deployment Methods

### Method 1: API Deployment (First Time)

**Use this for initial deployment:**

```bash
curl -X POST "https://space.ai-builders.com/backend/v1/deployments" \
  -H "Authorization: Bearer sk_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
  "repo_url": "https://github.com/xiu-shi/maya_v1.0",
  "service_name": "maya-agent",
  "branch": "main",
  "port": 3000
}'
```

**Response**: Returns deployment status and service URL

### Method 2: Git Push (Auto-Deployment)

**After first successful deployment:**

```bash
# Make changes locally
git add Maya/
git commit -m "Update: [description]"
git push origin main

# Platform automatically deploys via GitHub webhook
# Wait 5-10 minutes for deployment to complete
```

**Note**: Platform uses GitHub webhooks for auto-deployment after first deployment.

### Method 3: Manual Trigger via Dashboard

1. Go to: https://space.ai-builders.com/deployments
2. Find service: `maya-agent`
3. Look for "Redeploy" or "Rebuild" button
4. Click to force new deployment

---

## Configuration

### Repository Information

- **URL**: `https://github.com/xiu-shi/maya_v1.0`
- **Branch**: `main`
- **Root Directory**: `Maya/backend` (auto-detected)

### Service Configuration

- **Service Name**: `maya-agent`
- **Port**: `3000`
- **Node Version**: 18+ (specified in `package.json`)

### Build Configuration

The Space platform automatically:
1. Clones the repository
2. Navigates to `Maya/backend` directory
3. Runs `npm install`
4. Starts with `npm start`

**Dockerfile Location**: Must be at repository root (`/Dockerfile`)

### Environment Variables

**Auto-Injected by Platform**:
- `AI_BUILDER_TOKEN` - Automatically injected using the API key used for deployment
- `NODE_ENV=production` - Set in Dockerfile
- `PORT=3000` - Set in Dockerfile

**Optional (Recommended)**:
- `AI_BUILDERS_MODEL=grok-4-fast`
- `AI_BUILDERS_API_URL=https://space.ai-builders.com/backend/v1/chat/completions`
- `ALLOWED_ORIGINS=https://space.ai-builders.com,https://maya-agent.ai-builders.space`
- `TRUST_PROXY=true`

**Security Settings**:
- Mark `AI_BUILDER_TOKEN` as **secret/encrypted** in platform
- Never expose tokens in logs or public settings

---

## Verification

### Health Check

```bash
curl https://maya-agent.ai-builders.space/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "...",
  "environment": "production",
  "mcpConnected": true,
  "tokenConfigured": true
}
```

### Frontend Access

Open in browser:
```
https://maya-agent.ai-builders.space/maya.html
```

**Expected**: Maya chat interface loads

### API Test

```bash
curl -X POST https://maya-agent.ai-builders.space/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "history": []}'
```

**Expected**: JSON response with Maya's greeting

### Root Route Test

```bash
curl -I https://maya-agent.ai-builders.space/
```

**Expected Response**:
```
HTTP/1.1 301 Moved Permanently
Location: /maya.html
```

### Post-Deployment Checklist

- [ ] Deployment status is "Healthy"
- [ ] Health endpoint returns `{"status": "ok"}`
- [ ] Root URL (`/`) redirects to `/maya.html` (301 redirect)
- [ ] Frontend loads at `/maya.html`
- [ ] Chat API responds successfully
- [ ] LLM backend connected (`tokenConfigured: true`)
- [ ] No console errors
- [ ] No CORS errors
- [ ] Browser cache cleared (use `Cmd+Shift+R` or private window)

---

## Troubleshooting

### Issue 1: Deployment Timestamp Not Updating

**Problem**: Deployment timestamp stuck and not updating despite multiple API calls.

**Root Cause**: Platform uses GitHub webhooks for auto-deployment after first successful deployment. Manual API calls may not trigger new deployments for existing services.

**Solutions**:

1. **Verify GitHub Auto-Deployment** (Recommended):
   ```bash
   git log --oneline -1
   git push origin main
   ```
   - Wait 2-5 minutes
   - Check deployment dashboard for new timestamp

2. **Manual Trigger via Dashboard**:
   - Go to: https://space.ai-builders.com/deployments
   - Find service: `maya-agent`
   - Click "Redeploy" or "Rebuild" button

3. **Force Deployment via Empty Commit**:
   ```bash
   git commit --allow-empty -m "Trigger deployment"
   git push origin main
   ```

4. **Check GitHub Webhook Configuration**:
   - Go to: https://github.com/xiu-shi/maya_v1.0/settings/hooks
   - Verify webhook pointing to `space.ai-builders.com` exists
   - Check webhook deliveries for success (200 status)

### Issue 2: Frontend Shows Hardcoded External API URL

**Problem**: Browser console shows `apiBaseUrl: "https://api.janetxiushi.me"` instead of empty string.

**Solution**:
1. Verify code is pushed to GitHub (should return empty string for production)
2. Wait for deployment to complete (5-10 minutes)
3. **Clear browser cache** (critical!):
   - **Mac**: `Cmd+Shift+R` (hard refresh)
   - **Windows**: `Ctrl+Shift+R`
   - **OR**: Use private/incognito window
4. Verify in console - should show `apiBaseUrl: ""` (empty)

**Verification**:
```bash
curl -s https://maya-agent.ai-builders.space/maya.html | grep -i "api.janetxiushi"
# Should return nothing (no hardcoded URL)
```

### Issue 3: CORS Policy Violation (403 Error)

**Problem**: Backend rejects requests with `403 CORS policy violation`.

**Solution**:
1. Update CORS middleware to explicitly allow `maya-agent.ai-builders.space`
2. Ensure `ALLOWED_ORIGINS` environment variable includes production domain
3. Redeploy and clear browser cache

**Verification**:
- Network tab should show requests to `maya-agent.ai-builders.space/api/chat`
- Should NOT see CORS errors in console

### Issue 4: LLM Connection Issues

**Problem**: Maya shows "connection issues" error message.

**Root Cause**: `AI_BUILDER_TOKEN` environment variable not configured in deployment.

**Solution**:
1. Go to deployment dashboard: https://space.ai-builders.com/deployments
2. Click on service: `maya-agent`
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name**: `AI_BUILDER_TOKEN`
   - **Value**: Your actual AI Builder token
   - **Mark as Secret**: ✅ Yes
5. Save and wait for service to restart

**Verification**:
```bash
curl -s https://maya-agent.ai-builders.space/health | jq .tokenConfigured
# Should return: true
```

### Issue 5: Root Route Returns 404

**Problem**: Root URL (`/`) returns 404 instead of redirecting to `/maya.html`.

**Root Cause**: Root route handler not placed before static middleware.

**Solution**:
1. Ensure `app.all('/')` route handler is BEFORE `app.use(express.static(...))`
2. Route handler should redirect with 301 status
3. Redeploy and test

**Verification**:
```bash
curl -I https://maya-agent.ai-builders.space/
# Should return: HTTP/1.1 301 Moved Permanently
# Should show: Location: /maya.html
```

### Issue 6: Build Fails

**Common Causes**:

1. **Dockerfile Missing or Wrong Location**:
   - **Problem**: Dockerfile must be at repository root (`/Dockerfile`)
   - **Solution**: Create Dockerfile at repository root
   - **Lesson**: Always place Dockerfile in repository root for platform deployments

2. **Node Version Incompatibility**:
   - **Check**: Node version compatibility (need 18+)
   - **Solution**: Ensure Node 18+ is specified in platform settings

3. **Missing Dependencies**:
   - **Check**: `package.json` includes all required packages
   - **Solution**: Verify `npm install` completes successfully

4. **Environment Variable Timing**:
   - **Problem**: `AI_BUILDER_TOKEN` validation happened at module load time
   - **Solution**: Made token optional during build, validate at runtime (lazy validation)

### Issue 7: Service Won't Start

**Common Causes**:

1. **Port Already in Use**:
   - **Solution**: Use `$PORT` environment variable (platform should set this)

2. **Server Binding Issue**:
   - **Problem**: Server not binding to all interfaces (0.0.0.0)
   - **Solution**: Explicitly bind to `0.0.0.0` in `app.listen()`
   - **Code**: `app.listen(PORT, '0.0.0.0', ...)`

3. **MCP Client Connection Fails**:
   - **Check**: `AI_BUILDER_TOKEN` is set correctly
   - **Check**: Network access to AI Builders API
   - **Solution**: Verify token and network connectivity

### Issue 8: Frontend Not Loading

**Problem**: 404 on `/maya.html`

**Solutions**:
- Check static file serving configuration
- Verify frontend files are in repository
- Verify `Maya/frontend/` directory structure

### Issue 9: KB Not Loading

**Problem**: Knowledge base not accessible

**Solutions**:
- Check KB files are committed to repository
- Verify `Maya/knowledge/config/priorities.json` exists
- Check server logs for KB loading errors
- Verify file paths and permissions

### Deployment Timing

**Expected Deployment Time**: 5-10 minutes from trigger to completion

**Timeline Breakdown**:
- **Build Phase**: 2-5 minutes (cloning repo, installing dependencies)
- **Deploy Phase**: 1-3 minutes (starting container, health checks)
- **DNS/Proxy**: 2-3 minutes (propagation, cache clearing)

**Status Progression**:
- 🟡 **"Deploying"** or **"Building"** - Initial phase (2-5 min)
- 🟡 **"Starting"** - Container starting (1-2 min)
- 🟢 **"Healthy"** - Service ready! (total 5-10 min)

### Browser Cache Issues

**Critical**: After deployment, browser cache must be cleared!

**Why**: Browser may have cached old JavaScript code with hardcoded URLs or old logic.

**Solutions** (in order of preference):
1. **Private/Incognito Window** (Recommended)
   - Opens fresh session without cache
   - Navigate to: https://maya-agent.ai-builders.space/maya.html

2. **Hard Refresh**
   - **Mac**: `Cmd+Shift+R`
   - **Windows**: `Ctrl+F5`
   - **Linux**: `Ctrl+F5`

3. **Clear Cache Manually**
   - **Chrome/Edge**: `Cmd+Shift+Delete` → Select "Cached images and files" → Clear
   - **Firefox**: `Cmd+Shift+Delete` → Select "Cache" → Clear

### Quick Verification Commands

```bash
# 1. Check deployment timestamp
curl -s https://maya-agent.ai-builders.space/health | jq .timestamp

# 2. Check if hardcoded URL exists in deployed code
curl -s https://maya-agent.ai-builders.space/maya.html | grep -i "api.janetxiushi" | wc -l
# Should return: 0 (no hardcoded URLs)

# 3. Check token configuration
curl -s https://maya-agent.ai-builders.space/health | jq .tokenConfigured
# Should return: true

# 4. Test API endpoint
curl -X POST https://maya-agent.ai-builders.space/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "history": []}'

# 5. Test root route redirect
curl -I https://maya-agent.ai-builders.space/
# Should return: 301 Moved Permanently
```

---

## Security

### ✅ Implemented Security Features

- **API Key Protection**: `AI_BUILDER_TOKEN` via environment variables
- **Input Validation**: All inputs sanitized and validated
- **Rate Limiting**: 20 requests per 15 minutes
- **CORS**: Configured for allowed origins
- **Security Headers**: Helmet.js configured
- **Error Handling**: Generic error messages (no technical details)
- **Audit Logging**: All requests logged securely

### 🔒 Production Checklist

- [ ] `AI_BUILDER_TOKEN` marked as secret in platform
- [ ] `NODE_ENV=production` set
- [ ] HTTPS enabled (platform should handle this)
- [ ] CORS configured for production domain
- [ ] Rate limiting active
- [ ] Error messages generic (no stack traces)
- [ ] Logs don't expose sensitive information

### Pre-Deployment Security Review

**Never Commit These Files**:
- `.env` files (all variants)
- `*.log` files
- `*.secret`, `*.key`, `*.token` files
- `secrets.json`, `credentials.json`

**Before Pushing to GitHub**:
```bash
# Check for any .env files that might be tracked
git ls-files | grep -E "\.env$|\.env\."

# Check for log files
git ls-files | grep "\.log$"

# Check for secrets files
git ls-files | grep -E "secret|key|token|credential" | grep -v node_modules

# Verify .gitignore is working
git check-ignore -v Maya/backend/.env
git check-ignore -v Maya/backend/server.log
```

**Expected Result**: No `.env`, `.log`, or secret files should appear in tracked files.

### GitHub Deployment Security Checklist

See the Security section above for complete security review checklist.

---

## Frontend Deployment

### Frontend Security Features

The `maya.html` file includes comprehensive security enhancements:

1. **Enhanced URL Cleaning** (Lines 1509-1679)
   - Removes 30+ tracking parameters (`_gl`, `_ga`, `utm_*`, `fbclid`, etc.)
   - Cleans URLs on page load
   - Cleans all navigation links
   - Monitors URL changes dynamically

2. **Code Protection CSS** (Lines 23-63)
   - Prevents text selection (except form fields and chat)
   - Prevents image dragging
   - Disables text highlighting
   - Maintains accessibility for `.maya-chat-input` and `.maya-chat-messages`

3. **Security Protection Script** (Lines 1681-1812)
   - 12 protection categories
   - Iframe embedding prevention
   - Right-click prevention (except form fields and chat)
   - Keyboard shortcut blocking (F12, Ctrl+Shift+I, etc.)
   - Copy protection with copyright notice
   - Developer tools detection
   - And more...

4. **Meta Tags** (Lines 7-8)
   - Copyright meta tag
   - Robots meta tag (noarchive, nosnippet)

### Deploying Frontend Updates

**Method 1: Git Push (Recommended)**
```bash
git add Maya/frontend/maya.html
git commit -m "Update frontend: [description]"
git push origin main
# Auto-deploys via GitHub webhook
```

**Method 2: Manual Upload**
- Use SFTP/FTP client to upload `Maya/frontend/maya.html`
- Replace existing file on server

### Frontend Verification

After deploying frontend updates:
- [ ] Navigate from Maya page to janetxiushi.me
- [ ] Verify URLs are clean (no `_gl`, `_ga`, etc.)
- [ ] Test navigation links (Home, Experience, etc.)
- [ ] Verify security protections active
- [ ] Test chat functionality
- [ ] Verify accessibility (chat input works)

---

## Feature Deployments

### Deploying Chat Logging System

**Files to Deploy**:
- `Maya/backend/server.js` - Added admin endpoints
- `Maya/backend/utils/chat-logger.js` - Chat logging utility
- `Maya/backend/utils/remote-logs.js` - Remote log fetching
- `Maya/frontend/chat_logs.html` - Dashboard UI

**Deployment Steps**:
```bash
git add Maya/backend/server.js
git add Maya/backend/utils/chat-logger.js
git add Maya/backend/utils/remote-logs.js
git add Maya/frontend/chat_logs.html
git commit -m "Add chat logging system with production log tracking"
git push origin main
```

**Verification**:
```bash
# Test stats endpoint
curl "https://maya-agent.ai-builders.space/api/admin/chat-logs/stats"

# Test logs endpoint
curl "https://maya-agent.ai-builders.space/api/admin/chat-logs?startDate=2026-01-17&endDate=2026-01-17"

# Check dashboard
# Visit: https://maya-agent.ai-builders.space/chat_logs.html
```

**Note**: Logs start from deployment time - previous chats are not logged.

---

## Monitoring & Maintenance

### Monitor Logs

Check deployment logs for:
- KB loading status
- API response times
- Error rates
- Rate limiting triggers

### Update Code

To update Maya after deployment:

```bash
# Make changes locally
git add Maya/
git commit -m "Update: [description]"
git push origin main

# Space platform should auto-deploy (if configured)
# Or manually trigger redeployment in Space dashboard
```

### Environment Variable Updates

To update environment variables:
1. Go to Space platform dashboard
2. Navigate to your deployment settings
3. Update environment variables
4. Restart/redeploy if needed

### Custom Domain (Optional)

If AI Builder Space supports custom domains:

1. Configure custom domain in Space platform
2. Update `ALLOWED_ORIGINS` to include custom domain
3. Update CORS settings
4. Verify SSL certificate is configured

---

## Deployment History

### January 17, 2026 - First Production Deployment

**Final Status**: ✅ **WORKING** - Maya is fully functional in production

**Deployment Timeline**:
- **14:44 GMT**: Initial deployment attempt
- **15:08 GMT**: Dockerfile location fix (critical!)
- **15:12 GMT**: First successful deployment (service healthy)
- **17:20 GMT**: Root route fix deployed
- **18:05 GMT**: API URL fix committed
- **18:06 GMT**: CORS fix committed
- **18:10 GMT**: Deployment completed successfully

**Total Deployment Time**: ~2.5 hours  
**Total Attempts**: 8+ deployment iterations  
**Key Issues Resolved**: 7 major problems

**Issues Encountered and Fixed**:

1. **Dockerfile Location** (PRIMARY ISSUE)
   - **Problem**: Dockerfile was in `Maya/Dockerfile` subdirectory
   - **Fix**: Moved Dockerfile to repository root
   - **Lesson**: Always place Dockerfile in repository root for platform deployments

2. **Environment Variable Timing**
   - **Problem**: `AI_BUILDER_TOKEN` validation happened at module load time
   - **Fix**: Made token optional during build, validate at runtime (lazy validation)
   - **Lesson**: Use lazy validation for environment variables

3. **Root Route (404 Error)**
   - **Problem**: Root URL (`/`) returned 404
   - **Fix**: Added `app.all('/')` route handler before static middleware
   - **Commit**: `11f2d45`
   - **Lesson**: Route order matters! Specific routes before general middleware

4. **Frontend API URL (Hardcoded External URL)**
   - **Problem**: Frontend was calling `https://api.janetxiushi.me/api/chat`
   - **Fix**: Changed production `API_BASE_URL` to empty string (same origin)
   - **Commit**: `0991870`

5. **CORS Policy Violation (403 Error)**
   - **Problem**: Backend rejected requests with `403 CORS policy violation`
   - **Fix**: Updated CORS middleware to explicitly allow `maya-agent.ai-builders.space`
   - **Commits**: `b3c1f30`, `90bb47c`

6. **LLM Connection Issues**
   - **Problem**: Maya showed "connection issues" error
   - **Fix**: Configured `AI_BUILDER_TOKEN` environment variable in deployment

7. **Git Remote Configuration**
   - **Problem**: `origin` remote pointed to wrong repository
   - **Fix**: Fixed remote URL to point to correct repository

**Key Learnings**:
- Dockerfile location is critical - must be at repository root
- Route order matters in Express - root route handler must be before static middleware
- CORS configuration must explicitly allow production domains
- Browser cache must be cleared after deployment (use `Cmd+Shift+R` or private window)
- Deployment typically takes 5-10 minutes from trigger to completion
- GitHub webhooks auto-deploy after first successful deployment
- Environment variables are injected AFTER container starts, not during build
- Server must bind to `0.0.0.0` for Docker containers

**Deployment Verification**:
- ✅ Root URL redirects to `/maya.html`
- ✅ Frontend uses same-origin API calls (`/api/chat`)
- ✅ CORS allows production domain requests
- ✅ Chat endpoint responds successfully
- ✅ LLM backend connected and working
- ✅ No console errors or CORS errors

**Commits Applied**: `11f2d45`, `0991870`, `b3c1f30`, `90bb47c`, `866d30f`

---

## Reference

### Service URLs

- **Root URL**: `https://maya-agent.ai-builders.space/` (redirects to `/maya.html`)
- **Frontend**: `https://maya-agent.ai-builders.space/maya.html`
- **Health Check**: `https://maya-agent.ai-builders.space/health`
- **Chat API**: `https://maya-agent.ai-builders.space/api/chat`
- **Admin Logs**: `https://maya-agent.ai-builders.space/api/admin/chat-logs`
- **Chat Logs Dashboard**: `https://maya-agent.ai-builders.space/chat_logs.html`

### Dashboard & Resources

- **Deployment Dashboard**: https://space.ai-builders.com/deployments
- **AI Builder Space**: https://space.ai-builders.com
- **GitHub Repository**: https://github.com/xiu-shi/maya_v1.0
- **Maya Documentation**: `Maya/Implementation.md`
- **Known Issues**: `Maya/tests/documentation/THINGS_TO_BE_AWARE_MAYAGPT.md`

### Service Configuration

- **Service Name**: `maya-agent`
- **Port**: `3000`
- **Branch**: `main`
- **Hosting**: Free for 12 months from first successful deployment
- **Service Limit**: Maximum of 2 services per user

### Dockerfile (Repository Root)

```dockerfile
FROM node:18-alpine

# Install wget for health checks
RUN apk add --no-cache wget curl

# Set working directory
WORKDIR /app

# Copy entire Maya directory structure
COPY Maya/ ./Maya/

# Set working directory to backend
WORKDIR /app/Maya/backend

# Install dependencies (production only)
RUN npm install --only=production --ignore-scripts

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Health check - wait longer for startup
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
  CMD wget --quiet --tries=1 --spider --timeout=5 http://localhost:3000/health || exit 1

# Start server
CMD ["node", "server.js"]
```

### Server Route Order (CRITICAL)

```javascript
// 1. Security headers (must be first)
app.use(securityHeaders);
app.use(customSecurityHeaders);

// 2. CORS (before routes)
app.use(corsMiddleware);

// 3. Root route handler (BEFORE static middleware!)
app.all('/', (req, res, next) => {
  logInfo('Root route handler called', { 
    method: req.method, 
    path: req.path,
    url: req.url,
    originalUrl: req.originalUrl
  });
  res.redirect(301, '/maya.html');
});

// 4. Static middleware (AFTER root route)
app.use(express.static(frontendPath, {
  index: false // Don't serve index.html automatically
}));

// 5. Body parsing
app.use(express.json({ limit: config.maxRequestSize }));
app.use(express.urlencoded({ extended: true, limit: config.maxRequestSize }));

// 6. Other routes (health, API, etc.)
app.get('/health', ...);
app.post('/api/chat', ...);

// 7. 404 handler (must be last)
app.use(notFoundHandler);

// 8. Error handlers (must be last)
app.use(corsErrorHandler);
app.use(errorHandler);

// 9. Server binding (for Docker)
app.listen(PORT, '0.0.0.0', () => {
  logInfo(`Maya backend server started`, {
    port: PORT,
    host: '0.0.0.0',
    environment: config.nodeEnv
  });
});
```

### Quick Deployment Command

```bash
curl -X POST "https://space.ai-builders.com/backend/v1/deployments" \
  -H "Authorization: Bearer sk_live_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
  "repo_url": "https://github.com/xiu-shi/maya_v1.0",
  "service_name": "maya-agent",
  "branch": "main",
  "port": 3000
}'
```

---

**Last Updated**: January 18, 2026  
**Status**: Complete Deployment Reference Guide  
**Version**: 1.0
