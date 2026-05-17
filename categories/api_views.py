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
        ).order_by('name')
    
    def perform_create(self, serializer):
        user = self.request.user
        current_count = Category.objects.filter(user=user, is_active=True).count()
    
        # Бесплатный тариф: максимум 5 категорий
        if not user.is_pro and current_count >= 5:
            from rest_framework import serializers
            raise serializers.ValidationError({
                'error': 'Достигнут лимит категорий (5). Оформите Pro-подписку для безлимита.'
            })
    
        serializer.save(user=user)
    
    @action(detail=True, methods=['get'])
    def tasks(self, request, pk=None):
        """Получить все задачи категории"""
        category = self.get_object()
        tasks = Task.objects.filter(category=category, user=request.user)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Архивировать категорию"""
        category = self.get_object()
        category.is_active = False
        category.save()
        return Response({'status': 'archived', 'id': category.id})
    

    def perform_destroy(self, instance):
        """При удалении категории удаляются все связанные задачи (cascade)"""
        instance.delete()


class TaskViewSet(viewsets.ModelViewSet):
    """API для управления задачами"""
    
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Task.objects.filter(user=self.request.user)
        
        # Фильтр по категории
        category_id = self.request.query_params.get('category', None)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        
        # Фильтр по дате
        date = self.request.query_params.get('date', None)
        if date:
            queryset = queryset.filter(created_at__date=date)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        user = self.request.user
        current_count = Task.objects.filter(user=user, completed=False).count()
        
        # Бесплатный тариф: максимум 10 активных задач
        if not user.is_pro and current_count >= 10:
            from rest_framework import serializers
            raise serializers.ValidationError({
                'error': 'Достигнут лимит активных задач (10). Оформите Pro-подписку для безлимита.'
            })
        
        serializer.save(user=user)
        
        @action(detail=False, methods=['get'])
        def today(self, request):
            """Задачи за сегодня"""
            today = timezone.now().date()
            tasks = Task.objects.filter(
                user=request.user,
                created_at__date=today
            ).order_by('-created_at')
            serializer = self.get_serializer(tasks, many=True)
            return Response(serializer.data)
        
        @action(detail=False, methods=['get'])
        def recent(self, request):
            """Последние 10 задач"""
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
        """Статистика за текущую неделю (для графика)"""
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
        
        # Топ-5 + Остальное
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
        """
        Линейная диаграмма: топ-6 категорий по количеству задач за месяц
        """
        user = request.user
        today = timezone.now().date()
        first_day = today.replace(day=1)
        
        # Формируем список дат от 1-го числа до сегодня
        days_range = (today - first_day).days + 1
        date_range = [first_day + timedelta(days=i) for i in range(days_range)]
        date_labels = [d.strftime('%d.%m') for d in date_range]
        
        # Собираем статистику по категориям за месяц
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
        
        # Берём топ-6 категорий
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
        
        return Response(result)
    