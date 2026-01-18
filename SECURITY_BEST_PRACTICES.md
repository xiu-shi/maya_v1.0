# Security Best Practices
**Date**: January 18, 2026  
**Purpose**: Prevent future security incidents

---

## 🚨 CRITICAL RULES

### Never Commit:
- ❌ API keys or tokens
- ❌ Passwords or secrets
- ❌ `.env` files
- ❌ `mcp_config.json` (contains tokens)
- ❌ Any file with credentials

### Always Use:
- ✅ `.env` files (gitignored)
- ✅ `.example` files for templates
- ✅ Environment variables
- ✅ GitHub Secrets (for CI/CD)

---

## ✅ Pre-Commit Checklist

Before committing, check:
- [ ] No `.env` files in commit
- [ ] No `mcp_config.json` in commit
- [ ] No tokens/keys in code
- [ ] `.gitignore` includes sensitive files
- [ ] Example/template files don't contain real values

---

## 🔧 Files That Should Be Gitignored

```
# Secrets and tokens
.env
.env.*
mcp_config.json
*.secret
*.key
*.token

# Config files with secrets
**/config.local.*
secrets.json
credentials.json
```

---

## 📋 If Token Exposed

1. **IMMEDIATELY** revoke the exposed token
2. Generate new token
3. Update local `.env` or `mcp_config.json`
4. Remove file from git: `git rm --cached filename`
5. Add to `.gitignore`
6. Commit removal
7. Document incident

---

**Status**: Active security guidelines
