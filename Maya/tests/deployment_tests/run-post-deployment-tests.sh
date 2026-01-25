#!/bin/bash

# Post-Deployment Verification Test Runner
# 
# Run this script AFTER deployment to verify everything works correctly
# 
# Usage: ./run-post-deployment-tests.sh [API_KEY]
#
# Exit codes:
#   0 - All verification passed
#   1 - Some verification failed

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Post-Deployment Verification Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if API key is provided
if [ -n "$1" ]; then
    export TEST_API_KEY="$1"
    echo "Using provided API key for deployment API tests"
else
    echo "API key not provided - deployment API tests will be skipped"
    echo "Usage: ./run-post-deployment-tests.sh YOUR_API_KEY"
fi
echo ""

# Change to backend directory
cd "$(dirname "$0")/../../backend" || exit 1

echo "Test Directory: $(pwd)"
echo ""

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Run post-deployment tests
echo -e "${BLUE}Running Post-Deployment Verification Tests${NC}"
echo "----------------------------------------"
echo ""

TOTAL_TESTS=$((TOTAL_TESTS + 1))

if npm test -- "../tests/deployment_tests/post-deployment-verification.test.js" 2>&1 | tee /tmp/deployment-test-output.txt | grep -q "Tests.*passed"; then
    echo ""
    echo -e "${GREEN}✓ Post-Deployment Verification: PASSED${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo ""
    echo -e "${RED}✗ Post-Deployment Verification: FAILED${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    
    # Show failures
    echo ""
    echo "Failed tests:"
    grep "FAIL" /tmp/deployment-test-output.txt || echo "See output above for details"
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Verification Results Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Total Test Suites: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
else
    echo "Failed: $FAILED_TESTS"
fi
echo ""

# Determine deployment success
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ DEPLOYMENT VERIFIED SUCCESSFULLY${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Deployment is working correctly!"
    echo ""
    echo "Service Status: ✅ HEALTHY"
    echo "Public URL: https://maya-agent.ai-builders.space/"
    echo ""
    echo "Next steps:"
    echo "1. Test Maya in browser: https://maya-agent.ai-builders.space/maya.html"
    echo "2. Monitor logs for any issues"
    echo "3. Update deployment record with timestamp"
    echo ""
    exit 0
else
    echo -e "${YELLOW}========================================${NC}"
    echo -e "${YELLOW}⚠️  DEPLOYMENT VERIFICATION ISSUES${NC}"
    echo -e "${YELLOW}========================================${NC}"
    echo ""
    echo -e "${YELLOW}Some verification tests failed${NC}"
    echo ""
    echo "Possible causes:"
    echo "1. Service is still starting up (wait 5-10 minutes)"
    echo "2. System instruction not loaded from environment variable"
    echo "3. MCP connection issues"
    echo "4. Configuration errors"
    echo ""
    echo "Actions to take:"
    echo "1. Wait 10 minutes for service to fully start"
    echo "2. Check deployment logs:"
    echo "   curl -H \"Authorization: Bearer YOUR_API_KEY\" \\"
    echo "     \"https://space.ai-builders.com/backend/v1/deployments/maya-agent/logs\""
    echo "3. Look for: '✅ Loaded system instructions from environment variable'"
    echo "4. Run this script again: ./run-post-deployment-tests.sh YOUR_API_KEY"
    echo ""
    exit 1
fi

# Cleanup
rm -f /tmp/deployment-test-output.txt
