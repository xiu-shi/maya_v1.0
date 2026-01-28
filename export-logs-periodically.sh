#!/bin/bash
# Periodic Log Export Script
# Exports production chat logs before they're lost on container restart
# Run this via cron every hour or before deployments

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Configuration
EXPORT_DIR="./log-exports"
DAYS_TO_FETCH=7
KEEP_EXPORTS_DAYS=30

# Create export directory
mkdir -p "$EXPORT_DIR"

# Generate filename with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
EXPORT_FILE="$EXPORT_DIR/production-logs-${TIMESTAMP}.json"

echo "📥 Exporting production chat logs..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Export File: $EXPORT_FILE"
echo "Date Range: Last $DAYS_TO_FETCH days"
echo ""

# Fetch logs
node fetch-production-logs.js "$DAYS_TO_FETCH" "$EXPORT_FILE"

if [ -f "$EXPORT_FILE" ]; then
  # Get log count
  LOG_COUNT=$(node -e "const data = require('./$EXPORT_FILE'); console.log(data.summary?.totalLogs || 0);" 2>/dev/null || echo "0")
  
  echo ""
  echo "✅ Export successful!"
  echo "   Logs exported: $LOG_COUNT"
  echo "   File: $EXPORT_FILE"
  echo ""
  
  # Clean up old exports (keep last 30 days)
  echo "🧹 Cleaning up old exports (keeping last $KEEP_EXPORTS_DAYS days)..."
  find "$EXPORT_DIR" -name "production-logs-*.json" -mtime +$KEEP_EXPORTS_DAYS -delete
  echo "✅ Cleanup complete"
  
  # Show recent exports
  echo ""
  echo "📁 Recent exports:"
  ls -lh "$EXPORT_DIR"/production-logs-*.json 2>/dev/null | tail -5 | awk '{print "   " $9 " (" $5 ")"}'
else
  echo "❌ Export failed - file not created"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Log export complete!"
echo ""
echo "💡 To analyze exports:"
echo "   node analyze-logs.js $EXPORT_FILE"
echo ""
