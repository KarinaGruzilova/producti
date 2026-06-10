from django.contrib.auth.decorators import login_required
from django.utils import timezone
from datetime import date
from datetime import timedelta
from django.db.models import Sum, Q
from .models import Category, Task
import plotly.express as px
import pandas as pd
from django.shortcuts import render, get_object_or_404

from django.http import JsonResponse
from .models import User


COLOR_CHOICES = [
    ("#C7CEEA", "Пастельно-лавандовый"),
    ("#B5EAD7", "Мятно-зелёный"),
    ("#FFDAC1", "Персиковый"),
    ("#FFB7B2", "Розовый"),
    ("#E2F0CB", "Светло-лаймовый"),
    ("#FFD3B6", "Абрикосовый"),
    ("#D4A5D8", "Сиреневый"),
    ("#A8D8EA", "Небесно-голубой"),
    ("#F7DC6F", "Солнечно-жёлтый"),
    ("#FF9AA2", "Коралловый"),
]

@login_required
def activities(request):
    user = request.user
    today = timezone.now().date()
    month_ago = today - timedelta(days=30)

    categories = Category.objects.filter(user=user, is_active=True)
    
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
    
    TOP_LIMIT = 5
    top_categories = chart_data[:TOP_LIMIT]
    other_categories = chart_data[TOP_LIMIT:]
    
    # Общее время
    total_hours_all = sum(c['hours'] for c in chart_data)
    other_hours = sum(c['hours'] for c in other_categories)

    total_incomplete = Task.objects.filter(
        user=request.user, 
        completed=False
    ).count()
    
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
    
    # График
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
        'total_incomplete': total_incomplete,
        'categories': categories,
        'chart_html': chart_html,
        'pie_data': pie_data,
        'center_number': center_number,
        'color_choices': Category.PASTEL_COLORS,
    }
    
    return render(request, 'categories/activities.html', context)

@login_required
def category_detail(request, category_id):
    
    category = get_object_or_404(Category, id=category_id, user=request.user, is_active=True)
    
    tasks_with_time = Task.objects.filter(
        user=request.user,
        category=category,
        duration_seconds__gt=0
    ).order_by('-created_at')
    
    total_seconds = tasks_with_time.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
    total_hours = round(total_seconds / 3600, 1)
    
    tasks_count = tasks_with_time.count()
    
    # Среднее время на задачу
    avg_hours = round(total_hours / tasks_count, 1) if tasks_count > 0 else 0
    
    # ЧАСЫ ЗА ПОСЛЕДНИЕ 30 ДНЕЙ
    today = timezone.now().date()
    thirty_days_ago = today - timedelta(days=30)
    
    recent_seconds = tasks_with_time.filter(
        created_at__date__gte=thirty_days_ago
    ).aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
    recent_hours = round(recent_seconds / 3600, 1)
    
    # Текущий месяц
    start_of_current_month = today.replace(day=1)
    current_month_seconds = tasks_with_time.filter(
        created_at__date__gte=start_of_current_month
    ).aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
    current_month_hours = round(current_month_seconds / 3600, 1)
    
    # Прошлый месяц
    if today.month == 1:
        start_of_last_month = today.replace(year=today.year - 1, month=12, day=1)
        last_day_of_last_month = today.replace(year=today.year - 1, month=12, day=31)
    else:
        start_of_last_month = today.replace(month=today.month - 1, day=1)
        next_month = start_of_last_month.replace(month=start_of_last_month.month + 1, day=1)
        last_day_of_last_month = next_month - timedelta(days=1)
    
    last_month_seconds = tasks_with_time.filter(
        created_at__date__gte=start_of_last_month,
        created_at__date__lte=last_day_of_last_month
    ).aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
    last_month_hours = round(last_month_seconds / 3600, 1)
    
    # Расчёт процента изменения
    if last_month_hours > 0:
        percent_change = round(((current_month_hours - last_month_hours) / last_month_hours) * 100, 1)
    else:
        percent_change = 100 if current_month_hours > 0 else 0
    
    if percent_change > 0:
        trend_class = 'trend-up'
        trend_icon = '↑'
        trend_text = f'+{percent_change}% к прошлому месяцу'
    elif percent_change < 0:
        trend_class = 'trend-down'
        trend_icon = '↓'
        trend_text = f'{percent_change}% к прошлому месяцу'
    else:
        trend_class = 'trend-neutral'
        trend_icon = '→'
        trend_text = '0% к прошлому месяцу'
    
    #ГРАФИК ЗА НЕДЕЛЮ
    start_of_week = today - timedelta(days=today.weekday())
    
    week_data = []
    max_hours = 0
    days_short = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    hours_by_day = {}
    
    for i in range(7):
        current_day = start_of_week + timedelta(days=i)
        day_tasks = tasks_with_time.filter(created_at__date=current_day)
        day_seconds = day_tasks.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
        day_hours = round(day_seconds / 3600, 1)
        
        hours_by_day[days_short[i]] = day_hours
        week_data.append({
            'name_short': days_short[i],
            'hours': day_hours,
        })
        
        if day_hours > max_hours:
            max_hours = day_hours
    
    if max_hours == 0:
        max_hours = 1
    
    # Лучший день
    best_day_name = max(hours_by_day, key=hours_by_day.get) if hours_by_day else 'Нет данных'
    best_day_hours = hours_by_day.get(best_day_name, 0)
    
    #ПОСЛЕДНИЕ ЗАДАЧИ
    recent_completed_tasks = tasks_with_time[:10]
    
    #НЕВЫПОЛНЕННЫЕ ЗАДАЧИ
    pending_tasks = Task.objects.filter(
        user=request.user,
        category=category,
        duration_seconds=0,
        completed=False
    ).order_by('due_date', 'created_at')[:10]


    total_incomplete = Task.objects.filter(
        user=request.user, 
        completed=False
    ).count()
    
    context = {
        'category': category,
        'total_hours': total_hours,
        'tasks_count': tasks_count,
        'avg_hours': avg_hours,
        'recent_hours': recent_hours,
        'trend_class': trend_class,
        'trend_icon': trend_icon,
        'trend_text': trend_text,
        'percent_change': percent_change,
        'week_data': week_data,
        'max_hours': max_hours,
        'best_day_name': best_day_name,
        'best_day_hours': best_day_hours,
        'recent_tasks': recent_completed_tasks,
        'pending_tasks': pending_tasks,
        'total_incomplete': total_incomplete,
    }
    
    return render(request, 'categories/category_detail.html', context)

@login_required
def tasks_calendar(request):
    user = request.user
    today = timezone.now().date()
    categories = Category.objects.filter(user=user, is_active=True)
    
    # Все невыполненные задачи
    all_tasks = Task.objects.filter(user=user, completed=False)
    
    overdue_tasks = all_tasks.filter(
        Q(due_date__lt=today)
    )
    
    active_tasks = all_tasks.filter(
        Q(due_date=today) | 
        Q(due_date__isnull=True, created_at__date=today)
    )
    
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




from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.utils import timezone
from categories.models import Category, Task
from django.db.models import Sum
 
 
@login_required
def goals(request):
    user = request.user
    categories = Category.objects.filter(user=user, is_active=True)
 
    total_incomplete = Task.objects.filter(user=user, completed=False).count()
 
    context = {
        'categories': categories,
        'total_incomplete': total_incomplete,
    }
    return render(request, 'categories/goals.html', context)
