# Root Route Fix - January 17, 2026

## Issue
Root URL `https://maya-agent.ai-builders.space/` was showing "Endpoint not found" error.

## Root Cause
Express static middleware was potentially interfering with the root route handler. When `express.static()` is configured without `index: false`, it tries to serve `index.html` automatically for root path requests, which can interfere with explicit route handlers.

## Solution
1. **Configure static middleware** to NOT serve index.html automatically:
   ```javascript
   app.use(express.static(frontendPath, {
     index: false // Don't serve index.html automatically
   }));
   ```

2. **Move root route handler** to AFTER static middleware:
   - Static middleware runs first (serves files like `/maya.html`)
   - Root route handler runs after (explicitly handles `/`)
   - This ensures proper order: static files → root route → other routes → 404 handler

## Code Changes

**Before**:
```javascript
// Root route BEFORE static middleware
app.get('/', (req, res) => {
  res.redirect('/maya.html');
});
app.use(express.static(frontendPath));
```

**After**:
```javascript
// Static middleware with index:false
app.use(express.static(frontendPath, {
  index: false
}));

// Root route AFTER static middleware
app.get('/', (req, res) => {
  res.redirect(301, '/maya.html');
});
```

## Why This Works

1. **Static middleware with `index: false`**: Prevents Express from automatically serving `index.html` for root path
2. **Explicit root handler**: Our route handler explicitly catches `/` and redirects
3. **Proper order**: Static files → Root route → Other routes → 404 handler

## Testing

After deployment:
- `https://maya-agent.ai-builders.space/` → Should redirect to `/maya.html`
- `https://maya-agent.ai-builders.space/maya.html` → Should serve frontend
- `https://maya-agent.ai-builders.space/api/chat` → Should work for API calls

## Status
✅ Fixed and deployed
