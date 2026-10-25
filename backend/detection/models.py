
from django.db import models


class AnalysisUpload(models.Model):
    filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    total_flows = models.PositiveIntegerField(default=0)
    benign_flows = models.PositiveIntegerField(default=0)
    suspicious_flows = models.PositiveIntegerField(default=0)

    status = models.CharField(
        max_length=20,
        default="completed",
    )

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.filename} - {self.uploaded_at}"


class DetectionResult(models.Model):
    upload = models.ForeignKey(
        AnalysisUpload,
        on_delete=models.CASCADE,
        related_name="results",
    )

    flow_index = models.PositiveIntegerField()
    predicted_label = models.CharField(max_length=100)
    confidence = models.FloatField()
    is_suspicious = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["flow_index"]
        indexes = [
            models.Index(fields=["is_suspicious"]),
            models.Index(fields=["predicted_label"]),
        ]

    def __str__(self):
        return f"{self.predicted_label} - {self.confidence:.2f}"
