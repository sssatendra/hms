# 🏥 HMS — Hospital Management System

A production-grade, multi-tenant, web-only Hospital Management System with Pharmacy and Laboratory modules.

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         HMS Monorepo                            │
├──────────────┬──────────────────────┬───────────────────────────┤
│   Frontend   │    backend-core      │      backend-lab          │
│   Next.js 14 │  Node.js + Express   │   Python + FastAPI        │
│   Tailwind   │  Prisma + PostgreSQL │   MinIO file handling     │
│   Shadcn UI  │  Mongoose + MongoDB  │   DICOM processing        │
│   React Query│  Bull + Redis queues │   Redis queues            │
└──────┬───────┴──────────┬───────────┴──────────┬────────────────┘
       │                  │                       │
       └──────────────────┼───────────────────────┘
                           │
        ┌─────────────────┼─────────────────────┐
        │          Infrastructure               │
        │  PostgreSQL  MongoDB  Redis  MinIO     │
        └───────────────────────────────────────┘
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), Tailwind CSS, Shadcn UI |
| Backend Core | Node.js, Express, Prisma ORM |
| Backend Lab | Python, FastAPI |
| Primary DB | PostgreSQL 16 |
| Document DB | MongoDB 7 |
| Cache/Queue | Redis 7 + Bull |
| Object Storage | MinIO (S3-compatible, LOCAL ONLY) |

## 📁 Project Structure

```
hms/
├── docker-compose.yml          # All services
├── .env.example               # Environment template
├── scripts/
│   └── postgres-init.sql      # DB initialization
│
├── frontend/                  # Next.js 14 App
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── (auth)/        # Login/Register
│   │   │   └── (dashboard)/   # Protected pages
│   │   ├── components/        # Shared components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── lib/               # API client, auth store, utils
│   │   └── providers/         # React Query, Theme providers
│   └── Dockerfile
│
├── backend-core/              # Node.js Express API
│   ├── prisma/
│   │   ├── schema.prisma      # Full HMS schema (30+ models)
│   │   └── seed.ts            # Demo data seeder
│   ├── src/
│   │   ├── config/            # Environment validation
│   │   ├── middleware/        # Auth, RBAC, Audit, Tenant
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/          # JWT, login, register, refresh
│   │   │   ├── patients/      # Patient CRUD + vital signs
│   │   │   ├── appointments/  # Scheduling with conflict detection
│   │   │   ├── pharmacy/      # Inventory + dispensing (SELECT FOR UPDATE)
│   │   │   ├── lab/           # Lab orders + file proxy
│   │   │   └── emr/           # Clinical notes (MongoDB) + prescriptions
│   │   ├── services/          # Prisma, MongoDB, Redis, Bull queues
│   │   ├── jobs/              # Background job processors
│   │   └── utils/             # JWT, logger, API response helpers
│   └── Dockerfile
│
└── backend-lab/               # Python FastAPI Service
    ├── app/
    │   ├── config.py          # Pydantic settings
    │   ├── main.py            # FastAPI app
    │   ├── routers/
    │   │   └── files.py       # Upload, signed URLs, DICOM
    │   ├── services/
    │   │   ├── minio_service.py  # MinIO client (upload, signed URLs, validation)
    │   │   ├── auth_service.py   # JWT validation (shared secret)
    │   │   └── queue_service.py  # Redis queue integration
    │   └── schemas/           # Pydantic schemas
    └── Dockerfile
```

---

## 🚀 Quick Start (Docker — Recommended)

### Prerequisites

- Docker >= 24.0
- Docker Compose >= 2.20
- 4GB+ RAM available for Docker

### Step 1 — Clone & Configure

```bash
# Clone the repo
git clone <repo-url>
cd hms

# Copy environment file
cp .env.example .env

# IMPORTANT: Change secrets in production!
# Edit .env and update:
# JWT_SECRET=<generate with: openssl rand -base64 64>
# JWT_REFRESH_SECRET=<generate with: openssl rand -base64 64>
# MINIO_ROOT_PASSWORD=<strong password>
# POSTGRES_PASSWORD=<strong password>
```

### Step 2 — Start All Services

```bash
# Start all services (first run downloads images, takes 3-5 min)
docker-compose up -d

# Watch logs
docker-compose logs -f

# Check all services are healthy
docker-compose ps
```

### Step 3 — Run Migrations & Seed Demo Data

```bash
# Run Prisma migrations
docker-compose exec backend-core npx prisma migrate deploy

# Seed demo data (creates tenant, users, patients, inventory)
docker-compose exec backend-core npm run seed
```

### Step 4 — Access the Application

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | See below |
| Core API | http://localhost:4000/health | — |
| Lab API | http://localhost:8000/health | — |
| API Docs | http://localhost:8000/api/docs | Debug mode only |
| MinIO Console | http://localhost:9001 | hms_minio_admin / hms_minio_pass |

### Demo Login Credentials

**Hospital ID (Tenant Slug):** `demo-hospital`

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo-hospital.com | Admin@1234 |
| Doctor | doctor@demo-hospital.com | Doctor@1234 |
| Pharmacist | pharmacist@demo-hospital.com | Pharma@1234 |
| Lab Tech | labtech@demo-hospital.com | LabTech@1234 |

---

## 💻 Local Development (Without Docker)

### Prerequisites

- Node.js >= 20.x
- Python >= 3.11
- PostgreSQL >= 15
- MongoDB >= 6
- Redis >= 7
- MinIO (local binary or Docker)

### Backend Core Setup

```bash
cd backend-core

# Install dependencies
npm install

# Configure environment
cp ../.env.example .env
# Edit .env to point to local services

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev

# Seed demo data
npm run seed

# Start development server (hot reload)
npm run dev
```

The core API will be available at http://localhost:4000

### Backend Lab Setup

```bash
cd backend-lab

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cat > .env << EOF
DEBUG=true
PORT=8000
POSTGRES_DSN=postgresql+asyncpg://hms_user:hms_pass@localhost:5432/hms_db
REDIS_URL=redis://:hms_redis_pass@localhost:6379
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=hms_minio_admin
MINIO_SECRET_KEY=hms_minio_pass
MINIO_SECURE=false
JWT_SECRET=super_secret_jwt_key_change_in_production
CORE_SERVICE_URL=http://localhost:4000
EOF

# Start development server
python run.py
```

The lab API will be available at http://localhost:8000

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cat > .env.local << EOF
NEXT_PUBLIC_CORE_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_LAB_API_URL=http://localhost:8000/api/v1
EOF

# Start development server
npm run dev
```

The frontend will be available at http://localhost:3000

### MinIO Setup (Local Dev)

```bash
# Option 1: Run via Docker
docker run -d \
  -p 9000:9000 -p 9001:9001 \
  -e "MINIO_ROOT_USER=hms_minio_admin" \
  -e "MINIO_ROOT_PASSWORD=hms_minio_pass" \
  --name hms_minio \
  minio/minio server /data --console-address ":9001"

# Option 2: Download binary from https://min.io/download
```

---

## 🔌 API Reference

### Authentication

All authenticated endpoints require JWT in **HttpOnly cookie** (`access_token`) or `Authorization: Bearer <token>` header.

#### Auth Endpoints

```
POST /api/v1/auth/register   — Register new tenant + admin
POST /api/v1/auth/login      — Login (sets HttpOnly cookies)
POST /api/v1/auth/logout     — Logout (blacklists token)
POST /api/v1/auth/refresh    — Refresh access token
GET  /api/v1/auth/me         — Get current user
POST /api/v1/auth/change-password
```

#### Core Modules

```
# Patients
GET    /api/v1/patients                    — List (paginated, searchable)
GET    /api/v1/patients/:id                — Get with appointments/vitals
POST   /api/v1/patients                    — Create
PUT    /api/v1/patients/:id                — Update
DELETE /api/v1/patients/:id                — Soft delete
POST   /api/v1/patients/:id/vital-signs    — Record vitals
GET    /api/v1/patients/:id/vital-signs    — Get vitals history

# Appointments
GET    /api/v1/appointments                — List
GET    /api/v1/appointments/today          — Today's schedule
POST   /api/v1/appointments                — Create (checks overlap)
PATCH  /api/v1/appointments/:id            — Update / status change

# Pharmacy
GET    /api/v1/pharmacy/inventory          — List (filterable)
GET    /api/v1/pharmacy/inventory/:id      — Get with transactions
POST   /api/v1/pharmacy/inventory          — Add item
PATCH  /api/v1/pharmacy/inventory/:id/adjust-stock  — Adjust stock (SELECT FOR UPDATE)
POST   /api/v1/pharmacy/dispense           — Dispense prescription (transactional)
GET    /api/v1/pharmacy/stats              — Stock statistics
GET    /api/v1/pharmacy/suppliers          — List suppliers
POST   /api/v1/pharmacy/suppliers          — Create supplier

# Laboratory
GET    /api/v1/lab/tests                   — Available tests
POST   /api/v1/lab/tests                   — Add test
GET    /api/v1/lab/orders                  — List orders
GET    /api/v1/lab/orders/:id              — Get order
POST   /api/v1/lab/orders                  — Create order
PATCH  /api/v1/lab/orders/:id/status       — Update status
PATCH  /api/v1/lab/orders/:id/results      — Enter results
GET    /api/v1/lab/orders/:id/file-url/:fileId  — Get signed URL for file
GET    /api/v1/lab/stats                   — Lab statistics

# EMR
GET    /api/v1/emr/notes                   — List clinical notes
GET    /api/v1/emr/notes/:id               — Get note
POST   /api/v1/emr/notes                   — Create SOAP note
PUT    /api/v1/emr/notes/:id               — Update / amend
POST   /api/v1/emr/notes/:id/sign          — Sign note
GET    /api/v1/emr/prescriptions           — List prescriptions
POST   /api/v1/emr/prescriptions           — Create prescription

# Users
GET    /api/v1/users                       — List staff
POST   /api/v1/users                       — Create user
PATCH  /api/v1/users/:id/status            — Update user status
GET    /api/v1/users/doctors               — List doctors
GET    /api/v1/users/audit-logs            — System audit trail
GET    /api/v1/users/notifications         — User notifications
PATCH  /api/v1/users/notifications/:id/read — Mark as read
```

#### Lab Service Endpoints

```
POST /api/v1/files/upload/lab-report   — Upload PDF report
POST /api/v1/files/upload/dicom        — Upload DICOM image
POST /api/v1/files/signed-url          — Generate signed download URL
POST /api/v1/files/signed-urls/batch   — Batch signed URLs
DELETE /api/v1/files/delete            — Delete file (admin only)
GET  /api/v1/files/list                — List files for lab order
```

### Standard Response Format

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// Error response
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Patient not found"
  }
}
```

---

## 🔐 Security Architecture

### Multi-Tenancy
- Every database table has `tenant_id`
- All queries are tenant-scoped in application layer
- JWT contains `tenantId` which is validated on every request
- Tenant middleware verifies tenant is active on every request

### Authentication
- JWT access tokens: 15 minute expiry, stored in HttpOnly cookie
- JWT refresh tokens: 7 day expiry, stored in HttpOnly cookie
- Token blacklisting via Redis on logout
- Bcrypt password hashing (12 rounds)
- Rate limiting on auth endpoints (20 req/15 min)

### RBAC Permissions
```
SUPER_ADMIN → All permissions
ADMIN       → User/patient management, reports, settings
DOCTOR      → Patients, appointments, EMR, prescriptions, lab orders
PHARMACIST  → Inventory, dispensing, prescriptions
LAB_TECH    → Lab orders, file uploads, results
NURSE       → Patients, appointments, EMR read
RECEPTIONIST→ Patients, appointments, billing
PATIENT     → Own records read-only
```

### File Security
- All files stored in private MinIO buckets (no public access)
- File access ONLY via presigned URLs (default 1 hour expiry)
- Tenant ownership validated before generating any URL
- File type validation (magic bytes + MIME type)

### Pharmacy Safety
- Stock deduction uses PostgreSQL `SELECT FOR UPDATE` (row-level locking)
- Prevents race conditions / overselling
- Atomic transactions for dispensing

---

## 🔄 Background Jobs

Redis-based Bull queues handle all async operations:

| Queue | Jobs | Schedule |
|-------|------|----------|
| lab-processing | Process uploaded lab files | On upload |
| pharmacy-sync | Expiry check | Daily 00:00 |
| pharmacy-sync | Stock alerts | Every 6 hours |
| notifications | Send notifications | On trigger |
| audit-log | Write audit entries | On mutation |
| email | Send emails | On trigger |

---

## 📊 Database Schema Highlights

### Key Models (PostgreSQL via Prisma)
- `Tenant` — Multi-tenant root
- `User` + `Role` — RBAC with permissions
- `Patient` — Medical Record with MRN
- `Appointment` — Scheduling with overlap detection
- `PharmacyInventory` — Stock with batch tracking
- `LabOrder` + `LabOrderItem` — Test results
- `LabFile` — MinIO file metadata
- `Prescription` + `PrescriptionItem` — Drug orders
- `AuditLog` — Complete audit trail
- `Invoice` + `Payment` — Billing
- `Ward` + `Bed` — Inpatient management

### MongoDB Collections
- `clinical_notes` — SOAP notes (TTL indexed for compliance)
- `system_logs` — Application logs (90-day TTL)

---

## 🚨 Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs backend-core
docker-compose logs backend-lab

# Restart specific service
docker-compose restart backend-core

# Full rebuild
docker-compose down && docker-compose up -d --build
```

### Database connection issues
```bash
# Verify PostgreSQL is healthy
docker-compose exec postgres pg_isready -U hms_user

# Connect to database
docker-compose exec postgres psql -U hms_user -d hms_db

# Re-run migrations
docker-compose exec backend-core npx prisma migrate deploy
```

### MinIO bucket issues
```bash
# Access MinIO console
open http://localhost:9001
# Login: hms_minio_admin / hms_minio_pass
# Verify buckets: hms-lab-files, hms-dicom-files exist
```

---

## 📦 Adding a New Tenant

```bash
# Via API
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_name": "City Medical Center",
    "tenant_slug": "city-medical",
    "email": "admin@citymedical.com",
    "password": "Admin@12345",
    "first_name": "Admin",
    "last_name": "User"
  }'
```

---

## 📄 License

MIT License — See LICENSE file for details.

---

## 🙏 Acknowledgments

Built with:
- [Prisma](https://prisma.io) — Next-generation ORM
- [FastAPI](https://fastapi.tiangolo.com) — Modern Python web framework
- [MinIO](https://min.io) — High-performance object storage
- [Bull](https://github.com/OptimalBits/bull) — Redis-based queue
- [Next.js](https://nextjs.org) — React framework
- [Shadcn UI](https://ui.shadcn.com) — Re-usable components
