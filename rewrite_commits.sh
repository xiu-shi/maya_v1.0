#!/bin/bash
# Script to rewrite commit messages that leak IP

# Commit hashes and their new messages
declare -A COMMITS=(
  ["cdbee2adcc5f9dbd9524050ef9c25ea1c54dde6e"]="security: remove test files from GitHub"
  ["1fb8b27b213cd69891e853ab0c4922dd1e683ad5"]="docs: update README - focus on product function"
  ["413ec190e435203e0b9d1078200686132ae8892a"]="docs: update SECURITY.md"
  ["a9d0b3f5244524bd54eb4f237a626e739d205005"]="feat: add testing and validation"
  ["620a4c3b06e80c58f3f5b83939e5cc1ba6d934ba"]="Add Dockerfile to repository root"
)

# Find the oldest commit to rebase from
OLDEST_COMMIT="620a4c3b06e80c58f3f5b83939e5cc1ba6d934ba"

# Count commits to rebase
COMMIT_COUNT=$(git rev-list --count ${OLDEST_COMMIT}..HEAD)
echo "Will rebase ${COMMIT_COUNT} commits"

# Create rebase script
cat > /tmp/rebase_script.sh << 'REBASE_EOF'
#!/bin/bash
COMMIT_MSG=$(cat "$1")
COMMIT_HASH=$(git rev-parse HEAD)

# Rewrite messages
case "$COMMIT_HASH" in
  cdbee2adcc5f9dbd9524050ef9c25ea1c54dde6e)
    echo "security: remove test files from GitHub"
    echo ""
    echo "- Remove test files from GitHub tracking"
    echo "- Update .gitignore to prevent future commits"
    ;;
  1fb8b27b213cd69891e853ab0c4922dd1e683ad5)
    echo "docs: update README - focus on product function"
    ;;
  413ec190e435203e0b9d1078200686132ae8892a)
    echo "docs: update SECURITY.md"
    ;;
  *)
    echo "$COMMIT_MSG"
    ;;
esac
REBASE_EOF

chmod +x /tmp/rebase_script.sh

echo "Rebase script created. Use: GIT_SEQUENCE_EDITOR='sed -i \"\" \"s/^pick cdbee2a/reword cdbee2a/; s/^pick 1fb8b27/reword 1fb8b27/; s/^pick 413ec19/reword 413ec19/\"; GIT_EDITOR=\"/tmp/rebase_script.sh\" git rebase -i ${OLDEST_COMMIT}~1"
