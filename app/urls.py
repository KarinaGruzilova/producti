
from django.contrib import admin
from django.urls import path, include

from app import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/', include('categories.api_urls')),

    path('', include('main.urls', namespace='main')),
    path('categories/', include('categories.urls', namespace='categories')),
    path('user/', include('users.urls', namespace='user')),

    path('api/users/', include('users.api_urls')),
]

if settings.DEBUG:
    urlpatterns = [
        path('__debug__/', include('debug_toolbar.urls')),
    ] + urlpatterns

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
