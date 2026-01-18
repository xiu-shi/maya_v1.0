# GitHub Repository Management Guide
**Repository**: `maya_v1.0`  
**URL**: https://github.com/xiu-shi/maya_v1.0  
**Last Updated**: January 18, 2026

---

## 📋 Table of Contents

1. [Repository Overview](#repository-overview)
2. [Branch Protection](#branch-protection)
3. [Security Implementation](#security-implementation)
4. [File Organization](#file-organization)
5. [Workflow Practices](#workflow-practices)
6. [Deployment](#deployment)
7. [Maintenance](#maintenance)

---

## Repository Overview

### Purpose
Maya is Janet Xiu Shi's digital twin - a ChatGPT-like interface powered by AI Builders API. This repository contains the complete implementation including backend, frontend, knowledge base, and deployment configurations.

### Structure
```
maya_v1.0/
├── Maya/                    # Main application
│   ├── backend/            # Node.js/Express API server
│   ├── frontend/           # HTML/CSS/JS chat interface
│   ├── knowledge/          # Knowledge base (docs, system instructions)
│   └── tests/              # Test suite
├── backend/                # Legacy backend (if applicable)
├── my_site_3_mayaGPT_v3/   # Legacy frontend files
├── .cursorrules            # Cursor AI development rules
├── .gitignore              # Git ignore patterns
├── Dockerfile              # Container configuration
├── README.md               # Project overview
├── SECURITY.md             # Security policy and best practices
└── GITHUB.md               # This file - GitHub management guide
```

### Key Files
- **`.cursorrules`**: Development guidelines and security rules for Cursor AI
- **`.gitignore`**: Prevents committing secrets and temporary files
- **`SECURITY.md`**: Comprehensive security documentation
- **`README.md`**: Quick start and project overview

---

## Branch Protection

### ✅ Current Configuration (Active)

**Status**: ✅ **PROTECTED** (Configured: January 18, 2026)

**Protection Rules**:
- ✅ **Force pushes**: BLOCKED (`git push --force` rejected)
- ✅ **Branch deletion**: BLOCKED (cannot delete `main` branch)
- ✅ **Admin enforcement**: ENABLED (rules apply to admins too)
- ✅ **Status checks**: REQUIRED (strict mode, ready for CI/CD)

**Configuration Type**: Minimal Protection (Recommended for Solo Developer)
- Allows direct pushes (no PR required)
- Prevents destructive operations
- Ready for status checks when CI/CD is configured

### How It Was Set Up

**Method**: GitHub API via `gh` CLI

**Command Used**:
```bash
gh api repos/xiu-shi/maya_v1.0/branches/main/protection -X PUT \
  --input branch_protection.json
```

**Configuration**:
```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": []
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

### Verification

**Check Protection Status**:
```bash
gh api repos/xiu-shi/maya_v1.0/branches/main/protection \
  --jq '{force_pushes: .allow_force_pushes.enabled, 
         deletions: .allow_deletions.enabled, 
         admin_enforcement: .enforce_admins.enabled}'
```

**Test Protection**:
```bash
# Force push should fail:
git push --force origin main
# Expected: "Updates were rejected because the tip of your current branch is behind"
```

### Future Enhancements

**When Adding Team Members**:
- Add PR requirement: `required_pull_request_reviews: {required_approving_review_count: 1}`
- Add code review requirement
- Configure specific status checks

**When Setting Up CI/CD**:
- Add status check contexts (e.g., `["test", "build", "lint"]`)
- Require all checks to pass before merging
- Configure branch up-to-date requirement

---

## Security Implementation

### 🔒 Secret Protection

**Critical Rules** (Enforced in `.cursorrules` and `.gitignore`):

**Never Commit**:
- ❌ API keys or tokens (e.g., `AI_BUILDER_TOKEN`)
- ❌ Passwords or secrets
- ❌ `.env` files (any variant)
- ❌ `mcp_config.json` (contains tokens)
- ❌ Any file with credentials

**Always Use**:
- ✅ `.env` files (must be in `.gitignore`)
- ✅ `.example` files for templates
- ✅ Environment variables
- ✅ GitHub Secrets (for CI/CD)

### Pre-Commit Checklist

Before every commit, verify:
- [ ] No `.env` files in commit (`git status` should not show .env)
- [ ] No `mcp_config.json` in commit (use `.example` instead)
- [ ] No tokens/keys in code or config files
- [ ] `.gitignore` includes all sensitive files
- [ ] No secrets visible in `git diff`

### Security Incident Response

**If Secret Exposed**:
1. **IMMEDIATELY** revoke/regenerate the exposed secret
2. Remove file from git: `git rm --cached filename`
3. Add to `.gitignore`
4. Commit removal
5. Document incident in `SECURITY.md`

**Past Incident** (January 18, 2026):
- **Issue**: `mcp_config.json` containing `AI_BUILDER_TOKEN` was committed
- **Action**: Removed from git tracking, added to `.gitignore`, created `.example` template
- **Status**: ✅ Resolved (token should be revoked by user)

### Security Measures Implemented

1. **Input Validation**: All user inputs validated and sanitized
2. **Rate Limiting**: 20 requests per 15 minutes per IP
3. **CORS**: Whitelist approach (specific domains only)
4. **Security Headers**: Helmet.js configured (CSP, XSS protection, etc.)
5. **Error Handling**: Generic error messages (no sensitive data leaked)
6. **HTTPS**: Enforced in production
7. **Audit Logging**: All requests logged (sanitized)

**See**: `SECURITY.md` for complete security documentation

---

## File Organization

### Essential Files (Committed)

**Root Level**:
- ✅ `README.md` - Project overview
- ✅ `SECURITY.md` - Security policy
- ✅ `GITHUB.md` - This file (GitHub management)
- ✅ `.cursorrules` - Development rules
- ✅ `.gitignore` - Git ignore patterns
- ✅ `Dockerfile` - Container configuration

**Maya/ Level**:
- ✅ `README.md` - Maya documentation
- ✅ `DEPLOYMENT.md` - Deployment guide
- ✅ `Implementation.md` - Implementation details

**Knowledge Base**:
- ✅ `Maya/knowledge/system_instruction.md` - System instructions
- ✅ `Maya/knowledge/docs/**/*.md` - KB documentation

### Ignored Files (Never Committed)

**Secrets**:
- ❌ `.env` files (all variants)
- ❌ `mcp_config.json` (use `.example` instead)
- ❌ `*.secret`, `*.key`, `*.token` files

**Build Artifacts**:
- ❌ `node_modules/`
- ❌ `*.log` files
- ❌ Build outputs

**Temporary Files**:
- ❌ Temporary `.md` files (debugging, analysis)
- ❌ OS files (`.DS_Store`, `Thumbs.db`)

**See**: `.gitignore` for complete list

### Repository Cleanup (January 18, 2026)

**Removed**: 50+ temporary `.md` files
- Temporary debugging files
- One-time fix logs
- Historical analysis documents
- Deployment verification files

**Result**: Clean, professional repository with only essential files

---

## Workflow Practices

### Development Workflow

**Current**: Direct push to `main` (solo developer)

```bash
# Standard workflow:
git add .
git commit -m "Description of changes"
git push origin main
```

**With Branch Protection**:
- ✅ Normal pushes work (if tests pass)
- ❌ Force pushes blocked (`git push --force` fails)
- ❌ Branch deletion blocked

### Commit Message Guidelines

**Format**:
```
Type: Brief description

- Detailed change 1
- Detailed change 2
```

**Types**:
- `Fix:` - Bug fixes
- `Add:` - New features
- `Update:` - Updates to existing features
- `Remove:` - Removing features/files
- `Refactor:` - Code refactoring
- `CRITICAL:` - Critical security fixes

**Examples**:
```
CRITICAL: Update security rules and remove temporary .md files

- Update .cursorrules with comprehensive security rules
- Remove all temporary/debugging .md files
- Keep only essential files for hosting Maya
```

### Pre-Deployment Checklist

Before pushing to `main`:
- [ ] All tests pass: `cd Maya/backend && npm test`
- [ ] Security checks pass: `npm run test:security` (if configured)
- [ ] No secrets in commit (`git diff` check)
- [ ] `.gitignore` updated (if needed)
- [ ] Documentation updated (if needed)
- [ ] Changes tested locally

**Automated**: Use `Maya/scripts/pre-deployment-test.sh` for automated checks

---

## Deployment

### Platform
- **Service**: `maya-agent`
- **Platform**: AI Builder Space (https://space.ai-builders.com)
- **Production URL**: https://maya-agent.ai-builders.space
- **Auto-Deployment**: Enabled via GitHub webhooks

### Deployment Methods

**Method 1: Git Push (Auto-Deployment)**
```bash
git add .
git commit -m "Update: Description"
git push origin main
# Platform automatically deploys via GitHub webhook
# Wait 5-10 minutes for deployment
```

**Method 2: Manual API Deployment**
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

**See**: `Maya/DEPLOYMENT.md` for complete deployment guide

### Environment Variables

**Required** (configured on platform):
- `AI_BUILDER_TOKEN` - AI Builders API token (auto-injected)
- `NODE_ENV` - Environment (production)
- `PORT` - Server port (3000)
- `ALLOWED_ORIGINS` - CORS allowed origins

**Never commit**: Environment variables are configured on the platform, not in git

---

## Maintenance

### Regular Tasks

**Weekly**:
- Review security alerts (GitHub Dependabot)
- Check for dependency updates
- Review audit logs

**Monthly**:
- Update dependencies (`npm update`)
- Review and update security measures
- Review branch protection settings
- Clean up temporary files

**As Needed**:
- Update documentation
- Review and update `.cursorrules`
- Review and update `.gitignore`
- Review deployment configurations

### Monitoring

**GitHub Security**:
- Check: https://github.com/xiu-shi/maya_v1.0/security
- Review Dependabot alerts
- Review security advisories

**Repository Health**:
- Check branch protection status
- Review commit history
- Check for large files
- Review `.gitignore` effectiveness

### Updating Branch Protection

**View Current Settings**:
```bash
gh api repos/xiu-shi/maya_v1.0/branches/main/protection
```

**Update Settings** (via GitHub UI):
1. Go to: Settings → Branches → Edit rule for `main`
2. Modify settings as needed
3. Save changes

**Update Settings** (via API):
```bash
# Create protection.json with new settings
gh api repos/xiu-shi/maya_v1.0/branches/main/protection -X PUT \
  --input protection.json
```

---

## Quick Reference

### Common Commands

**Check Protection Status**:
```bash
gh api repos/xiu-shi/maya_v1.0/branches/main/protection \
  --jq '{force_pushes: .allow_force_pushes.enabled, 
         deletions: .allow_deletions.enabled}'
```

**View Repository Info**:
```bash
gh repo view xiu-shi/maya_v1.0
```

**Check Security Alerts**:
```bash
gh api repos/xiu-shi/maya_v1.0/vulnerability-alerts
```

**View Recent Commits**:
```bash
gh api repos/xiu-shi/maya_v1.0/commits --jq '.[0:5] | .[] | "\(.commit.message | split("\n")[0]) - \(.commit.author.date)"'
```

### Important URLs

- **Repository**: https://github.com/xiu-shi/maya_v1.0
- **Settings**: https://github.com/xiu-shi/maya_v1.0/settings
- **Branches**: https://github.com/xiu-shi/maya_v1.0/settings/branches
- **Security**: https://github.com/xiu-shi/maya_v1.0/security
- **Actions**: https://github.com/xiu-shi/maya_v1.0/actions (if configured)

---

## Implementation History

### January 18, 2026

**Branch Protection**:
- ✅ Configured branch protection for `main` branch
- ✅ Prevented force pushes
- ✅ Prevented branch deletion
- ✅ Enabled admin enforcement
- ✅ Configured status checks (strict mode)

**Security Enhancements**:
- ✅ Updated `.cursorrules` with comprehensive security rules
- ✅ Updated system instructions with security focus
- ✅ Consolidated security documentation into `SECURITY.md`
- ✅ Removed `mcp_config.json` from git tracking
- ✅ Created `mcp_config.json.example` template

**Repository Cleanup**:
- ✅ Removed 50+ temporary `.md` files
- ✅ Updated `.gitignore` to prevent future temporary file commits
- ✅ Kept only essential files for hosting Maya
- ✅ Created `README.md` for project overview

**Documentation**:
- ✅ Created `GITHUB.md` (this file)
- ✅ Updated `SECURITY.md` with secret protection guidelines
- ✅ Maintained `Maya/DEPLOYMENT.md` for deployment guide

---

## Resources

- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [Git Best Practices](https://git-scm.com/book/en/v2)

---

**Last Updated**: January 18, 2026  
**Maintained By**: Repository administrators  
**Status**: ✅ Active and Protected
