#!/bin/bash

# Run Maya Locally
# Quick script to start Maya backend and open chat interface

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 Starting Maya Locally${NC}"
echo -e "${BLUE}========================${NC}"
echo ""

# Navigate to backend directory
cd Maya/backend

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please ensure Maya/backend/.env exists with your API_BUILDER_TOKEN"
    exit 1
fi

# Start the server
echo -e "${YELLOW}🔄 Starting Maya backend server...${NC}"
./start.sh

echo ""
echo -e "${GREEN}✅ Maya is running locally!${NC}"
echo ""
echo -e "${BLUE}📋 Access Maya:${NC}"
echo -e "  ${GREEN}Chat Interface:${NC} http://localhost:3000/maya.html"
echo -e "  ${GREEN}Health Check:${NC}   http://localhost:3000/health"
echo -e "  ${GREEN}Chat API:${NC}       http://localhost:3000/api/chat"
echo ""
echo -e "${YELLOW}🛑 To stop Maya:${NC}"
echo -e "  cd Maya/backend && ./stop.sh"
echo ""
