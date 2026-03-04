# TaskFlow — Task Management System

A full-stack task management system with JWT authentication, analytics, and a modern dark UI.

**Stack:** Django 5 · React 18 · PostgreSQL (Neon) · Tailwind CSS · Recharts

---

## Project Structure

```
taskflow/
├── backend/                  # Django + DRF
│   ├── app/
│   │   ├── api/              # View layer (auth, tasks, analytics)
│   │   ├── models/           # User, Task, TaskHistory, Feedback
│   │   ├── serializers/      # DRF serializers + validation
│   │   ├── services/         # Business logic (TaskService, AnalyticsService)
│   │   ├── repositories/     # Data access layer (TaskRepository)
│   │   ├── core/             # Pagination, exception handler
│   │   └── migrations/
│   ├── config/               # settings.py, urls.py, wsgi.py
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/                 # React + Vite + Tailwind
    ├── src/
    │   ├── pages/            # Login, Signup, Dashboard, Tasks, Analytics
    │   ├── components/       # Layout, UI components
    │   ├── context/          # AuthContext (global auth state)
    │   ├── services/         # API service layer (api.js, auth.js, tasks.js, analytics.js)
    │   └── index.css
    ├── package.json
    └── .env.example
```

---

## Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+
- A Neon (or any PostgreSQL) database

---

### Backend Setup

```bash
cd taskflow/backend

# 1. Create virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your Neon DB credentials and a secret key

# 4. Run migrations
python manage.py migrate

# 5. (Optional) Create superuser
python manage.py createsuperuser

# 6. Start dev server
python manage.py runserver
```

Backend runs on: http://localhost:8000
API docs (Swagger): http://localhost:8000/api/docs/

---

### Frontend Setup

```bash
cd taskflow/frontend

# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit VITE_API_URL if your backend is not on localhost:8000

# 3. Start dev server
npm run dev
```

Frontend runs on: http://localhost:5173

---

### Environment Variables

**Backend `.env`:**
```env
SECRET_KEY=your-super-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Neon PostgreSQL connection string
# Get it from: Neon Console → Project → Connection Details → Connection string
DATABASE_URL=postgresql://neondb_owner:your_password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require

CORS_ALLOWED_ORIGINS=http://localhost:5173
```

**Frontend `.env`:**
```env
VITE_API_URL=http://localhost:8000/api
```

---

### Database Migration Steps

```bash
# Initial migration (first time)
python manage.py makemigrations app
python manage.py migrate

# After model changes
python manage.py makemigrations
python manage.py migrate
```

---

## JWT Implementation

### Flow

```
1. REGISTER  POST /api/auth/register/
   → Returns access_token (15min) + refresh_token (7 days) + user info

2. LOGIN      POST /api/auth/login/
   → Same response as register

3. REQUESTS   All protected endpoints require:
   Authorization: Bearer <access_token>

4. REFRESH    POST /api/auth/refresh/
   Body: { "refresh": "<refresh_token>" }
   → Returns new access_token (old refresh rotated + blacklisted)

5. LOGOUT     POST /api/auth/logout/
   Body: { "refresh": "<refresh_token>" }
   → Blacklists the refresh token
```

### Token Configuration (settings.py)
| Setting | Value |
|---|---|
| ACCESS_TOKEN_LIFETIME | 15 minutes |
| REFRESH_TOKEN_LIFETIME | 7 days |
| ROTATE_REFRESH_TOKENS | True |
| BLACKLIST_AFTER_ROTATION | True |
| ALGORITHM | HS256 |

### Frontend Token Handling
The `src/services/api.js` Axios interceptor:
1. Attaches `Authorization: Bearer <token>` on every request
2. On 401 response: queues pending requests, calls `/auth/refresh/`, retries all queued requests
3. If refresh fails: clears storage and redirects to `/login`

---

## Database Schema (ER Diagram Description)

### Entities & Relationships

```
users (1) ──────< tasks (many)
tasks (1) ──────< task_history (many)
users (1) ──────< feedbacks (many)
tasks (1) ──────< feedbacks (many, optional)
```

### Indexes
- `tasks(user_id, status)` — fast filter by status per user
- `tasks(user_id, priority)` — fast filter by priority per user
- `tasks(user_id, due_date)` — fast date range queries
- `tasks(created_at)` — chronological listing
- `task_history(task_id, action_type)` — audit log lookups
- `task_history(timestamp)` — time-based history queries

---

## Analytics Logic

All analytics are calculated server-side in `app/services/analytics_service.py`.

| Metric | Calculation |
|---|---|
| Total tasks | `COUNT(tasks WHERE user=me)` |
| Completed | `COUNT(tasks WHERE status='completed')` |
| Completion % | `completed / total * 100` |
| Tasks over time | `GROUP BY TruncDate/Week/Month(completed_at)` |
| Most productive day | `ExtractWeekDay(completed_at)` grouped + count |
| Avg completion time | `AVG(completed_at - created_at)` |
| Priority distribution | `GROUP BY priority, COUNT(*)` |

---

## Productivity Score Formula

```
Score = (completion_rate × 50) + (on_time_rate × 30) + (high_priority_rate × 20)
```

| Component | Weight | Description |
|---|---|---|
| `completion_rate` | 50% | `completed / total` tasks |
| `on_time_rate` | 30% | tasks completed before `due_date` / tasks with `due_date` (defaults to 0.5 if no due dates) |
| `high_priority_rate` | 20% | completed high-priority / total high-priority (defaults to 0.5 if none) |

**Result:** 0–100 (clamped). Higher score = more productive.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login (get tokens) |
| POST | `/api/auth/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Logout (blacklist refresh) |
| GET | `/api/auth/me/` | Get current user |
| GET | `/api/tasks/` | List tasks (filter, paginate) |
| POST | `/api/tasks/` | Create task |
| GET | `/api/tasks/:id/` | Get task detail + history |
| PATCH | `/api/tasks/:id/` | Update task |
| DELETE | `/api/tasks/:id/` | Delete task |
| POST | `/api/tasks/:id/complete/` | Mark complete |
| POST | `/api/tasks/:id/archive/` | Archive task |
| POST | `/api/feedback/` | Submit feedback |
| GET | `/api/analytics/` | Full dashboard analytics |
| GET | `/api/analytics/over-time/` | Tasks over time |
| GET | `/api/analytics/productivity/` | Productivity score |

Full interactive docs: `GET /api/docs/`
