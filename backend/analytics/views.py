
from django.db.models import Count, Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response

from detection.models import (
    AnalysisUpload,
    DetectionResult,
)


@api_view(["GET"])
def analytics_home(request):
    return Response({
        "status": "success",
        "message": "NetShield Analytics API",
        "endpoints": {
            "dashboard": "/api/analytics/dashboard/",
            "classifications": "/api/analytics/classifications/",
        },
    })


@api_view(["GET"])
def dashboard_stats(request):
    totals = AnalysisUpload.objects.aggregate(
        total_flows=Sum("total_flows"),
        benign_flows=Sum("benign_flows"),
        suspicious_flows=Sum("suspicious_flows"),
    )

    total_flows = totals["total_flows"] or 0
    benign_flows = totals["benign_flows"] or 0
    suspicious_flows = totals["suspicious_flows"] or 0

    suspicious_percentage = (
        round(
            suspicious_flows / total_flows * 100,
            2,
        )
        if total_flows > 0
        else 0
    )

    recent_uploads = list(
        AnalysisUpload.objects.values(
            "id",
            "filename",
            "uploaded_at",
            "total_flows",
            "suspicious_flows",
        )[:5]
    )

    return Response({
        "total_uploads": AnalysisUpload.objects.count(),
        "total_flows": total_flows,
        "benign_flows": benign_flows,
        "suspicious_flows": suspicious_flows,
        "suspicious_percentage": suspicious_percentage,
        "recent_uploads": recent_uploads,
    })


@api_view(["GET"])
def classification_stats(request):
    classifications = (
        DetectionResult.objects
        .values("predicted_label")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    return Response({
        "classifications": list(classifications),
    })
