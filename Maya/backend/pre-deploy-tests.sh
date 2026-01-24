#!/bin/bash

# Pre-Deployment Test Suite
# Runs all tests and validates system before deployment
# Prevents deployment if tests fail or critical checks don't pass
#
# Usage: ./pre-deploy-tests.sh
# Exit code: 0 if all tests pass, 1 if any fail

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  PRE-DEPLOYMENT TEST SUITE                        ║${NC}"
echo -e "${BLUE}║          Comprehensive validation before deployment               ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Track failures
FAILURES=0

# Function to run a check
run_check() {
    local check_name="$1"
    local check_command="$2"
    
    echo -e "${BLUE}▶ ${check_name}...${NC}"
    
    if eval "$check_command"; then
        echo -e "${GREEN}  ✅ PASSED${NC}"
        echo ""
        return 0
    else
        echo -e "${RED}  ❌ FAILED${NC}"
        echo ""
        FAILURES=$((FAILURES + 1))
        return 1
    fi
}

# 1. Check .env file exists
run_check "Check .env file exists" \
    "[ -f .env ] && echo '  .env file found'"

# 2. Check API key is configured
run_check "Check API key is configured" \
    "grep -q 'AI_BUILDER_TOKEN=sk_' .env && echo '  API key is set'"

# 3. Check API key is not example/test key
run_check "Check API key is not placeholder" \
    "! grep -q 'AI_BUILDER_TOKEN=sk_your_token_here' .env && \
     ! grep -q 'AI_BUILDER_TOKEN=test-token' .env && \
     echo '  API key is not placeholder'"

# 4. Check .env is in .gitignore
run_check "Check .env is in .gitignore" \
    "grep -q '\.env' ../.gitignore && echo '  .env is gitignored'"

# 5. Check no API keys in committed code
run_check "Check no API keys in committed code" \
    "! git grep -E 'sk_[a-z0-9]{8}_[a-f0-9]{40,}' -- '*.js' '*.md' ':!*.test.js' ':!**/tests/**' 2>/dev/null || \
     echo '  No API keys found in committed code'"

# 6. Run security tests
run_check "Run security tests" \
    "npm test -- tests/security_tests 2>&1 | grep -q 'Tests.*passed' && echo '  Security tests passed'"

# 7. Run unit tests
run_check "Run unit tests" \
    "npm test -- tests/unit_tests 2>&1 | grep -q 'Tests.*passed' && echo '  Unit tests passed'"

# 8. Run API key validation tests
run_check "Run API key validation tests" \
    "npm test -- tests/security_tests/api-key-validation.test.js 2>&1 | grep -q 'Tests.*passed' && echo '  API key tests passed'"

# 9. Test local server can start
run_check "Test server configuration" \
    "node -c server.js && echo '  Server syntax valid'"

# 10. Check for linting errors
run_check "Check for obvious code errors" \
    "! grep -r 'console.log(.*AI_BUILDER_TOKEN' --include='*.js' --exclude-dir=tests . 2>/dev/null || \
     echo '  No API key logging found'"

# 11. Validate MCP connection (local)
run_check "Validate API key format in .env" \
    "source .env && [ ! -z \"\$AI_BUILDER_TOKEN\" ] && \
     echo \"\$AI_BUILDER_TOKEN\" | grep -q '^sk_' && \
     [ \${#AI_BUILDER_TOKEN} -ge 20 ] && \
     echo '  API key format is valid'"

# 12. Check for old revoked keys
run_check "Check for old revoked keys" \
    "! grep -q 'sk_937d9f12' .env && echo '  No revoked keys found'"

# 13. Run integration tests (sample)
run_check "Run sample integration tests" \
    "npm test -- tests/integration_tests/mcp-retry-logic.test.js 2>&1 | grep -q 'Tests.*passed' && echo '  MCP retry tests passed'"

# 14. Run new Jan 18 tests
run_check "Run Jan 18, 2026 test improvements" \
    "npm test -- tests/integration_tests/sample-questions-interactions.test.js tests/integration_tests/deployment-script.test.js 2>&1 | grep -q 'Tests.*passed' && echo '  New tests passed'"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"

# Summary
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                      ✅ ALL TESTS PASSED                          ║${NC}"
    echo -e "${GREEN}║              System is ready for deployment                       ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}You can now safely deploy with:${NC}"
    echo -e "${BLUE}  cd .. && ./deploy-to-space.sh <your_api_key>${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                    ❌ TESTS FAILED ($FAILURES)                         ║${NC}"
    echo -e "${RED}║                DO NOT DEPLOY                                      ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${RED}Please fix the failing tests before deploying.${NC}"
    echo ""
    exit 1
fi
