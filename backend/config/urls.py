from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health_check(request):
    return JsonResponse({
        "status": "success",
        "message": "NetShield API is running",
        "service": "NetShield Backend",
    })


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check),
    path("api/detection/", include("detection.urls")),
    path("api/analytics/", include("analytics.urls")),
]