
from django.contrib import admin
from .models import AnalysisUpload, DetectionResult


@admin.register(AnalysisUpload)
class AnalysisUploadAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "filename",
        "uploaded_at",
        "total_flows",
        "benign_flows",
        "suspicious_flows",
        "status",
    ]

    search_fields = ["filename"]
    list_filter = ["status", "uploaded_at"]


@admin.register(DetectionResult)
class DetectionResultAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "upload",
        "flow_index",
        "predicted_label",
        "confidence",
        "is_suspicious",
    ]

    list_filter = [
        "is_suspicious",
        "predicted_label",
    ]

    search_fields = [
        "predicted_label",
        "upload__filename",
    ]
