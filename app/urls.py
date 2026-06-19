from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from app import settings
from django.conf.urls.static import static
from users.forms import CustomPasswordResetForm

urlpatterns = [
    path('admin/', admin.site.urls),

    path('', include('main.urls', namespace='main')),
    path('categories/', include('categories.urls', namespace='categories')),
    path('user/', include('users.urls', namespace='user')),

    path('api/', include('categories.api_urls')),
    path('api/users/', include('users.api_urls')),
    path('password-reset/', 
        auth_views.PasswordResetView.as_view(
            template_name='registration/password_reset_form.html',
            form_class=CustomPasswordResetForm
        ), name='password_reset'),

    path('password-reset/done/', 
        auth_views.PasswordResetDoneView.as_view(
            template_name='registration/password_reset_done.html'
        ), name='password_reset_done'),

    path('reset/<uidb64>/<token>/', 
        auth_views.PasswordResetConfirmView.as_view(
            template_name='registration/password_reset_confirm.html'
        ), name='password_reset_confirm'),

    path('reset/done/', 
        auth_views.PasswordResetCompleteView.as_view(
            template_name='registration/password_reset_complete.html'
        ), name='password_reset_complete'),
]

if settings.DEBUG:
    urlpatterns = [
        path('__debug__/', include('debug_toolbar.urls')),
    ] + urlpatterns

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
