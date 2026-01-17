# Maya Space Deployment Guide

**Deployment Platform**: [AI Builder Space](https://space.ai-builders.com)  
**Project Name**: **maya space**  
**GitHub Repository**: https://github.com/xiu-shi/maya_v1.0  
**Date**: January 17, 2026

---

## Overview

This guide walks through deploying Maya (Janet Xiu Shi's Digital Twin) to AI Builder Space as "maya space". The deployment will use the existing GitHub repository and configure it for production use on the space.ai-builders.com platform.

---

## Prerequisites

✅ **Completed:**
- GitHub repository created: `xiu-shi/maya_v1.0`
- AI Builders account with Space access
- `AI_BUILDER_TOKEN` available

**Required:**
- Access to https://space.ai-builders.com
- GitHub account connected to AI Builder Space
- `AI_BUILDER_TOKEN` environment variable

---

## Step 1: Prepare Local Repository

### 1.1 Check Current Git Status

```bash
cd /Users/eupirate/Desktop/Cloud/my_site_3_bot_maya_repo
git status
```

### 1.2 Add Maya Remote (if not already added)

```bash
# Add the maya_v1.0 repository as a remote
git remote add maya-space git@github.com:xiu-shi/maya_v1.0.git

# Verify remotes
git remote -v
```

### 1.3 Ensure .gitignore is Properly Configured

Verify `.gitignore` excludes sensitive files:
- `.env` files (contains `AI_BUILDER_TOKEN`)
- `node_modules/`
- `server.log`
- `*.log` files
- `.DS_Store`
- Knowledge base PDFs (if large)

### 1.4 Create .env.example for Deployment Reference

Create `Maya/backend/.env.example` with template values:

```bash
# AI Builders API Configuration
AI_BUILDER_TOKEN=your_token_here

# Server Configuration
NODE_ENV=production
PORT=3000

# Optional Configuration
AI_BUILDERS_MODEL=grok-4-fast
AI_BUILDERS_API_URL=https://space.ai-builders.com/backend/v1/chat/completions
ALLOWED_ORIGINS=https://space.ai-builders.com
```

---

## Step 2: Prepare Maya Code for Deployment

### 2.1 Verify Project Structure

The Maya project structure is deployment-ready:
```
Maya/
├── backend/          # Node.js/Express backend
│   ├── server.js     # Main server file
│   ├── package.json  # Dependencies
│   ├── config/       # Configuration
│   └── ...
├── frontend/         # HTML/CSS/JS frontend
│   ├── maya.html     # Main frontend file
│   └── styles.css
├── knowledge/        # Knowledge base files
│   ├── docs/         # KB documents
│   └── config/       # KB configuration
└── tests/           # Test suite (optional for deployment)
```

### 2.2 Update Package.json Start Script

Verify `Maya/backend/package.json` has:
```json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

### 2.3 Verify Server Port Configuration

The server should use `PORT` environment variable (defaults to 3000):
- `Maya/backend/config/env.js` already handles this
- Space platform will set `PORT` automatically

---

## Step 3: Push Code to GitHub

### 3.1 Stage Maya Files

```bash
cd /Users/eupirate/Desktop/Cloud/my_site_3_bot_maya_repo

# Stage only Maya directory
git add Maya/

# Verify what will be committed
git status
```

### 3.2 Commit Changes

```bash
git commit -m "Deploy Maya v1.0 to AI Builder Space - maya space

- Complete Maya backend and frontend
- Knowledge base integration
- Updated system instructions for adaptive responses
- Comprehensive test suite (444 tests)
- Security and error handling
- Ready for production deployment"
```

### 3.3 Push to GitHub

```bash
# Push to maya_v1.0 repository
git push maya-space main

# If main branch doesn't exist yet, create it:
# git checkout -b main
# git push -u maya-space main
```

**Note**: If the repository is empty, you may need to push with `--force` or create an initial commit:
```bash
# If repository is completely empty
git push -u maya-space main --force
```

---

## Step 4: Configure AI Builder Space Deployment

### 4.1 Access AI Builder Space

1. Go to https://space.ai-builders.com
2. Sign in with your portal email
3. Navigate to workspace/deployment section

### 4.2 Create New Deployment/Workspace

1. **Create New Workspace**: Click "Create New" or "New Deployment"
2. **Name**: Enter "maya space" (or "maya-space" if spaces not allowed)
3. **Type**: Select "Node.js Application" or "MCP Server"

### 4.3 Connect GitHub Repository

1. **Connect GitHub**: Link your GitHub account if not already connected
2. **Select Repository**: Choose `xiu-shi/maya_v1.0`
3. **Branch**: Select `main` (or `master` if that's your default branch)
4. **Root Directory**: Set to `Maya` (if platform supports subdirectory deployment)

### 4.4 Configure Build Settings

**Build Command:**
```bash
cd Maya/backend && npm install
```

**Start Command:**
```bash
cd Maya/backend && npm start
```

**OR** (if platform supports working directory):
- **Working Directory**: `Maya/backend`
- **Build**: `npm install`
- **Start**: `npm start`

**Port**: 
- Set to `3000` (or use `$PORT` environment variable if platform provides it)

**Node Version**: 
- Specify `18.x` or `20.x` (check `package.json` engines field)

### 4.5 Configure Environment Variables

Add these environment variables in the Space platform:

**Required:**
```
AI_BUILDER_TOKEN=your_actual_token_here
NODE_ENV=production
PORT=3000
```

**Optional (but recommended):**
```
AI_BUILDERS_MODEL=grok-4-fast
AI_BUILDERS_API_URL=https://space.ai-builders.com/backend/v1/chat/completions
ALLOWED_ORIGINS=https://space.ai-builders.com,https://your-deployment-url.ai-builders.com
TRUST_PROXY=true
```

**Security Settings:**
- Mark `AI_BUILDER_TOKEN` as **secret/encrypted**
- Never expose tokens in logs or public settings

---

## Step 5: Deploy and Verify

### 5.1 Trigger Deployment

1. Click "Deploy" or "Save & Deploy"
2. Monitor build logs for any errors
3. Wait for deployment to complete

### 5.2 Verify Deployment

After successful deployment, verify:

**Health Check:**
```bash
curl https://your-deployment-url.ai-builders.com/api/health
```

**Frontend:**
- Open: `https://your-deployment-url.ai-builders.com/maya.html`
- Should load the chat interface

**API Endpoint:**
```bash
curl -X POST https://your-deployment-url.ai-builders.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "history": []}'
```

### 5.3 Test Chat Functionality

1. Open the frontend URL
2. Send a test message: "hi"
3. Verify Maya responds appropriately (brief, friendly response)
4. Test with a more detailed query
5. Verify KB integration works

---

## Step 6: Post-Deployment Checklist

- [ ] **Environment Variables**: All configured correctly
- [ ] **GitHub Repository**: Connected and up to date
- [ ] **Build**: Successful with no errors
- [ ] **Frontend**: Accessible at deployment URL
- [ ] **API Endpoints**: Responding correctly
  - [ ] `/api/health` - Health check
  - [ ] `/api/chat` - Chat endpoint
- [ ] **Knowledge Base**: Loading correctly (check server logs)
- [ ] **Chat Functionality**: Working end-to-end
- [ ] **Error Handling**: Generic messages (no technical details exposed)
- [ ] **Rate Limiting**: Active (20 requests per 15 minutes)
- [ ] **Security Headers**: Configured correctly
- [ ] **CORS**: Configured for deployment domain

---

## Step 7: Monitoring and Maintenance

### 7.1 Monitor Logs

Check deployment logs for:
- KB loading status
- API response times
- Error rates
- Rate limiting triggers

### 7.2 Update Code

To update Maya after deployment:

```bash
# Make changes locally
git add Maya/
git commit -m "Update: [description]"
git push maya-space main

# Space platform should auto-deploy (if configured)
# Or manually trigger redeployment in Space dashboard
```

### 7.3 Environment Variable Updates

To update environment variables:
1. Go to Space platform dashboard
2. Navigate to your deployment settings
3. Update environment variables
4. Restart/redeploy if needed

---

## Troubleshooting

### Build Fails

**Issue**: `npm install` fails
- **Check**: Node version compatibility
- **Solution**: Ensure Node 18+ is specified in platform settings

**Issue**: Missing dependencies
- **Check**: `package.json` includes all required packages
- **Solution**: Verify `npm install` completes successfully

### Server Won't Start

**Issue**: Port already in use
- **Solution**: Use `$PORT` environment variable (platform should set this)

**Issue**: MCP client connection fails
- **Check**: `AI_BUILDER_TOKEN` is set correctly
- **Check**: Network access to AI Builders API
- **Solution**: Verify token and network connectivity

### Frontend Not Loading

**Issue**: 404 on `/maya.html`
- **Check**: Static file serving configuration
- **Check**: Frontend files are in repository
- **Solution**: Verify `Maya/frontend/` directory structure

### KB Not Loading

**Issue**: Knowledge base not accessible
- **Check**: KB files are committed to repository
- **Check**: `Maya/knowledge/config/priorities.json` exists
- **Check**: Server logs for KB loading errors
- **Solution**: Verify file paths and permissions

### API Errors

**Issue**: 400/401/403 errors
- **Check**: `AI_BUILDER_TOKEN` is valid
- **Check**: CORS configuration
- **Check**: Rate limiting not exceeded
- **Solution**: Verify token, CORS settings, and rate limits

---

## Security Considerations

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

---

## Custom Domain (Optional)

If AI Builder Space supports custom domains:

1. Configure custom domain in Space platform
2. Update `ALLOWED_ORIGINS` to include custom domain
3. Update CORS settings
4. Verify SSL certificate is configured

---

## Next Steps After Deployment

1. **Test thoroughly**: Verify all functionality works
2. **Monitor performance**: Watch response times and error rates
3. **Update documentation**: Document deployment URL
4. **Set up monitoring**: Configure alerts for errors/downtime
5. **Plan updates**: Establish update/deployment workflow

---

## Support & Resources

- **AI Builder Space**: https://space.ai-builders.com
- **GitHub Repository**: https://github.com/xiu-shi/maya_v1.0
- **Maya Documentation**: `Maya/Implementation.md`
- **Deployment Issues**: Check `Maya/DEPLOYMENT.md` for known issues

---

**Last Updated**: January 17, 2026, 14:21 GMT  
**Status**: Ready for Deployment
