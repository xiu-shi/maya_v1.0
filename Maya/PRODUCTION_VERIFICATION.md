# Production Verification Guide
**Date**: January 18, 2026, 13:20 GMT  
**Purpose**: Step-by-step verification of deployed fixes

---

## Pre-Verification Checklist

Before testing in production, ensure:
- [x] Code pushed to GitHub
- [x] Auto-deployment triggered
- [x] Wait 2-5 minutes for deployment
- [ ] Production site accessible
- [ ] Health endpoint responding

---

## Verification Steps

### Step 1: Basic Site Accessibility

**Test**: Open production site  
**URL**: https://maya-agent.ai-builders.space/maya.html  
**Expected**: Page loads without errors

**Check**:
- [ ] Page loads successfully
- [ ] No 404 errors
- [ ] No 500 errors
- [ ] Page renders correctly

**Time**: [To be filled]  
**Result**: [To be filled]

---

### Step 2: Console Verification

**Test**: Check browser console for event listener logs  
**Steps**:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Reload page
4. Look for specific log messages

**Expected Logs**:
```
🔗 Attaching event listeners...
✅ Auto-resize listener attached
✅ Enter key listener attached
✅ Submit button listener attached
✅ New chat button listener attached
✅ All event listeners attached successfully
```

**Check**:
- [ ] `🔗 Attaching event listeners...` appears
- [ ] All `✅` messages appear
- [ ] No red errors
- [ ] No `❌` error messages

**Time**: [To be filled]  
**Result**: [To be filled]  
**Screenshot**: [To be taken if issues]

---

### Step 3: Chat Functionality - Send Button

**Test**: Test Send button functionality  
**Steps**:
1. Type a message in chat input
2. Click Send button
3. Observe behavior

**Expected**:
- [ ] Typing indicator appears (3 dots)
- [ ] API request is made (check Network tab)
- [ ] Response received
- [ ] Message displayed in chat
- [ ] Maya's avatar appears
- [ ] Response is formatted correctly

**Console Logs Expected**:
```
🖱️ Submit button clicked, calling sendMessage
📤 Sending request to: [API URL]
📥 Response status: 200
📥 Response data: [response object]
💬 Adding message to UI
✅ Message added to UI
```

**Time**: [To be filled]  
**Result**: [To be filled]  
**Network Tab**: [To be checked]

---

### Step 4: Chat Functionality - Enter Key

**Test**: Test Enter key functionality  
**Steps**:
1. Type a message in chat input
2. Press Enter (not Shift+Enter)
3. Observe behavior

**Expected**:
- [ ] Message sent (same as Send button)
- [ ] Shift+Enter creates new line (doesn't send)

**Console Logs Expected**:
```
⌨️ Enter key pressed, calling sendMessage
```

**Time**: [To be filled]  
**Result**: [To be filled]

---

### Step 5: Theme Toggle

**Test**: Test theme toggle functionality  
**Steps**:
1. Click theme toggle button (moon/sun icon)
2. Observe theme change

**Expected**:
- [ ] Theme changes (light ↔ dark)
- [ ] Icon updates (moon ↔ sun)
- [ ] Preference saved to localStorage
- [ ] Theme persists on reload

**Check**:
- [ ] No console errors
- [ ] Theme applies correctly
- [ ] All UI elements visible in both themes

**Time**: [To be filled]  
**Result**: [To be filled]

---

### Step 6: Prompt Suggestions

**Test**: Test prompt suggestion clicks  
**Steps**:
1. Click on a prompt suggestion (e.g., "I run a [your industry] business...")
2. Observe input field

**Expected**:
- [ ] Prompt text appears in input field
- [ ] Input field is focused
- [ ] Textarea auto-resizes if needed
- [ ] No console errors

**Console Logs Expected**:
- No errors
- Input value updated

**Time**: [To be filled]  
**Result**: [To be filled]

---

### Step 7: Error Handling

**Test**: Test error scenarios  
**Steps**:
1. Disconnect internet (or block network)
2. Try to send a message
3. Reconnect and try again

**Expected**:
- [ ] Error message displayed to user
- [ ] Error is user-friendly
- [ ] No technical details exposed
- [ ] Retry works after reconnection

**Console Logs Expected**:
```
❌ Network error detected
💬 Adding error message to UI
✅ Error message added
```

**Time**: [To be filled]  
**Result**: [To be filled]

---

### Step 8: Multiple Messages

**Test**: Test conversation flow  
**Steps**:
1. Send multiple messages
2. Verify conversation history
3. Check message ordering

**Expected**:
- [ ] Messages appear in correct order
- [ ] User messages on right
- [ ] Maya messages on left
- [ ] Avatars display correctly
- [ ] Conversation flows naturally

**Time**: [To be filled]  
**Result**: [To be filled]

---

## Issue Documentation Template

If issues are found, document:

### Issue #1: [Title]

**Description**:  
[Detailed description]

**Steps to Reproduce**:  
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Behavior**:  
[What should happen]

**Actual Behavior**:  
[What actually happens]

**Console Logs**:  
```
[Paste console logs here]
```

**Network Requests**:  
[Paste network tab info here]

**Screenshots**:  
[Attach screenshots]

**Severity**: [Critical/High/Medium/Low]  
**Status**: [Open/Investigating/Fixed]

---

## Verification Summary

**Overall Status**: ⏳ Pending  
**Tests Passed**: 0/8  
**Tests Failed**: 0/8  
**Issues Found**: 0

**Next Steps**:  
- [ ] Complete all verification steps
- [ ] Document any issues found
- [ ] Create fixes if needed
- [ ] Re-verify after fixes

---

**Last Updated**: 13:20 GMT  
**Next Update**: After verification complete
