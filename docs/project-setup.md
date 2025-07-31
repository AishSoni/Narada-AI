# Narada AI - Deep Research Agent: Project Setup Guide

This document provides instructions for setting up the "Narada AI - Deep Research Agent" project for local development.

## 1. Prerequisites

*   Node.js (v18 or later)
*   npm, yarn, or pnpm
*   Docker and Docker Compose (for running Qdrant)
*   Access to an Ollama instance (local or remote)

## 2. Initial Project Scaffolding

We will use the standard `create-next-app` command to initialize our project.

```bash
npx create-next-app@latest narada-ai --typescript --tailwind --eslint
```

This will create a new Next.js project with TypeScript, Tailwind CSS, and ESLint configured.

## 3. Directory Structure

After initialization, we will organize the code into the following structure:

```
/
|-- app/
|   |-- api/
|   |   |-- chat/route.ts
|   |   |-- knowledge-bases/
|   |   |   |-- route.ts
|   |   |   |-- [id]/route.ts
|   |   |-- settings/route.ts
|   |-- (main)/
|   |   |-- layout.tsx
|   |   |-- page.tsx
|   |-- settings/page.tsx # All relevent settings and API provider selections
|   |-- knowledge-base/
|   |   |-- page.tsx
|-- components/
|   |-- chat/
|   |-- common/
|   |-- layout/
|   |-- knowledge-base/
|-- lib/
|   |-- agent/       # Core agent logic
|   |-- qdrant.ts    # Qdrant client and functions
|   |-- ollama.ts    # Ollama client and functions
|   |-- tavily.ts    # Tavily client
|-- docs/            # All planning documents
|-- public/
|-- .env.local       # Environment variables
|-- docker-compose.yml # For Qdrant service
|-- next.config.mjs
|-- package.json
|-- tsconfig.json
```

## 4. Key Dependencies

We will need to install the following key libraries:

*   `@qdrant/js-client`: The official JavaScript client for Qdrant.
*   `ollama`: The official JavaScript client for Ollama.
*   `ai`: The Vercel AI SDK for easily handling streaming UI updates.
*   `langchain` or `llamaindex`: For document loading and text splitting.
*   `zod`: For validating API request bodies and environment variables.

## 5. Environment Configuration

We will use a `.env.local` file to manage secrets and configuration.

```ini
# .env.local

# Tavily API Key
TAVILY_API_KEY=

# Ollama Configuration
OLLAMA_API_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_LLM=llama3

# Qdrant Configuration
QDRANT_API_URL=http://localhost:6333

```

## 6. Containerization Setup (Docker)

To make the project easy to run and portable, we will use Docker to containerize both the Next.js application and the Qdrant database.

### a. Application Dockerfile

A `Dockerfile` will be created in the root of the project to define the application image.

```Dockerfile
# Dockerfile for Narada AI - Deep Research Agent

# 1. Install dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi

# 2. Build the application
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3. Run the application
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "start"]
```

### b. Docker Compose

The `docker-compose.yml` file will orchestrate both services. The application will be built from the `Dockerfile`, and the Qdrant instance will be pulled from Docker Hub.

```yaml
# docker-compose.yml
version: '3.8'
services:
  narada-ai:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - TAVILY_API_KEY=${TAVILY_API_KEY}
      - OLLAMA_API_URL=${OLLAMA_API_URL}
      - OLLAMA_EMBEDDING_MODEL=${OLLAMA_EMBEDDING_MODEL}
      - OLLAMA_LLM=${OLLAMA_LLM}
      - QDRANT_API_URL=http://qdrant:6333
    depends_on:
      - qdrant
    networks:
      - narada-net

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ./qdrant_storage:/qdrant/storage
    networks:
      - narada-net

networks:
  narada-net:
    driver: bridge
```

### c. Running the Project

To start the entire application stack, the user will run:

```bash
docker-compose up --build -d
```