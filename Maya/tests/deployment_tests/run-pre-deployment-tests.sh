#!/bin/bash

# Pre-Deployment Test Runner
# 
# CRITICAL: Run this script BEFORE deploying to ensure all checks pass
# 
# Usage: ./run-pre-deployment-tests.sh
#
# Exit codes:
#   0 - All tests passed, safe to deploy
#   1 - Some tests failed, DO NOT deploy

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Pre-Deployment Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "CRITICAL: These tests MUST pass before deployment"
echo ""

# Track test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test suite
run_test_suite() {
    local test_file=$1
    local test_name=$2
    
    echo -e "${YELLOW}Running: $test_name${NC}"
    echo "----------------------------------------"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    # Run the test
    if npm test -- "$test_file" --silent 2>&1 | grep -q "Tests.*passed"; then
        echo -e "${GREEN}✓ $test_name: PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        echo ""
        return 0
    else
        echo -e "${RED}✗ $test_name: FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo ""
        return 1
    fi
}

# Change to backend directory
cd "$(dirname "$0")/../../backend" || exit 1

echo "Test Directory: $(pwd)"
echo ""

# Run all pre-deployment test suites
echo -e "${BLUE}1. System Prompt Validation${NC}"
run_test_suite "../tests/deployment_tests/pre-deployment-checks.test.js" \
               "Pre-Deployment Checks"

echo -e "${BLUE}2. System Instruction Loading${NC}"
run_test_suite "../tests/deployment_tests/system-instruction-loading.test.js" \
               "System Instruction Loading"

echo -e "${BLUE}3. Deployment API Validation${NC}"
run_test_suite "../tests/deployment_tests/deployment-api.test.js" \
               "Deployment API"

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Results Summary${NC}"
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

# Determine deployment readiness
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ ALL TESTS PASSED${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${GREEN}Deployment is SAFE to proceed${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Commit your changes: git add . && git commit -m \"Ready for deployment\""
    echo "2. Push to GitHub: git push origin main"
    echo "3. Deploy via API: ./DEPLOY_WITH_ENV_VAR.sh YOUR_API_KEY"
    echo ""
    exit 0
else
    echo -e "${RED}========================================${NC}"
    echo -e "${RED}✗ DEPLOYMENT BLOCKED${NC}"
    echo -e "${RED}========================================${NC}"
    echo ""
    echo -e "${RED}$FAILED_TESTS test suite(s) failed${NC}"
    echo ""
    echo "⚠️  DO NOT DEPLOY until all tests pass"
    echo ""
    echo "Actions required:"
    echo "1. Review test failures above"
    echo "2. Fix all failing tests"
    echo "3. Run this script again: ./run-pre-deployment-tests.sh"
    echo "4. Only deploy after all tests pass"
    echo ""
    exit 1
fi
