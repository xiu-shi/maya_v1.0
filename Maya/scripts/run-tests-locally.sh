#!/bin/bash
# Local Test Runner - Quick test script for development
# Usage: ./run-tests-locally.sh [test-pattern]

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/../backend"

cd "$BACKEND_DIR"

# Check if test pattern provided
if [ -n "$1" ]; then
  echo "Running tests matching: $1"
  npm test -- --testNamePattern="$1"
else
  echo "Running all tests..."
  npm test
fi
