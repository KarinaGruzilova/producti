# from django.shortcuts import render
# from django.utils import timezone
# from datetime import timedelta
# from django.db.models import Sum
# import datetime
# import json
# import logging

# from django.http import JsonResponse
# from django.views.decorators.http import require_POST
# from django.contrib.auth.decorators import login_required
# from django.views.decorators.csrf import csrf_protect, csrf_exempt

# from categories.models import Category, Task  # Добавлен импорт Task
# from categories.forms import CategoryCreateForm

# from datetime import datetime

# logger = logging.getLogger(__name__)

# def index(request):
#     return render(request, 'main/index.html' )

# def dashboard(request):
#     # Получаем текущую дату и время
#     current_datetime = datetime.datetime.now()

#     # Форматируем дату на русском языке
#     months_ru = {
#         1: 'Янв', 2: 'Фев', 3: 'Мар', 4: 'Апр', 5: 'Май', 6: 'Июн',
#         7: 'Июл', 8: 'Авг', 9: 'Сен', 10: 'Окт', 11: 'Ноя', 12: 'Дек'
#     }

#     formatted_date = f"{months_ru[current_datetime.month]} {current_datetime.day:02d}, {current_datetime.year}"
#     formatted_time = current_datetime.strftime("%H:%M")

#     # ПОЛУЧАЕМ КАТЕГОРИИ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
#     categories = Category.objects.filter(user=request.user, is_active=True)











#     # ГРАФИК ДНЕЙ НЕДЕЛИ
#     user = request.user
#     today = timezone.now().date()
    
#     # Получаем начало недели (понедельник)
#     start_of_week = today - timedelta(days=today.weekday())
    
#     # Данные за каждый день недели
#     week_data = []
#     week_total = 0
#     max_hours = 0
    
#     for i in range(7):
#         current_day = start_of_week + timedelta(days=i)
#         next_day = current_day + timedelta(days=1)
        
#         # Суммируем время за день
#         day_sessions = Task.objects.filter(
#             user=user,
#             created_at__date=current_day
#         )
        
#         total_seconds = day_sessions.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
#         total_hours = total_seconds / 3600
#         week_total += total_hours
        
#         # Находим максимальное значение для масштабирования
#         if total_hours > max_hours:
#             max_hours = total_hours
        
#         # Названия дней
#         days_ru = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
#         days_short = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
        
#         week_data.append({
#             'name': days_ru[i],
#             'name_short': days_short[i],
#             'hours': round(total_hours, 1),
#             'seconds': total_seconds,
#         })
    
#     # Если максимальное значение 0, ставим 1 для корректного отображения
#     if max_hours == 0:
#         max_hours = 1



# # Получаем последние 10 сеансов
# recent_tasks = Task.objects.filter(
#     user=request.user
# ).select_related('category').order_by('-created_at')[:10]

# # Группируем по датам
# today = timezone.now().date()
# yesterday = today - timedelta(days=1)

# sessions_by_day = {
#     'today': [],
#     'yesterday': [],
#     'older': []
# }

# for task in recent_tasks:
#     task_date = task.created_at.date()
#     session_data = {
#         'id': task.id,
#         'time': task.created_at.strftime('%H:%M'),
#         'duration': format_duration(task.duration_seconds),
#         'category_name': task.category.name,
#         'category_emoji': task.category.emoji,
#         'category_color': task.category.color,
#         'description': truncate_text(task.title or 'без описания', 40),
#         'full_description': task.title or '',
#         'category_id': task.category.id,
#     }
    
#     if task_date == today:
#         sessions_by_day['today'].append(session_data)
#     elif task_date == yesterday:
#         sessions_by_day['yesterday'].append(session_data)
#     else:
#         sessions_by_day['older'].append(session_data)


    
#     context = {
#         'current_date': formatted_date,
#         'current_time': formatted_time,
#         'full_datetime': current_datetime,
#         'categories': categories,
#         'color_choices': Category.PASTEL_COLORS,
#         'week_data': week_data,
#         'week_total_hours': round(week_total, 1),
#         'max_hours': max_hours,

#         'sessions_by_day' : sessions_by_day,
#     }
#     return render(request, 'main/dashboard.html', context)




from django.shortcuts import render
from django.utils import timezone
from datetime import timedelta, datetime
from django.db.models import Sum
import json
import logging

from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_protect, csrf_exempt

from categories.models import Category, Task
from categories.forms import CategoryCreateForm

logger = logging.getLogger(__name__)


# ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

def format_duration(seconds):
    """Форматирование секунд в '1ч 15м'"""
    hours = seconds // 3600
    minutes = (seconds % 3600) // 60
    if hours > 0:
        return f"{hours}ч {minutes}м"
    else:
        return f"{minutes}м"


def truncate_text(text, max_length=40):
    """Обрезает текст и добавляет ... если слишком длинный"""
    if len(text) > max_length:
        return text[:max_length] + '...'
    return text


# ========== ОСНОВНЫЕ VIEWS ==========

def index(request):
    return render(request, 'main/index.html')


@login_required
def dashboard(request):
    # Получаем текущую дату и время
    current_datetime = datetime.now()

    # Форматируем дату на русском языке
    months_ru = {
        1: 'Янв', 2: 'Фев', 3: 'Мар', 4: 'Апр', 5: 'Май', 6: 'Июн',
        7: 'Июл', 8: 'Авг', 9: 'Сен', 10: 'Окт', 11: 'Ноя', 12: 'Дек'
    }

    formatted_date = f"{months_ru[current_datetime.month]} {current_datetime.day:02d}, {current_datetime.year}"
    formatted_time = current_datetime.strftime("%H:%M")

    # Получаем категории текущего пользователя
    categories = Category.objects.filter(user=request.user, is_active=True)

    # ========== ГРАФИК ДНЕЙ НЕДЕЛИ ==========
    user = request.user
    today = timezone.now().date()
    
    # Получаем начало недели (понедельник)
    start_of_week = today - timedelta(days=today.weekday())
    
    # Данные за каждый день недели
    week_data = []
    week_total = 0  # ← обязательно определить ДО цикла
    max_hours = 0
    
    days_ru = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    days_short = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    
    for i in range(7):
        current_day = start_of_week + timedelta(days=i)
        
        # Суммируем время за день
        day_sessions = Task.objects.filter(
            user=user,
            created_at__date=current_day
        )
        
        total_seconds = day_sessions.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
        total_hours = total_seconds / 3600
        week_total += total_hours
        
        # Находим максимальное значение для масштабирования
        if total_hours > max_hours:
            max_hours = total_hours
        
        week_data.append({
            'name': days_ru[i],
            'name_short': days_short[i],
            'hours': round(total_hours, 1),
            'seconds': total_seconds,
        })
    
    # Если максимальное значение 0, ставим 1 для корректного отображения
    if max_hours == 0:
        max_hours = 1

    # ========== ПОСЛЕДНИЕ 10 СЕАНСОВ ==========
    recent_tasks = Task.objects.filter(
        user=request.user,
        duration_seconds__gt=0  # 🔥 ТОЛЬКО ЗАДАЧИ С ПОТРАЧЕННЫМ ВРЕМЕНЕМ
    ).select_related('category').order_by('-created_at')[:10]

    # Группируем по датам
    today_date = timezone.now().date()
    yesterday_date = today_date - timedelta(days=1)

    sessions_by_day = {
        'today': [],
        'yesterday': [],
        'older': []
    }

    for task in recent_tasks:
        task_date = task.created_at.date()
        session_data = {
            'id': task.id,
            'time': task.created_at.strftime('%H:%M'),
            'duration': format_duration(task.duration_seconds),
            'category_name': task.category.name,
            'category_emoji': task.category.emoji,
            'category_color': task.category.color,
            'description': truncate_text(task.title or 'без описания', 40),
            'full_description': task.title or '',
            'category_id': task.category.id,
        }
        
        if task_date == today_date:
            sessions_by_day['today'].append(session_data)
        elif task_date == yesterday_date:
            sessions_by_day['yesterday'].append(session_data)
        else:
            sessions_by_day['older'].append(session_data)

    # ========== КОНТЕКСТ ==========
    context = {
        'current_date': formatted_date,
        'current_time': formatted_time,
        'full_datetime': current_datetime,
        'categories': categories,
        'color_choices': Category.PASTEL_COLORS,
        'week_data': week_data,
        'week_total_hours': round(week_total, 1),
        'max_hours': max_hours,
        'sessions_by_day': sessions_by_day,
    }
    
    return render(request, 'main/dashboard.html', context)

@login_required
@require_POST
@csrf_protect
def create_category(request):
    """
    Создание новой категории через AJAX
    """
    print("\n" + "="*50)
    print("🔥 ЗАПРОС НА СОЗДАНИЕ КАТЕГОРИИ")
    print("="*50)
    
    print(f"👤 Пользователь: {request.user.username} (ID: {request.user.id})")
    print(f"📨 POST данные: {dict(request.POST)}")
    
    form = CategoryCreateForm(request.POST)
    
    if form.is_valid():
        print("✅ Форма валидна!")
        print(f"📦 Очищенные данные: {form.cleaned_data}")
        
        try:
            category = form.save(commit=False)
            category.user = request.user
            category.save()
            
            print(f"✅ Категория сохранена в БД с ID: {category.id}")
            
            response_data = {
                'success': True,
                'category': {
                    'id': category.id,
                    'name': category.name,
                    'emoji': category.emoji,
                    'color': category.color,
                }
            }
            return JsonResponse(response_data)
            
        except Exception as e:
            print(f"❌ Ошибка при сохранении в БД: {str(e)}")
            return JsonResponse({
                'success': False,
                'errors': {'database': [f'Ошибка базы данных: {str(e)}']}
            }, status=500)
    else:
        print("❌ Форма невалидна!")
        print(f"❌ Ошибки формы: {form.errors}")
        
        return JsonResponse({
            'success': False,
            'errors': form.errors
        }, status=400)

# ========== НОВЫЙ VIEW ДЛЯ СОХРАНЕНИЯ РЕЗУЛЬТАТОВ ТАЙМЕРА ==========

@login_required
@require_POST
@csrf_protect  # Для упрощения, но лучше использовать csrf_protect с правильным токеном
def save_timer_result(request):
    """
    Сохранение результата таймера
    """
    print("\n" + "="*50)
    print("⏱️ СОХРАНЕНИЕ РЕЗУЛЬТАТА ТАЙМЕРА")
    print("="*50)
    
    try:
        # Парсим JSON из тела запроса
        data = json.loads(request.body)
        print(f"📦 Полученные данные: {data}")
        
        # Получаем данные
        category_id = data.get('category_id')
        task_description = data.get('task_description', '')
        duration_seconds = data.get('duration_seconds', 0)
        completed = data.get('completed', False)
        completed_early = data.get('completed_early', False)
        distracted = data.get('distracted', False)
        
        print(f"👤 Пользователь: {request.user.username}")
        print(f"📊 Категория ID: {category_id}")
        print(f"⏱️ Время: {duration_seconds} сек")
        print(f"✅ Выполнена: {completed}")
        
        # Проверяем наличие категории
        if not category_id:
            return JsonResponse({
                'success': False,
                'error': 'Не указана категория'
            }, status=400)
        
        # Находим категорию (для стандартных категорий может не быть в БД)
        category = None
        try:
            # Пробуем найти по ID (для категорий из БД)
            category = Category.objects.get(id=category_id, user=request.user)
        except (Category.DoesNotExist, ValueError):
            # Если не нашли по ID, возможно это стандартная категория
            # Создаем временную или ищем по имени
            standard_categories = ['study', 'read', 'work', 'hobby']
            if category_id in standard_categories:
                # Для стандартных категорий создаем запись в БД
                category_name_map = {
                    'study': 'учеба',
                    'read': 'чтение',
                    'work': 'работа',
                    'hobby': 'хобби'
                }
                category_emoji_map = {
                    'study': '📚',
                    'read': '📖',
                    'work': '💼',
                    'hobby': '🎨'
                }
                
                # Проверяем, есть ли уже такая категория у пользователя
                category = Category.objects.filter(
                    user=request.user,
                    name=category_name_map.get(category_id, category_id)
                ).first()
                
                # Если нет, создаем
                if not category:
                    category = Category.objects.create(
                        user=request.user,
                        name=category_name_map.get(category_id, category_id),
                        color='#C7CEEA',
                        emoji=category_emoji_map.get(category_id, '📁'),
                        description='Стандартная категория'
                    )
                    print(f"✅ Создана стандартная категория: {category.name}")
        
        # Создаем задачу
        task_title = task_description if task_description else f"Фокус на {category.name if category else 'задаче'}"
        
        task = Task.objects.create(
            category=category,
            user=request.user,
            title=task_title[:200],  # Обрезаем до 200 символов
            description=task_description,
            duration_seconds=duration_seconds,
            completed=completed
        )
        
        print(f"✅ Задача создана: {task.title} (ID: {task.id})")
        print(f"⏱️ Потрачено времени: {duration_seconds // 60} мин {duration_seconds % 60} сек")
        
        # Формируем ответ
        response_data = {
            'success': True,
            'task': {
                'id': task.id,
                'title': task.title,
                'duration': duration_seconds,
                'duration_formatted': task.duration_formatted,
                'completed': task.completed
            }
        }
        
        print(f"📤 Ответ: {response_data}")
        print("="*50 + "\n")
        
        return JsonResponse(response_data)
        
    except json.JSONDecodeError:
        print("❌ Ошибка парсинга JSON")
        return JsonResponse({
            'success': False,
            'error': 'Неверный формат JSON'
        }, status=400)
        
    except Exception as e:
        print(f"❌ Непредвиденная ошибка: {str(e)}")
        import traceback
        traceback.print_exc()
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)
    

















    