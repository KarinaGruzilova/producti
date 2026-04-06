from . import views
from django.urls import path
from .views import delete_category

app_name = 'categories'

urlpatterns = [
    path('activities/', views.activities, name='activities'),
    path('goals/', views.goals, name='goals'),
    path('create/', views.create_category, name='create'),
    path('api/list/', views.get_user_categories, name='api_list'),
    path('delete/<int:category_id>/', delete_category, name='delete_category'),
    path('<int:category_id>/', views.category_detail, name='category_detail'),
]