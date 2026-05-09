# categories/views.py
from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from datetime import date
from datetime import timedelta
from django.db.models import Sum, Q
from .models import Category, Task
import plotly.express as px
import pandas as pd
from django.shortcuts import render, get_object_or_404

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
    
    # Генерируем график
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
    
    context = {
        'categories': categories,
        'chart_html': chart_html,
        'pie_data': pie_data,
        'center_number': center_number,
        'color_choices': Category.PASTEL_COLORS,
    }
    
    return render(request, 'categories/activities.html', context)

@login_required
def category_detail(request, category_id):
    """Детальная страница категории с данными"""
    
    # Получаем категорию
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
    avg_hours = round(total_hours / tasks_count, 1) if tasks_count > 0 else 0
    
    # За последние 30 дней
    month_ago = timezone.now().date() - timedelta(days=30)
    recent_tasks = tasks.filter(created_at__date__gte=month_ago)
    recent_seconds = recent_tasks.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
    recent_hours = round(recent_seconds / 3600, 1)
    
    # ========== ГРАФИК ЗА НЕДЕЛЮ ==========
    today = timezone.now().date()
    start_of_week = today - timedelta(days=today.weekday())
    
    week_data = []
    max_hours = 0
    days_short = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    
    for i in range(7):
        current_day = start_of_week + timedelta(days=i)
        day_tasks = tasks.filter(created_at__date=current_day)
        day_seconds = day_tasks.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
        day_hours = round(day_seconds / 3600, 1)
        
        if day_hours > max_hours:
            max_hours = day_hours
        
        week_data.append({
            'name_short': days_short[i],
            'hours': day_hours,
        })
    
    if max_hours == 0:
        max_hours = 1
    
    # ========== ПОСЛЕДНИЕ 10 ЗАДАЧ ==========
    recent_tasks_list = []
    for task in tasks[:10]:
        recent_tasks_list.append({
            'id': task.id,
            'title': task.title,
            'duration_formatted': task.duration_formatted,
            'created_at': task.created_at.strftime('%d.%m %H:%M'),
        })
    
    # Форматирование длительности
    def format_duration(seconds):
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        if hours > 0:
            return f"{hours}ч {minutes}м"
        return f"{minutes}м"
    
    context = {
        'category': category,
        'total_hours': total_hours,
        'tasks_count': tasks_count,
        'avg_hours': avg_hours,
        'recent_hours': recent_hours,
        'week_data': week_data,
        'max_hours': max_hours,
        'recent_tasks': recent_tasks_list,
        'format_duration': format_duration,
    }
    
    return render(request, 'categories/category_detail.html', context)





@login_required
def tasks_calendar(request):
    user = request.user
    today = timezone.now().date()
    categories = Category.objects.filter(user=user, is_active=True)
    
    # Все невыполненные задачи
    all_tasks = Task.objects.filter(user=user, completed=False)
    
    # Просроченные: due_date < сегодня ИЛИ (due_date нет И created_at < сегодня)
    overdue_tasks = all_tasks.filter(
        Q(due_date__lt=today)
    )
    
    # Активные (сегодняшние): due_date = сегодня ИЛИ (due_date нет И created_at = сегодня)
    active_tasks = all_tasks.filter(
        Q(due_date=today) | 
        Q(due_date__isnull=True, created_at__date=today)
    )
    
    # Запланированные: due_date > сегодня
    planned_tasks = all_tasks.filter(
        Q(due_date__gt=today) |
        Q(due_date__isnull=True, created_at__date__lt=today))
    
    context = {
        'categories': categories,
        'overdue_tasks': overdue_tasks,
        'active_tasks': active_tasks,
        'planned_tasks': planned_tasks,
        'total_incomplete': all_tasks.count(),
        'today': today,
    }
    return render(request, 'categories/tasks_calendar.html', context)





