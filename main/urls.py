from main import views
from django.urls import path

app_name = 'main'

urlpatterns = [
    path('', views.index, name='index'),
    path('proversion/', views.proversion, name='proversion'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('api/save-timer/', views.save_timer_result, name='save_timer'),
    path('api/activate-pro/', views.activate_pro, name='activate-pro'),
]