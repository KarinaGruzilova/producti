from rest_framework import serializers
from .models import Category, Task

class CategorySerializer(serializers.ModelSerializer):
    """Сериализатор для категорий"""
    
    total_time_formatted = serializers.SerializerMethodField()
    task_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'emoji', 'color', 'description',
            'is_active', 'created_at', 'updated_at',
            'total_time_formatted', 'task_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']
    
    def get_total_time_formatted(self, obj):
        return obj.total_time_formatted
    
    def get_task_count(self, obj):
        return obj.task_count
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TaskSerializer(serializers.ModelSerializer):
    """Сериализатор для задач"""
    
    duration_formatted = serializers.SerializerMethodField()
    category_name = serializers.ReadOnlyField(source='category.name')
    category_emoji = serializers.ReadOnlyField(source='category.emoji')
    
    class Meta:
        model = Task
        fields = [
            'id', 'category', 'category_name', 'category_emoji',
            'title', 'description', 'duration_seconds', 'duration_formatted',
            'completed', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']
    
    def get_duration_formatted(self, obj):
        return obj.duration_formatted
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class WeekStatsSerializer(serializers.Serializer):
    """Сериализатор для статистики за неделю"""
    day = serializers.CharField()
    hours = serializers.FloatField()
    tasks_count = serializers.IntegerField()