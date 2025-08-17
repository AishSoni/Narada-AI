# Narada AI - Docker Setup

This repository includes Docker configuration to run the Narada AI application with Qdrant vector database.

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- At least 4GB of available RAM
- API keys for the services you want to use

### 1. Environment Setup

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and add your API keys:
   ```bash
   # Required for basic functionality
   OPENAI_API_KEY=your_openai_api_key_here
   TAVILY_API_KEY=your_tavily_api_key_here
   
   # Optional but recommended
   FIRECRAWL_API_KEY=your_firecrawl_api_key_here
   ```

### 2. Production Deployment

Run the application in production mode:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at:
- **Narada AI**: http://localhost:3000
- **Qdrant Dashboard**: http://localhost:6333/dashboard

### 3. Development Mode

For development with hot reload:

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f narada-ai-dev

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

## Services

### Narada AI Application
- **Port**: 3000
- **Health Check**: http://localhost:3000/api/check-env
- **Container**: `narada-ai-app`

### Qdrant Vector Database
- **Port**: 6333 (HTTP API)
- **Port**: 6334 (gRPC API)
- **Dashboard**: http://localhost:6333/dashboard
- **Container**: `narada-qdrant`
- **Volume**: `qdrant_storage` (persistent data)

## Configuration

### Environment Variables

The application supports the following environment variables:

#### AI/LLM Providers
- `OPENAI_API_KEY` - OpenAI API key
- `OPENROUTER_API_KEY` - OpenRouter API key
- `COHERE_API_KEY` - Cohere API key
- `OLLAMA_API_URL` - Ollama server URL (default: http://localhost:11434)

#### Search Providers
- `FIRECRAWL_API_KEY` - Firecrawl API key for web scraping
- `TAVILY_API_KEY` - Tavily API key for web search
- `SERP_API_KEY` - SERP API key for search

#### Vector Database
- `QDRANT_URL` - Qdrant server URL (automatically set in Docker)
- `QDRANT_COLLECTION_NAME` - Collection name (default: narada_vectors)
- `QDRANT_API_KEY` - API key for Qdrant Cloud (optional)

#### Provider Selection
- `LLM_PROVIDER` - LLM provider (openai, openrouter, cohere, ollama)
- `EMBEDDING_PROVIDER` - Embedding provider (openai, cohere)
- `SEARCH_PROVIDER` - Search provider (tavily, serp, firecrawl, duckduckgo)
- `VECTOR_DB_PROVIDER` - Vector database provider (qdrant)

### Volumes

- `qdrant_storage` - Persistent storage for Qdrant vector database

## Troubleshooting

### Common Issues

1. **Port conflicts**: If ports 3000 or 6333 are already in use, modify the port mappings in `docker-compose.yml`

2. **Memory issues**: Ensure Docker has at least 4GB of RAM allocated

3. **API key errors**: Check that your `.env` file contains valid API keys

4. **Qdrant connection issues**: Ensure Qdrant service is healthy before the app starts:
   ```bash
   docker-compose logs qdrant
   ```

### Health Checks

Check service health:

```bash
# Check Qdrant health
curl http://localhost:6333/health

# Check app health
curl http://localhost:3000/api/check-env
```

### Logs

View logs for debugging:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f narada-ai
docker-compose logs -f qdrant
```

### Rebuilding

Force rebuild after code changes:

```bash
docker-compose build --no-cache
docker-compose up -d
```

## Development

### Local Development with Docker

1. Use the development compose file for hot reload:
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. Make changes to your code - they will be reflected immediately

3. Access the application at http://localhost:3000

### Debugging

Access the container for debugging:

```bash
# Enter the app container
docker-compose exec narada-ai sh

# Enter the Qdrant container
docker-compose exec qdrant sh
```

## Production Considerations

1. **Security**: Use proper API keys and consider using Docker secrets
2. **Scaling**: Consider using Docker Swarm or Kubernetes for production scaling
3. **Monitoring**: Add monitoring and logging solutions
4. **Backups**: Implement backup strategies for Qdrant data
5. **SSL/TLS**: Use a reverse proxy like Nginx or Traefik for SSL termination

## Support

For issues related to:
- Docker setup: Check this README and Docker logs
- Application functionality: Check the main project README
- Qdrant issues: Check [Qdrant documentation](https://qdrant.tech/documentation/)
