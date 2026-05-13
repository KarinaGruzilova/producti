from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    avatar = models.ImageField(
        upload_to='users_images', 
        blank=True, 
        null=True,
        verbose_name='Аватар'
    )

    # Поля подписки
    is_pro = models.BooleanField(default=False)
    subscription_until = models.DateTimeField(null=True, blank=True)
    
    def has_pro(self):
        """Проверяет, активна ли Pro-подписка"""
        if self.is_pro:
            if self.subscription_until and self.subscription_until < timezone.now():
                return False
            return True
        return False
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
    
    def __str__(self):
        return self.username