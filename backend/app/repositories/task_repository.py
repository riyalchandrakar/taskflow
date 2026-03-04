"""
Task Repository — data access layer for Task and TaskHistory models.
"""
from django.utils import timezone
from django.db.models import QuerySet
from app.models import Task, TaskHistory


class TaskRepository:

    @staticmethod
    def get_user_tasks(user, filters: dict = None) -> QuerySet:
        qs = Task.objects.filter(user=user)
        if filters:
            status = filters.get('status')
            priority = filters.get('priority')
            due_date_from = filters.get('due_date_from')
            due_date_to = filters.get('due_date_to')
            search = filters.get('search')

            if status:
                qs = qs.filter(status=status)
            if priority:
                qs = qs.filter(priority=priority)
            if due_date_from:
                qs = qs.filter(due_date__gte=due_date_from)
            if due_date_to:
                qs = qs.filter(due_date__lte=due_date_to)
            if search:
                qs = qs.filter(title__icontains=search)
        return qs

    @staticmethod
    def get_task_by_id(task_id, user) -> Task | None:
        try:
            return Task.objects.get(id=task_id, user=user)
        except Task.DoesNotExist:
            return None

    @staticmethod
    def create_task(user, data: dict) -> Task:
        return Task.objects.create(user=user, **data)

    @staticmethod
    def update_task(task: Task, data: dict) -> Task:
        for key, value in data.items():
            setattr(task, key, value)
        task.save()
        return task

    @staticmethod
    def mark_completed(task: Task) -> Task:
        task.status = Task.Status.COMPLETED
        task.completed_at = timezone.now()
        task.save()
        return task

    @staticmethod
    def archive_task(task: Task) -> Task:
        task.status = Task.Status.ARCHIVED
        task.save()
        return task

    @staticmethod
    def delete_task(task: Task) -> None:
        task.delete()

    @staticmethod
    def create_history(task: Task, action_type: str, previous_state: dict = None) -> TaskHistory:
        return TaskHistory.objects.create(
            task=task,
            action_type=action_type,
            previous_state=previous_state
        )

    @staticmethod
    def get_all_user_tasks(user) -> QuerySet:
        """Return ALL tasks for analytics (no pagination)."""
        return Task.objects.filter(user=user)
