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

def test_accounts_endpoint(client):
    """Test GET /api/accounts endpoint."""
    response = client.get("/api/accounts")
    assert response.status_code == 200
    # Response is a list of accounts
    data = response.json()
    assert isinstance(data, list)
    # Check that each account has required fields
    for account in data:
        assert "id" in account
        assert "name" in account
        assert "industry" in account
        assert "currency" in account
        assert "client_type" in account
        assert "platforms" in account

def test_upload_status_not_found(client):
    """Test GET /api/upload/status/{upload_id} returns 404 for non-existent upload."""
    response = client.get("/api/upload/status/nonexistent-upload-id")
    assert response.status_code == 404
    assert "Upload not found" in response.json()["detail"]

def test_upload_status_invalid_id(client):
    """Test GET /api/upload/status/{upload_id} with invalid ID."""
    response = client.get("/api/upload/status/invalid-uuid")
    assert response.status_code == 404
    assert "Upload not found" in response.json()["detail"]
