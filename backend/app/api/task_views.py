from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from app.serializers import (
    TaskSerializer, TaskListSerializer,
    TaskCreateSerializer, TaskUpdateSerializer, FeedbackSerializer
)
from app.services.task_service import TaskService
from app.core.pagination import StandardPagination
from app.models import Feedback


@extend_schema(
    parameters=[
        OpenApiParameter('status', OpenApiTypes.STR, enum=['pending', 'completed', 'archived']),
        OpenApiParameter('priority', OpenApiTypes.STR, enum=['low', 'medium', 'high']),
        OpenApiParameter('search', OpenApiTypes.STR),
        OpenApiParameter('due_date_from', OpenApiTypes.DATETIME),
        OpenApiParameter('due_date_to', OpenApiTypes.DATETIME),
        OpenApiParameter('page', OpenApiTypes.INT),
        OpenApiParameter('page_size', OpenApiTypes.INT),
    ],
    description='List all tasks for the authenticated user with filtering and pagination.'
)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_list_create(request):
    if request.method == 'GET':
        filters = {
            'status': request.query_params.get('status'),
            'priority': request.query_params.get('priority'),
            'due_date_from': request.query_params.get('due_date_from'),
            'due_date_to': request.query_params.get('due_date_to'),
            'search': request.query_params.get('search'),
        }
        # Remove None values
        filters = {k: v for k, v in filters.items() if v}

        queryset = TaskService.list_tasks(request.user, filters)

        # Ordering
        ordering = request.query_params.get('ordering', '-created_at')
        allowed_orderings = ['created_at', '-created_at', 'due_date', '-due_date',
                             'priority', '-priority', 'title', '-title']
        if ordering in allowed_orderings:
            queryset = queryset.order_by(ordering)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)
        serializer = TaskListSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    elif request.method == 'POST':
        serializer = TaskCreateSerializer(data=request.data)
        if serializer.is_valid():
            task = TaskService.create_task(request.user, serializer.validated_data)
            return Response(
                {'success': True, 'task': TaskSerializer(task).data},
                status=status.HTTP_201_CREATED
            )
        return Response({'success': False, 'errors': serializer.errors},
                        status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def task_detail(request, task_id):
    task = TaskService.get_task(task_id, request.user)
    if not task:
        return Response({'success': False, 'errors': {'detail': 'Task not found.'}},
                        status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response({'success': True, 'task': TaskSerializer(task).data})

    elif request.method in ('PUT', 'PATCH'):
        partial = request.method == 'PATCH'
        serializer = TaskUpdateSerializer(task, data=request.data, partial=partial)
        if serializer.is_valid():
            updated = TaskService.update_task(task, serializer.validated_data)
            return Response({'success': True, 'task': TaskSerializer(updated).data})
        return Response({'success': False, 'errors': serializer.errors},
                        status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        TaskService.delete_task(task)
        return Response({'success': True, 'message': 'Task deleted.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_task(request, task_id):
    task = TaskService.get_task(task_id, request.user)
    if not task:
        return Response({'success': False, 'errors': {'detail': 'Task not found.'}},
                        status=status.HTTP_404_NOT_FOUND)
    if task.status == 'completed':
        return Response({'success': False, 'errors': {'detail': 'Task already completed.'}},
                        status=status.HTTP_400_BAD_REQUEST)
    completed = TaskService.complete_task(task)
    return Response({'success': True, 'task': TaskSerializer(completed).data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def archive_task(request, task_id):
    task = TaskService.get_task(task_id, request.user)
    if not task:
        return Response({'success': False, 'errors': {'detail': 'Task not found.'}},
                        status=status.HTTP_404_NOT_FOUND)
    archived = TaskService.archive_task(task)
    return Response({'success': True, 'task': TaskSerializer(archived).data})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_feedback(request):
    serializer = FeedbackSerializer(data=request.data)
    if serializer.is_valid():
        # Ensure task belongs to user if provided
        task = serializer.validated_data.get('task')
        if task and task.user != request.user:
            return Response({'success': False, 'errors': {'task': 'Invalid task.'}},
                            status=status.HTTP_403_FORBIDDEN)
        feedback = serializer.save(user=request.user)
        return Response({'success': True, 'feedback': FeedbackSerializer(feedback).data},
                        status=status.HTTP_201_CREATED)
    return Response({'success': False, 'errors': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST)
