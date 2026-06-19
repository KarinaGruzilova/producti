import csv
import io

from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import redirect, render
from django.contrib import auth
from django.urls import reverse
from openpyxl import Workbook

from users.forms import UserLoginForm
from users.forms import UserRegistrationForm

from django.contrib import messages

from django.contrib.auth.decorators import login_required
from django.contrib.auth import update_session_auth_hash
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import datetime, timedelta
from .models import ProPromoCode, User
from categories.models import Category, Task

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
import os
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
import json



try:
    from openpyxl import Workbook
    OPENPYXL_AVAILABLE = True
except ImportError:
    OPENPYXL_AVAILABLE = False

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

@login_required
def profile(request):
    #Страница профиля
    user = request.user
    
    # Общее количество категорий
    categories_count = Category.objects.filter(user=user, is_active=True).count()
    
    # Общее количество задач
    tasks_count = Task.objects.filter(user=user).count()
    
    # Общее количество часов
    total_seconds = Task.objects.filter(user=user).aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
    total_hours = round(total_seconds / 3600, 1)
    
    # Количество выполненных целей
    # completed_goals = 0
    # try:
    #     from goals.models import Goal
    #     completed_goals = Goal.objects.filter(user=user, is_completed=True).count()
    # except ImportError:
    #     pass
    
    # Текущая серия
    streak_days = calculate_streak(user)
    
    # ДАННЫЕ ДЛЯ ГРАФИКА АКТИВНОСТИ
    # Активность за последние 12 месяцев
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
    
    months_data.reverse()

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
    # Расчёт текущей серии
    today = timezone.now().date()
    streak = 0
    
    # Даты, когда были задачи
    dates = Task.objects.filter(
        user=user
    ).dates('created_at', 'day', order='DESC')
    
    if not dates:
        return 0
    
    # Была ли активность сегодня или вчера
    latest_date = dates[0]
    if (today - latest_date).days > 1:
        return 0
    
    # Считает непрерывную серию
    current_date = latest_date
    for date in dates:
        if date == current_date:
            streak += 1
            current_date -= timedelta(days=1)
        else:
            break
    
    return streak


def get_month_name(month_number):
    months = {
        1: 'Янв', 2: 'Фев', 3: 'Мар', 4: 'Апр', 5: 'Май', 6: 'Июн',
        7: 'Июл', 8: 'Авг', 9: 'Сен', 10: 'Окт', 11: 'Ноя', 12: 'Дек'
    }
    return months.get(month_number, '')




def logout(request):
    auth.logout(request)
    messages.success(request, 'Вы успешно вышли из системы')
    return redirect(reverse('main:index'))


class UserProfileViewSet(viewsets.ViewSet):
    # API для работы с профилем
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'], url_path='upload-avatar')
    def upload_avatar(self, request):
        # Загрузка аватара
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
        
        # Удаляет старый аватар, если он существует
        if user.profile.avatar and user.profile.avatar.name != 'default.png':
            old_avatar_path = os.path.join(settings.MEDIA_ROOT, user.profile.avatar.name)
            if os.path.exists(old_avatar_path):
                os.remove(old_avatar_path)
        
        # Сохраняет новый аватар
        file_extension = os.path.splitext(avatar_file.name)[1]
        new_filename = f"avatars/{user.id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}{file_extension}"
        saved_path = default_storage.save(new_filename, ContentFile(avatar_file.read()))
        
        user.profile.avatar = saved_path
        user.profile.save()
        
        # Возвращаем URL нового аватара
        avatar_url = settings.MEDIA_URL + saved_path
        
        return Response({
            'success': True,
            'avatar_url': avatar_url,
            'message': 'Аватар успешно обновлён'
        }, status=status.HTTP_200_OK)
    


def get_task_status(task):
    # Cтатус задачи
    today = timezone.now().date()
    
    # Если есть потраченное время, задача выполнена через фокус
    if task.duration_seconds > 0:
        return 'Выполнена (фокус)'
    
    # Для плановых задач определяет статус по дате
    due_date = task.due_date
    compare_date = due_date if due_date else task.created_at.date()
    
    if compare_date < today:
        return 'Просрочена'
    elif compare_date == today:
        return 'На сегодня'
    else:
        return 'В планах'


@login_required
def export_tasks(request):
    format_type = request.GET.get('format', 'csv')
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')

    def is_valid_date(date_string):
        """Проверяет что дата в формате YYYY-MM-DD с ровно 4-значным годом"""
        if not date_string:
            return True
        parts = date_string.split('-')
        if len(parts) != 3:
            return False
        year_part = parts[0]
        if len(year_part) != 4 or not year_part.isdigit():
            return False
        try:
            datetime.strptime(date_string, '%Y-%m-%d')
            return True
        except ValueError:
            return False

    if date_from and not is_valid_date(date_from):
        return HttpResponse('Некорректный формат даты "от". Год должен состоять из 4 цифр.', status=400)
    if date_to and not is_valid_date(date_to):
        return HttpResponse('Некорректный формат даты "до". Год должен состоять из 4 цифр.', status=400)
    
    tasks = Task.objects.filter(user=request.user).select_related('category')
    
    if date_from:
        tasks = tasks.filter(created_at__date__gte=date_from)
    if date_to:
        tasks = tasks.filter(created_at__date__lte=date_to)
    
    export_data = []
    for task in tasks:
        # Определяем тип задачи
        if task.duration_seconds > 0:
            task_type = 'Фокус (таймер)'
        else:
            task_type = 'Плановая'
        
        # Получаем статус
        task_status = get_task_status(task)
        
        export_data.append({
            'id': task.id,
            'category': task.category.name,
            'title': task.title,
            'duration_hours': round(task.duration_seconds / 3600, 2),
            'duration_formatted': task.duration_formatted,
            'completed': 'Да' if task.completed else 'Нет',
            'task_type': task_type,
            'status': task_status,
            'due_date': task.due_date.strftime('%Y-%m-%d') if task.due_date else '',
            'created_at': task.created_at.strftime('%Y-%m-%d %H:%M:%S'),
        })
    
    # JSON
    if format_type == 'json':
        import json
        filename = f"tasks_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        response = HttpResponse(json.dumps(export_data, ensure_ascii=False, indent=2), content_type='application/json')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    # Excel
    if format_type == 'xlsx' and OPENPYXL_AVAILABLE:
        filename = f"tasks_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        wb = Workbook()
        ws = wb.active
        ws.title = 'Задачи'
        
        if export_data:
            headers = ['ID', 'Категория', 'Название', 'Часы', 'Длительность', 'Выполнена', 'Тип задачи', 'Статус', 'Дедлайн', 'Дата создания']
            ws.append(headers)
            for row in export_data:
                ws.append([
                    row['id'], row['category'], row['title'],
                    row['duration_hours'], row['duration_formatted'], row['completed'],
                    row['task_type'], row['status'],
                    row['due_date'], row['created_at']
                ])
            
            for col in ws.columns:
                max_length = 0
                col_letter = col[0].column_letter
                for cell in col:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                ws.column_dimensions[col_letter].width = min(max_length + 2, 30)
        
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        wb.save(response)
        return response
    
    # CSV
    filename = f"tasks_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    output = io.StringIO()
    writer = csv.writer(output, delimiter=';')
    
    if export_data:
        headers = ['ID', 'Категория', 'Название', 'Часы', 'Длительность', 'Выполнена', 'Тип задачи', 'Статус', 'Дедлайн', 'Дата создания']
        writer.writerow(headers)
        for row in export_data:
            writer.writerow([
                row['id'], row['category'], row['title'],
                row['duration_hours'], row['duration_formatted'], row['completed'],
                row['task_type'], row['status'],
                row['due_date'], row['created_at']
            ])
    
    response = HttpResponse(output.getvalue().encode('utf-8-sig'), content_type='text/csv')
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response



@csrf_exempt
@require_POST
def yookassa_webhook(request):
    # Обработка уведомлений от YooKassa
    event = json.loads(request.body)
    
    if event.get('event') == 'payment.succeeded':
        payment_id = event['object']['id']
        metadata = event['object']['metadata']
        
        user_id = int(metadata.get('user_id'))
        plan_type = metadata.get('plan_type', 'monthly')
        
        from .models import User
        from django.utils import timezone
        from datetime import timedelta
        
        try:
            user = User.objects.get(id=user_id)
            user.is_pro = True
            
            if plan_type == 'monthly':
                user.subscription_until = timezone.now() + timedelta(days=30)
            else:
                user.subscription_until = timezone.now() + timedelta(days=365)
            
            user.save()
            
            print(f" Платеж {payment_id} подтверждён. Пользователь {user.username} получил Pro-подписку до {user.subscription_until}")
            
        except User.DoesNotExist:
            print(f" Пользователь с ID {user_id} не найден")
    
    return JsonResponse({'status': 'ok'})


def payment(request):
    # Страница после успешной оплаты с промокодом
    promo_data = request.session.get('pending_promo', {})
    promo_code = promo_data.get('code', '')
    user_id = promo_data.get('user_id')
    
    # Если промокод есть в сессии и пользователь авторизован
    if promo_code and user_id and request.user.is_authenticated:
        # Проверяем, существует ли уже такой промокод в БД
        exists = ProPromoCode.objects.filter(code=promo_code, user=request.user).exists()
        
        if not exists:
            # Сохраняем промокод в БД
            expires_at = promo_data.get('expires_at')
            if expires_at:
                # Если дата есть в сессии
                from datetime import datetime
                expires_at = datetime.fromisoformat(expires_at)
            else:
                expires_at = timezone.now() + timedelta(days=1)
            
            ProPromoCode.objects.create(
                code=promo_code,
                user=request.user,
                used=False,
                expires_at=expires_at
            )
    
    return render(request, 'payment.html', {'promo_code': promo_code})




@csrf_exempt
@require_POST
def activate_promo(request):
    code = request.POST.get('promo_code', '').strip().upper()

    if len(code) > 20:
        return JsonResponse({'error': 'Промокод указан некорректно'}, status=400)
    
    try:
        promo = ProPromoCode.objects.get(code=code, user=request.user)
        
        if promo.used:
            return JsonResponse({'error': 'Промокод уже использован'}, status=400)
        
        if promo.expires_at < timezone.now():
            return JsonResponse({'error': 'Промокод истёк'}, status=400)
        
        # Активируем Pro
        promo.user.is_pro = True
        promo.user.subscription_until = timezone.now() + timedelta(days=30)
        promo.user.save()
        
        # Отмечаем промокод как использованный
        promo.used = True
        promo.save()
        
        return JsonResponse({'success': 'Pro-подписка активирована!'})
        
    except ProPromoCode.DoesNotExist:
        return JsonResponse({'error': 'Неверный промокод'}, status=400)




@login_required
def delete_account(request):
    if request.method == 'DELETE':
        user = request.user
        logout(request)
        user.delete()
        return JsonResponse({'success': True})
    return JsonResponse({'error': 'Method not allowed'}, status=405)