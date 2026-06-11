from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

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
    




class PaymentHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    plan_type = models.CharField(max_length=20, choices=[('monthly', 'Месяц'), ('yearly', 'Год')])
    payment_id = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Платеж'
        verbose_name_plural = 'Платежи'
    
    def __str__(self):
        return f"{self.user.username} - {self.amount} руб. - {self.created_at}"
    
class ProPromoCode(models.Model):
    code = models.CharField(max_length=50, unique=True)
    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='promocodes')
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    class Meta:
        verbose_name = 'Промокод'
        verbose_name_plural = 'Промокоды'
    
    def __str__(self):
        return f"Промокод {self.code} для {self.user.username} - {'Использован' if self.used else 'Активен'}"
    
    def is_valid(self):
        return not self.used and self.expires_at > timezone.now() 