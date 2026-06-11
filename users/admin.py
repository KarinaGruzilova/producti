from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, PaymentHistory, ProPromoCode

admin.site.site_header = 'Producti — Администрирование'
admin.site.site_title = 'Producti'
admin.site.index_title = 'Управление системой'

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'first_name', 'is_pro', 'is_staff', 'is_active', 'date_joined']
    list_filter = ['is_pro', 'is_staff', 'is_active']
    search_fields = ['username', 'email', 'first_name']
    fieldsets = UserAdmin.fieldsets + (
        ('Подписка', {'fields': ('is_pro', 'subscription_until', 'avatar')}),
    )

@admin.register(PaymentHistory)
class PaymentHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'plan_type', 'status', 'created_at')
    list_filter = ('status', 'plan_type', 'created_at')
    search_fields = ('user__username', 'user__email', 'payment_id')
    readonly_fields = ('created_at',)

@admin.register(ProPromoCode)
class ProPromoCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'user', 'used', 'is_valid_display', 'created_at', 'expires_at')
    list_filter = ('used', 'created_at')
    search_fields = ('code', 'user__username', 'user__email')
    readonly_fields = ('created_at',)

    def is_valid_display(self, obj):
        return obj.is_valid()
    is_valid_display.boolean = True
    is_valid_display.short_description = 'Действителен'