# users/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import UserProfileViewSet

router = DefaultRouter()
router.register(r'profile', UserProfileViewSet, basename='api-profile')

urlpatterns = [
    path('', include(router.urls)),
]