#!/bin/bash

# Knowledge Stack ID Fixer Script
# This script fixes mismatched knowledge stack IDs

echo "=== Knowledge Stack ID Fix ==="

# Check current stack IDs in the data file
echo "Current stack IDs in .narada-stacks.json:"
if [ -f ".narada-stacks.json" ]; then
    cat .narada-stacks.json | jq '.stacks[].id' 2>/dev/null || echo "Error reading JSON"
else
    echo "No .narada-stacks.json file found"
fi

echo ""
echo "Making API call to check live stack IDs:"
curl -s http://localhost:3000/api/knowledge-stacks | jq '.[].id' 2>/dev/null || echo "Could not fetch from API"

echo ""
echo "The fix involves ensuring the frontend uses the correct, current stack IDs."
echo "Please refresh your browser and re-select the knowledge stack from the dropdown."
