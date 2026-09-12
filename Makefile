.PHONY: help setup build up down logs clean restart status test-api db-shell db-admin dev-backend

help:
	@echo "========================================"
	@echo "Investment Trading Platform - Commands"
	@echo "========================================"
	@echo ""
	@echo "Quick Start:"
	@echo "  make setup       - Interactive setup wizard"
	@echo "  make up          - Start all services"
	@echo ""
	@echo "Management:"
	@echo "  make status      - Check platform status"
	@echo "  make logs        - View logs from all services"
	@echo "  make restart     - Restart all services"
	@echo "  make down        - Stop all services"
	@echo "  make clean       - Remove all containers and volumes"
	@echo ""
	@echo "Database:"
	@echo "  make db-shell    - Open PostgreSQL shell"
	@echo "  make db-admin    - Database administration tools"
	@echo ""
	@echo "Testing:"
	@echo "  make test-api    - Run API tests"
	@echo ""
	@echo "Development:"
	@echo "  make dev-backend - Run backend locally"
	@echo "  make build       - Build all Docker containers"
	@echo ""

setup:
	@./setup.sh

build:
	docker-compose build

up:
	@echo "Starting Investment Trading Platform..."
	@docker-compose up -d
	@sleep 5
	@echo ""
	@echo "✓ Platform started successfully!"
	@echo ""
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8080"
	@echo "  Database: localhost:5432"
	@echo ""
	@echo "  Admin:    admin@platform.com / admin123"
	@echo ""
	@echo "  Telebirr: 0954381944 (ጤናው አክሊሉ)"
	@echo "  CBE:      1000715798488 (Bereket Melese Mulugeta)"
	@echo ""
	@echo "Run 'make status' to check services"
	@echo "Run 'make logs' to view logs"

down:
	docker-compose down

restart:
	@echo "Restarting all services..."
	@docker-compose restart
	@echo "✓ Services restarted"

logs:
	docker-compose logs -f

clean:
	@echo "This will remove all containers and volumes. Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	docker-compose down -v
	@echo "✓ All containers and volumes removed"

status:
	@./status.sh

db-shell:
	@docker-compose exec postgres psql -U postgres -d investment_platform

db-admin:
	@./db-admin.sh

test-api:
	@./test-backend.sh

dev-backend:
	@cd backend && go mod download && go run cmd/server/main.go
