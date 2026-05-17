from django.urls import path
from . import views

app_name = 'categories'

urlpatterns = [
    path('', views.activities, name='activities'),
    path('tasks/calendar/', views.tasks_calendar, name='tasks_calendar'),
    path('<int:category_id>/', views.category_detail, name='category_detail'),
]