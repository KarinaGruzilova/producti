from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta

from .models import Category, Task
from .serializers import CategorySerializer, TaskSerializer

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from datetime import datetime
import csv
import json
import io

class CategoryViewSet(viewsets.ModelViewSet):
    
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Category.objects.filter(
            user=self.request.user,
            is_active=True
        ).order_by('-updated_at')
    
    def perform_create(self, serializer):
        user = self.request.user
        current_count = Category.objects.filter(user=user, is_active=True).count()
    
        if not user.is_pro and current_count >= 5:
            from rest_framework import serializers
            raise serializers.ValidationError({
                'error': 'Достигнут лимит категорий (5). Оформите Pro-подписку для безлимита.'
            })
    
        serializer.save(user=user)
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        category = self.get_object()
        tasks = Task.objects.filter(category=category, user=request.user)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        category = self.get_object()
        category.is_active = False
        category.save()
        return Response({'status': 'archived', 'id': category.id})   

    def perform_destroy(self, instance):
        instance.delete()


class TaskViewSet(viewsets.ModelViewSet):
    """API для управления задачами"""
    
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Task.objects.filter(user=self.request.user)
        
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        date = self.request.query_params.get('date', None)
        if date:
            queryset = queryset.filter(created_at__date=date)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        user = self.request.user
        current_count = Task.objects.filter(user=user, completed=False).count()
        
        if not user.is_pro and current_count >= 10:
            from rest_framework import serializers
            raise serializers.ValidationError({
                'error': 'Достигнут лимит активных задач (10). Оформите Pro-подписку для безлимита.'
            })
        
        serializer.save(user=user)
        
        @action(detail=False, methods=['get'])
        def today(self, request):
            today = timezone.now().date()
            tasks = Task.objects.filter(
                user=request.user,
                created_at__date=today
            ).order_by('-created_at')
            serializer = self.get_serializer(tasks, many=True)
            return Response(serializer.data)
        
        @action(detail=False, methods=['get'])
        def recent(self, request):
            tasks = Task.objects.filter(
                user=request.user
            ).order_by('-created_at')[:10]
            serializer = self.get_serializer(tasks, many=True)
            return Response(serializer.data)


class StatsViewSet(viewsets.ViewSet):
    """API для статистики"""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def week(self, request):
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        
        days_ru = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
        week_data = []
        max_hours = 0
        
        for i in range(7):
            current_day = start_of_week + timedelta(days=i)
            
            day_tasks = Task.objects.filter(
                user=request.user,
                created_at__date=current_day
            )
            
            total_seconds = day_tasks.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
            total_hours = round(total_seconds / 3600, 1)
            
            if total_hours > max_hours:
                max_hours = total_hours
            
            week_data.append({
                'day': days_ru[i],
                'hours': total_hours,
                'tasks_count': day_tasks.count(),
            })
        
        return Response({
            'week_data': week_data,
            'max_hours': max_hours if max_hours > 0 else 1,
            'total_hours': round(sum(d['hours'] for d in week_data), 1)
        })
    
    @action(detail=False, methods=['get'])
    def month(self, request):
        """Статистика за последние 30 дней (для круговой диаграммы)"""
        month_ago = timezone.now().date() - timedelta(days=30)
        
        categories_stats = []
        categories = Category.objects.filter(user=request.user, is_active=True)
        
        for category in categories:
            tasks = Task.objects.filter(
                user=request.user,
                category=category,
                created_at__date__gte=month_ago
            )
            total_seconds = tasks.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
            
            if total_seconds > 0:
                categories_stats.append({
                    'id': category.id,
                    'name': category.name,
                    'emoji': category.emoji,
                    'color': category.color,
                    'hours': round(total_seconds / 3600, 1),
                    'tasks_count': tasks.count(),
                })
        
        categories_stats.sort(key=lambda x: x['hours'], reverse=True)
        
        total_hours_all = sum(c['hours'] for c in categories_stats)
        
        top_categories = categories_stats[:5]
        other_categories = categories_stats[5:]
        other_hours = sum(c['hours'] for c in other_categories)
        
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
        
        return Response({
            'pie_data': pie_data,
            'center_number': len(pie_data),
            'total_categories': len(categories),
            'total_hours': round(total_hours_all, 1),
        })
    
    @action(detail=False, methods=['get'])
    def category_detail(self, request):
        """Статистика для детальной страницы категории"""
        category_id = request.query_params.get('category_id')
        if not category_id:
            return Response({'error': 'category_id required'}, status=400)
        
        try:
            category = Category.objects.get(id=category_id, user=request.user, is_active=True)
        except Category.DoesNotExist:
            return Response({'error': 'Category not found'}, status=404)
        
        tasks = Task.objects.filter(user=request.user, category=category).order_by('-created_at')
        
        # Общая статистика
        total_seconds = tasks.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
        total_hours = round(total_seconds / 3600, 1)
        tasks_count = tasks.count()
        avg_hours = round(total_hours / tasks_count, 1) if tasks_count > 0 else 0
        
        # За последние 30 дней
        month_ago = timezone.now().date() - timedelta(days=30)
        recent_tasks = tasks.filter(created_at__date__gte=month_ago)
        recent_seconds = recent_tasks.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
        recent_hours = round(recent_seconds / 3600, 1)
        
        # График за неделю
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        days_short = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
        week_data = []
        max_hours = 0
        
        for i in range(7):
            current_day = start_of_week + timedelta(days=i)
            day_tasks = tasks.filter(created_at__date=current_day)
            day_seconds = day_tasks.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
            day_hours = round(day_seconds / 3600, 1)
            
            if day_hours > max_hours:
                max_hours = day_hours
            if max_hours == 0:
                max_hours = 1
            
            week_data.append({
                'name_short': days_short[i],
                'hours': day_hours,
            })
        
        # Последние 10 задач
        recent_tasks_list = [
            {
                'id': t.id,
                'title': t.title,
                'duration_formatted': t.duration_formatted,
                'created_at': t.created_at.strftime('%d.%m %H:%M'),
            }
            for t in tasks[:10]
        ]
        
        return Response({
            'category': {
                'id': category.id,
                'name': category.name,
                'emoji': category.emoji,
                'color': category.color,
                'description': category.description,
            },
            'total_hours': total_hours,
            'tasks_count': tasks_count,
            'avg_hours': avg_hours,
            'recent_hours': recent_hours,
            'week_data': week_data,
            'max_hours': max_hours,
            'recent_tasks': recent_tasks_list,
        })
    




    @action(detail=False, methods=['get'], url_path='monthly-trends')
    def monthly_trends(self, request):
        """Tоп-6 категорий по количеству задач за месяц"""
        user = request.user
        today = timezone.now().date()
        first_day = today.replace(day=1)
        
        # Cписок дат от 1-го числа до сегодня
        days_range = (today - first_day).days + 1
        date_range = [first_day + timedelta(days=i) for i in range(days_range)]
        date_labels = [d.strftime('%d.%m') for d in date_range]
        
        # Cтатистику по категориям за месяц
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
        
        category_stats.sort(key=lambda x: x['total'], reverse=True)
        top_categories = category_stats[:6]
        
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
        
        return Response(result)
    




    from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Goal
 
 
class GoalViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
 
    def list(self, request):
        """Активные цели пользователя"""
        goals = Goal.objects.filter(user=request.user, status='active')
        data = []
        for goal in goals:
            # Автоматически проверяем выполнение
            if goal.progress_percent >= 100:
                goal.status = 'completed'
                goal.completed_at = timezone.now()
                goal.save()
                continue
            if goal.is_overdue:
                goal.status = 'failed'
                goal.save()
                continue
 
            data.append(self._serialize(goal))
        return Response(data)
 
    @action(detail=False, methods=['get'])
    def archive(self, request):
        """Выполненные и просроченные цели"""
        goals = Goal.objects.filter(
            user=request.user,
            status__in=['completed', 'failed']
        ).order_by('-completed_at', '-created_at')
        return Response([self._serialize(g) for g in goals])
 
    def create(self, request):
        user = request.user
        data = request.data
 
        category_id = data.get('category_id')
        title = data.get('title', '').strip()
        goal_type = data.get('goal_type', 'time')
        target_value = data.get('target_value')
        period = data.get('period', 'week')
        deadline = data.get('deadline') or None
 
        if not title:
            return Response({'error': 'Введите название цели'}, status=400)
        if not category_id:
            return Response({'error': 'Выберите категорию'}, status=400)
        if not target_value or float(target_value) <= 0:
            return Response({'error': 'Укажите целевое значение больше 0'}, status=400)
        if period == 'custom' and not deadline:
            return Response({'error': 'Укажите дату дедлайна'}, status=400)
 
        try:
            from categories.models import Category
            category = Category.objects.get(id=category_id, user=user, is_active=True)
        except Category.DoesNotExist:
            return Response({'error': 'Категория не найдена'}, status=404)
 
        goal = Goal.objects.create(
            user=user,
            category=category,
            title=title,
            goal_type=goal_type,
            target_value=float(target_value),
            period=period,
            deadline=deadline if period == 'custom' else None,
        )
        return Response(self._serialize(goal), status=201)
 
    def destroy(self, request, pk=None):
        try:
            goal = Goal.objects.get(id=pk, user=request.user)
            goal.delete()
            return Response({'status': 'deleted'})
        except Goal.DoesNotExist:
            return Response({'error': 'Цель не найдена'}, status=404)
 
    def _serialize(self, goal):
        from datetime import date
    
    # Безопасно получаем end_date
        end_date = goal.end_date
        if isinstance(end_date, str):
            try:
                end_date = date.fromisoformat(end_date)
            except (ValueError, TypeError):
                end_date = None
        
        # Безопасно проверяем is_overdue
        try:
            is_overdue = bool(end_date and date.today() > end_date)
        except TypeError:
            is_overdue = False

        unit = 'ч' if goal.goal_type == 'time' else 'зад.'
        period_labels = {
            'week': 'Неделя',
            'month': 'Месяц',
            'custom': 'До ' + (str(goal.deadline) if goal.deadline else '—')
        }
        
        return {
            'id': goal.id,
            'title': goal.title,
            'goal_type': goal.goal_type,
            'category_name': goal.category.name,
            'category_emoji': goal.category.emoji,
            'category_color': goal.category.color,
            'target_value': goal.target_value,
            'current_value': goal.current_value,
            'progress_percent': goal.progress_percent,
            'period': goal.period,
            'period_label': period_labels.get(goal.period, ''),
            'deadline': str(goal.deadline) if goal.deadline else None,
            'end_date': str(end_date) if end_date else None,
            'status': goal.status,
            'unit': unit,
            'is_overdue': is_overdue,
        }