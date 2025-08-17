# Narada AI - Docker Makefile
# Simplifies Docker operations for development and production

.PHONY: help build up down logs clean dev-up dev-down dev-logs restart health check-env setup

# Default target
help:
	@echo "Narada AI - Docker Commands"
	@echo "=========================="
	@echo ""
	@echo "Production:"
	@echo "  make build      - Build production Docker image"
	@echo "  make up         - Start production environment"
	@echo "  make down       - Stop production environment"
	@echo "  make logs       - View production logs"
	@echo "  make restart    - Restart production environment"
	@echo ""
	@echo "Development:"
	@echo "  make dev-up     - Start development environment"
	@echo "  make dev-down   - Stop development environment"
	@echo "  make dev-logs   - View development logs"
	@echo ""
	@echo "Utilities:"
	@echo "  make health     - Check service health"
	@echo "  make check-env  - Check environment configuration"
	@echo "  make clean      - Clean up Docker resources"
	@echo "  make setup      - Initial setup (copy env file)"
	@echo ""

# Initial setup
setup:
	@echo "🚀 Setting up Narada AI Docker environment..."
	@if [ ! -f .env ]; then \
		cp env.example .env; \
		echo "✅ Created .env file from env.example"; \
		echo "⚠️  Please edit .env and add your API keys"; \
	else \
		echo "ℹ️  .env file already exists"; \
	fi

# Production commands
build:
	@echo "🏗️  Building production Docker image..."
	docker-compose build --no-cache

up: setup
	@echo "🚀 Starting production environment..."
	docker-compose up -d

down:
	@echo "🛑 Stopping production environment..."
	docker-compose down

logs:
	@echo "📋 Viewing production logs..."
	docker-compose logs -f

restart: down up
	@echo "🔄 Restarted production environment"

# Development commands
dev-up: setup
	@echo "🚀 Starting development environment..."
	docker-compose -f docker-compose.dev.yml up -d

dev-down:
	@echo "🛑 Stopping development environment..."
	docker-compose -f docker-compose.dev.yml down

dev-logs:
	@echo "📋 Viewing development logs..."
	docker-compose -f docker-compose.dev.yml logs -f

# Health and utility commands
health:
	@echo "🏥 Checking service health..."
	@echo "Qdrant Health:"
	@curl -s http://localhost:6333/health || echo "❌ Qdrant not accessible"
	@echo ""
	@echo "Narada AI Health:"
	@curl -s http://localhost:3000/api/check-env | head -c 200 || echo "❌ Narada AI not accessible"
	@echo ""

check-env:
	@echo "🔧 Checking environment configuration..."
	@curl -s http://localhost:3000/api/check-env | python3 -m json.tool || echo "❌ Cannot check environment (service may be down)"

clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f
	@echo "✅ Cleanup complete"

# Quick shortcuts
start: up
stop: down
dev: dev-up
