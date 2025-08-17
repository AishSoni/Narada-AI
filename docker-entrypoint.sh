#!/bin/bash

# Docker startup script for Narada AI
# This script runs before starting the application to ensure everything is ready

set -e

echo "🚀 Starting Narada AI..."

# Check if we're in a Docker environment
if [ -f /.dockerenv ]; then
    echo "📦 Running in Docker container"
else
    echo "⚠️  Not running in Docker container"
fi

# Wait for Qdrant to be ready if we're using it
if [ "$VECTOR_DB_PROVIDER" = "qdrant" ] && [ -n "$QDRANT_URL" ]; then
    echo "🔍 Waiting for Qdrant to be ready..."
    
    # Extract host and port from QDRANT_URL
    QDRANT_HOST=$(echo $QDRANT_URL | sed -e 's|http://||' -e 's|https://||' | cut -d: -f1)
    QDRANT_PORT=$(echo $QDRANT_URL | sed -e 's|http://||' -e 's|https://||' | cut -d: -f2 | cut -d/ -f1)
    
    # Default port if not specified
    if [ "$QDRANT_PORT" = "$QDRANT_HOST" ]; then
        QDRANT_PORT=6333
    fi
    
    # Wait for Qdrant to be accessible
    timeout=60
    while [ $timeout -gt 0 ]; do
        if nc -z $QDRANT_HOST $QDRANT_PORT; then
            echo "✅ Qdrant is ready at $QDRANT_HOST:$QDRANT_PORT"
            break
        fi
        echo "⏳ Waiting for Qdrant... ($timeout seconds remaining)"
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        echo "❌ Timeout waiting for Qdrant to be ready"
        exit 1
    fi
fi

# Check essential environment variables
echo "🔧 Checking environment configuration..."

missing_vars=()

# Check for at least one LLM provider
if [ -z "$OPENAI_API_KEY" ] && [ -z "$OPENROUTER_API_KEY" ] && [ -z "$COHERE_API_KEY" ] && [ -z "$OLLAMA_API_URL" ]; then
    missing_vars+=("At least one LLM provider (OPENAI_API_KEY, OPENROUTER_API_KEY, COHERE_API_KEY, or OLLAMA_API_URL)")
fi

# Check for at least one search provider
if [ -z "$TAVILY_API_KEY" ] && [ -z "$SERP_API_KEY" ] && [ -z "$FIRECRAWL_API_KEY" ]; then
    missing_vars+=("At least one search provider (TAVILY_API_KEY, SERP_API_KEY, or FIRECRAWL_API_KEY)")
fi

if [ ${#missing_vars[@]} -gt 0 ]; then
    echo "⚠️  Warning: Missing some recommended environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo "   The application may have limited functionality."
else
    echo "✅ Essential environment variables are configured"
fi

echo "🌟 Starting Narada AI application..."

# Execute the main command
exec "$@"
