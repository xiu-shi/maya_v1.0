# Deployment Checklist
**Last Updated**: January 18, 2026

---

## Pre-Deployment Requirements

### ✅ Automated Checks (Run `./scripts/pre-deployment-test.sh`)

1. **All Tests Pass**
   ```bash
   cd Maya/backend
   npm test
   ```
   - ✅ All unit tests passing
   - ✅ All integration tests passing
   - ✅ All security tests passing

2. **Event Listener Tests Pass**
   ```bash
   npm test -- tests/integration_tests/frontend-chat-event-listeners.test.js
   ```
   - ✅ DOM readiness tests pass
   - ✅ Element existence checks pass
   - ✅ Event attachment tests pass

3. **Security Tests Pass**
   ```bash
   npm run test:security
   ```
   - ✅ Rate limiting tests pass
   - ✅ Input validation tests pass
   - ✅ Frontend protection tests pass

### ✅ Manual Checks

1. **Code Review**
   - [ ] All DOM element access has null checks
   - [ ] All event listeners attached after DOM ready
   - [ ] No inline event handlers accessing DOM
   - [ ] Error handling present for DOM operations

2. **Browser Testing** (Local)
   - [ ] Open `maya.html` in browser
   - [ ] Open browser console (F12)
   - [ ] Check for: `✅ All event listeners attached successfully`
   - [ ] Test: Type message → Click Send → Verify response
   - [ ] Test: Type message → Press Enter → Verify response
   - [ ] Test: Click prompt suggestions → Verify input populated
   - [ ] Test: Theme toggle works

3. **Console Verification**
   - [ ] No red errors in console
   - [ ] Event listener logs appear
   - [ ] API calls logged correctly
   - [ ] Responses logged correctly

---

## Deployment Process

### Step 1: Run Pre-Deployment Tests
```bash
cd Maya
./scripts/pre-deployment-test.sh
```

**Expected Output**:
```
✅ All tests passed!
✅ Security tests passed!
✅ Integration tests passed!
✅ Event listener tests passed!
🚀 You are cleared for deployment!
```

### Step 2: Review Changes
```bash
git log --oneline -10
git diff HEAD~5 HEAD --stat
```

### Step 3: Commit and Push
```bash
git add .
git commit -m "Your descriptive commit message"
git push origin main
```

### Step 4: Wait for Auto-Deployment
- ⏱️ Wait 2-5 minutes for GitHub → AI Builders Space deployment
- 🔗 Monitor: https://github.com/xiu-shi/maya_v1.0/actions

### Step 5: Production Verification
1. **Open Production Site**
   - URL: https://maya-agent.ai-builders.space/maya.html

2. **Console Check**
   - Open browser console (F12)
   - Look for: `🔗 Attaching event listeners...`
   - Look for: `✅ All event listeners attached successfully`
   - No red errors

3. **Functionality Test**
   - [ ] Send button works
   - [ ] Enter key works
   - [ ] Typing indicator shows
   - [ ] API response received
   - [ ] Message displayed correctly
   - [ ] Theme toggle works
   - [ ] Prompt suggestions work

4. **Error Monitoring**
   - Check console for any errors
   - Verify no silent failures
   - Test in multiple browsers if possible

---

## Post-Deployment

### If Issues Found

1. **Check Console Logs**
   - Copy all console output
   - Look for error messages
   - Check network tab for failed requests

2. **Rollback if Critical**
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Document Issue**
   - Create issue document
   - Include console logs
   - Include steps to reproduce

---

## Quick Reference

### Test Commands
```bash
# All tests
cd Maya/backend && npm test

# Security tests only
npm run test:security

# Event listener tests only
npm test -- tests/integration_tests/frontend-chat-event-listeners.test.js

# Pre-deployment check
cd Maya && ./scripts/pre-deployment-test.sh
```

### Deployment Commands
```bash
# Push to deploy
git push origin main

# Check deployment status
# Visit: https://github.com/xiu-shi/maya_v1.0/actions
```

---

## Related Documents

- [DOM Timing Patterns](./DOM_TIMING_PATTERNS.md) - Prevention guide
- [Root Cause Analysis](./ROOT_CAUSE_ANALYSIS_CHAT_BREAKAGE.md) - Previous issue analysis
- [Chat Fix Summary](./CHAT_FIX_SUMMARY.md) - Fix documentation

---

**Remember**: Always run tests before deploying! 🚀
