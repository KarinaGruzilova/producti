from django.contrib import admin
from users.models import User

admin.site.register(User)


from django.contrib import admin
from .models import PaymentHistory, ProPromoCode

@admin.register(PaymentHistory)
class PaymentHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'amount', 'plan_type', 'status', 'created_at')
    list_filter = ('status', 'plan_type', 'created_at')
    search_fields = ('user__username', 'user__email', 'payment_id')
    readonly_fields = ('created_at',)

@admin.register(ProPromoCode)
class ProPromoCodeAdmin(admin.ModelAdmin):
    list_display = ('code', 'user', 'used', 'created_at', 'expires_at')
    list_filter = ('used', 'created_at', 'expires_at')
    search_fields = ('code', 'user__username', 'user__email')
    readonly_fields = ('created_at',)
    
    def is_valid(self, obj):
        return obj.is_valid()
    is_valid.boolean = True
    is_valid.short_description = 'Действителен'