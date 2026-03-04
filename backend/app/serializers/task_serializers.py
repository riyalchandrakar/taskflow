from rest_framework import serializers
from app.models import Task, TaskHistory, Feedback


class TaskHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskHistory
        fields = ['id', 'action_type', 'previous_state', 'timestamp']
        read_only_fields = fields


class TaskSerializer(serializers.ModelSerializer):
    history = TaskHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'priority', 'status',
            'due_date', 'completed_at', 'created_at', 'updated_at', 'history'
        ]
        read_only_fields = ['id', 'completed_at', 'created_at', 'updated_at']


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list endpoints (no history)."""

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'priority', 'status',
            'due_date', 'completed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'completed_at', 'created_at', 'updated_at']


class TaskCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['title', 'description', 'priority', 'due_date']

    def validate_title(self, value):
        if not value.strip():
            raise serializers.ValidationError('Title cannot be blank.')
        return value.strip()


class TaskUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ['title', 'description', 'priority', 'status', 'due_date']

    def validate_title(self, value):
        if value is not None and not value.strip():
            raise serializers.ValidationError('Title cannot be blank.')
        return value.strip() if value else value


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Feedback
        fields = ['id', 'task', 'comment', 'rating', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError('Rating must be between 1 and 5.')
        return value
