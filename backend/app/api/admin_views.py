"""
Admin-only API views.
All endpoints require: is_authenticated + is_staff = True
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema

from app.models import Task, Feedback
from app.serializers import UserSerializer, TaskListSerializer
from app.services.analytics_service import AnalyticsService
from app.core.pagination import StandardPagination

User = get_user_model()


class IsStaffUser(IsAuthenticated):
    """Allow only is_staff users."""
    def has_permission(self, request, view):
        return super().has_permission(request, view) and bool(request.user.is_staff)


# ─── All Users ────────────────────────────────────────────────────────────────
@extend_schema(description='Admin: list all registered users with task counts.')
@api_view(['GET'])
@permission_classes([IsStaffUser])
def admin_users(request):
    users = User.objects.all().order_by('-created_at')

    # Annotate task counts
    from django.db.models import Count, Q
    users = users.annotate(
        total_tasks=Count('tasks'),
        completed_tasks=Count('tasks', filter=Q(tasks__status='completed')),
    )

    paginator = StandardPagination()
    page = paginator.paginate_queryset(users, request)

    data = []
    for u in page:
        data.append({
            'id': str(u.id),
            'name': u.name,
            'email': u.email,
            'is_staff': u.is_staff,
            'is_active': u.is_active,
            'created_at': u.created_at.isoformat(),
            'total_tasks': u.total_tasks,
            'completed_tasks': u.completed_tasks,
        })

    return paginator.get_paginated_response(data)


# ─── All Tasks ────────────────────────────────────────────────────────────────
@extend_schema(description='Admin: list all tasks across all users.')
@api_view(['GET'])
@permission_classes([IsStaffUser])
def admin_tasks(request):
    qs = Task.objects.select_related('user').order_by('-created_at')

    # Optional filters
    status_filter   = request.query_params.get('status')
    priority_filter = request.query_params.get('priority')
    user_id         = request.query_params.get('user_id')
    search          = request.query_params.get('search')

    if status_filter:   qs = qs.filter(status=status_filter)
    if priority_filter: qs = qs.filter(priority=priority_filter)
    if user_id:         qs = qs.filter(user__id=user_id)
    if search:          qs = qs.filter(title__icontains=search)

    paginator = StandardPagination()
    page = paginator.paginate_queryset(qs, request)

    data = []
    for t in page:
        data.append({
            'id': str(t.id),
            'title': t.title,
            'description': t.description,
            'priority': t.priority,
            'status': t.status,
            'due_date': t.due_date.isoformat() if t.due_date else None,
            'completed_at': t.completed_at.isoformat() if t.completed_at else None,
            'created_at': t.created_at.isoformat(),
            'updated_at': t.updated_at.isoformat(),
            'user': {
                'id': str(t.user.id),
                'name': t.user.name,
                'email': t.user.email,
            },
        })

    return paginator.get_paginated_response(data)


# ─── Global Analytics ─────────────────────────────────────────────────────────
@extend_schema(description='Admin: global analytics across all users.')
@api_view(['GET'])
@permission_classes([IsStaffUser])
def admin_analytics(request):
    from django.db.models import Count, Avg, F, ExpressionWrapper, DurationField, Q
    from django.db.models.functions import TruncDate

    total_users = User.objects.count()
    total_tasks = Task.objects.count()
    completed   = Task.objects.filter(status='completed').count()
    pending     = Task.objects.filter(status='pending').count()
    archived    = Task.objects.filter(status='archived').count()
    completion_pct = round(completed / total_tasks * 100, 1) if total_tasks else 0

    # Priority distribution
    priority_dist = list(
        Task.objects.values('priority')
        .annotate(count=Count('id'))
        .order_by('priority')
    )

    # Tasks completed per day (last 30 days)
    from django.utils import timezone
    from datetime import timedelta
    thirty_days_ago = timezone.now() - timedelta(days=30)
    daily = list(
        Task.objects.filter(
            status='completed',
            completed_at__gte=thirty_days_ago
        )
        .annotate(date=TruncDate('completed_at'))
        .values('date')
        .annotate(count=Count('id'))
        .order_by('date')
    )
    daily_data = [{'date': str(d['date']), 'count': d['count']} for d in daily]

    # Avg completion time globally
    avg_qs = Task.objects.filter(
        status='completed', completed_at__isnull=False
    ).annotate(
        duration=ExpressionWrapper(
            F('completed_at') - F('created_at'),
            output_field=DurationField()
        )
    ).aggregate(avg=Avg('duration'))

    avg_dur = avg_qs['avg']
    if avg_dur:
        total_hours = avg_dur.total_seconds() / 3600
        days = int(total_hours // 24)
        hours = int(total_hours % 24)
        avg_time_fmt = f'{days}d {hours}h' if days else f'{hours}h {int((total_hours % 1)*60)}m'
    else:
        total_hours = 0
        avg_time_fmt = 'N/A'

    # Top 5 most productive users
    top_users = list(
        User.objects.annotate(done=Count('tasks', filter=Q(tasks__status='completed')))
        .order_by('-done')[:5]
        .values('id', 'name', 'email', 'done')
    )
    for u in top_users:
        u['id'] = str(u['id'])

    return Response({
        'success': True,
        'total_users': total_users,
        'total_tasks': total_tasks,
        'completed_tasks': completed,
        'pending_tasks': pending,
        'archived_tasks': archived,
        'completion_percentage': completion_pct,
        'priority_distribution': priority_dist,
        'tasks_over_time': daily_data,
        'avg_completion_time': {'hours': round(total_hours, 2), 'formatted': avg_time_fmt},
        'top_users': top_users,
    })


# ─── Toggle user active/staff ─────────────────────────────────────────────────
@extend_schema(description='Admin: toggle is_active or is_staff for a user.')
@api_view(['PATCH'])
@permission_classes([IsStaffUser])
def admin_update_user(request, user_id):
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({'success': False, 'errors': {'detail': 'User not found.'}},
                        status=status.HTTP_404_NOT_FOUND)

    # Prevent self-demotion
    if user == request.user:
        return Response({'success': False, 'errors': {'detail': 'Cannot modify your own account.'}},
                        status=status.HTTP_400_BAD_REQUEST)

    if 'is_active' in request.data:
        user.is_active = bool(request.data['is_active'])
    if 'is_staff' in request.data:
        user.is_staff = bool(request.data['is_staff'])
    user.save()

    return Response({'success': True, 'user': {
        'id': str(user.id), 'name': user.name,
        'email': user.email, 'is_active': user.is_active, 'is_staff': user.is_staff,
    }})
