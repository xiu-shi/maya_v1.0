# Important Security Note

**Date**: January 18, 2026

## ⚠️ Critical: Local `.gitignore` Still Required

Even though `.gitignore` has been removed from the repository, **you MUST maintain a local `.gitignore` file** to prevent accidentally committing secrets.

### Why This Matters

Without `.gitignore`, Git will track:
- `.env` files (containing `AI_BUILDER_TOKEN`)
- `mcp_config.json` (containing tokens)
- `node_modules/` (large, unnecessary)
- Log files (may contain sensitive info)
- System files (`.DS_Store`)

### Action Required

**Create a local `.gitignore` file** (do NOT commit it):

```bash
# Create .gitignore locally
cat > .gitignore << 'EOF'
# Environment variables and secrets
.env
.env.*
mcp_config.json
*.secret
*.key
*.token

# Dependencies
node_modules/

# Logs
*.log

# System files
.DS_Store

# Build outputs
dist/
build/
EOF
```

**Important**: This file should exist locally but NOT be committed to git.

---

## Development Guidelines

Since `.cursorrules` has been removed, development guidelines are now in:
- `Maya/knowledge/system_instruction.md` - System instructions
- `SECURITY.md` - Security best practices
- `GITHUB.md` - Repository management

---

**Status**: Files removed from repository as requested  
**Action**: Create local `.gitignore` immediately to prevent secret commits
