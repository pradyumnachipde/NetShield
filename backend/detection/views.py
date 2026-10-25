
from collections import Counter

from django.db import transaction
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .models import AnalysisUpload, DetectionResult
from .serializers import (
    AnalysisUploadSerializer,
    DetectionResultSerializer,
    CSVUploadSerializer,
)
from .ml_service import predict_csv


class ResultsPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = "page_size"
    max_page_size = 200


@api_view(["GET"])
def detection_home(request):
    return Response({
        "status": "success",
        "message": "NetShield Detection API",
        "endpoints": {
            "upload": "/api/detection/upload/",
            "history": "/api/detection/history/",
            "alerts": "/api/detection/alerts/",
        },
    })


@api_view(["POST"])
def upload_csv(request):
    serializer = CSVUploadSerializer(
        data=request.data
    )

    serializer.is_valid(raise_exception=True)

    uploaded_file = serializer.validated_data["file"]

    try:
        results = predict_csv(uploaded_file)
    except ValueError as error:
        return Response(
            {"error": str(error)},
            status=status.HTTP_400_BAD_REQUEST,
        )
    except FileNotFoundError:
        return Response(
            {"error": "Trained ML model files are missing."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    total_flows = len(results)

    suspicious_flows = sum(
        result["is_suspicious"]
        for result in results
    )

    benign_flows = total_flows - suspicious_flows

    distribution = dict(
        Counter(
            result["predicted_label"]
            for result in results
        )
    )

    with transaction.atomic():
        upload = AnalysisUpload.objects.create(
            filename=uploaded_file.name[:255],
            total_flows=total_flows,
            benign_flows=benign_flows,
            suspicious_flows=suspicious_flows,
            status="completed",
        )

        detection_objects = [
            DetectionResult(
                upload=upload,
                flow_index=result["flow_index"],
                predicted_label=result["predicted_label"],
                confidence=result["confidence"],
                is_suspicious=result["is_suspicious"],
            )
            for result in results
        ]

        DetectionResult.objects.bulk_create(
            detection_objects,
            batch_size=1000,
        )

    return Response(
        {
            "message": "CSV analysis completed successfully.",
            "upload_id": upload.id,
            "filename": upload.filename,
            "total_flows": total_flows,
            "benign_flows": benign_flows,
            "suspicious_flows": suspicious_flows,
            "classification_distribution": distribution,
            "results_url": (
                f"/api/detection/history/{upload.id}/results/"
            ),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
def upload_history(request):
    uploads = AnalysisUpload.objects.all()

    paginator = ResultsPagination()
    page = paginator.paginate_queryset(
        uploads,
        request,
    )

    serializer = AnalysisUploadSerializer(
        page,
        many=True,
    )

    return paginator.get_paginated_response(
        serializer.data
    )


@api_view(["GET"])
def upload_detail(request, upload_id):
    upload = get_object_or_404(
        AnalysisUpload,
        id=upload_id,
    )

    serializer = AnalysisUploadSerializer(upload)

    distribution = dict(
        Counter(
            upload.results.values_list(
                "predicted_label",
                flat=True,
            )
        )
    )

    return Response({
        **serializer.data,
        "classification_distribution": distribution,
    })


@api_view(["GET"])
def upload_results(request, upload_id):
    upload = get_object_or_404(
        AnalysisUpload,
        id=upload_id,
    )

    results = upload.results.all()

    suspicious = request.query_params.get(
        "suspicious"
    )

    if suspicious is not None:
        if suspicious.lower() not in ["true", "false"]:
            return Response(
                {
                    "error": (
                        "suspicious must be true or false."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = results.filter(
            is_suspicious=suspicious.lower() == "true"
        )

    label = request.query_params.get("label")

    if label:
        results = results.filter(
            predicted_label__iexact=label
        )

    paginator = ResultsPagination()

    page = paginator.paginate_queryset(
        results,
        request,
    )

    serializer = DetectionResultSerializer(
        page,
        many=True,
    )

    return paginator.get_paginated_response(
        serializer.data
    )


@api_view(["GET"])
def alert_history(request):
    alerts = DetectionResult.objects.filter(
        is_suspicious=True
    ).order_by("-created_at", "-id")

    paginator = ResultsPagination()

    page = paginator.paginate_queryset(
        alerts,
        request,
    )

    serializer = DetectionResultSerializer(
        page,
        many=True,
    )

    return paginator.get_paginated_response(
        serializer.data
    )
