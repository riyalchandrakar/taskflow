# TaskFlow — Task Management System

A full-stack task management system with JWT authentication, analytics dashboard, role-based admin panel, and dark/light theme support.

**Live Demo:** https://taskflow-1-k683.onrender.com <br>
**API Docs:** https://taskflow-vj1u.onrender.com/api/docs/

**Stack:**  
`Django 5` · `Django REST Framework` · `React 18` · `Vite` · `PostgreSQL (Neon)` · `Redis (Upstash)` · `Tailwind CSS` · `Recharts`

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Local Setup](#local-setup)
3. [Production Deployment (Render)](#production-deployment-render)
4. [Environment Variables](#environment-variables)
5. [Database Migrations](#database-migrations)
6. [Admin User Setup](#admin-user-setup)
7. [JWT Implementation](#jwt-implementation)
8. [Database Design (ER Diagram)](#database-design)
9. [Analytics Logic](#analytics-logic)
10. [Productivity Score Formula](#productivity-score-formula)
11. [API Endpoints](#api-endpoints)
12. [Rate Limiting](#rate-limiting)
13. [Frontend Architecture](#frontend-architecture)

---

## Project Structure

```
taskflow/
├── backend/
│   ├── app/
│   │   ├── api/                  # View layer
│   │   │   ├── auth_views.py     # Register, Login, Refresh, Logout, Me
│   │   │   ├── task_views.py     # Task CRUD, Complete, Archive, Feedback
│   │   │   ├── analytics_views.py# Analytics endpoints
│   │   │   ├── admin_views.py    # Admin-only: all users, all tasks, global analytics
│   │   │   ├── health_views.py   # /api/health/ — DB + cache check
│   │   │   └── urls.py
│   │   ├── models/
│   │   │   ├── user.py           # Custom User model (email auth)
│   │   │   ├── task.py           # Task model
│   │   │   ├── task_history.py   # TaskHistory model
│   │   │   └── feedback.py       # Feedback model
│   │   ├── serializers/          # DRF serializers + validation
│   │   ├── services/
│   │   │   ├── task_service.py   # Business logic (CRUD + history)
│   │   │   └── analytics_service.py
│   │   ├── repositories/
│   │   │   └── task_repository.py# Data access layer
│   │   ├── core/
│   │   │   ├── pagination.py     # StandardPagination
│   │   │   └── exceptions.py     # Custom JSON exception handler
│   │   └── utils/
│   │       └── ratelimit.py      # Rate limiting helper
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── migrations/
│   ├── manage.py
│   ├── build.sh                  # Render build script
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Tasks.jsx         # Task cards + History + Feedback modals
│   │   │   ├── Analytics.jsx     # Charts (Area, Pie, Bar)
│   │   │   ├── Feedback.jsx      # User's submitted feedback list
│   │   │   └── Admin.jsx         # Admin panel (staff only)
│   │   ├── components/
│   │   │   ├── layout/AppLayout.jsx  # Sidebar + theme toggle
│   │   │   └── ui/
│   │   │       ├── TaskModal.jsx
│   │   │       ├── TaskHistoryModal.jsx
│   │   │       └── FeedbackModal.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Global auth state
│   │   │   └── ThemeContext.jsx  # Dark/light theme
│   │   ├── services/
│   │   │   ├── api.js            # Axios instance + JWT interceptor
│   │   │   ├── auth.js
│   │   │   ├── tasks.js
│   │   │   ├── analytics.js
│   │   │   └── admin.js
│   │   └── index.css             # Tailwind + CSS variables (light/dark)
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .env.example
├── er_diagram.png
├── render.yaml
└── README.md
```

---

## Local Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL database (local or [Neon](https://neon.tech) free tier)
- Redis (local or [Upstash](https://upstash.com) free tier — optional for dev)

---

### Backend

```bash
cd taskflow/backend

# 1. Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env — add your DATABASE_URL and SECRET_KEY (REDIS_URL optional locally)

# 4. Run migrations
python manage.py migrate

# 5. Create admin user
python manage.py createsuperuser
# OR via shell:
# python manage.py shell
# >>> from app.models import User
# >>> User.objects.create_superuser(email='admin@example.com', password='pass123', name='Admin')

# 6. Start server
python manage.py runserver
```

- Backend: http://localhost:8000
- API Docs: http://localhost:8000/api/docs/
- Health check: http://localhost:8000/api/health/

---

### Frontend

```bash
cd taskflow/frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# VITE_API_URL=http://localhost:8000/api  (default)

# 3. Start dev server
npm run dev
```

- Frontend: http://localhost:5173

---

## Production Deployment (Render)

### Services needed

| Service | Provider | Free Tier |
|---|---|---|
| Backend (Web Service) | [Render](https://render.com) | 750 hrs/month |
| Frontend (Static Site) | [Render](https://render.com) | Unlimited |
| PostgreSQL | [Neon](https://neon.tech) | 0.5 GB |
| Redis | [Upstash](https://upstash.com) | 10k cmds/day |

---

### Step 1 — Upstash Redis

1. Sign up at [console.upstash.com](https://console.upstash.com)
2. **Create Database** → Region: `us-east-1` → Type: Regional
3. Copy the **Redis URL** from Details tab — format: `rediss://default:xxx@xxx.upstash.io:6379`

---

### Step 2 — Neon PostgreSQL

1. Sign up at [neon.tech](https://neon.tech)
2. Create a project → copy **Connection string**  
   Format: `postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

---

### Step 3 — Push to GitHub

```bash
cd taskflow
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

> `.gitignore` already excludes `.env`, `node_modules/`, `venv/`, `__pycache__/` etc.

---

### Step 4 — Render Backend

1. [render.com](https://render.com) → **New → Web Service**
2. Connect your GitHub repo
3. Settings:

   | Field | Value |
   |---|---|
   | Root Directory | `backend` |
   | Runtime | `Python 3` |
   | Build Command | `./build.sh` |
   | Start Command | `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 2 --threads 2 --timeout 60` |

4. **Environment Variables** tab — add these (never put secrets in `render.yaml`):

   | Key | Value |
   |---|---|
   | `SECRET_KEY` | Run `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
   | `DEBUG` | `False` |
   | `ALLOWED_HOSTS` | `taskflow-backend.onrender.com` |
   | `DATABASE_URL` | Your Neon connection string |
   | `REDIS_URL` | Your Upstash Redis URL |
   | `CORS_ALLOWED_ORIGINS` | `https://taskflow-frontend.onrender.com` |

5. Click **Create Web Service** — `build.sh` automatically runs `migrate` + `collectstatic`

---

### Step 5 — Render Frontend

1. **New → Static Site**
2. Same GitHub repo, settings:

   | Field | Value |
   |---|---|
   | Root Directory | `frontend` |
   | Build Command | `npm install && npm run build` |
   | Publish Directory | `dist` |

3. **Environment Variables:**

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://taskflow-backend.onrender.com/api` |

4. **Redirects/Rewrites** tab → Add rule:

   | Source | Destination | Type |
   |---|---|---|
   | `/*` | `/index.html` | Rewrite |

---

### Step 6 — Create Admin User (Production)

Render Dashboard → **taskflow-backend** → **Shell** tab:

```bash
python manage.py createsuperuser
```

Or via shell if custom fields cause issues:

```python
python manage.py shell
>>> from app.models import User
>>> User.objects.create_superuser(email='admin@example.com', password='strongpass', name='Admin')
```

After login, the **Admin Panel** link appears in the sidebar (staff users only).

---

## Environment Variables

### Backend `.env`

```env
# Django
SECRET_KEY=your-50-char-secret-key
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,taskflow-backend.onrender.com

# Neon PostgreSQL
DATABASE_URL=postgresql://neondb_owner:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

# Upstash Redis (leave blank locally to use in-memory fallback)
REDIS_URL=rediss://default:password@your-db.upstash.io:6379

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://taskflow-frontend.onrender.com
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:8000/api
```

---

## Database Migrations

```bash
# First time
python manage.py migrate

# After any model change
python manage.py makemigrations
python manage.py migrate

# Check migration status
python manage.py showmigrations
```

On Render, `build.sh` runs `python manage.py migrate` automatically on every deploy.

---

## Admin User Setup

Three ways to create an admin:

**1. createsuperuser command (recommended)**
```bash
python manage.py createsuperuser
```

**2. Shell (if name field causes issues)**
```python
python manage.py shell
>>> from app.models import User
>>> User.objects.create_superuser(email='admin@example.com', password='pass', name='Admin')
```

**3. Promote existing user**
```python
python manage.py shell
>>> from app.models import User
>>> u = User.objects.get(email='existing@example.com')
>>> u.is_staff = True
>>> u.save()
```

After login → sidebar shows **🛡 Admin Panel** section (hidden from regular users).

Admin can:
- View all users + task counts, toggle active/staff status
- View all tasks across all users with filters
- View global analytics — total users, completion rates, top performers

---

## JWT Implementation

### Flow

```
1. REGISTER   POST /api/auth/register/
              → access_token (15 min) + refresh_token (7 days) + user object

2. LOGIN      POST /api/auth/login/
              → same response as register

3. REQUEST    Authorization: Bearer <access_token>
              → all protected endpoints require this header

4. REFRESH    POST /api/auth/refresh/
              body: { "refresh": "<refresh_token>" }
              → new access_token issued
              → old refresh token rotated (blacklisted)
              → new refresh token returned

5. LOGOUT     POST /api/auth/logout/
              body: { "refresh": "<refresh_token>" }
              → refresh token blacklisted, cannot be reused
```

### Token Settings

| Setting | Value |
|---|---|
| `ACCESS_TOKEN_LIFETIME` | 15 minutes |
| `REFRESH_TOKEN_LIFETIME` | 7 days |
| `ROTATE_REFRESH_TOKENS` | True |
| `BLACKLIST_AFTER_ROTATION` | True |
| `ALGORITHM` | HS256 |
| Custom claims | `name`, `email`, `is_staff` |

### Frontend Interceptor (`src/services/api.js`)

1. Every request → `Authorization: Bearer <access_token>` attached automatically
2. On 401 → pending requests queued
3. `POST /auth/refresh/` called with stored refresh token
4. On success → all queued requests retried with new token
5. On failure → localStorage cleared, redirect to `/login`

---

## Database Design

### ER Diagram

![ER Diagram](er_diagram.png)

### Entities & Relationships

```
users     (1) ──────────< tasks        (N)   user creates many tasks
tasks     (1) ──────────< task_history (N)   every change logged
users     (1) ──────────< feedback     (N)   user submits feedback
tasks     (1) ──────────< feedback   (0..N)  task optionally referenced
```

### Schema

**users**
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK, auto-generated |
| name | VARCHAR | required |
| email | VARCHAR | unique, used for login |
| password | VARCHAR | bcrypt hashed |
| is_staff | BOOLEAN | admin access |
| is_active | BOOLEAN | account enabled |
| created_at | TIMESTAMP | auto |

**tasks**
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| title | VARCHAR | required |
| description | TEXT | optional |
| priority | ENUM | low / medium / high |
| status | ENUM | pending / completed / archived |
| due_date | TIMESTAMP | optional |
| completed_at | TIMESTAMP | set when completed |
| created_at | TIMESTAMP | auto |
| updated_at | TIMESTAMP | auto |

**task_history**
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| task_id | UUID | FK → tasks.id |
| action_type | ENUM | created / updated / completed / archived / deleted |
| previous_state | JSONB | snapshot before change |
| timestamp | TIMESTAMP | auto |

**feedback**
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| user_id | UUID | FK → users.id |
| task_id | UUID | FK → tasks.id (nullable) |
| comment | TEXT | required |
| rating | SMALLINT | 1–5 |
| created_at | TIMESTAMP | auto |

### Indexes

| Table | Columns | Purpose |
|---|---|---|
| tasks | `(user_id, status)` | Fast filter by status per user |
| tasks | `(user_id, priority)` | Fast filter by priority per user |
| tasks | `(user_id, due_date)` | Date range queries |
| tasks | `(created_at)` | Chronological listing |
| task_history | `(task_id, action_type)` | Audit log lookups |
| task_history | `(timestamp)` | Time-based queries |

---

## Analytics Logic

All metrics are calculated server-side in `app/services/analytics_service.py`.

| Metric | SQL Logic |
|---|---|
| Total tasks | `COUNT(*)` WHERE user = me |
| Completed | `COUNT(*)` WHERE status = 'completed' |
| Completion % | `completed / total × 100` |
| Tasks over time | `GROUP BY TruncDate/Week/Month(completed_at)` |
| Most productive day | `ExtractWeekDay(completed_at)` → max count |
| Avg completion time | `AVG(completed_at − created_at)` in hours |
| Priority distribution | `GROUP BY priority, COUNT(*)` |

---

## Productivity Score Formula

```
Score = (completion_rate × 50) + (on_time_rate × 30) + (high_priority_rate × 20)
```

| Component | Weight | Calculation |
|---|---|---|
| `completion_rate` | 50% | `completed_tasks / total_tasks` |
| `on_time_rate` | 30% | tasks completed before `due_date` / tasks with `due_date` (default 0.5 if none) |
| `high_priority_rate` | 20% | completed high-priority / total high-priority (default 0.5 if none) |

**Result:** 0–100 (clamped). The breakdown of each component is returned alongside the score for transparency.

**Example:**
- 8/10 tasks completed → completion_rate = 0.8 → contributes 40
- 3/4 on-time → on_time_rate = 0.75 → contributes 22.5
- 2/2 high-priority done → high_priority_rate = 1.0 → contributes 20
- **Score = 82.5**

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register/` | ✗ | Register (rate: 3/min/IP) |
| POST | `/api/auth/login/` | ✗ | Login (rate: 5/min/IP) |
| POST | `/api/auth/refresh/` | ✗ | Refresh token (rate: 10/min/IP) |
| POST | `/api/auth/logout/` | ✓ | Blacklist refresh token |
| GET | `/api/auth/me/` | ✓ | Current user profile |

### Tasks
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tasks/` | ✓ | List tasks (filter, paginate) |
| POST | `/api/tasks/` | ✓ | Create task |
| GET | `/api/tasks/:id/` | ✓ | Task detail + history |
| PATCH | `/api/tasks/:id/` | ✓ | Update task |
| DELETE | `/api/tasks/:id/` | ✓ | Delete task |
| POST | `/api/tasks/:id/complete/` | ✓ | Mark completed |
| POST | `/api/tasks/:id/archive/` | ✓ | Archive |

### Feedback
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/feedback/` | ✓ | Submit feedback (rating 1-5) |
| GET | `/api/feedback/list/` | ✓ | List own feedback |

### Analytics
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/analytics/` | ✓ | Full dashboard data |
| GET | `/api/analytics/over-time/` | ✓ | Tasks per day/week/month |
| GET | `/api/analytics/productivity/` | ✓ | Productivity score + breakdown |

### Admin (staff only)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users/` | Admin | All users + task counts |
| PATCH | `/api/admin/users/:id/` | Admin | Toggle active/staff |
| GET | `/api/admin/tasks/` | Admin | All tasks (filterable) |
| GET | `/api/admin/analytics/` | Admin | Global analytics + top users |

### System
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health/` | ✗ | DB + cache health check |
| GET | `/api/docs/` | ✗ | Swagger UI |
| GET | `/api/schema/` | ✗ | OpenAPI schema |

---

## Rate Limiting

Implemented via `app/utils/ratelimit.py` using Django's cache backend (Redis in production).

| Endpoint group | Limit | Key |
|---|---|---|
| Login | 5 / minute | IP |
| Register | 3 / minute | IP |
| Token refresh | 10 / minute | IP |
| Task reads | 60 / minute | User |
| Task writes | 30 / minute | User |
| Analytics | 20 / minute | User |

Exceeded limit returns:
```json
{
  "success": false,
  "status_code": 429,
  "errors": { "detail": "Too many requests. Limit: 5 per 60s." },
  "retry_after": 60
}
```
Header: `Retry-After: 60`

If Redis is unavailable, rate limiting fails open (requests are allowed through) to prevent 500 errors.

---

## Frontend Architecture

### Pages & Routes

| Route | Component | Access |
|---|---|---|
| `/login` | `Login.jsx` | Public |
| `/signup` | `Signup.jsx` | Public |
| `/dashboard` | `Dashboard.jsx` | Protected |
| `/tasks` | `Tasks.jsx` | Protected |
| `/analytics` | `Analytics.jsx` | Protected |
| `/feedback` | `Feedback.jsx` | Protected |
| `/admin` | `Admin.jsx` | Staff only |

### Theme

Dark/light mode via CSS variables + Tailwind `darkMode: 'class'`.  
Theme persists in `localStorage`. On first visit, system preference (`prefers-color-scheme`) is used.

| Variable | Light | Dark |
|---|---|---|
| `--bg-base` | `#f1f5f9` | `#080810` |
| `--bg-surface` | `#ffffff` | `#0f0f1a` |
| `--text-primary` | `#0f172a` | `#f1f5f9` |

### Task History

Every task card has a **"View History"** menu option that opens a timeline modal showing:
- Action type badge (created / updated / completed / archived)
- Timestamp
- Previous state diff (what fields changed and from what value)

### Feedback

Submit via **"Feedback"** option in any task's menu.  
View all submitted feedback at `/feedback` — shows star rating, comment, linked task, and an average rating chart.
