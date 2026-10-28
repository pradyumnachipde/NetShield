
from rest_framework.test import APITestCase

from detection.models import AnalysisUpload, DetectionResult


class AnalyticsAPITests(APITestCase):

    def setUp(self):
        self.upload = AnalysisUpload.objects.create(
            filename="test_flows.csv",
            total_flows=3,
            benign_flows=2,
            suspicious_flows=1,
        )

        DetectionResult.objects.create(
            upload=self.upload,
            flow_index=1,
            predicted_label="BENIGN",
            confidence=0.98,
            is_suspicious=False,
        )

        DetectionResult.objects.create(
            upload=self.upload,
            flow_index=2,
            predicted_label="BENIGN",
            confidence=0.97,
            is_suspicious=False,
        )

        DetectionResult.objects.create(
            upload=self.upload,
            flow_index=3,
            predicted_label="DoS Hulk",
            confidence=0.95,
            is_suspicious=True,
        )

    def test_dashboard_statistics(self):
        response = self.client.get(
            "/api/analytics/dashboard/"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["total_uploads"],
            1,
        )
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
            response.data["suspicious_percentage"],
            33.33,
        )

    def test_classification_statistics(self):
        response = self.client.get(
            "/api/analytics/classifications/"
        )

        self.assertEqual(response.status_code, 200)

        distribution = {
            item["predicted_label"]: item["count"]
            for item in response.data["classifications"]
        }

        self.assertEqual(distribution["BENIGN"], 2)
        self.assertEqual(distribution["DoS Hulk"], 1)

    def test_analytics_home(self):
        response = self.client.get(
            "/api/analytics/"
        )

        self.assertEqual(response.status_code, 200)
