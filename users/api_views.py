# users/api_views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
from .models import User
import os
from datetime import datetime


class UserProfileViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='upload-avatar')
    def upload_avatar(self, request):
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
        
        # Удаляем старый аватар, если он существует и не является дефолтным
        if user.avatar and user.avatar.name != 'users_images/default.png':
            old_avatar_path = os.path.join(settings.MEDIA_ROOT, user.avatar.name)
            if os.path.exists(old_avatar_path):
                os.remove(old_avatar_path)
        
        # Формируем новое имя файла
        file_extension = os.path.splitext(avatar_file.name)[1]
        new_filename = f"users_images/{user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{file_extension}"
        
        # Сохраняем файл
        saved_path = default_storage.save(new_filename, ContentFile(avatar_file.read()))
        
        # Обновляем поле avatar в модели User
        user.avatar = saved_path
        user.save()
        
        # Возвращаем URL нового аватара
        avatar_url = settings.MEDIA_URL + saved_path
        
        return Response({
            'success': True,
            'avatar_url': avatar_url,
            'message': 'Аватар успешно обновлён'
        }, status=status.HTTP_200_OK)
    



    @action(detail=False, methods=['get'], url_path='profile-data')
    def get_profile_data(self, request):
        """Получение данных профиля для редактирования"""
        user = request.user
        
        return Response({
            'username': user.username,
            'first_name': user.first_name or '',
            'email': user.email,
        })


    @action(detail=False, methods=['post'], url_path='update-profile')
    def update_profile(self, request):
        """Обновление данных профиля"""
        user = request.user
        
        new_username = request.data.get('username')
        new_first_name = request.data.get('first_name', '')
        new_email = request.data.get('email')
        new_password = request.data.get('password')
        
        # Проверка уникальности логина
        if new_username and new_username != user.username:
            if User.objects.filter(username=new_username).exists():
                return Response({
                    'success': False,
                    'error': 'Пользователь с таким логином уже существует'
                }, status=400)
            user.username = new_username
        
        # Обновление полей
        if new_first_name != user.first_name:
            user.first_name = new_first_name
        
        if new_email and new_email != user.email:
            user.email = new_email
        
        # Обновление пароля (если указан и не пустой)
        password_changed = False
        if new_password and new_password.strip():
            if len(new_password) < 6:
                return Response({
                    'success': False,
                    'error': 'Пароль должен содержать не менее 6 символов'
                }, status=400)
            user.set_password(new_password)
            password_changed = True
        
        user.save()
        
        # Если пароль был изменён, обновляем сессию, чтобы пользователь не разлогинился
        if password_changed:
            from django.contrib.auth import update_session_auth_hash
            update_session_auth_hash(request, user)
        
        return Response({
            'success': True,
            'message': 'Профиль успешно обновлён'
        })

    @action(detail=False, methods=['get'], url_path='check-username')
    def check_username(self, request):
        """Проверка уникальности логина"""
        username = request.query_params.get('username')
        if not username:
            return Response({'exists': False})
        
        exists = User.objects.filter(username=username).exclude(id=request.user.id).exists()
        return Response({'exists': exists})
    







@action(detail=False, methods=['get'], url_path='monthly-trends')
def monthly_trends(self, request):
    """Линейная диаграмма: топ-6 категорий по кол-ву задач за месяц"""
    user = request.user
    today = timezone.now().date()
    first_day = today.replace(day=1)
    
    # Получаем даты месяца
    days_in_month = (today - first_day).days + 1
    date_range = [first_day + timedelta(days=i) for i in range(days_in_month)]
    date_labels = [d.strftime('%d.%m') for d in date_range]
    
    # Получаем категории с количеством задач за месяц
    categories = Category.objects.filter(user=user, is_active=True)
    
    category_stats = []
    for category in categories:
        tasks_count = Task.objects.filter(
            user=user,
            category=category,
            created_at__date__gte=first_day
        ).count()
        
        if tasks_count > 0:
            category_stats.append({
                'id': category.id,
                'name': category.name,
                'color': category.color,
                'total': tasks_count
            })
    
    # Топ-6 категорий
    category_stats.sort(key=lambda x: x['total'], reverse=True)
    top_categories = category_stats[:6]
    
    # Формируем данные для графика
    result = {
        'dates': date_labels,
        'categories': []
    }
    
    for cat in top_categories:
        daily_counts = []
        for single_date in date_range:
            count = Task.objects.filter(
                user=user,
                category_id=cat['id'],
                created_at__date=single_date
            ).count()
            daily_counts.append(count)
        
        result['categories'].append({
            'name': cat['name'],
            'color': cat['color'],
            'values': daily_counts
        })


    print(f"Топ категорий: {[c['name'] for c in top_categories]}")
    print(f"Результат: {result}")
    
    return Response(result)


# users/api_views.py
from yookassa import Configuration, Payment
from django.conf import settings
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
import uuid
import random
import string
from django.shortcuts import render
from .models import ProPromoCode
from django.utils import timezone
from datetime import timedelta

# Настройка YooKassa
Configuration.account_id = settings.YOKASSA_SHOP_ID
Configuration.secret_key = settings.YOKASSA_SECRET_KEY


def generate_promo_code():
    """Генерация уникального промокода"""
    prefix = "PRO"
    random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))
    return f"{prefix}-{random_part}"


class CreatePaymentView(APIView):
    """Создание платежа для подписки Pro"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        plan_type = request.data.get('plan', 'monthly')
        
        prices = {
            'monthly': 299,
            'yearly': 2990,
        }
        
        amount = prices.get(plan_type, 299)
        
        # ГЕНЕРИРУЕМ ПРОМОКОД ЗДЕСЬ
        promo_code = generate_promo_code()
        
        # Сохраняем в сессию (или сразу в БД со статусом pending)
        request.session['pending_promo'] = {
            'code': promo_code,
            'user_id': user.id,
            'plan_type': plan_type,
            'expires_at': (timezone.now() + timedelta(days=1)).isoformat()
        }
        
        idempotence_key = str(uuid.uuid4())
        
        # Добавляем промокод в метаданные платежа
        payment = Payment.create({
            "amount": {
                "value": str(amount),
                "currency": "RUB"
            },
            "payment_method_data": {
                "type": "bank_card"
            },
            "confirmation": {
                "type": "redirect",
                "return_url": "http://127.0.0.1:8000/user/payment/"
            },
            "description": f"Подписка Pro ({plan_type}) для {user.email}",
            "metadata": {
                "user_id": user.id,
                "username": user.username,
                "plan_type": plan_type,
                "promo_code": promo_code  # ← сохраняем промокод в метаданные
            }
        }, idempotence_key)
        
        return JsonResponse({
            'success': True,
            'confirmation_url': payment.confirmation.confirmation_url,
            'payment_id': payment.id,
            'promo_code': promo_code  # ← возвращаем промокод на фронт
        })
    


