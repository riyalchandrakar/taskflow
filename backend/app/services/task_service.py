"""
Task Service — business logic layer.
"""
from django.db import transaction
from app.models import Task, TaskHistory
from app.repositories.task_repository import TaskRepository


def _task_snapshot(task: Task) -> dict:
    """Capture current task state as JSON-serializable dict."""
    return {
        'title': task.title,
        'description': task.description,
        'priority': task.priority,
        'status': task.status,
        'due_date': task.due_date.isoformat() if task.due_date else None,
        'completed_at': task.completed_at.isoformat() if task.completed_at else None,
    }


class TaskService:

    @staticmethod
    def list_tasks(user, filters: dict = None):
        return TaskRepository.get_user_tasks(user, filters)

    @staticmethod
    def get_task(task_id, user) -> Task | None:
        return TaskRepository.get_task_by_id(task_id, user)

    @staticmethod
    @transaction.atomic
    def create_task(user, validated_data: dict) -> Task:
        task = TaskRepository.create_task(user, validated_data)
        TaskRepository.create_history(task, TaskHistory.ActionType.CREATED)
        return task

    @staticmethod
    @transaction.atomic
    def update_task(task: Task, validated_data: dict) -> Task:
        snapshot = _task_snapshot(task)
        updated = TaskRepository.update_task(task, validated_data)
        TaskRepository.create_history(updated, TaskHistory.ActionType.UPDATED, snapshot)
        return updated

    @staticmethod
    @transaction.atomic
    def complete_task(task: Task) -> Task:
        snapshot = _task_snapshot(task)
        completed = TaskRepository.mark_completed(task)
        TaskRepository.create_history(completed, TaskHistory.ActionType.COMPLETED, snapshot)
        return completed

    @staticmethod
    @transaction.atomic
    def archive_task(task: Task) -> Task:
        snapshot = _task_snapshot(task)
        archived = TaskRepository.archive_task(task)
        TaskRepository.create_history(archived, TaskHistory.ActionType.ARCHIVED, snapshot)
        return archived

    @staticmethod
    @transaction.atomic
    def delete_task(task: Task) -> None:
        snapshot = _task_snapshot(task)
        # Create history on task BEFORE deleting (task_id preserved via history)
        TaskRepository.create_history(task, TaskHistory.ActionType.DELETED, snapshot)
        TaskRepository.delete_task(task)
