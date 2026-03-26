# Task Manager API

A production-ready REST API built with **FastAPI**, **PostgreSQL**, **Redis**, and **React.js** — featuring JWT authentication, role-based access control, Redis caching, structured logging, and full Docker support.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11, FastAPI |
| Database | PostgreSQL 15 |
| Cache | Redis 7 |
| Frontend | React.js 18 |
| Auth | JWT (python-jose) + bcrypt |
| Containerization | Docker + Docker Compose |
| API Docs | Swagger UI (auto-generated) |

---

## Features

- ✅ User registration & login with bcrypt password hashing
- ✅ JWT-based authentication with Bearer tokens
- ✅ Role-based access control (user vs admin)
- ✅ Full CRUD for Tasks entity (title, description, status, priority)
- ✅ API versioning (`/api/v1/`)
- ✅ Input validation & sanitization (Pydantic v2)
- ✅ Structured logging (terminal + file, per module)
- ✅ Redis caching with automatic invalidation on mutation
- ✅ Swagger UI documentation at `/api/docs`
- ✅ Docker Compose — entire stack runs with one command
- ✅ Admin panel (manage users, view all tasks)

---

## Project Structure
```
rbac-task-manager/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── cache.py        # Redis caching helpers
│   │   │   ├── logger.py       # Structured logging setup
│   │   │   ├── middleware.py   # Request logging middleware
│   │   │   └── security.py     # JWT + password hashing
│   │   ├── db/
│   │   │   └── database.py     # SQLAlchemy engine + session
│   │   ├── models/
│   │   │   └── models.py       # User + Task ORM models
│   │   ├── routes/
│   │   │   ├── auth.py         # Register, login, /me
│   │   │   ├── tasks.py        # CRUD + admin task routes
│   │   │   └── admin.py        # Admin user management
│   │   ├── schemas/
│   │   │   └── schemas.py      # Pydantic request/response schemas
│   │   └── main.py             # FastAPI app entry point
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/axios.js        # Axios instance + interceptors
│   │   ├── context/            # Auth context (global state)
│   │   ├── components/         # Navbar, ProtectedRoute
│   │   └── pages/              # Login, Register, Dashboard, Admin
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

---

## ⚡ Quick Start (Docker — Recommended)

> Prerequisites: [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/) installed.

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/rbac-task-manager.git
cd rbac-task-manager
```

### 2. Start all services
```bash
docker compose up --build
```

This starts 4 containers automatically:
- PostgreSQL database
- Redis cache
- FastAPI backend (port 8000)
- React frontend via Nginx (port 3000)

Wait until you see:
```
taskapp_backend  | INFO | main | Task Manager API started successfully
```

### 3. Create the admin user

In a **new terminal tab**, run:
```bash
docker compose exec backend python3 -c "
from app.db.database import SessionLocal
from app.models.models import User
from app.core.security import hash_password
db = SessionLocal()
if not db.query(User).filter(User.email=='admin@taskapp.com').first():
    db.add(User(username='admin', email='admin@taskapp.com', hashed_password=hash_password('admin123'), role='admin'))
    db.commit()
    print('Admin created successfully')
else:
    print('Admin already exists')
db.close()
"
```

### 4. Open the app

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| API Docs (Swagger) | http://localhost:8000/api/docs |

---

## 🔐 Test Credentials

### Admin Account
| Field | Value |
|---|---|
| Email | admin@taskapp.com |
| Password | admin123 |
| Role | admin |

> The admin account can: view all users, deactivate users, promote users to admin, and view all tasks across the system via the **Admin Panel** in the navbar.

### Regular User
Register a new account at `http://localhost:3000/register` — all new accounts get the `user` role by default.

---

## API Endpoints

### Authentication
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | Public | Register new user |
| POST | `/api/v1/auth/login` | Public | Login, returns JWT |
| GET | `/api/v1/auth/me` | User | Get current user info |
| DELETE | `/api/v1/auth/me` | User | Delete own account |

### Tasks
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/v1/tasks/` | User | Create a task |
| GET | `/api/v1/tasks/` | User | Get own tasks (cached) |
| GET | `/api/v1/tasks/{id}` | User | Get single task (cached) |
| PATCH | `/api/v1/tasks/{id}` | User | Update a task |
| DELETE | `/api/v1/tasks/{id}` | User | Delete a task |
| GET | `/api/v1/tasks/admin/all` | Admin | Get all tasks (all users) |
| DELETE | `/api/v1/tasks/admin/{id}` | Admin | Delete any task |

### Admin
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/v1/admin/users` | Admin | List all users |
| PATCH | `/api/v1/admin/users/{id}/deactivate` | Admin | Deactivate a user |
| PATCH | `/api/v1/admin/users/{id}/make-admin` | Admin | Promote user to admin |

---

## Local Development (Without Docker)

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file:
```env
DATABASE_URL=postgresql://taskapp_user:taskapp123@localhost:5432/taskapp_db
SECRET_KEY=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL_SECONDS=300
```

Set up the database:
```bash
sudo -u postgres psql -c "CREATE USER taskapp_user WITH PASSWORD 'taskapp123';"
sudo -u postgres psql -c "CREATE DATABASE taskapp_db OWNER taskapp_user;"
```

Run the backend:
```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:3000`.

---

## Caching Strategy

Redis caches task lists and individual task details per user:

- **Cache key format:** `tasks:user:{id}:list:status={s}:priority={p}`
- **TTL:** 300 seconds (5 minutes)
- **Invalidation:** Any create / update / delete clears all cache keys for that user
- **Graceful fallback:** If Redis is unavailable, the app falls back to direct DB queries without crashing

---

## Logging

Logs are written to three destinations simultaneously:

| Destination | Level | Location |
|---|---|---|
| Terminal (stdout) | INFO and above | Live in console |
| App log file | DEBUG and above | `backend/logs/app.log` |
| Error log file | ERROR only | `backend/logs/errors.log` |

Every HTTP request logs: method, path, status code, and response time in ms.

---

## Scalability Notes

### Current Architecture
Single-server deployment with Docker Compose. Suitable for development and small production workloads.

### Horizontal Scaling Path

**1. Load Balancing**
Multiple backend instances can run behind an Nginx or AWS ALB load balancer. Since JWT is stateless, no session sharing is needed between instances.

**2. Database Scaling**
- Read replicas for heavy read workloads (SQLAlchemy supports multiple binds)
- Connection pooling via PgBouncer
- Migrate to managed DB (AWS RDS, Supabase) for automatic backups and failover

**3. Caching Layer**
- Redis Cluster for distributed caching across nodes
- Cache warming strategies for frequently accessed data
- Separate cache TTLs per data type

**4. Microservices Migration**
The modular structure (`auth`, `tasks`, `admin`) maps directly to independent microservices:
- Auth Service → handles JWT issuance and validation
- Task Service → CRUD operations
- Admin Service → user management
- API Gateway → routes requests, handles rate limiting

**5. Message Queue**
Long-running tasks (email notifications, report generation) offloaded to Celery + Redis as a task queue.

**6. Containerization**
Current Docker Compose setup can be migrated to Kubernetes (K8s) for:
- Auto-scaling based on CPU/memory
- Zero-downtime rolling deployments
- Self-healing containers

---

## Database Schema
```
users
├── id (PK)
├── username (unique)
├── email (unique)
├── hashed_password
├── role (user | admin)
├── is_active
└── created_at

tasks
├── id (PK)
├── title
├── description
├── status (pending | in_progress | completed)
├── priority (1=low | 2=medium | 3=high)
├── user_id (FK → users.id)
├── created_at
└── updated_at
```

---

## Security Practices

- Passwords hashed with **bcrypt** (never stored in plain text)
- JWT tokens expire after **30 minutes**
- All protected routes validate token on every request
- Input validated and sanitized via **Pydantic v2** before hitting the database
- CORS restricted to frontend origin only
- `.env` files excluded from version control via `.gitignore`