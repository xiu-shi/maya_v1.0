#!/bin/bash

# AWS S3 Verification Script for Maya Chat Logs
# Verifies that S3 bucket and IAM configuration are correct

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BUCKET_NAME="maya-ai-builder-prod-logs"
REGION="eu-west-1"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Maya AWS S3 Verification${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found${NC}"
    exit 1
fi

# Check credentials
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Account ID: ${ACCOUNT_ID}"
echo ""

# Verify Bucket
echo -e "${YELLOW}Verifying bucket...${NC}"
if aws s3api head-bucket --bucket "${BUCKET_NAME}" --region "${REGION}" 2>/dev/null; then
    echo -e "${GREEN}✅ Bucket exists: ${BUCKET_NAME}${NC}"
else
    echo -e "${RED}❌ Bucket not found: ${BUCKET_NAME}${NC}"
    exit 1
fi

# Verify Encryption
echo -e "${YELLOW}Verifying encryption...${NC}"
ENCRYPTION=$(aws s3api get-bucket-encryption --bucket "${BUCKET_NAME}" --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' --output text 2>/dev/null || echo "None")
if [ "${ENCRYPTION}" = "AES256" ]; then
    echo -e "${GREEN}✅ Encryption: ${ENCRYPTION}${NC}"
else
    echo -e "${YELLOW}⚠️  Encryption: ${ENCRYPTION}${NC}"
fi

# Verify Public Access Block
echo -e "${YELLOW}Verifying public access block...${NC}"
PUBLIC_BLOCK=$(aws s3api get-public-access-block --bucket "${BUCKET_NAME}" --query 'PublicAccessBlockConfiguration' --output json 2>/dev/null || echo "{}")
if echo "${PUBLIC_BLOCK}" | grep -q "true"; then
    echo -e "${GREEN}✅ Public access blocked${NC}"
else
    echo -e "${YELLOW}⚠️  Public access block status unclear${NC}"
fi

# Test Write Access
echo -e "${YELLOW}Testing write access...${NC}"
TEST_KEY="test-$(date +%s).txt"
TEST_CONTENT="Maya S3 test - $(date)"

if aws s3api put-object \
    --bucket "${BUCKET_NAME}" \
    --key "${TEST_KEY}" \
    --body <(echo "${TEST_CONTENT}") \
    --server-side-encryption AES256 \
    --region "${REGION}" &>/dev/null; then
    echo -e "${GREEN}✅ Write access working${NC}"
    
    # Clean up test file
    aws s3api delete-object --bucket "${BUCKET_NAME}" --key "${TEST_KEY}" &>/dev/null
else
    echo -e "${RED}❌ Write access failed${NC}"
    exit 1
fi

# Test Read Access
echo -e "${YELLOW}Testing read access...${NC}"
TEST_KEY="test-read-$(date +%s).txt"
echo "${TEST_CONTENT}" | aws s3api put-object \
    --bucket "${BUCKET_NAME}" \
    --key "${TEST_KEY}" \
    --server-side-encryption AES256 \
    --region "${REGION}" &>/dev/null

if aws s3api get-object \
    --bucket "${BUCKET_NAME}" \
    --key "${TEST_KEY}" \
    /tmp/test-read.txt \
    --region "${REGION}" &>/dev/null; then
    echo -e "${GREEN}✅ Read access working${NC}"
    rm -f /tmp/test-read.txt
    aws s3api delete-object --bucket "${BUCKET_NAME}" --key "${TEST_KEY}" &>/dev/null
else
    echo -e "${RED}❌ Read access failed${NC}"
    exit 1
fi

# Verify Bucket Policy
echo -e "${YELLOW}Verifying bucket policy...${NC}"
POLICY=$(aws s3api get-bucket-policy --bucket "${BUCKET_NAME}" --query Policy --output text 2>/dev/null || echo "{}")
if echo "${POLICY}" | grep -q "aws:SecureTransport"; then
    echo -e "${GREEN}✅ Bucket policy configured${NC}"
else
    echo -e "${YELLOW}⚠️  Bucket policy may be missing${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Verification Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Bucket: ${BUCKET_NAME}"
echo "Region: ${REGION}"
echo "Status: ✅ Ready for use"
echo ""
