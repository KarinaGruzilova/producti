from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import CategoryViewSet, TaskViewSet, StatsViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='api-categories')
router.register(r'tasks', TaskViewSet, basename='api-tasks')
router.register(r'stats', StatsViewSet, basename='api-stats')

urlpatterns = [
    path('', include(router.urls)),
]