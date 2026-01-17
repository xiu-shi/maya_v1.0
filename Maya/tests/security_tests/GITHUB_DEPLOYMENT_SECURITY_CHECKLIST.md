# GitHub Deployment Security Checklist

**Repository**: `xiu-shi/maya_v1.0` (Public)  
**Date**: January 8, 2025  
**Last Updated**: January 11, 2026  
**Status**: Pre-deployment Security Review

---

## ✅ Critical: Never Commit These Files

### Environment Variables & Secrets
- [x] `.env` files (all variants)
- [x] `.env.local`, `.env.development`, `.env.production`
- [x] `*.secret`, `*.key`, `*.token` files
- [x] `secrets.json`, `credentials.json`
- [x] `config.local.*` files

### API Keys & Tokens
- [x] `AI_BUILDER_TOKEN` - **NEVER commit this**
- [x] Any hardcoded API keys or tokens
- [x] Authentication credentials

### Logs & Debug Files
- [x] `*.log` files (server.log, error.log, etc.)
- [x] `logs/` directory
- [x] Debug output files

### Sensitive Data
- [x] Private contact information
- [x] Personal data
- [x] Database credentials
- [x] SSH keys, certificates

---

## ✅ Code Security Review

### Environment Variables Usage
- ✅ All secrets use `process.env` (no hardcoded values)
- ✅ `.env.example` file exists (without real values)
- ✅ Environment variables loaded via `config/env.js`

### Files Currently Protected
- ✅ `Maya/backend/.env` - gitignored
- ✅ `Maya/backend/server.log` - gitignored
- ✅ `backend/.env` - gitignored
- ✅ `private.sample/contact.secrets.php` - gitignored

### Code Review Status
- ✅ No hardcoded `AI_BUILDER_TOKEN` found
- ✅ No hardcoded API keys found
- ✅ All sensitive operations use environment variables
- ✅ Error messages don't expose technical details

---

## ⚠️ Pre-Push Verification

Before pushing to GitHub, verify:

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

---

## 🔒 Security Best Practices

### 1. Environment Variables
- ✅ Use `.env` files for local development
- ✅ Use platform environment variables for deployment
- ✅ Never commit `.env` files
- ✅ Use `.env.example` as template (without real values)

### 2. API Keys & Tokens
- ✅ Store in environment variables only
- ✅ Use platform secrets management (MCP, Vercel, etc.)
- ✅ Rotate keys if accidentally exposed
- ✅ Use different keys for dev/prod

### 3. Code Security
- ✅ No hardcoded secrets
- ✅ Generic error messages (no technical details)
- ✅ Input validation and sanitization
- ✅ Rate limiting enabled

### 4. Repository Security
- ✅ `.gitignore` comprehensive and up-to-date
- ✅ Regular security audits
- ✅ Monitor for accidental commits
- ✅ Use GitHub's secret scanning

---

## 🚨 If Secrets Are Accidentally Committed

### Immediate Actions:
1. **Rotate the exposed secret immediately**
2. **Remove from git history**:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch PATH_TO_FILE" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. **Force push** (if repository is private or you're the only contributor)
4. **If public**: Consider the secret compromised and rotate it

### Prevention:
- Use `git-secrets` or similar tools
- Set up pre-commit hooks
- Regular security audits
- Monitor GitHub security alerts

---

## 📋 Pre-Deployment Checklist

Before deploying to MCP:

- [ ] All `.env` files are gitignored
- [ ] No secrets in tracked files
- [ ] `.env.example` exists (without real values)
- [ ] `AI_BUILDER_TOKEN` will be set in MCP platform
- [ ] Error messages are generic (no technical details)
- [ ] No hardcoded API endpoints with tokens
- [ ] Logs are gitignored
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Input validation active

---

## 🔍 Files to Review Before Push

```bash
# Check what will be committed
git status

# Review all files that will be added
git diff --cached --name-only

# Verify no sensitive files
git diff --cached | grep -i "token\|key\|secret\|password"
```

---

**Last Updated**: January 9, 2026, 23:55  
**Next Review**: Before each deployment
