
from django.urls import path
from . import views

urlpatterns = [
    path(
        "",
        views.detection_home,
        name="detection-home",
    ),
    path(
        "upload/",
        views.upload_csv,
        name="upload-csv",
    ),
    path(
        "history/",
        views.upload_history,
        name="upload-history",
    ),
    path(
        "history/<int:upload_id>/",
        views.upload_detail,
        name="upload-detail",
    ),
    path(
        "history/<int:upload_id>/results/",
        views.upload_results,
        name="upload-results",
    ),
    path(
        "alerts/",
        views.alert_history,
        name="alert-history",
    ),
]
