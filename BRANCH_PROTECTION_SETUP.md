# Branch Protection Setup Guide
**Date**: January 18, 2026  
**Purpose**: Set up branch protection for main branch

---

## ⚠️ Current Status

**Issue**: Main branch has no protection  
**Risk**: 
- Accidental force pushes could lose history
- Accidental deletion possible
- No required status checks before merging
- No code review requirements

---

## ✅ Recommended Protection Settings

### Basic Protection (Minimum)
1. ✅ **Prevent force pushes**
2. ✅ **Prevent branch deletion**
3. ✅ **Require pull request reviews** (1 reviewer)
4. ✅ **Require status checks** (tests must pass)

### Enhanced Protection (Recommended)
1. ✅ **Require pull request reviews** (1 reviewer)
2. ✅ **Dismiss stale reviews** when new commits are pushed
3. ✅ **Require status checks to pass** before merging
4. ✅ **Require branches to be up to date** before merging
5. ✅ **Require conversation resolution** before merging
6. ✅ **Do not allow bypassing** the above settings
7. ✅ **Restrict who can push** to matching branches (optional)

---

## 🔧 Setup Instructions

### Step 1: Navigate to Branch Protection Settings

1. Go to your GitHub repository
2. Click **Settings** (top navigation)
3. Click **Branches** (left sidebar)
4. Under "Branch protection rules", click **Add rule** or edit existing rule for `main`

### Step 2: Configure Protection Rules

#### Basic Settings:
- **Branch name pattern**: `main`
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: `1`
  - ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Select status checks: (will show after tests are configured)
- ✅ **Require conversation resolution before merging**
- ✅ **Do not allow bypassing the above settings**
- ✅ **Restrict who can push to matching branches** (optional - only if you want to restrict)

#### Advanced Settings:
- ✅ **Require linear history** (optional - keeps cleaner history)
- ✅ **Include administrators** (apply rules to admins too)
- ✅ **Allow force pushes** - ❌ **UNCHECK** (prevent force pushes)
- ✅ **Allow deletions** - ❌ **UNCHECK** (prevent branch deletion)

### Step 3: Save Settings

Click **Create** or **Save changes**

---

## 🎯 Recommended Configuration for Your Workflow

### Since You Push Directly to Main:

**Option A: Soft Protection** (Recommended for solo developer)
- ✅ Prevent force pushes
- ✅ Prevent branch deletion
- ✅ Require status checks (tests must pass)
- ❌ Don't require PR reviews (since you push directly)
- ✅ Allow administrators to bypass (for emergencies)

**Option B: Full Protection** (Recommended for team)
- ✅ All basic protections
- ✅ Require PR reviews (even for your own commits)
- ✅ Require status checks
- ❌ Don't allow bypassing (strict)

---

## 📋 Status Checks to Require

After setting up branch protection, you can require these status checks:

### If Using GitHub Actions:
- `test` - All tests passing
- `lint` - Code linting (if configured)
- `build` - Build successful (if configured)

### If Using External CI:
- Your CI service status checks

**Note**: Status checks appear after they've run at least once.

---

## ⚠️ Important Considerations

### For Your Current Workflow:
Since you push directly to `main`:
- **Don't require PR reviews** if you're the only developer
- **Do require status checks** (tests must pass)
- **Do prevent force pushes** (safety)
- **Do prevent deletion** (safety)

### If You Want to Keep Direct Pushes:
- Set protection to allow administrators to bypass
- Still require status checks
- Still prevent force pushes and deletion

### If You Want to Switch to PR Workflow:
- Require PR reviews
- Require status checks
- Don't allow bypassing
- This is more secure but requires PRs for every change

---

## 🚀 Quick Setup (Recommended for You)

### Minimal Protection (Allows Direct Pushes):
1. Go to: Settings → Branches → Add rule for `main`
2. Check:
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators
   - ✅ Allow force pushes - ❌ **UNCHECK**
   - ✅ Allow deletions - ❌ **UNCHECK**
3. **Don't check**: "Require a pull request before merging" (allows direct pushes)
4. Save

**Result**: 
- ✅ Tests must pass before pushing
- ✅ No force pushes allowed
- ✅ No branch deletion allowed
- ✅ You can still push directly (no PR required)

---

## 📝 After Setup

### Verify Protection:
1. Try to force push: `git push --force origin main`
2. Should fail with: "Updates were rejected because the tip of your current branch is behind"
3. Try to delete branch via GitHub UI
4. Should be prevented

### Status Checks:
- After first push with protection, GitHub will show available status checks
- Select which checks are required (e.g., "test")
- Future pushes will require these checks to pass

---

## 🔄 Workflow Impact

### With Protection (Minimal):
- ✅ Push normally: `git push origin main` (works if tests pass)
- ❌ Force push: `git push --force` (blocked)
- ❌ Delete branch: Blocked via UI
- ✅ Tests must pass (if status checks configured)

### Without Protection:
- ✅ Push normally: Works
- ✅ Force push: Works (dangerous!)
- ✅ Delete branch: Possible (dangerous!)
- ⚠️ No test requirements

---

## 📚 Additional Resources

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Status Checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-status-checks)

---

## ✅ Next Steps

1. **Set up branch protection** using the guide above
2. **Configure status checks** (after first protected push)
3. **Test protection** (try force push - should fail)
4. **Document** your protection settings

---

**Status**: Ready to set up branch protection
