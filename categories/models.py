from django.db import models
from users.models import User
# import emoji

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
        max_length=4, 
        verbose_name='Эмодзи',
        default='📁'
    )
    description = models.TextField(max_length=500, verbose_name='Описание категории', blank=True)
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
    title = models.CharField(max_length=100, verbose_name='Название задачи')
    description = models.TextField(max_length=500, verbose_name='Описание задачи', blank=True)
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
        




from django.db import models
from django.utils import timezone
from users.models import User
from categories.models import Category
 
 
class Goal(models.Model):
 
    TYPE_CHOICES = [
        ('time', 'По времени (часы)'),
        ('tasks', 'По задачам (количество)'),
    ]
 
    PERIOD_CHOICES = [
        ('week', 'Неделя'),
        ('month', 'Месяц'),
        ('custom', 'Своя дата'),
    ]
 
    STATUS_CHOICES = [
        ('active', 'Активна'),
        ('completed', 'Выполнена'),
        ('failed', 'Просрочена'),
    ]
 
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='goals')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='goals')
    title = models.CharField(max_length=100, verbose_name='Название цели')
    goal_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='time')
    target_value = models.FloatField(verbose_name='Целевое значение')
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES, default='week')
    deadline = models.DateField(null=True, blank=True, verbose_name='Дедлайн (для своей даты)')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
 
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Цель'
        verbose_name_plural = 'Цели'
 
    def __str__(self):
        return f"{self.title} ({self.user.username})"
 
    @property
    def start_date(self):
        """Дата начала периода цели"""
        today = timezone.now().date()
        if self.period == 'week':
            return today - timezone.timedelta(days=today.weekday())
        elif self.period == 'month':
            return today.replace(day=1)
        else:
            return self.created_at.date()
 
    @property
    def end_date(self):
        """Дата окончания периода"""
        from datetime import timedelta
        today = timezone.now().date()
        if self.period == 'week':
            start = today - timedelta(days=today.weekday())
            return start + timedelta(days=6)
        elif self.period == 'month':
            if today.month == 12:
                return today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
            return today.replace(month=today.month + 1, day=1) - timedelta(days=1)
        else:
            return self.deadline
 
    @property
    def current_value(self):
        """Текущий прогресс"""
        from categories.models import Task
        from django.db.models import Sum
        tasks = Task.objects.filter(
            user=self.user,
            category=self.category,
            created_at__date__gte=self.start_date,
        )
        if self.end_date:
            tasks = tasks.filter(created_at__date__lte=self.end_date)
 
        if self.goal_type == 'time':
            total = tasks.aggregate(Sum('duration_seconds'))['duration_seconds__sum'] or 0
            return round(total / 3600, 1)
        else:
            return tasks.filter(completed=True).count()
 
    @property
    def progress_percent(self):
        if self.target_value <= 0:
            return 0
        pct = (self.current_value / self.target_value) * 100
        return min(round(pct, 1), 100)
 
    @property
    def is_overdue(self):
        if self.end_date and timezone.now().date() > self.end_date:
            return True
        return False