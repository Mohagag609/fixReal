# Makefile for Accounting System

.PHONY: help install dev build start test clean docker-up docker-down

# Default target
help:
	@echo "Available commands:"
	@echo "  install     - Install all dependencies"
	@echo "  dev         - Start development servers"
	@echo "  build       - Build for production"
	@echo "  start       - Start production servers"
	@echo "  test        - Run all tests"
	@echo "  clean       - Clean build artifacts"
	@echo "  docker-up   - Start with Docker Compose"
	@echo "  docker-down - Stop Docker Compose"

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Development
dev:
	@echo "Starting development servers..."
	@echo "Backend: http://localhost:3000"
	@echo "Frontend: http://localhost:4200"
	@echo "Database: http://localhost:5432"
	@echo ""
	@echo "Press Ctrl+C to stop all servers"
	@echo ""
	@trap 'kill %1; kill %2' INT; \
	cd backend && npm run dev & \
	cd frontend && npm start & \
	wait

# Build for production
build:
	@echo "Building backend..."
	cd backend && npm run build
	@echo "Building frontend..."
	cd frontend && npm run build

# Start production
start:
	@echo "Starting production servers..."
	@echo "Backend: http://localhost:3000"
	@echo "Frontend: http://localhost:4200"
	@echo ""
	@trap 'kill %1; kill %2' INT; \
	cd backend && npm start & \
	cd frontend && npm run serve & \
	wait

# Run tests
test:
	@echo "Running backend tests..."
	cd backend && npm test
	@echo "Running frontend tests..."
	cd frontend && npm test

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf backend/dist
	rm -rf frontend/dist
	rm -rf backend/node_modules
	rm -rf frontend/node_modules

# Docker commands
docker-up:
	@echo "Starting with Docker Compose..."
	docker-compose up --build

docker-down:
	@echo "Stopping Docker Compose..."
	docker-compose down

# Database commands
db-migrate:
	@echo "Running database migrations..."
	cd backend && npx prisma migrate dev

db-reset:
	@echo "Resetting database..."
	cd backend && npx prisma migrate reset

db-seed:
	@echo "Seeding database..."
	cd backend && npx prisma db seed

# Development helpers
dev-backend:
	@echo "Starting backend only..."
	cd backend && npm run dev

dev-frontend:
	@echo "Starting frontend only..."
	cd frontend && npm start

# Production helpers
prod-backend:
	@echo "Starting backend production..."
	cd backend && npm start

prod-frontend:
	@echo "Starting frontend production..."
	cd frontend && npm run serve

# Utility commands
logs:
	@echo "Showing Docker logs..."
	docker-compose logs -f

status:
	@echo "Checking service status..."
	@echo "Backend: $$(curl -s http://localhost:3000/health | jq -r '.message' 2>/dev/null || echo 'Not running')"
	@echo "Frontend: $$(curl -s http://localhost:4200 > /dev/null && echo 'Running' || echo 'Not running')"
	@echo "Database: $$(pg_isready -h localhost -p 5432 > /dev/null 2>&1 && echo 'Running' || echo 'Not running')"

# Quick setup for new developers
setup: install db-migrate
	@echo "Setup complete! Run 'make dev' to start development servers."

# Full reset
reset: clean install db-reset
	@echo "Full reset complete! Run 'make dev' to start development servers."