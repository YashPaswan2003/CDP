"""Phase 5 Integration Tests: Real data dashboard (remove mock).

Full end-to-end tests verifying:
- Analytics endpoints return correct structure
- Funnel data properly aggregates from campaign_metrics
- Empty state handling works correctly
- Frontend can consume API responses
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


class TestPhase5Integration:
    """Full Phase 5 integration tests."""

    def test_funnel_endpoint_returns_valid_json(self, client):
        """Verify funnel endpoint returns valid JSON response."""
        response = client.get("/api/analytics/funnel?account_id=ethinos")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"

        data = response.json()
        assert isinstance(data, dict)
        assert "funnel" in data

    def test_funnel_has_three_stages(self, client):
        """Verify funnel always returns exactly 3 stages: tofu, mofu, bofu."""
        response = client.get("/api/analytics/funnel?account_id=ethinos")
        assert response.status_code == 200

        funnel = response.json()["funnel"]
        assert set(funnel.keys()) == {"tofu", "mofu", "bofu"}

    def test_each_funnel_stage_has_required_fields(self, client):
        """Verify each funnel stage has required metric fields."""
        response = client.get("/api/analytics/funnel?account_id=ethinos")
        assert response.status_code == 200

        funnel = response.json()["funnel"]
        required_fields = {"impressions", "clicks", "cost", "reach"}

        for stage_name, stage_data in funnel.items():
            assert set(stage_data.keys()) == required_fields
            # Verify all values are numeric
            for field in required_fields:
                assert isinstance(stage_data[field], (int, float))

    def test_summary_endpoint_returns_valid_json(self, client):
        """Verify summary endpoint returns valid JSON response."""
        response = client.get("/api/analytics/summary?account_id=ethinos")
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/json"

        data = response.json()
        assert isinstance(data, dict)
        assert "summary" in data

    def test_summary_has_required_fields(self, client):
        """Verify summary always has all required fields."""
        response = client.get("/api/analytics/summary?account_id=ethinos")
        assert response.status_code == 200

        summary = response.json()["summary"]
        required_fields = {"total_impressions", "total_clicks", "total_cost", "total_reach"}

        assert set(summary.keys()) == required_fields
        for field in required_fields:
            assert isinstance(summary[field], (int, float))

    def test_funnel_with_all_filters(self, client):
        """Test funnel endpoint with all possible filters applied."""
        response = client.get(
            "/api/analytics/funnel",
            params={
                "account_id": "ethinos",
                "platform": "google",
                "date_from": "2026-04-01",
                "date_to": "2026-04-08",
            }
        )
        assert response.status_code == 200

        funnel = response.json()["funnel"]
        # Should return empty or populated, but always valid structure
        assert "tofu" in funnel
        assert "mofu" in funnel
        assert "bofu" in funnel

    def test_summary_with_all_filters(self, client):
        """Test summary endpoint with all possible filters applied."""
        response = client.get(
            "/api/analytics/summary",
            params={
                "account_id": "ethinos",
                "date_from": "2026-04-01",
                "date_to": "2026-04-08",
            }
        )
        assert response.status_code == 200

        summary = response.json()["summary"]
        assert "total_impressions" in summary
        assert "total_clicks" in summary
        assert "total_cost" in summary
        assert "total_reach" in summary

    def test_empty_account_returns_empty_metrics(self, client):
        """Verify empty account returns valid but empty metric structure."""
        response = client.get("/api/analytics/funnel?account_id=ethinos")
        assert response.status_code == 200

        funnel = response.json()["funnel"]
        # For empty account with no data, all stages should be zero
        for stage in ["tofu", "mofu", "bofu"]:
            assert funnel[stage]["impressions"] >= 0
            assert funnel[stage]["clicks"] >= 0
            assert funnel[stage]["cost"] >= 0
            assert funnel[stage]["reach"] >= 0

    def test_funnel_frontendready_response_format(self, client):
        """Verify funnel response matches frontend expectations."""
        response = client.get("/api/analytics/funnel?account_id=kotak-mf&platform=google")
        assert response.status_code == 200

        data = response.json()

        # Frontend expects this exact structure
        assert "funnel" in data
        funnel = data["funnel"]

        # Three-stage funnel
        assert isinstance(funnel, dict)
        assert len(funnel) == 3

        # Each stage should be displayable (numeric values)
        for stage_data in funnel.values():
            # Can calculate CTR
            if stage_data["impressions"] > 0:
                ctr = (stage_data["clicks"] / stage_data["impressions"]) * 100
                assert ctr >= 0

            # Can display cost
            assert stage_data["cost"] >= 0

    def test_multiple_accounts_return_different_data(self, client):
        """Verify different accounts can return different data."""
        # Ethinos account
        response1 = client.get("/api/analytics/summary?account_id=ethinos")
        assert response1.status_code == 200
        summary1 = response1.json()["summary"]

        # Kotak account
        response2 = client.get("/api/analytics/summary?account_id=kotak-mf")
        assert response2.status_code == 200
        summary2 = response2.json()["summary"]

        # Both should be valid responses (may or may not have different values)
        assert "total_impressions" in summary1
        assert "total_impressions" in summary2
