#!/bin/bash
# Pre-Deployment Test Script
# Runs all tests and checks before deployment approval
# Usage: ./pre-deployment-test.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/../backend"
TESTS_DIR="$SCRIPT_DIR/../tests"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Maya Pre-Deployment Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "$BACKEND_DIR/package.json" ]; then
  echo -e "${RED}❌ Error: Backend directory not found${NC}"
  echo "Expected: $BACKEND_DIR"
  exit 1
fi

cd "$BACKEND_DIR"

# Check Node.js version
echo -e "${BLUE}📋 Checking prerequisites...${NC}"
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}⚠️  node_modules not found, installing dependencies...${NC}"
  npm install
fi

echo ""
echo -e "${BLUE}🧪 Running test suite...${NC}"
echo ""

# Run all tests
echo -e "${BLUE}1️⃣  Running all tests...${NC}"
if npm test; then
  echo -e "${GREEN}✅ All tests passed!${NC}"
else
  echo -e "${RED}❌ Tests failed!${NC}"
  echo -e "${RED}Please fix failing tests before deploying.${NC}"
  exit 1
fi

echo ""

# Run security tests specifically
echo -e "${BLUE}2️⃣  Running security tests...${NC}"
if npm run test:security; then
  echo -e "${GREEN}✅ Security tests passed!${NC}"
else
  echo -e "${RED}❌ Security tests failed!${NC}"
  echo -e "${RED}Please fix security issues before deploying.${NC}"
  exit 1
fi

echo ""

# Run integration tests (skip E2E tests that require server)
echo -e "${BLUE}3️⃣  Running integration tests...${NC}"
if npm test -- tests/integration_tests --testPathIgnorePatterns="frontend-chat-e2e-flow.test.js"; then
  echo -e "${GREEN}✅ Integration tests passed!${NC}"
else
  echo -e "${RED}❌ Integration tests failed!${NC}"
  echo -e "${RED}Please fix integration issues before deploying.${NC}"
  exit 1
fi

# Run event listener tests specifically
echo -e "${BLUE}4️⃣  Running event listener tests...${NC}"
if npm test -- tests/integration_tests/frontend-chat-event-listeners.test.js; then
  echo -e "${GREEN}✅ Event listener tests passed!${NC}"
else
  echo -e "${RED}❌ Event listener tests failed!${NC}"
  echo -e "${RED}Please fix event listener issues before deploying.${NC}"
  exit 1
fi

echo ""

# Check for console.log statements in production code (optional check)
echo -e "${BLUE}5️⃣  Checking for debug statements...${NC}"
DEBUG_COUNT=$(grep -r "console\.log" "$SCRIPT_DIR/../frontend/maya.html" 2>/dev/null | wc -l | tr -d ' ')
if [ "$DEBUG_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Found $DEBUG_COUNT console.log statements in maya.html${NC}"
  echo -e "${YELLOW}   (This is OK for debugging, but consider removing in production)${NC}"
else
  echo -e "${GREEN}✅ No console.log statements found${NC}"
fi

echo ""

# Final summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ All pre-deployment checks passed!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}🚀 You are cleared for deployment!${NC}"
echo ""
echo "Next steps:"
echo "  1. Review changes: git log --oneline -10"
echo "  2. Push to GitHub: git push origin main"
echo "  3. Wait for auto-deployment (2-5 minutes)"
echo "  4. Test in production: https://maya-agent.ai-builders.space/maya.html"
echo ""

exit 0
