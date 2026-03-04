from django.db import connection
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    GET /api/health/
    Tests DB and cache connectivity. Use this to diagnose 500 errors.
    """
    status = {'status': 'ok', 'db': 'unknown', 'cache': 'unknown'}
    http_status = 200

    # ── DB check ──────────────────────────────────────────────────────────────
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
        status['db'] = 'ok'
    except Exception as e:
        status['db'] = f'error: {str(e)}'
        status['status'] = 'degraded'
        http_status = 503

    # ── Cache check ───────────────────────────────────────────────────────────
    try:
        cache.set('health_check', 'ok', timeout=5)
        val = cache.get('health_check')
        status['cache'] = 'ok' if val == 'ok' else 'miss'
    except Exception as e:
        status['cache'] = f'error: {str(e)}'
        # cache failure is non-fatal, don't change http_status

    return Response(status, status=http_status)
