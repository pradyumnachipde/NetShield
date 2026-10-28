from io import BytesIO
from unittest.mock import patch

from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from .models import AnalysisUpload, DetectionResult


class DetectionAPITests(APITestCase):

    def setUp(self):
        self.sample_predictions = [
            {
                "flow_index": 1,
                "predicted_label": "BENIGN",
                "confidence": 0.98,
                "is_suspicious": False,
            },
            {
                "flow_index": 2,
                "predicted_label": "DoS Hulk",
                "confidence": 0.95,
                "is_suspicious": True,
            },
            {
                "flow_index": 3,
                "predicted_label": "BENIGN",
                "confidence": 0.99,
                "is_suspicious": False,
            },
        ]

    def create_upload(self):
        return SimpleUploadedFile(
            "sample.csv",
            b"feature1,feature2\n1,2\n3,4\n",
            content_type="text/csv",
        )

    def test_detection_home(self):
        response = self.client.get(
            "/api/detection/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["status"],
            "success",
        )

    @patch("detection.views.predict_csv")
    def test_csv_upload(self, mock_predict):
        mock_predict.return_value = (
            self.sample_predictions
        )

        response = self.client.post(
            "/api/detection/upload/",
            {"file": self.create_upload()},
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.data["total_flows"],
            3,
        )
        self.assertEqual(
            response.data["benign_flows"],
            2,
        )
        self.assertEqual(
            response.data["suspicious_flows"],
            1,
        )

        self.assertEqual(
            AnalysisUpload.objects.count(),
            1,
        )

        self.assertEqual(
            DetectionResult.objects.count(),
            3,
        )

    def test_reject_non_csv(self):
        file = SimpleUploadedFile(
            "sample.txt",
            b"invalid data",
            content_type="text/plain",
        )

        response = self.client.post(
            "/api/detection/upload/",
            {"file": file},
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)

    def test_reject_empty_file(self):
        file = SimpleUploadedFile(
            "empty.csv",
            b"",
            content_type="text/csv",
        )

        response = self.client.post(
            "/api/detection/upload/",
            {"file": file},
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)

    @patch("detection.views.predict_csv")
    def test_upload_history(self, mock_predict):
        mock_predict.return_value = (
            self.sample_predictions
        )

        self.client.post(
            "/api/detection/upload/",
            {"file": self.create_upload()},
            format="multipart",
        )

        response = self.client.get(
            "/api/detection/history/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

    @patch("detection.views.predict_csv")
    def test_alert_history(self, mock_predict):
        mock_predict.return_value = (
            self.sample_predictions
        )

        self.client.post(
            "/api/detection/upload/",
            {"file": self.create_upload()},
            format="multipart",
        )

        response = self.client.get(
            "/api/detection/alerts/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertTrue(
            response.data["results"][0]["is_suspicious"]
        )

    @patch("detection.views.predict_csv")
    def test_suspicious_filter(self, mock_predict):
        mock_predict.return_value = (
            self.sample_predictions
        )

        upload_response = self.client.post(
            "/api/detection/upload/",
            {"file": self.create_upload()},
            format="multipart",
        )

        upload_id = upload_response.data["upload_id"]

        response = self.client.get(
            f"/api/detection/history/{upload_id}/results/",
            {"suspicious": "true"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)

    @patch("detection.views.predict_csv")
    def test_invalid_filter(self, mock_predict):
        mock_predict.return_value = (
            self.sample_predictions
        )

        upload_response = self.client.post(
            "/api/detection/upload/",
            {"file": self.create_upload()},
            format="multipart",
        )

        upload_id = upload_response.data["upload_id"]

        response = self.client.get(
            f"/api/detection/history/{upload_id}/results/",
            {"suspicious": "invalid"},
        )

        self.assertEqual(response.status_code, 400)

    def test_missing_upload(self):
        response = self.client.get(
            "/api/detection/history/999999/"
        )

        self.assertEqual(response.status_code, 404)
