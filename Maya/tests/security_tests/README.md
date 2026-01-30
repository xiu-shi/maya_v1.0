# IP Protection Tests

**Purpose**: Automated tests to detect IP leakage risks in the GitHub repository.

**Safe for GitHub**: ✅ Yes - Tests use generic patterns and don't expose IP details.

## What These Tests Check

### 1. Tracked Files - IP-Protected File Names
- Ensures IP-protected code files are not tracked in Git
- Checks for: `response-guardrails`, `kb-monitor`, `kb-cache`, `system_prompt`, etc.
- Note: These are generic pattern names used for detection, not actual file paths

### 2. Tracked Files - Test Files
- Ensures test files are not tracked (except deployment tests)
- Checks for: `*.test.js`, `*.spec.js` patterns

### 3. Tracked Files - Documentation Files
- Ensures only allowed documentation is tracked
- Allows: `README.md`, `SECURITY.md`, `knowledge/` docs
- Blocks: All other `.md` files

### 4. Tracked Files - Script Files
- Ensures only deployment/server scripts are tracked
- Allows: `deploy-to-space.sh`, `run-pre-deployment-tests.sh`, `start.sh`, `stop.sh`
- Blocks: All other `.sh` files

### 5. .gitignore Content
- Ensures `.gitignore` doesn't contain IP-revealing comments
- Checks for: "IP-protected", "Core IP", "Maya System Instructions"
- Validates required exclusion patterns exist

### 6. Commit Messages
- Ensures recent commits don't contain IP-revealing terms
- Checks last 20 commits for sensitive patterns

### 7. File Content - IP-Revealing Patterns
- Scans tracked JavaScript files for IP-revealing comments
- Checks for: "GitHub deployment", "IP-protected", "(local)" references

### 8. Documentation References
- Ensures documentation doesn't reference IP-protected files
- Checks for references to IP-protected documentation files in tracked docs

## Running Tests

### Locally
```bash
cd Maya/backend
npm test -- tests/security_tests/ip-protection.test.js
```

### In CI/CD
Tests run automatically via GitHub Actions on:
- Every push to main/master
- Every pull request
- Daily at 2 AM UTC (scheduled)

## Test Output

Tests provide generic error messages that:
- ✅ Flag risks without exposing IP details
- ✅ Provide actionable guidance
- ✅ Don't reveal specific file names or content

Example error:
```
Found 3 IP-protected file(s) tracked in Git.
These files should be excluded via .gitignore.
```

## Integration

- **Pre-commit hook**: Blocks commits locally if IP leakage detected
- **GitHub Actions**: Runs on every push/PR to catch issues early
- **Scheduled runs**: Daily checks to catch any missed issues

## Maintenance

When adding new IP-protected files:
1. Update `.gitignore` to exclude them
2. Add pattern to test if needed (generic pattern only)
3. Ensure tests still pass

---

**Note**: These tests are designed to be safe for GitHub - they use generic patterns and don't expose sensitive details.
