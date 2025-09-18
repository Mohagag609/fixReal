# Makefile for Makka Real Estate Management System

.PHONY: help install run test clean migrate collectstatic createsuperuser backup restore

# Default target
help:
	@echo "Available commands:"
	@echo "  install       - Install dependencies"
	@echo "  run           - Run development server"
	@echo "  test          - Run tests"
	@echo "  clean         - Clean temporary files"
	@echo "  migrate       - Run database migrations"
	@echo "  collectstatic - Collect static files"
	@echo "  createsuperuser - Create superuser"
	@echo "  backup        - Create database backup"
	@echo "  restore       - Restore database from backup"
	@echo "  docker-build  - Build Docker image"
	@echo "  docker-up     - Start Docker containers"
	@echo "  docker-down   - Stop Docker containers"
	@echo "  docker-logs   - Show Docker logs"

# Install dependencies
install:
	pip install -r requirements.txt

# Run development server
run:
	python manage.py runserver

# Run tests
test:
	python manage.py test

# Clean temporary files
clean:
	find . -type f -name "*.pyc" -delete
	find . -type d -name "__pycache__" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/
	rm -rf dist/
	rm -rf .coverage
	rm -rf htmlcov/
	rm -rf .pytest_cache/

# Run database migrations
migrate:
	python manage.py makemigrations
	python manage.py migrate

# Collect static files
collectstatic:
	python manage.py collectstatic --noinput

# Create superuser
createsuperuser:
	python manage.py createsuperuser

# Create database backup
backup:
	python manage.py dbbackup

# Restore database from backup
restore:
	python manage.py dbrestore

# Build Docker image
docker-build:
	docker-compose build

# Start Docker containers
docker-up:
	docker-compose up -d

# Stop Docker containers
docker-down:
	docker-compose down

# Show Docker logs
docker-logs:
	docker-compose logs -f

# Run Docker containers in development mode
docker-dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Run tests in Docker
docker-test:
	docker-compose run web python manage.py test

# Access Django shell in Docker
docker-shell:
	docker-compose run web python manage.py shell

# Access database in Docker
docker-db:
	docker-compose exec db psql -U makka_user -d makka_db

# Show Docker container status
docker-status:
	docker-compose ps

# Remove Docker containers and volumes
docker-clean:
	docker-compose down -v
	docker system prune -f

# Install development dependencies
install-dev:
	pip install -r requirements-dev.txt

# Run linting
lint:
	flake8 .
	black --check .
	isort --check-only .

# Fix linting issues
lint-fix:
	black .
	isort .

# Run security checks
security:
	bandit -r .

# Generate requirements
requirements:
	pip freeze > requirements.txt

# Update requirements
update-requirements:
	pip install --upgrade pip
	pip install -r requirements.txt --upgrade
	pip freeze > requirements.txt

# Run all checks
check: lint test security

# Deploy to production
deploy:
	@echo "Deploying to production..."
	@echo "Make sure to set production environment variables"
	@echo "Run: make migrate collectstatic"
	@echo "Restart services: sudo systemctl restart makka nginx"

# Setup development environment
setup-dev: install migrate collectstatic createsuperuser
	@echo "Development environment setup complete!"
	@echo "Run 'make run' to start the development server"

# Setup production environment
setup-prod: install migrate collectstatic
	@echo "Production environment setup complete!"
	@echo "Make sure to configure production settings"

# Show system status
status:
	@echo "=== System Status ==="
	@echo "Python version: $(shell python --version)"
	@echo "Django version: $(shell python -c 'import django; print(django.get_version())')"
	@echo "Database: $(shell python manage.py dbshell --command='SELECT version();' 2>/dev/null || echo 'Not connected')"
	@echo "Static files: $(shell ls -la staticfiles/ 2>/dev/null | wc -l) files"
	@echo "Media files: $(shell ls -la media/ 2>/dev/null | wc -l) files"
	@echo "Backups: $(shell ls -la backups/ 2>/dev/null | wc -l) files"