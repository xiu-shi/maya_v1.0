#!/bin/bash

# Script to update AI_BUILDER_TOKEN in all locations
# Usage: ./update-token.sh YOUR_NEW_TOKEN

set -e

if [ -z "$1" ]; then
    echo "❌ Error: Please provide your new AI_BUILDER_TOKEN"
    echo "Usage: ./update-token.sh YOUR_NEW_TOKEN"
    exit 1
fi

NEW_TOKEN="$1"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Updating AI_BUILDER_TOKEN in all locations...${NC}\n"

# 1. Update .env file
if [ -f ".env" ]; then
    if grep -q "AI_BUILDER_TOKEN=" .env; then
        # Update existing token
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|AI_BUILDER_TOKEN=.*|AI_BUILDER_TOKEN=$NEW_TOKEN|" .env
        else
            # Linux
            sed -i "s|AI_BUILDER_TOKEN=.*|AI_BUILDER_TOKEN=$NEW_TOKEN|" .env
        fi
        echo -e "${GREEN}✅ Updated .env file${NC}"
    else
        # Add new token
        echo "AI_BUILDER_TOKEN=$NEW_TOKEN" >> .env
        echo -e "${GREEN}✅ Added token to .env file${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  .env file not found, creating it...${NC}"
    echo "AI_BUILDER_TOKEN=$NEW_TOKEN" > .env
    echo -e "${GREEN}✅ Created .env file with token${NC}"
fi

# Note: MCP configuration removed - Maya now uses direct API calls
# Token is only stored in .env file (above)

echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Token update complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Restart the server: ./stop.sh && ./start.sh"
echo -e "2. Test the chat functionality"
