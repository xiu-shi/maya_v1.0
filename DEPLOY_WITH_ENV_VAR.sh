#!/bin/bash

# Maya Deployment Script with Environment Variable
# Based on AI Builders Space OpenAPI spec: POST /v1/deployments with env_vars parameter

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Maya Deployment with System Instructions${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if API key is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: API key required${NC}"
    echo ""
    echo "Usage: ./DEPLOY_WITH_ENV_VAR.sh YOUR_API_KEY"
    echo ""
    echo "Get your API key from: https://space.ai-builders.com/settings"
    exit 1
fi

API_KEY="$1"

# Check if system prompt file exists
SYSTEM_PROMPT_FILE="./Maya/backend/system_prompt.txt"
if [ ! -f "$SYSTEM_PROMPT_FILE" ]; then
    echo -e "${RED}Error: System prompt file not found: $SYSTEM_PROMPT_FILE${NC}"
    echo ""
    echo "Expected location: Maya/backend/system_prompt.txt"
    exit 1
fi

echo -e "${GREEN}✓${NC} Found system prompt file"
echo "  Lines: $(wc -l < "$SYSTEM_PROMPT_FILE")"
echo "  Size: $(wc -c < "$SYSTEM_PROMPT_FILE") bytes"
echo ""

# Read system instructions
SYSTEM_INSTRUCTION=$(cat "$SYSTEM_PROMPT_FILE")

# Escape for JSON (properly handle quotes, newlines, etc.)
SYSTEM_INSTRUCTION_ESCAPED=$(echo "$SYSTEM_INSTRUCTION" | jq -Rs .)

echo -e "${GREEN}✓${NC} Loaded and escaped system instructions"
echo ""

# Deployment API endpoint (from OpenAPI spec)
DEPLOYMENT_URL="https://space.ai-builders.com/backend/v1/deployments"

echo -e "${YELLOW}Deploying maya-agent...${NC}"
echo ""
echo "Configuration:"
echo "  Repo: https://github.com/xiu-shi/maya_v1.0"
echo "  Service: maya-agent"
echo "  Branch: main"
echo "  Port: 3000"
echo "  Environment Variables:"
echo "    - SYSTEM_INSTRUCTION (452 lines)"
echo ""

# Deploy with environment variable
echo -e "${YELLOW}Sending deployment request...${NC}"
echo ""

RESPONSE=$(curl -s -X POST "$DEPLOYMENT_URL" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -w "\n%{http_code}" \
  --data @- <<EOF
{
  "repo_url": "https://github.com/xiu-shi/maya_v1.0",
  "service_name": "maya-agent",
  "branch": "main",
  "port": 3000,
  "env_vars": {
    "SYSTEM_INSTRUCTION": $SYSTEM_INSTRUCTION_ESCAPED
  },
  "streaming_log_timeout_seconds": 60
}
EOF
)

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "${BLUE}Response:${NC}"
echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
echo ""

# Check HTTP status code
if [ "$HTTP_CODE" = "202" ]; then
    echo -e "${GREEN}✓ Deployment queued successfully! (HTTP 202 Accepted)${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Wait 5-10 minutes for deployment to complete"
    echo "2. Check status at: https://space.ai-builders.com/"
    echo "3. Or poll status with: curl -H \"Authorization: Bearer YOUR_API_KEY\" https://space.ai-builders.com/backend/v1/deployments/maya-agent"
    echo "4. Look for status: 'HEALTHY' (not 'queued' or 'deploying')"
    echo "5. Check logs for: '✅ Loaded system instructions from environment variable'"
    echo "6. Test Maya at: https://maya-agent.ai-builders.space/"
    echo ""
elif [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Deployment successful! (HTTP 200)${NC}"
    echo ""
    echo "Test Maya at: https://maya-agent.ai-builders.space/"
elif [ "$HTTP_CODE" = "422" ]; then
    echo -e "${RED}✗ Validation error (HTTP 422)${NC}"
    echo ""
    echo "Check the response above for details on what went wrong."
    echo "Common issues:"
    echo "  - Invalid service name format"
    echo "  - Invalid repo URL"
    echo "  - Environment variable too large (max size unknown)"
elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${RED}✗ Authentication failed (HTTP 401)${NC}"
    echo ""
    echo "Your API key may be invalid or expired."
    echo "Get a new key from: https://space.ai-builders.com/settings"
else
    echo -e "${RED}✗ Deployment failed (HTTP $HTTP_CODE)${NC}"
    echo ""
    echo "Response above may contain error details."
fi

echo ""
echo -e "${BLUE}========================================${NC}"
