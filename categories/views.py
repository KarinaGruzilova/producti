from django.shortcuts import render, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum
from .models import Category, Task
import plotly.express as px
import plotly.utils
import json
import pandas as pd
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .forms import CategoryCreateForm

@login_required
def activities(request):
    user = request.user
    today = timezone.now().date()
    month_ago = today - timedelta(days=30)
    
    # Получаем все активные категории пользователя
    categories = Category.objects.filter(user=user, is_active=True)
    
    # Собираем данные по каждой категории за месяц
    chart_data = []
    for category in categories:
        tasks = Task.objects.filter(
            user=user,
            category=category,
            created_at__date__gte=month_ago
        )
        total_seconds = tasks.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
        total_hours = round(total_seconds / 3600, 1)
        
        if total_hours > 0:
            chart_data.append({
                'name': category.name,
                'color': category.color,
                'hours': total_hours,
            })
    
    # Сортируем по часам
    chart_data.sort(key=lambda x: x['hours'], reverse=True)
    
    # Берём топ-5 категорий
    TOP_LIMIT = 5
    top_categories = chart_data[:TOP_LIMIT]
    other_categories = chart_data[TOP_LIMIT:]
    
    # Общее время
    total_hours_all = sum(c['hours'] for c in chart_data)
    other_hours = sum(c['hours'] for c in other_categories)
    
    # Формируем данные для графика
    pie_data = []
    
    for cat in top_categories:
        percentage = round((cat['hours'] / total_hours_all) * 100) if total_hours_all > 0 else 0
        pie_data.append({
            'name': cat['name'][:20] + ('...' if len(cat['name']) > 20 else ''),
            'color': cat['color'],
            'hours': cat['hours'],
            'percentage': percentage,
        })
    
    if other_categories:
        other_percentage = round((other_hours / total_hours_all) * 100) if total_hours_all > 0 else 0
        pie_data.append({
            'name': 'Остальное',
            'color': '#D9D9D9',
            'hours': other_hours,
            'percentage': other_percentage,
        })
    
    center_number = len(pie_data)
    
    # === ГЕНЕРИРУЕМ ГРАФИК НА СЕРВЕРЕ ===
    if pie_data:
        df = pd.DataFrame(pie_data)
        
        fig = px.pie(
            df, 
            values='percentage', 
            names='name',
            color='name',
            color_discrete_map={item['name']: item['color'] for item in pie_data},
            hole=0.7,
        )
        
        fig.update_traces(
            textposition='inside',
            textinfo='none',
            hoverinfo='label+percent+value',
            marker=dict(line=dict(color='white', width=2))
        )
        fig.update_layout(
            showlegend=False,
            margin=dict(t=0, l=0, r=0, b=0),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            width=260,   
            height=260,
            annotations=[dict(
                text=str(center_number),
                x=0.5, y=0.5,
                font_size=40,
                showarrow=False
            )]
        )
        
        chart_html = fig.to_html(full_html=False, include_plotlyjs='cdn')
    else:
        chart_html = '<div class="no-data">Нет данных за последние 30 дней</div>'
    
    # ========== ДОБАВЛЯЕМ ЦВЕТА ДЛЯ ВЫБОРА ==========
    color_choices = Category.PASTEL_COLORS  # ← БЕРЁМ ЦВЕТА ИЗ МОДЕЛИ
    
    context = {
        'categories': categories,
        'chart_html': chart_html,
        'center_number': center_number,
        'total_categories': len(categories),
        'total_hours': round(total_hours_all, 1),
        'top_count': len(top_categories),
        'other_count': len(other_categories),
        'pie_data': pie_data,
        'color_choices': color_choices,  # ← ПЕРЕДАЁМ В ШАБЛОН
    }
    
    return render(request, 'categories/activities.html', context)


def goals(request):
    return render(request, 'categories/goals.html')


@login_required
@require_POST
def create_category(request):
    """Создание новой категории через AJAX"""
    form = CategoryCreateForm(request.POST)
    
    if form.is_valid():
        category = form.save(commit=False)
        category.user = request.user
        category.save()
        
        return JsonResponse({
            'success': True,
            'category': {
                'id': category.id,
                'name': category.name,
                'emoji': category.emoji,
                'color': category.color,
            }
        })
    else:
        return JsonResponse({
            'success': False,
            'errors': form.errors
        }, status=400)


@login_required
def get_user_categories(request):
    """Получение списка категорий пользователя для выпадающего списка"""
    categories = Category.objects.filter(
        user=request.user, 
        is_active=True
    ).values('id', 'name', 'emoji', 'color')
    
    return JsonResponse({
        'categories': list(categories)
    })


@login_required
@require_POST
def delete_category(request, category_id):
    category = get_object_or_404(Category, id=category_id, user=request.user)
    category.delete()
    return JsonResponse({'success': True})






@login_required
def category_detail(request, category_id):
    """Детальная страница категории"""
    
    # Получаем категорию или 404
    category = get_object_or_404(Category, id=category_id, user=request.user, is_active=True)
    
    # Получаем все задачи этой категории
    tasks = Task.objects.filter(user=request.user, category=category).order_by('-created_at')
    
    # ========== СТАТИСТИКА ==========
    
    # Общее время
    total_seconds = tasks.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
    total_hours = round(total_seconds / 3600, 1)
    
    # Количество задач
    tasks_count = tasks.count()
    
    # Среднее время на задачу
    avg_seconds = total_seconds // tasks_count if tasks_count > 0 else 0
    avg_hours = round(avg_seconds / 3600, 1)
    
    # Последняя активность
    last_task = tasks.first()
    last_activity = last_task.created_at if last_task else None
    
    # ========== ДАННЫЕ ЗА ПОСЛЕДНИЕ 30 ДНЕЙ ==========
    month_ago = timezone.now().date() - timedelta(days=30)
    
    # Задачи за последние 30 дней
    recent_tasks = tasks.filter(created_at__date__gte=month_ago)
    recent_seconds = recent_tasks.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
    recent_hours = round(recent_seconds / 3600, 1)
    
    # ========== ГРАФИК АКТИВНОСТИ ЗА ПОСЛЕДНИЕ 7 ДНЕЙ ==========
    today = timezone.now().date()
    start_of_week = today - timedelta(days=today.weekday())
    
    week_data = []
    max_hours = 0
    days_ru = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
    days_short = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    
    for i in range(7):
        current_day = start_of_week + timedelta(days=i)
        day_tasks = tasks.filter(created_at__date=current_day)
        day_seconds = day_tasks.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
        day_hours = day_seconds / 3600
        
        if day_hours > max_hours:
            max_hours = day_hours
        
        week_data.append({
            'name': days_ru[i],
            'name_short': days_short[i],
            'hours': round(day_hours, 1),
            'seconds': day_seconds,
        })
    
    if max_hours == 0:
        max_hours = 1
    
    # ========== ПОСЛЕДНИЕ 10 ЗАДАЧ ==========
    recent_tasks_list = tasks[:10]
    
    # ========== ФОРМАТИРОВАНИЕ ВРЕМЕНИ ==========
    def format_duration(seconds):
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        if hours > 0:
            return f"{hours}ч {minutes}м"
        return f"{minutes}м"
    
    # ========== КОНТЕКСТ ==========
    context = {
        'category': category,
        'total_hours': total_hours,
        'tasks_count': tasks_count,
        'avg_hours': avg_hours,
        'recent_hours': recent_hours,
        'last_activity': last_activity,
        'week_data': week_data,
        'max_hours': max_hours,
        'recent_tasks': recent_tasks_list,
        'format_duration': format_duration,
    }
    
    return render(request, 'categories/category_detail.html', context)