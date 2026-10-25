
from rest_framework import serializers
from .models import AnalysisUpload, DetectionResult


class DetectionResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = DetectionResult
        fields = [
            "id",
            "upload",
            "flow_index",
            "predicted_label",
            "confidence",
            "is_suspicious",
            "created_at",
        ]


class AnalysisUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisUpload
        fields = [
            "id",
            "filename",
            "uploaded_at",
            "total_flows",
            "benign_flows",
            "suspicious_flows",
            "status",
        ]


class CSVUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, file):
        if not file.name.lower().endswith(".csv"):
            raise serializers.ValidationError(
                "Only CSV files are supported."
            )

        if file.size > 20 * 1024 * 1024:
            raise serializers.ValidationError(
                "Maximum file size is 20 MB."
            )

        if file.size == 0:
            raise serializers.ValidationError(
                "The uploaded file is empty."
            )

        return file
