#!/bin/bash

# Quick Deployment Script for Maya
# Deploys with the current API key and verifies

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Maya Quick Deploy${NC}"
echo ""

# Deploy
cd Maya
./deploy-to-space.sh sk_9a342713_136e696672a6d8ae4701a0edcc8babbaefdc

# Wait for deployment
echo ""
echo -e "${YELLOW}⏳ Waiting 30 seconds for deployment to complete...${NC}"
sleep 30

# Verify
echo ""
echo -e "${BLUE}🔍 Verifying deployment...${NC}"
echo ""

echo -e "${YELLOW}1. Checking health endpoint...${NC}"
HEALTH=$(curl -s https://maya-agent.ai-builders.space/health)
echo "$HEALTH" | grep -q '"mcpConnected":true' && \
  echo -e "${GREEN}✅ MCP Connected${NC}" || \
  echo -e "${RED}❌ MCP Not Connected${NC}"

echo ""
echo -e "${YELLOW}2. Testing chat endpoint...${NC}"
CHAT=$(curl -s -X POST https://maya-agent.ai-builders.space/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "history": []}')

echo "$CHAT" | grep -q '"response"' && \
  echo -e "${GREEN}✅ Chat working${NC}" || \
  echo -e "${RED}❌ Chat not working${NC}"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "🌐 Live Site: https://maya-agent.ai-builders.space/maya.html"
echo ""
