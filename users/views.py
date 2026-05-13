from django.http import HttpResponseRedirect
from django.shortcuts import redirect, render
from django.contrib import auth
from django.urls import reverse

from users.forms import UserLoginForm
from users.forms import UserRegistrationForm

from django.contrib import messages

def login(request):
    if request.method == 'POST':
        form = UserLoginForm(data=request.POST)
        if form.is_valid():
            username = request.POST['username']
            password = request.POST['password']
            user = auth.authenticate(username=username,password=password)
            if user:
                auth.login(request,user)
                return HttpResponseRedirect(reverse('main:dashboard'))
    else:
        form = UserLoginForm()
    context = {
        'title':'Producti - Авторизация',
        'form': form
    }
    return render(request, 'users/login.html', context)

def registration(request):
    if request.method == 'POST':
        form = UserRegistrationForm(data=request.POST)
        if form.is_valid():
            form.save()
            user = form.instance
            auth.login(request, user)
            return HttpResponseRedirect(reverse('main:dashboard'))
    else:
        form = UserRegistrationForm()

    context = {
        'title':'Producti - Регистрация',
        'form': form
    }
    return render(request, 'users/registration.html', context)

from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import update_session_auth_hash
from django.contrib import messages
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from .models import User
from categories.models import Category, Task

@login_required
def profile(request):
    """Страница профиля пользователя"""
    user = request.user
    
    # ========== СТАТИСТИКА ПОЛЬЗОВАТЕЛЯ ==========
    
    # Общее количество категорий
    categories_count = Category.objects.filter(user=user, is_active=True).count()
    
    # Общее количество задач
    tasks_count = Task.objects.filter(user=user).count()
    
    # Общее количество часов
    total_seconds = Task.objects.filter(user=user).aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
    total_hours = round(total_seconds / 3600, 1)
    
    # Количество выполненных целей (если есть модель Goal)
    # completed_goals = 0
    # try:
    #     from goals.models import Goal
    #     completed_goals = Goal.objects.filter(user=user, is_completed=True).count()
    # except ImportError:
    #     pass
    
    # Текущая серия (количество дней подряд с активностью)
    streak_days = calculate_streak(user)
    
    # ========== ДАННЫЕ ДЛЯ ГРАФИКА АКТИВНОСТИ ==========
    # Получаем активность за последние 12 месяцев
    today = timezone.now().date()
    months_data = []
    
    for i in range(12):
        month_date = today.replace(day=1) - timedelta(days=30 * i)
        month_start = month_date.replace(day=1)
        if month_date.month == 12:
            month_end = month_date.replace(year=month_date.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            month_end = month_date.replace(month=month_date.month + 1, day=1) - timedelta(days=1)
        
        month_tasks = Task.objects.filter(
            user=user,
            created_at__date__gte=month_start,
            created_at__date__lte=month_end
        )
        month_seconds = month_tasks.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
        month_hours = round(month_seconds / 3600, 1)
        
        months_data.append({
            'name': get_month_name(month_date.month),
            'hours': month_hours,
        })
    
    months_data.reverse()  # Отображаем от января к декабрю

    # Подсчёт невыполненных задач
    total_incomplete = Task.objects.filter(
        user=request.user, 
        completed=False
    ).count()
    
    context = {
        'user': user,
        'categories_count': categories_count,
        'tasks_count': tasks_count,
        'total_hours': total_hours,
        'total_incomplete': total_incomplete,
        'streak_days': streak_days,
        'months_data': months_data,
    }
    
    return render(request, 'users/profile.html', context)


def calculate_streak(user):
    """Расчёт текущей серии (дней подряд с активностью)"""
    today = timezone.now().date()
    streak = 0
    
    # Получаем все даты, когда были задачи
    dates = Task.objects.filter(
        user=user
    ).dates('created_at', 'day', order='DESC')
    
    if not dates:
        return 0
    
    # Проверяем, была ли активность сегодня или вчера
    latest_date = dates[0]
    if (today - latest_date).days > 1:
        return 0
    
    # Считаем непрерывную серию
    current_date = latest_date
    for date in dates:
        if date == current_date:
            streak += 1
            current_date -= timedelta(days=1)
        else:
            break
    
    return streak


def get_month_name(month_number):
    """Возвращает название месяца на русском"""
    months = {
        1: 'Янв', 2: 'Фев', 3: 'Мар', 4: 'Апр', 5: 'Май', 6: 'Июн',
        7: 'Июл', 8: 'Авг', 9: 'Сен', 10: 'Окт', 11: 'Ноя', 12: 'Дек'
    }
    return months.get(month_number, '')




def logout(request):
    auth.logout(request)
    messages.success(request, 'Вы успешно вышли из системы')
    return redirect(reverse('main:index'))




# users/api_views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
import os

class UserProfileViewSet(viewsets.ViewSet):
    """API для работы с профилем пользователя"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='upload-avatar')
    def upload_avatar(self, request):
        """Загрузка аватара пользователя"""
        user = request.user
        
        if 'avatar' not in request.FILES:
            return Response(
                {'error': 'Файл не найден'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        avatar_file = request.FILES['avatar']
        
        # Проверка типа файла
        if not avatar_file.content_type.startswith('image/'):
            return Response(
                {'error': 'Можно загружать только изображения'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Проверка размера (максимум 5MB)
        if avatar_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'Размер файла не должен превышать 5MB'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Удаляем старый аватар, если он существует
        if user.profile.avatar and user.profile.avatar.name != 'default.png':
            old_avatar_path = os.path.join(settings.MEDIA_ROOT, user.profile.avatar.name)
            if os.path.exists(old_avatar_path):
                os.remove(old_avatar_path)
        
        # Сохраняем новый аватар
        file_extension = os.path.splitext(avatar_file.name)[1]
        new_filename = f"avatars/{user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{file_extension}"
        saved_path = default_storage.save(new_filename, ContentFile(avatar_file.read()))
        
        # Обновляем запись в базе данных
        user.profile.avatar = saved_path
        user.profile.save()
        
        # Возвращаем URL нового аватара
        avatar_url = settings.MEDIA_URL + saved_path
        
        return Response({
            'success': True,
            'avatar_url': avatar_url,
            'message': 'Аватар успешно обновлён'
        }, status=status.HTTP_200_OK)