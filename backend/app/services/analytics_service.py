"""
Analytics Service — computes all dashboard metrics.

Productivity Score Formula:
    score = (completion_rate * 50)
          + (on_time_rate * 30)
          + (high_priority_rate * 20)

    - completion_rate:    completed / total tasks  (0–1)
    - on_time_rate:       tasks completed before due_date / tasks with due_date  (0–1)
    - high_priority_rate: completed high-priority / total high-priority  (0–1)

    Result: 0–100, clamped.
"""
from datetime import timedelta
from django.db.models import Count, Avg, F, Q, ExpressionWrapper, DurationField
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth, ExtractWeekDay
from django.utils import timezone
from app.models import Task
from app.repositories.task_repository import TaskRepository


class AnalyticsService:

    @staticmethod
    def get_summary(user) -> dict:
        tasks = TaskRepository.get_all_user_tasks(user)
        total = tasks.count()
        completed = tasks.filter(status=Task.Status.COMPLETED).count()
        pending = tasks.filter(status=Task.Status.PENDING).count()
        archived = tasks.filter(status=Task.Status.ARCHIVED).count()
        completion_pct = round((completed / total * 100), 1) if total else 0

        return {
            'total_tasks': total,
            'completed_tasks': completed,
            'pending_tasks': pending,
            'archived_tasks': archived,
            'completion_percentage': completion_pct,
        }

    @staticmethod
    def get_tasks_over_time(user, period: str = 'day') -> list:
        """Tasks completed grouped by day/week/month."""
        trunc_map = {
            'day': TruncDate,
            'week': TruncWeek,
            'month': TruncMonth,
        }
        trunc_fn = trunc_map.get(period, TruncDate)

        qs = (
            Task.objects
            .filter(user=user, status=Task.Status.COMPLETED, completed_at__isnull=False)
            .annotate(period=trunc_fn('completed_at'))
            .values('period')
            .annotate(count=Count('id'))
            .order_by('period')
        )
        return [{'date': str(row['period']), 'count': row['count']} for row in qs]

    @staticmethod
    def get_most_productive_day(user) -> dict:
        """Day of week with most task completions (1=Sunday, 2=Monday, ..., 7=Saturday)."""
        day_names = {1: 'Sunday', 2: 'Monday', 3: 'Tuesday', 4: 'Wednesday',
                     5: 'Thursday', 6: 'Friday', 7: 'Saturday'}
        qs = (
            Task.objects
            .filter(user=user, status=Task.Status.COMPLETED, completed_at__isnull=False)
            .annotate(dow=ExtractWeekDay('completed_at'))
            .values('dow')
            .annotate(count=Count('id'))
            .order_by('-count')
            .first()
        )
        if not qs:
            return {'day': None, 'count': 0}
        return {'day': day_names.get(qs['dow'], 'Unknown'), 'count': qs['count']}

    @staticmethod
    def get_avg_completion_time(user) -> dict:
        """Average hours between task creation and completion."""
        qs = Task.objects.filter(
            user=user,
            status=Task.Status.COMPLETED,
            completed_at__isnull=False
        ).annotate(
            duration=ExpressionWrapper(
                F('completed_at') - F('created_at'),
                output_field=DurationField()
            )
        ).aggregate(avg_duration=Avg('duration'))

        avg = qs['avg_duration']
        if avg is None:
            return {'hours': 0, 'formatted': 'N/A'}

        total_hours = avg.total_seconds() / 3600
        days = int(total_hours // 24)
        hours = int(total_hours % 24)

        if days > 0:
            formatted = f'{days}d {hours}h'
        else:
            formatted = f'{hours}h {int((total_hours % 1) * 60)}m'

        return {'hours': round(total_hours, 2), 'formatted': formatted}

    @staticmethod
    def get_priority_distribution(user) -> list:
        qs = (
            Task.objects
            .filter(user=user)
            .values('priority')
            .annotate(count=Count('id'))
            .order_by('priority')
        )
        return [{'priority': row['priority'], 'count': row['count']} for row in qs]

    @staticmethod
    def get_productivity_score(user) -> dict:
        tasks = TaskRepository.get_all_user_tasks(user)
        total = tasks.count()
        if total == 0:
            return {'score': 0, 'breakdown': {}}

        completed = tasks.filter(status=Task.Status.COMPLETED).count()
        completion_rate = completed / total

        # On-time rate
        tasks_with_due = tasks.filter(due_date__isnull=False, status=Task.Status.COMPLETED)
        on_time = tasks_with_due.filter(completed_at__lte=F('due_date')).count()
        total_with_due = tasks_with_due.count()
        on_time_rate = (on_time / total_with_due) if total_with_due else 0.5  # neutral if no due dates

        # High priority completion rate
        high_priority_total = tasks.filter(priority=Task.Priority.HIGH).count()
        high_priority_done = tasks.filter(
            priority=Task.Priority.HIGH,
            status=Task.Status.COMPLETED
        ).count()
        high_priority_rate = (high_priority_done / high_priority_total) if high_priority_total else 0.5

        score = (completion_rate * 50) + (on_time_rate * 30) + (high_priority_rate * 20)
        score = min(100, max(0, round(score, 1)))

        return {
            'score': score,
            'breakdown': {
                'completion_rate': round(completion_rate * 100, 1),
                'on_time_rate': round(on_time_rate * 100, 1),
                'high_priority_rate': round(high_priority_rate * 100, 1),
            }
        }

    @staticmethod
    def get_full_analytics(user) -> dict:
        return {
            **AnalyticsService.get_summary(user),
            'tasks_over_time': AnalyticsService.get_tasks_over_time(user),
            'tasks_per_week': AnalyticsService.get_tasks_over_time(user, 'week'),
            'tasks_per_month': AnalyticsService.get_tasks_over_time(user, 'month'),
            'most_productive_day': AnalyticsService.get_most_productive_day(user),
            'avg_completion_time': AnalyticsService.get_avg_completion_time(user),
            'priority_distribution': AnalyticsService.get_priority_distribution(user),
            'productivity_score': AnalyticsService.get_productivity_score(user),
        }
