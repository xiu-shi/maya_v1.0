# Maya Deployment Guide - MCP Setup

**Date**: January 8, 2025  
**Deployment Platform**: AI Builders MCP (https://space.ai-builders.com/mcp-setup)  
**GitHub Repository**: https://github.com/xiu-shi/maya_v1.0

---

## Prerequisites

1. ✅ GitHub repository created: `maya_v1.0`
2. ✅ AI Builders account with MCP access
3. ✅ `AI_BUILDER_TOKEN` environment variable configured

---

## Step 1: Prepare Repository

### 1.1 Connect Local Repository to GitHub

```bash
cd /Users/eupirate/Desktop/Cloud/my_site_3_bot_maya_repo
git remote add maya-v1 git@github.com:xiu-shi/maya_v1.0.git
# OR if you want to replace the current remote:
# git remote set-url origin git@github.com:xiu-shi/maya_v1.0.git
```

### 1.2 Ensure .gitignore is Properly Configured

Make sure sensitive files are excluded:
- `.env` files (contains `AI_BUILDER_TOKEN`)
- `node_modules/`
- `server.log`
- Knowledge base PDFs and large files

### 1.3 Create Deployment-Ready Structure

The Maya project structure is already deployment-ready:
```
Maya/
├── backend/          # Node.js/Express backend
├── frontend/         # HTML/CSS/JS frontend
├── knowledge/        # Knowledge base (KB) files
└── tests/           # Test suite
```

---

## Step 2: MCP Setup Configuration

### 2.1 Environment Variables

The MCP deployment platform will need these environment variables:

**Required:**
- `AI_BUILDER_TOKEN` - Your AI Builders API token
- `NODE_ENV` - Set to `production` for deployment
- `PORT` - Server port (default: 3000)

**Optional:**
- `AI_BUILDERS_MODEL` - Model to use (default: `grok-4-fast`)
- `AI_BUILDERS_API_URL` - API endpoint (default: auto-detected)

### 2.2 MCP Server Configuration

The backend uses the AI Builders MCP server via:
- `@modelcontextprotocol/sdk` package
- `@aibuilders/mcp-coach-server` (installed via npx)

---

## Step 3: Deployment Steps

### 3.1 Push to GitHub

```bash
# Stage all Maya files
git add Maya/

# Commit
git commit -m "Initial Maya v1.0 deployment"

# Push to new repository
git push maya-v1 main
# OR if you changed origin:
# git push -u origin main
```

### 3.2 Connect to MCP Platform

1. Go to https://space.ai-builders.com/mcp-setup
2. Connect your GitHub account
3. Select repository: `xiu-shi/maya_v1.0`
4. Configure environment variables (see Step 2.1)
5. Set build/start commands:
   - **Build**: `cd Maya/backend && npm install`
   - **Start**: `cd Maya/backend && npm start`
   - **Port**: `3000`

### 3.3 Verify Deployment

After deployment:
- Frontend should be accessible at: `https://your-deployment-url/maya.html`
- API endpoint: `https://your-deployment-url/api/chat`
- Health check: `https://your-deployment-url/api/health`

---

## Step 4: Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] GitHub repository connected
- [ ] MCP platform connected to repo
- [ ] Build successful
- [ ] Frontend accessible
- [ ] API endpoints responding
- [ ] Knowledge Base loading correctly
- [ ] Chat functionality working
- [ ] Error handling working (no technical details exposed)

---

## Important Notes

### Security
- ✅ Never commit `.env` files
- ✅ Never expose `AI_BUILDER_TOKEN` in code
- ✅ Use environment variables for all secrets
- ✅ Error messages are generic (no technical details)

### Knowledge Base
- KB files are included in the repository
- Large PDFs are gitignored
- KB context loads at server startup (lazy loading with timeout protection)
- Current implementation uses local filesystem (S3 integration was planned but not implemented)

### Monitoring
- Check server logs for KB loading status
- Monitor API response times
- Watch for rate limiting (20 requests per 15 minutes)

---

## Known Issues

### Issue #10: Server Hangs During Startup ✅ RESOLVED
**Date**: January 8, 2025  
**Status**: ✅ **RESOLVED** (January 9, 2026)  
**Impact**: Was blocking deployment, now resolved

**Root Cause**: MCP client import blocking server startup, KB loading blocking operations

**Resolution**: 
- Implemented lazy loading of MCP client
- Moved KB context loading to be non-blocking with async operations
- Added timeout protection for all file operations
- Implemented comprehensive hang prevention strategies

**Details**: See `tests/documentation/THINGS_TO_BE_AWARE_MAYAGPT.md` Issue #10 for complete investigation and resolution notes.

---

## Troubleshooting

### Server Won't Start / Hangs During Startup
**If you encounter startup issues**:
1. Check `tests/documentation/THINGS_TO_BE_AWARE_MAYAGPT.md` for known issues and resolutions
2. Verify you're using the latest code
3. Check server logs: `tail -f Maya/backend/server.log`
4. Monitor CPU usage during startup (should be < 95%)
5. Try manual start: `cd Maya/backend && npm start`
6. Verify KB files exist and are readable

### KB Not Loading
- Check server logs for KB loading errors
- Verify `Maya/knowledge/config/priorities.json` exists
- Ensure KB files are committed to repository

### API Errors
- Verify `AI_BUILDER_TOKEN` is set correctly
- Check MCP server connection
- Review error logs (generic messages only)

### Frontend Not Loading
- Verify static file paths are correct
- Check CORS configuration
- Ensure frontend files are in repository

---

## Next Steps After Deployment

1. Test chat functionality
2. Verify KB integration
3. Monitor performance
4. Set up production KB storage (S3) if needed
5. Configure custom domain (if applicable)

---

**Last Updated**: January 9, 2026, 23:45

**Note**: Issue #10 (server startup hang) was resolved January 9, 2026. See `tests/documentation/THINGS_TO_BE_AWARE_MAYAGPT.md` for details.
