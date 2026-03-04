from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from drf_spectacular.utils import extend_schema

from app.serializers import UserRegistrationSerializer, UserSerializer, CustomTokenObtainPairSerializer
from app.utils.ratelimit import check_rate_limit


# ─── Login ────────────────────────────────────────────────────────────────────
class LoginView(TokenObtainPairView):
    """
    POST /api/auth/login/
    Rate limit: 5 requests / minute / IP
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        resp = check_rate_limit(request, group='login', key='ip')
        if resp:
            return resp
        return super().post(request, *args, **kwargs)


# ─── Token Refresh ────────────────────────────────────────────────────────────
class RateLimitedTokenRefreshView(TokenRefreshView):
    """
    POST /api/auth/refresh/
    Rate limit: 10 requests / minute / IP
    """
    def post(self, request, *args, **kwargs):
        resp = check_rate_limit(request, group='refresh', key='ip')
        if resp:
            return resp
        return super().post(request, *args, **kwargs)


# ─── Register ─────────────────────────────────────────────────────────────────
@extend_schema(
    request=UserRegistrationSerializer,
    responses={201: UserSerializer},
    description='Register a new user. Rate limited: 3 requests / minute / IP.',
)
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    resp = check_rate_limit(request, group='register', key='ip')
    if resp:
        return resp

    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(
        {'success': False, 'errors': serializer.errors},
        status=status.HTTP_400_BAD_REQUEST,
    )


# ─── Me ───────────────────────────────────────────────────────────────────────
@extend_schema(description='Get the currently authenticated user profile.')
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response({'success': True, 'user': UserSerializer(request.user).data})


# ─── Logout ───────────────────────────────────────────────────────────────────
@extend_schema(description='Logout — blacklists the provided refresh token.')
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'success': True, 'message': 'Logged out successfully.'})
    except Exception:
        return Response(
            {'success': False, 'errors': {'detail': 'Invalid token.'}},
            status=status.HTTP_400_BAD_REQUEST,
        )
