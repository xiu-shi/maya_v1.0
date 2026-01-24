# Branch Protection Best Practices
**Date**: January 18, 2026  
**Repository**: maya_v1.0  
**Workflow**: Direct pushes to main (solo developer)

---

## 🎯 Recommended Configuration for Your Project

### Option 1: Minimal Protection (Recommended for Solo Developer)

**Best for**: Solo developer, direct push workflow, quick iterations

**Settings**:
- ✅ **Prevent force pushes** - CRITICAL
- ✅ **Prevent branch deletion** - CRITICAL  
- ✅ **Require status checks** (if tests configured)
- ✅ **Include administrators** (applies to you too)
- ❌ **Don't require PR reviews** (allows direct pushes)
- ❌ **Don't require linear history** (allows merge commits)

**Why This Works**:
- Protects against accidental destructive operations
- Still allows fast iteration (direct pushes)
- Tests run automatically (if configured)
- No workflow friction for solo development

**Trade-offs**:
- ✅ Fast development cycle
- ✅ No PR overhead
- ⚠️ Less protection against bad code (relies on tests)
- ⚠️ No code review (but you're the only developer)

---

### Option 2: Balanced Protection (Recommended for Future Team)

**Best for**: Small team, occasional collaborators, growing project

**Settings**:
- ✅ **Prevent force pushes** - CRITICAL
- ✅ **Prevent branch deletion** - CRITICAL
- ✅ **Require status checks** - CRITICAL
- ✅ **Require branches to be up to date** before merging
- ✅ **Require PR reviews** (1 approval)
- ✅ **Dismiss stale reviews** when new commits pushed
- ✅ **Require conversation resolution** before merging
- ✅ **Include administrators** (you can still bypass if needed)
- ❌ **Don't require linear history** (flexibility)

**Why This Works**:
- Code review before merging
- Tests must pass
- Protects against bad code
- Still allows admin bypass for emergencies

**Trade-offs**:
- ✅ Better code quality
- ✅ Team collaboration ready
- ⚠️ Requires PRs (more workflow steps)
- ⚠️ Slightly slower iteration

---

### Option 3: Maximum Protection (Enterprise/Production)

**Best for**: Production systems, large teams, critical applications

**Settings**:
- ✅ **Prevent force pushes** - CRITICAL
- ✅ **Prevent branch deletion** - CRITICAL
- ✅ **Require status checks** - CRITICAL
- ✅ **Require branches to be up to date** - CRITICAL
- ✅ **Require PR reviews** (2 approvals)
- ✅ **Dismiss stale reviews** - CRITICAL
- ✅ **Require conversation resolution** - CRITICAL
- ✅ **Require linear history** (clean git history)
- ✅ **Do NOT allow bypassing** (strict enforcement)
- ✅ **Restrict who can push** (specific users/teams)

**Why This Works**:
- Maximum security and code quality
- Multiple reviewers catch issues
- Clean git history
- No exceptions (even for admins)

**Trade-offs**:
- ✅ Highest code quality
- ✅ Best security practices
- ⚠️ Requires PRs for every change
- ⚠️ Multiple approvals needed
- ⚠️ Slower development cycle

---

## 🔒 Critical Settings (Always Enable)

### 1. Prevent Force Pushes ⚠️ CRITICAL
**Why**: Force pushes can rewrite history and lose commits
```bash
# Without protection:
git push --force origin main  # ⚠️ DANGEROUS - can lose work

# With protection:
git push --force origin main  # ❌ BLOCKED - safe!
```

### 2. Prevent Branch Deletion ⚠️ CRITICAL
**Why**: Accidental deletion loses all work
- Protects against UI deletion
- Protects against `git push origin --delete main`

### 3. Require Status Checks ✅ RECOMMENDED
**Why**: Ensures tests pass before code reaches main
- Prevents broken code from being merged
- Catches issues early
- Works with CI/CD

---

## 📋 Status Checks Configuration

### What Status Checks to Require:

**Minimum** (if you have tests):
- `test` - All tests passing
- `lint` - Code linting (if configured)

**Recommended** (if using CI/CD):
- `test` - Unit/integration tests
- `build` - Build successful
- `security` - Security scans (if configured)

**How to Set Up**:
1. After first push with protection, GitHub shows available checks
2. Select which checks are required
3. Future pushes will require these checks to pass

**Note**: Checks appear after they've run at least once (chicken-and-egg)

---

## 🎯 Recommended Setup for Your Project

### Current Situation:
- Solo developer
- Direct push workflow
- Maya chat application (production)
- Security-sensitive (API tokens, user data)

### Recommended: **Option 1 (Minimal Protection)**

**Exact Settings**:
```
Branch name pattern: main

✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   ✅ Select status checks: (will appear after first push)

✅ Include administrators

❌ Allow force pushes (UNCHECKED)
❌ Allow deletions (UNCHECKED)

❌ Require a pull request before merging (UNCHECKED)
❌ Require linear history (UNCHECKED)
❌ Do not allow bypassing (UNCHECKED)
```

**Why This Configuration**:
1. **Protects against accidents** (force push, deletion)
2. **Allows fast iteration** (direct pushes)
3. **Enforces tests** (if configured)
4. **No workflow friction** (solo developer)
5. **Easy to upgrade** (can add PR requirement later)

---

## 🚀 Migration Path

### Phase 1: Now (Solo Developer)
- Use **Option 1: Minimal Protection**
- Focus on preventing accidents
- Keep workflow fast

### Phase 2: When Adding Collaborators
- Upgrade to **Option 2: Balanced Protection**
- Add PR requirement
- Add code review requirement

### Phase 3: Production/Mature Project
- Consider **Option 3: Maximum Protection**
- Multiple reviewers
- Strict enforcement

---

## ⚠️ Common Mistakes to Avoid

### ❌ Don't Do:
1. **Require PR reviews but allow bypassing** - Defeats the purpose
2. **Require status checks but don't configure them** - Blocks all pushes
3. **Prevent force pushes but allow deletions** - Inconsistent protection
4. **Require linear history without reason** - Unnecessary restriction

### ✅ Do:
1. **Start minimal, add protection gradually**
2. **Test protection settings** (try force push, should fail)
3. **Configure status checks** after first protected push
4. **Document your protection settings** (this file!)

---

## 🔄 Workflow Examples

### With Minimal Protection (Recommended):

```bash
# Normal push (works if tests pass)
git add .
git commit -m "Fix: Update security rules"
git push origin main  # ✅ Works

# Force push (blocked)
git push --force origin main  # ❌ BLOCKED - "Updates were rejected"

# Delete branch (blocked via UI)
# ❌ GitHub UI prevents deletion
```

### With Balanced Protection:

```bash
# Direct push (blocked - requires PR)
git push origin main  # ❌ BLOCKED - "Requires pull request"

# Create PR instead
git checkout -b feature/update-security
git push origin feature/update-security
# Create PR on GitHub
# Wait for approval + tests
# Merge PR
```

---

## 📊 Comparison Table

| Feature | Minimal | Balanced | Maximum |
|---------|---------|----------|---------|
| Prevent force push | ✅ | ✅ | ✅ |
| Prevent deletion | ✅ | ✅ | ✅ |
| Require tests | ✅ | ✅ | ✅ |
| Require PR | ❌ | ✅ | ✅ |
| Require reviews | ❌ | ✅ (1) | ✅ (2) |
| Allow bypass | ✅ | ✅ | ❌ |
| Linear history | ❌ | ❌ | ✅ |
| **Best for** | Solo dev | Small team | Enterprise |

---

## ✅ Action Items

1. **Set up minimal protection** (Option 1)
2. **Test protection** (try force push - should fail)
3. **Configure status checks** (after first push)
4. **Document settings** (update this file with your choices)
5. **Review periodically** (upgrade as project grows)

---

## 📚 Additional Resources

- [GitHub Branch Protection Docs](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Status Checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-status-checks)
- [Git Force Push Risks](https://www.atlassian.com/git/tutorials/rewriting-history)

---

**Recommendation**: Start with **Option 1 (Minimal Protection)** and upgrade as your project grows.
