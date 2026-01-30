#!/bin/bash

# AWS S3 Setup Script for Maya Chat Logs
# This script creates the S3 bucket, IAM roles, and policies for Maya's chat log storage
#
# Prerequisites:
# - AWS CLI installed and configured (aws configure)
# - Appropriate AWS permissions to create S3 buckets and IAM roles
# - jq installed (for JSON parsing)

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BUCKET_NAME="maya-ai-builder-prod-logs"
REGION="eu-west-1"  # Ireland
ADMIN_ROLE_NAME="MayaS3AdminRole"
VIEWER_ROLE_NAME="MayaS3ViewerRole"
ADMIN_POLICY_NAME="MayaS3AdminPolicy"
VIEWER_POLICY_NAME="MayaS3ViewerPolicy"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Maya AWS S3 Setup${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Bucket Name: ${BUCKET_NAME}"
echo "Region: ${REGION}"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    echo "   Install: https://aws.amazon.com/cli/"
    exit 1
fi

# Check AWS credentials
echo -e "${YELLOW}Checking AWS credentials...${NC}"
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS credentials not configured.${NC}"
    echo "   Run: aws configure"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✅ AWS credentials configured${NC}"
echo "   Account ID: ${ACCOUNT_ID}"
echo ""

# Step 1: Create S3 Bucket
echo -e "${YELLOW}Step 1: Creating S3 bucket...${NC}"
if aws s3api head-bucket --bucket "${BUCKET_NAME}" --region "${REGION}" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Bucket ${BUCKET_NAME} already exists${NC}"
else
    if [ "${REGION}" = "us-east-1" ]; then
        # us-east-1 doesn't need LocationConstraint
        aws s3api create-bucket \
            --bucket "${BUCKET_NAME}" \
            --region "${REGION}"
    else
        aws s3api create-bucket \
            --bucket "${BUCKET_NAME}" \
            --region "${REGION}" \
            --create-bucket-configuration LocationConstraint="${REGION}"
    fi
    echo -e "${GREEN}✅ Bucket created: ${BUCKET_NAME}${NC}"
fi

# Step 2: Enable Block Public Access
echo -e "${YELLOW}Step 2: Configuring bucket security...${NC}"
aws s3api put-public-access-block \
    --bucket "${BUCKET_NAME}" \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
echo -e "${GREEN}✅ Block public access enabled${NC}"

# Step 3: Enable SSE-S3 Encryption
echo -e "${YELLOW}Step 3: Enabling encryption...${NC}"
aws s3api put-bucket-encryption \
    --bucket "${BUCKET_NAME}" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }'
echo -e "${GREEN}✅ SSE-S3 encryption enabled${NC}"

# Step 4: Apply Bucket Policy
echo -e "${YELLOW}Step 4: Applying bucket policy...${NC}"
BUCKET_POLICY=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "EnforceHTTPS",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::${BUCKET_NAME}",
                "arn:aws:s3:::${BUCKET_NAME}/*"
            ],
            "Condition": {
                "Bool": {
                    "aws:SecureTransport": "false"
                }
            }
        },
        {
            "Sid": "EnforceSSE",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::${BUCKET_NAME}/*",
            "Condition": {
                "StringNotEquals": {
                    "s3:x-amz-server-side-encryption": "AES256"
                }
            }
        }
    ]
}
EOF
)

echo "${BUCKET_POLICY}" > /tmp/bucket-policy.json
aws s3api put-bucket-policy --bucket "${BUCKET_NAME}" --policy file:///tmp/bucket-policy.json
rm /tmp/bucket-policy.json
echo -e "${GREEN}✅ Bucket policy applied${NC}"

# Step 5: Create IAM Policies
echo -e "${YELLOW}Step 5: Creating IAM policies...${NC}"

# Admin Policy (CRUD)
ADMIN_POLICY=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::${BUCKET_NAME}",
                "arn:aws:s3:::${BUCKET_NAME}/*"
            ]
        }
    ]
}
EOF
)

# Viewer Policy (Get only)
VIEWER_POLICY=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::${BUCKET_NAME}",
                "arn:aws:s3:::${BUCKET_NAME}/*"
            ]
        }
    ]
}
EOF
)

# Create Admin Policy
if aws iam get-policy --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${ADMIN_POLICY_NAME}" &>/dev/null; then
    echo -e "${YELLOW}⚠️  Policy ${ADMIN_POLICY_NAME} already exists${NC}"
else
    echo "${ADMIN_POLICY}" > /tmp/admin-policy.json
    aws iam create-policy \
        --policy-name "${ADMIN_POLICY_NAME}" \
        --policy-document file:///tmp/admin-policy.json \
        --description "Admin access to Maya S3 chat logs bucket"
    rm /tmp/admin-policy.json
    echo -e "${GREEN}✅ Admin policy created${NC}"
fi

# Create Viewer Policy
if aws iam get-policy --policy-arn "arn:aws:iam::${ACCOUNT_ID}:policy/${VIEWER_POLICY_NAME}" &>/dev/null; then
    echo -e "${YELLOW}⚠️  Policy ${VIEWER_POLICY_NAME} already exists${NC}"
else
    echo "${VIEWER_POLICY}" > /tmp/viewer-policy.json
    aws iam create-policy \
        --policy-name "${VIEWER_POLICY_NAME}" \
        --policy-document file:///tmp/viewer-policy.json \
        --description "Viewer access to Maya S3 chat logs bucket"
    rm /tmp/viewer-policy.json
    echo -e "${GREEN}✅ Viewer policy created${NC}"
fi

# Step 6: Create IAM Roles (if needed)
echo -e "${YELLOW}Step 6: Creating IAM roles...${NC}"

# Admin Role Trust Policy
ADMIN_TRUST_POLICY=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF
)

# Viewer Role Trust Policy
VIEWER_TRUST_POLICY=$(cat <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
EOF
)

ADMIN_POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${ADMIN_POLICY_NAME}"
VIEWER_POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${VIEWER_POLICY_NAME}"

# Create Admin Role
if aws iam get-role --role-name "${ADMIN_ROLE_NAME}" &>/dev/null; then
    echo -e "${YELLOW}⚠️  Role ${ADMIN_ROLE_NAME} already exists${NC}"
else
    echo "${ADMIN_TRUST_POLICY}" > /tmp/admin-trust.json
    aws iam create-role \
        --role-name "${ADMIN_ROLE_NAME}" \
        --assume-role-policy-document file:///tmp/admin-trust.json \
        --description "Admin role for Maya S3 chat logs"
    rm /tmp/admin-trust.json
    
    aws iam attach-role-policy \
        --role-name "${ADMIN_ROLE_NAME}" \
        --policy-arn "${ADMIN_POLICY_ARN}"
    echo -e "${GREEN}✅ Admin role created and policy attached${NC}"
fi

# Create Viewer Role
if aws iam get-role --role-name "${VIEWER_ROLE_NAME}" &>/dev/null; then
    echo -e "${YELLOW}⚠️  Role ${VIEWER_ROLE_NAME} already exists${NC}"
else
    echo "${VIEWER_TRUST_POLICY}" > /tmp/viewer-trust.json
    aws iam create-role \
        --role-name "${VIEWER_ROLE_NAME}" \
        --assume-role-policy-document file:///tmp/viewer-trust.json \
        --description "Viewer role for Maya S3 chat logs"
    rm /tmp/viewer-trust.json
    
    aws iam attach-role-policy \
        --role-name "${VIEWER_ROLE_NAME}" \
        --policy-arn "${VIEWER_POLICY_ARN}"
    echo -e "${GREEN}✅ Viewer role created and policy attached${NC}"
fi

# Step 7: Verify Setup
echo ""
echo -e "${YELLOW}Step 7: Verifying setup...${NC}"

# Verify bucket exists
if aws s3api head-bucket --bucket "${BUCKET_NAME}" --region "${REGION}" &>/dev/null; then
    echo -e "${GREEN}✅ Bucket exists: ${BUCKET_NAME}${NC}"
else
    echo -e "${RED}❌ Bucket verification failed${NC}"
    exit 1
fi

# Verify encryption
ENCRYPTION=$(aws s3api get-bucket-encryption --bucket "${BUCKET_NAME}" --query 'ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm' --output text 2>/dev/null || echo "None")
if [ "${ENCRYPTION}" = "AES256" ]; then
    echo -e "${GREEN}✅ Encryption enabled: ${ENCRYPTION}${NC}"
else
    echo -e "${YELLOW}⚠️  Encryption status: ${ENCRYPTION}${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Bucket: ${BUCKET_NAME}"
echo "Region: ${REGION}"
echo ""
echo "IAM Policies:"
echo "  - ${ADMIN_POLICY_NAME} (ARN: ${ADMIN_POLICY_ARN})"
echo "  - ${VIEWER_POLICY_NAME} (ARN: ${VIEWER_POLICY_ARN})"
echo ""
echo "IAM Roles:"
echo "  - ${ADMIN_ROLE_NAME}"
echo "  - ${VIEWER_ROLE_NAME}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure environment variables in your deployment:"
echo "   ENABLE_S3_LOGGING=true"
echo "   AWS_S3_BUCKET=${BUCKET_NAME}"
echo "   AWS_REGION=${REGION}"
echo ""
echo "2. Attach IAM role to your EC2/ECS instance (if using IAM roles)"
echo "   OR set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY env vars"
echo ""
echo "3. Test S3 connection from your application"
echo ""
