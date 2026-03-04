import uuid
import django.contrib.auth.models
import django.core.validators
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=150)),
                ('email', models.EmailField(max_length=254, unique=True)),
                ('is_active', models.BooleanField(default=True)),
                ('is_staff', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('groups', models.ManyToManyField(
                    blank=True, related_name='user_set', related_query_name='user',
                    to='auth.group', verbose_name='groups'
                )),
                ('user_permissions', models.ManyToManyField(
                    blank=True, related_name='user_set', related_query_name='user',
                    to='auth.permission', verbose_name='user permissions'
                )),
            ],
            options={'db_table': 'users', 'ordering': ['-created_at']},
            managers=[('objects', django.contrib.auth.models.UserManager())],
        ),
        migrations.CreateModel(
            name='Task',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, default='')),
                ('priority', models.CharField(
                    choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')],
                    default='medium', max_length=10
                )),
                ('status', models.CharField(
                    choices=[('pending', 'Pending'), ('completed', 'Completed'), ('archived', 'Archived')],
                    default='pending', max_length=10
                )),
                ('due_date', models.DateTimeField(blank=True, null=True)),
                ('completed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='tasks',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'tasks', 'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['user', 'status'], name='tasks_user_status_idx'),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['user', 'priority'], name='tasks_user_priority_idx'),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['user', 'due_date'], name='tasks_user_due_date_idx'),
        ),
        migrations.AddIndex(
            model_name='task',
            index=models.Index(fields=['created_at'], name='tasks_created_at_idx'),
        ),
        migrations.CreateModel(
            name='TaskHistory',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('action_type', models.CharField(
                    choices=[('created', 'Created'), ('updated', 'Updated'), ('completed', 'Completed'),
                             ('deleted', 'Deleted'), ('archived', 'Archived')],
                    max_length=20
                )),
                ('previous_state', models.JSONField(blank=True, null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('task', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='history',
                    to='app.task',
                )),
            ],
            options={'db_table': 'task_history', 'ordering': ['-timestamp']},
        ),
        migrations.AddIndex(
            model_name='taskhistory',
            index=models.Index(fields=['task', 'action_type'], name='history_task_action_idx'),
        ),
        migrations.AddIndex(
            model_name='taskhistory',
            index=models.Index(fields=['timestamp'], name='history_timestamp_idx'),
        ),
        migrations.CreateModel(
            name='Feedback',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('comment', models.TextField()),
                ('rating', models.IntegerField(
                    validators=[
                        django.core.validators.MinValueValidator(1),
                        django.core.validators.MaxValueValidator(5),
                    ]
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('task', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='feedbacks',
                    to='app.task',
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='feedbacks',
                    to=settings.AUTH_USER_MODEL,
                )),
            ],
            options={'db_table': 'feedbacks', 'ordering': ['-created_at']},
        ),
    ]
