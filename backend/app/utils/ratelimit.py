"""
Rate limiting helpers for TaskFlow.

django-ratelimit works via the @ratelimit decorator, but DRF function-based
views need a small adapter because ratelimit normally raises Ratelimited on
GET requests via middleware — here we check the flag manually so we can
return a proper JSON 429 response instead of an HTML error page.

Usage:
    from app.utils.ratelimit import check_rate_limit

    @api_view(['POST'])
    def my_view(request):
        check_rate_limit(request, group='login', rate='5/m', key='ip')
        ...
"""

from django.conf import settings
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework import status


# ─── Tiny manual rate-limiter ─────────────────────────────────────────────────
# We roll a lightweight counter instead of django-ratelimit's decorator so we
# can plug cleanly into DRF's @api_view pattern and always return JSON 429.

def _parse_rate(rate: str) -> tuple[int, int]:
    """
    Parse a rate string like '5/m', '10/h', '100/d' into (limit, window_seconds).
    """
    count_str, period = rate.split('/')
    count = int(count_str)
    window = {'s': 1, 'm': 60, 'h': 3600, 'd': 86400}.get(period.lower(), 60)
    return count, window


def _get_key(request, group: str, key: str) -> str:
    """Build a unique cache key for this (group, identity)."""
    if key == 'ip':
        ip = (
            request.META.get('HTTP_X_FORWARDED_FOR', '').split(',')[0].strip()
            or request.META.get('REMOTE_ADDR', 'unknown')
        )
        identity = ip
    elif key == 'user':
        identity = str(request.user.pk) if request.user.is_authenticated else 'anon'
    else:
        identity = key  # allow arbitrary string keys
    return f'rl:{group}:{identity}'


def check_rate_limit(request, group: str, rate: str = None, key: str = 'ip'):
    """
    Increment the counter for (group, identity).
    Returns a 429 Response if the limit is exceeded, otherwise None.

    Call at the TOP of any view:
        resp = check_rate_limit(request, 'login', rate='5/m', key='ip')
        if resp: return resp
    """
    # Allow per-call override; fall back to settings.RATE_LIMITS
    if rate is None:
        rate = getattr(settings, 'RATE_LIMITS', {}).get(group, '60/m')

    limit, window = _parse_rate(rate)
    cache_key = _get_key(request, group, key)

    # Atomic increment via cache.add (sets to 1 if missing) + cache.incr
    if not cache.add(cache_key, 1, timeout=window):
        try:
            current = cache.incr(cache_key)
        except ValueError:
            # Key expired between add and incr — reset
            cache.set(cache_key, 1, timeout=window)
            current = 1
    else:
        current = 1

    if current > limit:
        retry_after = window  # simplification: full window remaining
        return Response(
            {
                'success': False,
                'status_code': 429,
                'errors': {
                    'detail': f'Too many requests. Limit: {limit} per {window}s. Please try again later.',
                },
                'retry_after': retry_after,
            },
            status=status.HTTP_429_TOO_MANY_REQUESTS,
            headers={'Retry-After': str(retry_after)},
        )
    return None  # not rate-limited
