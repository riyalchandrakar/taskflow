from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from app.services.analytics_service import AnalyticsService
from app.utils.ratelimit import check_rate_limit


@extend_schema(description='Full analytics dashboard. Rate limit: 20/min/user.')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_dashboard(request):
    resp = check_rate_limit(request, group='analytics', key='user')
    if resp:
        return resp
    data = AnalyticsService.get_full_analytics(request.user)
    return Response({'success': True, **data})


@extend_schema(
    parameters=[
        OpenApiParameter('period', OpenApiTypes.STR, enum=['day', 'week', 'month']),
    ],
    description='Tasks completed over time, grouped by period. Rate limit: 20/min/user.',
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tasks_over_time(request):
    resp = check_rate_limit(request, group='analytics', key='user')
    if resp:
        return resp
    period = request.query_params.get('period', 'day')
    if period not in ('day', 'week', 'month'):
        period = 'day'
    data = AnalyticsService.get_tasks_over_time(request.user, period)
    return Response({'success': True, 'period': period, 'data': data})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def productivity_score(request):
    resp = check_rate_limit(request, group='analytics', key='user')
    if resp:
        return resp
    data = AnalyticsService.get_productivity_score(request.user)
    return Response({'success': True, **data})
