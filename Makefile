# Estate Management System Makefile

.PHONY: help install dev build start test clean docker-up docker-down docker-build

# Default target
help:
	@echo "Estate Management System - Available Commands:"
	@echo ""
	@echo "Development:"
	@echo "  install     - Install all dependencies"
	@echo "  dev         - Start development servers"
	@echo "  build       - Build all projects"
	@echo "  start       - Start production servers"
	@echo "  test        - Run all tests"
	@echo "  clean       - Clean all build artifacts"
	@echo ""
	@echo "Docker:"
	@echo "  docker-up   - Start all services with Docker"
	@echo "  docker-down - Stop all Docker services"
	@echo "  docker-build- Build all Docker images"
	@echo ""
	@echo "Database:"
	@echo "  db-setup    - Setup database and run migrations"
	@echo "  db-seed     - Seed database with sample data"
	@echo "  db-reset    - Reset database"

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Development
dev:
	@echo "Starting development servers..."
	@echo "Backend: http://localhost:3001"
	@echo "Frontend: http://localhost:4200"
	@echo "Database: localhost:5432"
	@echo ""
	@echo "Press Ctrl+C to stop all services"
	@trap 'kill 0' INT; \
	cd backend && npm run dev & \
	cd frontend && npm start & \
	wait

# Build all projects
build:
	@echo "Building backend..."
	cd backend && npm run build
	@echo "Building frontend..."
	cd frontend && npm run build

# Start production
start:
	@echo "Starting production servers..."
	cd backend && npm start &
	cd frontend && npm start

# Run tests
test:
	@echo "Running backend tests..."
	cd backend && npm test
	@echo "Running frontend tests..."
	cd frontend && npm test

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	cd backend && rm -rf dist node_modules
	cd frontend && rm -rf dist node_modules
	docker system prune -f

# Docker commands
docker-up:
	@echo "Starting all services with Docker..."
	docker-compose up --build

docker-down:
	@echo "Stopping all Docker services..."
	docker-compose down

docker-build:
	@echo "Building all Docker images..."
	docker-compose build

# Database commands
db-setup:
	@echo "Setting up database..."
	cd backend && npx prisma generate
	cd backend && npx prisma db push

db-seed:
	@echo "Seeding database..."
	cd backend && npm run db:seed

db-reset:
	@echo "Resetting database..."
	cd backend && npx prisma migrate reset --force

# Quick start
quick-start: install db-setup db-seed
	@echo "Quick start completed!"
	@echo "Run 'make dev' to start development servers"