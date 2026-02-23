#!/bin/bash
set -e

echo "🏥 HMS - Hospital Management System Setup"
echo "========================================="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
  echo "❌ Docker is required. Install from https://docker.com"
  exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
  echo "❌ Docker Compose is required."
  exit 1
fi

echo "✅ Docker detected: $(docker --version)"

# Setup .env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env from .env.example"
  echo "⚠️  Please review .env and update secrets before production use!"
fi

# Pull and start services
echo ""
echo "📦 Pulling Docker images..."
docker-compose pull

echo ""
echo "🚀 Starting all services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be healthy (30s)..."
sleep 30

echo ""
echo "🗄️ Running database migrations..."
docker-compose exec -T backend-core npx prisma migrate deploy

echo ""
echo "🌱 Seeding demo data..."
docker-compose exec -T backend-core npm run seed

echo ""
echo "================================================"
echo "✅ HMS is ready!"
echo ""
echo "🌐 Frontend:      http://localhost:3000"
echo "🔌 Core API:      http://localhost:4000"
echo "🧪 Lab API:       http://localhost:8000"
echo "🗄️  MinIO:         http://localhost:9001"
echo ""
echo "Demo Credentials:"
echo "  Hospital ID:  demo-hospital"
echo "  Admin:        admin@demo-hospital.com / Admin@1234"
echo "  Doctor:       doctor@demo-hospital.com / Doctor@1234"
echo "================================================"
