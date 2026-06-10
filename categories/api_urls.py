from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import CategoryViewSet, TaskViewSet, StatsViewSet
from .api_views import GoalViewSet


router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='api-categories')
router.register(r'tasks', TaskViewSet, basename='api-tasks')
router.register(r'stats', StatsViewSet, basename='api-stats')
router.register(r'goals', GoalViewSet, basename='api-goals')

urlpatterns = [
    path('', include(router.urls)),
]