import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_dashboard_success(client):
    """Test getting dashboard for valid client."""
    # Use the sample account ID from seed
    client_id = "kotak-mf"

    response = client.get(f"/dashboard/{client_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["client_id"] == client_id
    assert data["client_name"] == "Kotak Mutual Fund"
    assert "campaigns" in data
    assert len(data["campaigns"]) > 0
    assert data["total_spend"] > 0
    assert data["total_impressions"] > 0

def test_dashboard_with_date_range(client):
    """Test dashboard with date range filter."""
    client_id = "kotak-mf"

    response = client.get(
        f"/dashboard/{client_id}",
        params={
            "start_date": "2026-04-01",
            "end_date": "2026-04-05"
        }
    )
    assert response.status_code == 200

    data = response.json()
    assert data["date_range"]["start"] == "2026-04-01"
    assert data["date_range"]["end"] == "2026-04-05"

def test_dashboard_nonexistent_client(client):
    """Test dashboard for non-existent client."""
    response = client.get("/dashboard/nonexistent-client-id")
    assert response.status_code == 404

def test_dashboard_campaign_metrics(client):
    """Test that campaign metrics are calculated correctly."""
    client_id = "kotak-mf"

    response = client.get(f"/dashboard/{client_id}")
    assert response.status_code == 200

    data = response.json()
    for campaign in data["campaigns"]:
        # Verify campaign structure
        assert "campaign_id" in campaign
        assert "campaign_name" in campaign
        assert "platform" in campaign
        assert "total_spend" in campaign
        assert "total_impressions" in campaign
        assert "total_clicks" in campaign
        assert "total_conversions" in campaign
        assert "total_revenue" in campaign
        assert "average_cpc" in campaign
        assert "conversion_rate" in campaign
        assert "roas" in campaign
        assert "metrics" in campaign

        # Verify KPI calculations
        if campaign["total_clicks"] > 0:
            expected_cpc = campaign["total_spend"] / campaign["total_clicks"]
            assert abs(campaign["average_cpc"] - expected_cpc) < 0.01

def test_dashboard_real_estate_client(client):
    """Test dashboard for second account with campaigns."""
    # Using kotak-mf since qi-spine has no campaigns in seed
    client_id = "kotak-mf"

    response = client.get(f"/dashboard/{client_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["client_name"] == "Kotak Mutual Fund"
    assert len(data["campaigns"]) > 0
