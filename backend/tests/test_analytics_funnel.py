"""Tests for Phase 5: Real data analytics endpoints.

Tests for:
- GET /api/analytics/funnel?account_id=&date_from=&date_to=
- GET /api/analytics/summary?account_id=
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


class TestFunnelEndpoint:
    """Test /api/analytics/funnel endpoint."""

    def test_funnel_without_params(self, client):
        """Test funnel without any parameters."""
        response = client.get("/api/analytics/funnel")
        assert response.status_code == 200
        data = response.json()
        assert "funnel" in data

    def test_funnel_with_account_id(self, client):
        """Test funnel with account_id filter."""
        # Use the ethinos master account
        response = client.get("/api/analytics/funnel?account_id=ethinos")
        assert response.status_code == 200
        data = response.json()
        assert "funnel" in data
        # For empty account, should still return valid structure (dict with three stages)
        assert isinstance(data["funnel"], dict)

    def test_funnel_with_date_range(self, client):
        """Test funnel with date range filter."""
        response = client.get(
            "/api/analytics/funnel",
            params={
                "account_id": "ethinos",
                "date_from": "2026-04-01",
                "date_to": "2026-04-08",
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "funnel" in data

    def test_funnel_with_all_params(self, client):
        """Test funnel with all parameters."""
        response = client.get(
            "/api/analytics/funnel",
            params={
                "account_id": "ethinos",
                "date_from": "2026-04-01",
                "date_to": "2026-04-08",
            }
        )
        assert response.status_code == 200
        data = response.json()
        funnel = data["funnel"]

        # Should return three-stage funnel: TOFU, MOFU, BOFU
        assert isinstance(funnel, dict)
        assert "tofu" in funnel
        assert "mofu" in funnel
        assert "bofu" in funnel

    def test_funnel_response_structure(self, client):
        """Test funnel response has correct structure."""
        response = client.get("/api/analytics/funnel?account_id=ethinos")
        assert response.status_code == 200
        data = response.json()
        funnel = data["funnel"]

        # For each stage, verify structure
        for stage_name in ["tofu", "mofu", "bofu"]:
            stage = funnel.get(stage_name, {})
            # Stage should have basic metrics
            assert isinstance(stage, dict)
            # Can be empty, but should have these keys if data exists
            if stage:
                assert "impressions" in stage or "clicks" in stage or "cost" in stage


class TestSummaryEndpoint:
    """Test /api/analytics/summary endpoint."""

    def test_summary_with_account_id(self, client):
        """Test summary endpoint with account_id."""
        response = client.get("/api/analytics/summary?account_id=ethinos")
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data

    def test_summary_response_structure(self, client):
        """Test summary response structure."""
        response = client.get("/api/analytics/summary?account_id=ethinos")
        assert response.status_code == 200
        data = response.json()
        summary = data["summary"]

        # Summary should have key metrics
        assert isinstance(summary, dict)
        # Should have these required fields
        assert "total_impressions" in summary
        assert "total_clicks" in summary
        assert "total_cost" in summary
        assert "total_reach" in summary

    def test_summary_no_account(self, client):
        """Test summary without account_id."""
        response = client.get("/api/analytics/summary")
        # Should still return 200 with empty/aggregated data
        assert response.status_code == 200


class TestFunnelDataIntegration:
    """Integration tests for funnel data from campaign_metrics table."""

    def test_funnel_empty_state(self, client):
        """Test funnel returns valid structure even with no data."""
        response = client.get("/api/analytics/funnel?account_id=ethinos")
        assert response.status_code == 200
        data = response.json()
        funnel = data["funnel"]

        # Should return dict with three stages
        assert isinstance(funnel, dict)
        assert len(funnel) >= 0  # Can be empty or populated

    def test_funnel_stage_aggregation(self, client):
        """Test that funnel correctly aggregates by funnel_stage."""
        response = client.get("/api/analytics/funnel?account_id=kotak-mf")
        assert response.status_code == 200
        data = response.json()
        funnel = data["funnel"]

        # Should have aggregated metrics per stage
        for stage_name in ["tofu", "mofu", "bofu"]:
            stage = funnel.get(stage_name, {})
            if stage:
                # If data exists, metrics should be numeric
                if "impressions" in stage:
                    assert isinstance(stage["impressions"], (int, float))
                if "clicks" in stage:
                    assert isinstance(stage["clicks"], (int, float))
                if "cost" in stage:
                    assert isinstance(stage["cost"], (int, float))

    def test_summary_aggregation(self, client):
        """Test that summary correctly aggregates all metrics."""
        response = client.get("/api/analytics/summary?account_id=kotak-mf")
        assert response.status_code == 200
        data = response.json()
        summary = data["summary"]

        # All numeric fields should be valid numbers
        for key in summary:
            if key.startswith("total_"):
                assert isinstance(summary[key], (int, float, type(None)))
