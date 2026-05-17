from django.db import models
from users.models import User

import emoji

class Category(models.Model):
    PASTEL_COLORS = [
        ('#FFB6C1', 'Пастельно-розовый'),
        ('#FFDAC1', 'Пастельно-персиковый'),
        ('#E2F0CB', 'Пастельно-мятный'),
        ('#B5EAD7', 'Пастельно-бирюзовый'),
        ('#C7CEEA', 'Пастельно-лавандовый'),
        ('#FF9AA2', 'Светло-розовый'),
        ('#FFB7B2', 'Светло-коралловый'),
        ('#FFDAC1', 'Светло-персиковый'),
        ('#E2F0CB', 'Светло-зеленый'),
        ('#B5EAD7', 'Светло-бирюзовый'),
        ('#C7CEEA', 'Светло-сиреневый'),
        ('#F8B195', 'Теплый розовый'),
        ('#F67280', 'Нежный красный'),
        ('#C06C84', 'Приглушенный розовый'),
        ('#6C5B7B', 'Светло-фиолетовый'),
        ('#355C7D', 'Светло-синий'),
        ('#99B898', 'Салатовый'),
        ('#FECEAB', 'Абрикосовый'),
        ('#FF847C', 'Лососевый'),
        ('#E84A5F', 'Малиновый'),
    ]
    

    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100, verbose_name='Название категории')
    color = models.CharField(
        max_length=7, 
        verbose_name='Цвет категории',
        choices=PASTEL_COLORS,
        default='#C7CEEA'
    )
    emoji = models.CharField(
        max_length=10, 
        verbose_name='Эмодзи',
        default='📁'
    )
    description = models.TextField(verbose_name='Описание категории', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True, verbose_name='Активна')
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
        unique_together = ['user', 'name']
    
    def __str__(self):
        return f"{self.emoji} {self.name} ({self.user.username})"
    
    @property
    def total_time(self):
        """Общее время всех задач в категории в секундах"""
        Tasks = self.Tasks.all()
        return sum(task.duration_seconds for task in Tasks)
    
    @property
    def total_time_formatted(self):
        total = self.total_time
        hours = total // 3600
        minutes = (total % 3600) // 60
        
        if hours > 0:
            return f"{hours}ч {minutes}м"
        elif minutes > 0:
            return f"{minutes}м"
        else:
            return "0ч"
    
    @property
    def task_count(self):
        return self.Tasks.count()


class Task(models.Model):
    category = models.ForeignKey(
        Category, 
        on_delete=models.CASCADE, 
        related_name='Tasks' 
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='Tasks')
    title = models.CharField(max_length=200, verbose_name='Название задачи')
    description = models.TextField(verbose_name='Описание задачи', blank=True)
    duration_seconds = models.IntegerField(verbose_name='Потраченное время (сек)', default=0)
    completed = models.BooleanField(default=False, verbose_name='Выполнена')
    due_date = models.DateField(verbose_name='Дата выполнения', null=True, blank=True)
    due_time = models.TimeField(verbose_name='Время выполнения', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    SOURCE_CHOICES = [
        ('focus', 'Фокус (таймер)'),
        ('planned', 'Плановая'),
    ]
    source = models.CharField(
        max_length=20, 
        choices=SOURCE_CHOICES, 
        default='focus',
        verbose_name='Источник создания'
    )
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Задача'
        verbose_name_plural = 'Задачи'
    
    def __str__(self):
        return self.title
    
    @property
    def duration_formatted(self):
        hours = self.duration_seconds // 3600
        minutes = (self.duration_seconds % 3600) // 60
        seconds = self.duration_seconds % 60
        
        if hours > 0:
            return f"{hours}ч {minutes}м"
        elif minutes > 0:
            return f"{minutes}м {seconds}с"
        else:
            return f"{seconds}с"