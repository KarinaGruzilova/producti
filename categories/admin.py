# categories/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Category, Task  

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['emoji', 'name', 'user', 'color_display', 'Task_count', 'is_active']
    list_filter = ['user', 'is_active', 'created_at']
    search_fields = ['name', 'user__username']
    list_editable = ['is_active']
    
    # Отображение цвета в списке
    def color_display(self, obj):
        return format_html(
            '<span style="display: inline-block; width: 20px; height: 20px; '
            'background-color: {}; border-radius: 3px; border: 1px solid #ddd;"></span> {}',
            obj.color, obj.color
        )
    color_display.short_description = 'Цвет'
    
    # Количество задач в категории
    def Task_count(self, obj):
        return obj.Tasks.count()
    Task_count.short_description = 'Задач'


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'user', 'duration_formatted', 'completed', 'created_at']
    list_filter = ['category', 'completed', 'user', 'created_at']
    search_fields = ['title', 'description', 'category__name']
    
    def duration_formatted(self, obj):
        hours = obj.duration_seconds // 3600
        minutes = (obj.duration_seconds % 3600) // 60
        return f"{hours}ч {minutes}м"
    duration_formatted.short_description = 'Время'