from django.urls import path, include
from users import views
from rest_framework.routers import DefaultRouter
from .api_views import UserProfileViewSet

router = DefaultRouter()
router.register(r'profile', UserProfileViewSet, basename='api-profile')

app_name = 'users'

urlpatterns = [
    path('payment/', views.payment, name='payment'),
    path('login/', views.login, name='login'),
    path('registration/', views.registration, name='registration'),
    path('profile/', views.profile, name='profile'),
    path('logout/', views.logout, name='logout'),
    path('export/', views.export_tasks, name='export_tasks'),
    path('webhook/', views.yookassa_webhook, name='yookassa_webhook'),
    path('activate-promo/', views.activate_promo, name='activate_promo'),
    path('', include(router.urls)),
]