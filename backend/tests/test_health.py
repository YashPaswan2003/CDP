import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    """Fixture for test client."""
    return TestClient(app)

def test_health_endpoint(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "timestamp" in response.json()

def test_metrics_count_endpoint(client):
    """Test metrics count endpoint."""
    response = client.get("/api/metrics/count")
    assert response.status_code == 200
    assert "total_metrics" in response.json()
    assert response.json()["total_metrics"] > 0

def test_clients_endpoint(client):
    """Test clients endpoint."""
    response = client.get("/api/clients")
    assert response.status_code == 200
    data = response.json()
    assert "clients" in data
    assert len(data["clients"]) == 2  # TechStore and RealEstate

def test_campaigns_endpoint(client):
    """Test campaigns endpoint."""
    response = client.get("/api/campaigns")
    assert response.status_code == 200
    data = response.json()
    assert "campaigns" in data
    assert len(data["campaigns"]) > 0
