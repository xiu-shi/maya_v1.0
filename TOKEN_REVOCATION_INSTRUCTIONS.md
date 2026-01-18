# Token Revocation Instructions - URGENT
**Date**: January 18, 2026  
**Severity**: 🔴 CRITICAL

---

## 🚨 EXPOSED TOKEN

**Token**: `sk_937d9f12_5e4fc7f11ca47cf77cefec16b8611132466d`  
**File**: `mcp_config.json`  
**Status**: Publicly visible on GitHub  
**Action**: **REVOKE IMMEDIATELY**

---

## ⚠️ IMMEDIATE STEPS

### Step 1: Revoke Token (URGENT)
1. Log into AI Builders platform
2. Navigate to API Keys/Settings
3. Find token: `sk_937d9f12_5e4fc7f11ca47cf77cefec16b8611132466d`
4. **Revoke/Delete** the token immediately
5. Generate a new token

### Step 2: Update Local Configuration
1. Update local `mcp_config.json` with new token:
   ```json
   {
     "mcpServers": {
       "ai-builders-coach": {
         "env": {
           "AI_BUILDER_TOKEN": "NEW_TOKEN_HERE"
         }
       }
     }
   }
   ```

2. Or update `.env` file if using that instead:
   ```
   AI_BUILDER_TOKEN=NEW_TOKEN_HERE
   ```

### Step 3: Verify Fix
1. Check that `mcp_config.json` is in `.gitignore`
2. Verify file is not tracked: `git status` (should not show mcp_config.json)
3. Test with new token

---

## 📋 What Was Fixed

1. ✅ Removed `mcp_config.json` from git tracking
2. ✅ Added to `.gitignore`
3. ✅ Created `mcp_config.json.example` template
4. ✅ Documented security incident
5. ✅ Updated security guidelines

---

## ⚠️ Important Notes

- **Token is still in git history** - Even though removed, it's in commit history
- **Consider**: Using `git filter-branch` or BFG Repo-Cleaner to remove from history (advanced)
- **For now**: Revoking token is the priority - prevents unauthorized use

---

## 🔒 Prevention

- ✅ `mcp_config.json` now in `.gitignore`
- ✅ Example template created
- ✅ Security guidelines updated
- ✅ Cursor rules updated with security reminders

---

**Status**: ⚠️ Token revocation required immediately
