#!/bin/bash
# Test Maya Backend Connection
# Usage: ./test-connection.sh

echo "🧪 Testing Maya Backend Connection"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Check if server is running
echo "1️⃣  Checking if server is running..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running${NC}"
    
    # Get health response
    echo ""
    echo "📋 Health check response:"
    curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/health
    echo ""
else
    echo -e "${RED}❌ Server is NOT running${NC}"
    echo ""
    echo "💡 Start the server with:"
    echo "   cd Maya/backend"
    echo "   npm start"
    echo ""
    exit 1
fi

# Test 2: Test chat endpoint
echo "2️⃣  Testing chat endpoint..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, this is a test",
    "history": []
  }')

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Chat endpoint is accessible${NC}"
    echo ""
    echo "📋 Response preview:"
    echo "$TEST_RESPONSE" | python3 -m json.tool 2>/dev/null | head -10 || echo "$TEST_RESPONSE" | head -5
    echo ""
    
    # Check for errors
    if echo "$TEST_RESPONSE" | grep -q "error"; then
        echo -e "${YELLOW}⚠️  Response contains an error${NC}"
        echo "$TEST_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TEST_RESPONSE"
    else
        echo -e "${GREEN}✅ Chat endpoint working correctly${NC}"
    fi
else
    echo -e "${RED}❌ Chat endpoint test failed${NC}"
    echo ""
    echo "💡 Check server logs for errors"
fi

echo ""
echo "===================================="
echo "✅ Testing complete!"
echo ""
echo "💡 Next steps:"
echo "   - Open Maya/frontend/maya.html in browser"
echo "   - Try sending a message"
echo ""



