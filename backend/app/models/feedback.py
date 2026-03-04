import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Feedback(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        'app.User',
        on_delete=models.CASCADE,
        related_name='feedbacks'
    )
    task = models.ForeignKey(
        'app.Task',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feedbacks'
    )
    comment = models.TextField()
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'feedbacks'
        ordering = ['-created_at']

    def __str__(self):
        return f'Feedback by {self.user.name} - Rating: {self.rating}/5'
