# Repository Cleanup Proposal - Best Practices
**Date**: January 18, 2026  
**Purpose**: Clean up repository to follow GitHub best practices

---

## ❌ Current Issues

### Too Many Temporary Files in Root
The repository root contains many temporary/debugging files that should be:
- **Removed** (if temporary/one-time tasks)
- **Moved** to appropriate directories (if still useful)
- **Documented** in a single README (if needed for reference)

### Files Currently in Root:
- `E2E_tests_9Jan.md` - Temporary test documentation
- `GIT_PUSH_FIX.md` - Temporary fix notes
- `GIT_PUSH_INSTRUCTIONS.md` - Temporary instructions
- `GIT_REMOTE_FIX.md` - Temporary fix notes
- `GIT_SYNC_CHECK.md` - Temporary check notes
- `PROJECT_PROGRESS.md` - Could be useful, but should be in docs folder
- `SECURITY.md` - ✅ Keep (standard security file)
- `.cursorrules` - ✅ Keep (project configuration)

### Files in Maya/ Directory:
- Many temporary analysis/debugging files
- Fix logs and verification files
- Some should be removed, some consolidated

---

## ✅ Best Practices for GitHub Repositories

### What Should Be Public:
1. **README.md** - Project overview and getting started
2. **SECURITY.md** - Security policy (GitHub standard)
3. **LICENSE** - License file (if applicable)
4. **.cursorrules** - Project configuration (useful for contributors)
5. **Essential documentation** - User-facing docs, API docs
6. **Code** - Source code, tests, configs

### What Should NOT Be Public:
1. **Temporary debugging files** - One-time fixes, debug logs
2. **Internal notes** - Personal reminders, work-in-progress
3. **Duplicate documentation** - Multiple files saying the same thing
4. **Historical snapshots** - Old analysis that's no longer relevant
5. **Test execution logs** - Temporary test results

---

## 📋 Cleanup Plan

### Phase 1: Root Directory Cleanup

#### Remove (Temporary/One-Time Tasks):
1. ✅ `E2E_tests_9Jan.md` - Temporary test doc
2. ✅ `GIT_PUSH_FIX.md` - Temporary fix notes
3. ✅ `GIT_PUSH_INSTRUCTIONS.md` - Temporary instructions
4. ✅ `GIT_REMOTE_FIX.md` - Temporary fix notes
5. ✅ `GIT_SYNC_CHECK.md` - Temporary check notes

#### Keep/Move:
- ✅ `SECURITY.md` - Keep (GitHub standard)
- ✅ `.cursorrules` - Keep (project config)
- ✅ `PROJECT_PROGRESS.md` - Move to `Maya/docs/` or remove if outdated
- ✅ `Dockerfile` - Keep (deployment config)
- ✅ `.gitignore` - Keep (standard)

### Phase 2: Maya/ Directory Cleanup

#### Remove (Temporary Analysis):
1. ✅ `SYSTEM_INSTRUCTIONS_VERIFICATION.md` - Temporary verification
2. ✅ `DIAGNOSIS_CHAT_BREAKAGE.md` - Superseded by root cause analysis
3. ✅ `FIX_CHAT_BREAKAGE_LOG.md` - Temporary implementation log

#### Consolidate (Keep Essential, Remove Duplicates):
- Keep: `ROOT_CAUSE_ANALYSIS_CHAT_BREAKAGE.md` (comprehensive)
- Keep: `DOM_TIMING_PATTERNS.md` (prevention guide)
- Keep: `INSPECT_ACCESS_GUIDE.md` (useful reference)
- Remove: Duplicate fix/verification files

#### Organize (Create Structure):
Create `Maya/docs/` directory for:
- Deployment guides
- Troubleshooting guides
- Architecture documentation
- Best practices

---

## 📁 Proposed Structure

```
/
├── README.md                    # Main project README
├── SECURITY.md                  # Security policy (GitHub standard)
├── .cursorrules                 # Project configuration
├── .gitignore                   # Git ignore rules
├── Dockerfile                   # Docker config
├── mcp_config.json              # MCP config
│
├── Maya/
│   ├── README.md                # Maya-specific README
│   ├── DEPLOYMENT.md            # Deployment guide
│   ├── Implementation.md        # Implementation details
│   │
│   ├── docs/                    # 📁 NEW: Organized documentation
│   │   ├── deployment/          # Deployment guides
│   │   ├── troubleshooting/     # Troubleshooting guides
│   │   ├── architecture/        # Architecture docs
│   │   └── best-practices/      # Best practices
│   │
│   ├── backend/                  # Backend code
│   ├── frontend/                # Frontend code
│   ├── tests/                   # Tests
│   └── knowledge/               # Knowledge base
│
└── backend/                     # Root backend (if needed)
```

---

## 🎯 Recommended Actions

### Immediate (High Priority):
1. **Remove temporary root files** (5 files)
2. **Remove temporary Maya/ files** (3 files)
3. **Create `Maya/docs/` structure**
4. **Move reusable docs** to organized folders

### Short Term:
1. **Consolidate duplicate documentation**
2. **Update README.md** with essential info
3. **Create proper documentation index**

### Long Term:
1. **Maintain clean repository**
2. **Follow Documentation Review SOP** for new files
3. **Use docs/ folder** for all documentation

---

## 📝 Files to Remove

### Root Level (5 files):
- `E2E_tests_9Jan.md`
- `GIT_PUSH_FIX.md`
- `GIT_PUSH_INSTRUCTIONS.md`
- `GIT_REMOTE_FIX.md`
- `GIT_SYNC_CHECK.md`

### Maya/ Level (3+ files):
- `SYSTEM_INSTRUCTIONS_VERIFICATION.md`
- `DIAGNOSIS_CHAT_BREAKAGE.md`
- `FIX_CHAT_BREAKAGE_LOG.md`
- (Plus other temporary files to be identified)

---

## ✅ Benefits of Cleanup

1. **Professional appearance** - Clean, organized repository
2. **Easier navigation** - Less clutter, better structure
3. **Better for contributors** - Clear documentation structure
4. **Follows best practices** - Standard GitHub repository layout
5. **Easier maintenance** - Less files to manage

---

## ⚠️ Before Removing

I will:
1. ✅ Ensure historical essence is captured in kept files
2. ✅ Update any references to removed files
3. ✅ Update tests if needed
4. ✅ Create proper documentation structure
5. ✅ Update README with essential information

---

## 🚀 Action Required

**Would you like me to proceed with the cleanup?**

If yes, I will:
1. Remove temporary files (8+ files)
2. Create `Maya/docs/` structure
3. Move/organize remaining documentation
4. Update README.md
5. Commit and push cleanup

**This will make your repository more professional and easier to navigate.**

---

**Status**: Awaiting approval to proceed with cleanup
