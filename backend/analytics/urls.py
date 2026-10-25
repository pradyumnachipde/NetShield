
from django.urls import path
from . import views

urlpatterns = [
    path(
        "",
        views.analytics_home,
        name="analytics-home",
    ),
    path(
        "dashboard/",
        views.dashboard_stats,
        name="dashboard-stats",
    ),
    path(
        "classifications/",
        views.classification_stats,
        name="classification-stats",
    ),
]
