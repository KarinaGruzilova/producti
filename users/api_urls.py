# users/api_urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import UserProfileViewSet, CreatePaymentView

router = DefaultRouter()
router.register(r'profile', UserProfileViewSet, basename='api-profile')

urlpatterns = [
    path('create-payment/', CreatePaymentView.as_view(), name='create-payment'),
    path('', include(router.urls)),
]