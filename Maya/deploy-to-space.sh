#!/bin/bash

# Maya Space Deployment Script
# Deploys Maya to AI Builder Space using the deployment API
# Service Name: maya_agent

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Maya Space Deployment${NC}"
echo -e "${BLUE}========================${NC}"
echo ""

# Configuration
REPO_URL="https://github.com/xiu-shi/maya_v1.0"
SERVICE_NAME="maya-agent"
BRANCH="main"
PORT=3000
API_ENDPOINT="https://space.ai-builders.com/backend/v1/deployments"

# Check if API key is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: API Key required${NC}"
    echo ""
    echo "Usage: $0 <your_api_key>"
    echo ""
    echo "To get your API key:"
    echo "1. Go to https://space.ai-builders.com"
    echo "2. Navigate to Settings → API Keys"
    echo "3. Create a new API key"
    echo "4. Copy the key (starts with 'sk_live_')"
    echo ""
    echo "Example:"
    echo "  $0 sk_live_your_api_key_here"
    echo ""
    exit 1
fi

API_KEY="$1"

# Validate API key format
if [[ ! "$API_KEY" =~ ^sk_live_ ]]; then
    echo -e "${YELLOW}⚠️  Warning: API key should start with 'sk_live_'${NC}"
    echo ""
fi

echo -e "${YELLOW}📋 Deployment Configuration:${NC}"
echo "  Repository: $REPO_URL"
echo "  Service Name: $SERVICE_NAME"
echo "  Branch: $BRANCH"
echo "  Port: $PORT"
echo "  API Endpoint: $API_ENDPOINT"
echo ""

# Confirm deployment
read -p "Deploy Maya to AI Builder Space? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🔄 Deploying...${NC}"
echo ""

# Deploy using curl
RESPONSE=$(curl -X POST "$API_ENDPOINT" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
  \"repo_url\": \"$REPO_URL\",
  \"service_name\": \"$SERVICE_NAME\",
  \"branch\": \"$BRANCH\",
  \"port\": $PORT
}" \
  -w "\n%{http_code}" \
  -s)

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
# Extract response body (all but last line)
RESPONSE_BODY=$(echo "$RESPONSE" | sed '$d')

# Check response
if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✅ Deployment queued successfully!${NC}"
    echo ""
    echo -e "${GREEN}Response:${NC}"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    echo ""
    echo -e "${BLUE}📊 Monitor your deployment:${NC}"
    echo "  https://space.ai-builders.com/deployments"
    echo ""
    echo -e "${BLUE}📝 Note:${NC}"
    echo "  - Deployment may take a few minutes to complete"
    echo "  - After first successful deployment, git pushes will auto-deploy"
    echo "  - Free hosting for 12 months from first deployment"
    echo ""
else
    echo -e "${RED}❌ Deployment failed (HTTP $HTTP_CODE)${NC}"
    echo ""
    echo -e "${RED}Response:${NC}"
    echo "$RESPONSE_BODY" | jq '.' 2>/dev/null || echo "$RESPONSE_BODY"
    echo ""
    echo -e "${YELLOW}Troubleshooting:${NC}"
    echo "  1. Verify your API key is correct"
    echo "  2. Check that the repository is accessible"
    echo "  3. Ensure you have deployment permissions"
    echo ""
    exit 1
fi
