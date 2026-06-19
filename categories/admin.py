from django.contrib import admin
from django import forms
from django.utils.html import format_html
from django.contrib.admin.widgets import ForeignKeyRawIdWidget
from .models import Category, Task
from users.models import User

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['emoji', 'name', 'user', 'color_display', 'Task_count', 'is_active']
    list_filter = ['user', 'is_active', 'created_at']
    search_fields = ['name', 'user__username']
    list_editable = ['is_active']
    
    def color_display(self, obj):
        return format_html(
            '<span style="display: inline-block; width: 20px; height: 20px; '
            'background-color: {}; border-radius: 3px; border: 1px solid #ddd;"></span> {}',
            obj.color, obj.color
        )
    color_display.short_description = 'Цвет'
    
    def Task_count(self, obj):
        return obj.Tasks.count()
    Task_count.short_description = 'Задач'
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        # Обычный пользователь видит только себя при выборе владельца
        if db_field.name == "user":
            if not request.user.is_superuser:
                kwargs["queryset"] = User.objects.filter(id=request.user.id)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)
    
    def save_model(self, request, obj, form, change):
        # Автоматически назначаем владельца при создании категории
        if not obj.pk:  # Только при создании
            obj.user = request.user
        super().save_model(request, obj, form, change)

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):

    list_display = ['title', 'category', 'user', 'duration_seconds', 'completed', 'created_at']
    list_filter = ['category', 'completed', 'user', 'created_at']
    search_fields = ['title', 'description', 'category__name']

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "category":
            if not request.user.is_superuser:
                kwargs["queryset"] = Category.objects.filter(user=request.user)

        if db_field.name == "user":
            if not request.user.is_superuser:
                kwargs["queryset"] = User.objects.filter(id=request.user.id)

        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        if not obj.user_id:
            obj.user = request.user
        super().save_model(request, obj, form, change)