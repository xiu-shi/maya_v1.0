# DOM Timing Patterns - Prevention Guide
**Date**: January 18, 2026  
**Purpose**: Document similar patterns that can cause DOM timing issues

---

## Problem Pattern

**Issue**: Accessing DOM elements or attaching event listeners before elements exist.

**Symptoms**:
- Silent failures (no errors, but functionality doesn't work)
- Intermittent failures (works sometimes, fails other times)
- Works in development, fails in production
- Works in one browser, fails in another

---

## Similar Patterns Found in Codebase

### 1. ✅ FIXED: Event Listener Attachment (maya.html)
**Location**: Lines 858-874 (before fix)

**Problem**:
```javascript
// ❌ BAD: Attaching immediately, elements might not exist
const chatInput = document.getElementById('chatInput');
chatInput.addEventListener('keydown', ...);  // chatInput might be null!
```

**Fix**:
```javascript
// ✅ GOOD: Check DOM readiness and element existence
function attachEventListeners() {
  if (!chatInput || !submitBtn) return false;
  chatInput.addEventListener('keydown', ...);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', attachEventListeners);
} else {
  attachEventListeners();
}
```

---

### 2. ✅ FIXED: Theme Toggle (maya.html)
**Location**: Lines 785-799 (before fix)

**Problem**:
```javascript
// ❌ BAD: Accessing element immediately
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');  // themeToggle might be null!
```

**Fix**:
```javascript
// ✅ GOOD: Wrapped in function with checks
function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;
  const themeIcon = themeToggle.querySelector('.theme-icon');
  if (!themeIcon) return;
  // ... rest of code
}
```

---

### 3. ✅ FIXED: Inline onclick Handlers (maya.html)
**Location**: Lines 746-757 (before fix)

**Problem**:
```html
<!-- ❌ BAD: Inline onclick uses getElementById without checks -->
<li onclick="document.getElementById('chatInput').value='...'; document.getElementById('chatInput').focus();">
```

**Fix**:
```html
<!-- ✅ GOOD: Use data attributes and event delegation -->
<li data-prompt="...">...</li>
<script>
function initPromptHandlers() {
  document.querySelectorAll('[data-prompt]').forEach(item => {
    item.addEventListener('click', function() {
      const chatInput = document.getElementById('chatInput');
      if (chatInput) {
        chatInput.value = this.getAttribute('data-prompt');
        chatInput.focus();
      }
    });
  });
}
</script>
```

---

### 4. ⚠️ POTENTIAL ISSUE: Query Selectors in Functions (maya.html)
**Location**: Multiple locations (lines 1115, 1295, 1369, etc.)

**Current Pattern**:
```javascript
// ⚠️ Some functions check, some don't
function scrollToBottom() {
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) {  // ✅ Good - checks exist
    // ...
  }
}

function someOtherFunction() {
  const element = document.querySelector('.some-class');
  // ❌ No check - might fail if element doesn't exist
  element.doSomething();
}
```

**Recommendation**: Always check element existence before use.

---

### 5. ✅ GOOD PATTERN: Event Delegation (script_contact.js)
**Location**: Lines 433-464

**Example**:
```javascript
// ✅ GOOD: Uses DOMContentLoaded and checks
document.addEventListener("DOMContentLoaded", function () {
  const selectors = "#contactForm, form.contact-form";
  Array.from(document.querySelectorAll(selectors))
    .filter((el, i, arr) => arr.indexOf(el) === i)
    .forEach(bindFormSafely);
  
  function bindFormSafely(form) {
    if (!form || form.dataset.vHandlerBound === "1") return;  // ✅ Checks exist
    bindForm(form);
  }
});
```

---

## Prevention Checklist

### ✅ Always Do:
1. **Check DOM readiness** before accessing elements
   ```javascript
   if (document.readyState === 'loading') {
     document.addEventListener('DOMContentLoaded', init);
   } else {
     init();
   }
   ```

2. **Verify element exists** before using
   ```javascript
   const element = document.getElementById('myId');
   if (!element) {
     console.warn('Element not found');
     return;
   }
   ```

3. **Use event delegation** for dynamically added elements
   ```javascript
   document.addEventListener('click', function(e) {
     if (e.target.matches('.dynamic-button')) {
       // Handle click
     }
   });
   ```

4. **Wrap initialization in functions** that can be called when ready
   ```javascript
   function initMyFeature() {
     // All initialization code here
   }
   ```

5. **Add error handling** around DOM operations
   ```javascript
   try {
     element.addEventListener('click', handler);
   } catch (error) {
     console.error('Failed to attach listener:', error);
   }
   ```

### ❌ Never Do:
1. **Don't access elements immediately** when script loads
   ```javascript
   // ❌ BAD
   const el = document.getElementById('myId');
   el.addEventListener('click', ...);
   ```

2. **Don't assume elements exist** without checking
   ```javascript
   // ❌ BAD
   document.getElementById('myId').addEventListener('click', ...);
   ```

3. **Don't use inline event handlers** that access DOM
   ```html
   <!-- ❌ BAD -->
   <button onclick="document.getElementById('input').value='test'">
   ```

4. **Don't ignore null checks**
   ```javascript
   // ❌ BAD
   const el = document.getElementById('myId');
   el.style.display = 'none';  // Crashes if el is null
   ```

---

## Testing Strategy

### Unit Tests
- Test element existence checks
- Test DOM readiness detection
- Test event listener attachment

### Integration Tests
- Test full initialization flow
- Test with different DOM states
- Test with missing elements

### E2E Tests
- Test in real browser
- Test with slow network (simulates slow DOM parsing)
- Test with cached vs fresh page loads

---

## Code Review Checklist

When reviewing frontend code, check:
- [ ] Are DOM elements checked before use?
- [ ] Are event listeners attached after DOM ready?
- [ ] Are inline handlers avoided?
- [ ] Is error handling present?
- [ ] Are functions wrapped for delayed initialization?
- [ ] Are tests covering DOM timing scenarios?

---

## Future Improvements

1. **ESLint Rules**: Add rules to catch DOM timing issues
2. **TypeScript**: Use TypeScript for better null checking
3. **Framework**: Consider React/Vue that handle DOM timing automatically
4. **Automated Tests**: Add tests that simulate slow DOM parsing
5. **Monitoring**: Add error tracking for DOM-related failures

---

## Related Files

- `Maya/frontend/maya.html` - Main chat interface (fixed)
- `Maya/tests/integration_tests/frontend-chat-event-listeners.test.js` - Tests
- `Maya/ROOT_CAUSE_ANALYSIS_CHAT_BREAKAGE.md` - Root cause analysis
- `Maya/scripts/pre-deployment-test.sh` - Pre-deployment test script

---

**Status**: Patterns documented, fixes applied, prevention measures in place ✅
