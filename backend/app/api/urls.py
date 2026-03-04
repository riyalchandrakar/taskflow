from django.urls import path

from app.api.auth_views import LoginView, RateLimitedTokenRefreshView, register, me, logout
from app.api.task_views import (
    task_list_create, task_detail, complete_task, archive_task, create_feedback,
)
from app.api.analytics_views import analytics_dashboard, tasks_over_time, productivity_score
from app.api.health_views import health_check

urlpatterns = [
    # ─── Health (public, no auth) ───────────────────────────────────
    path('health/', health_check, name='health-check'),

    # ─── Auth ───────────────────────────────────────────────────────
    path('auth/register/', register,                              name='auth-register'),
    path('auth/login/',    LoginView.as_view(),                   name='auth-login'),
    path('auth/refresh/',  RateLimitedTokenRefreshView.as_view(), name='auth-refresh'),
    path('auth/logout/',   logout,                                name='auth-logout'),
    path('auth/me/',       me,                                    name='auth-me'),

    # ─── Tasks ──────────────────────────────────────────────────────
    path('tasks/',                           task_list_create, name='task-list-create'),
    path('tasks/<uuid:task_id>/',            task_detail,      name='task-detail'),
    path('tasks/<uuid:task_id>/complete/',   complete_task,    name='task-complete'),
    path('tasks/<uuid:task_id>/archive/',    archive_task,     name='task-archive'),

    # ─── Feedback ───────────────────────────────────────────────────
    path('feedback/', create_feedback, name='feedback-create'),

    # ─── Analytics ──────────────────────────────────────────────────
    path('analytics/',             analytics_dashboard, name='analytics-dashboard'),
    path('analytics/over-time/',   tasks_over_time,     name='analytics-over-time'),
    path('analytics/productivity/', productivity_score, name='analytics-productivity'),
]
