import uuid
from django.db import models


class TaskHistory(models.Model):
    class ActionType(models.TextChoices):
        CREATED = 'created', 'Created'
        UPDATED = 'updated', 'Updated'
        COMPLETED = 'completed', 'Completed'
        DELETED = 'deleted', 'Deleted'
        ARCHIVED = 'archived', 'Archived'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    task = models.ForeignKey(
        'app.Task',
        on_delete=models.CASCADE,
        related_name='history'
    )
    action_type = models.CharField(max_length=20, choices=ActionType.choices)
    previous_state = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'task_history'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['task', 'action_type']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f'{self.task.title} - {self.action_type} at {self.timestamp}'
