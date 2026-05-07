from django.urls import path
from . import views

app_name = 'categories'

urlpatterns = [
    path('', views.activities, name='activities'),
    path('<int:category_id>/', views.category_detail, name='category_detail'),
]