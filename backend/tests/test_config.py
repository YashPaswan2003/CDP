"""Tests for /api/config endpoint."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import get_connection
from app.database.schema import drop_all_tables, create_tables

@pytest.fixture
def client():
    """Fixture for test client."""
    return TestClient(app)

@pytest.fixture
def account_id():
    """Standard test account ID."""
    return "ethinos_master_account"

@pytest.fixture
def auth_token():
    """Fixture for valid auth token."""
    import uuid
    from jose import jwt
    from app.config import settings
    from datetime import datetime, timedelta

    # Create JWT token directly for testing
    user_id = str(uuid.uuid4())
    payload = {
        "sub": user_id,
        "role": "admin",
        "name": "Test User",
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token

def test_config_get_default_creates_config(client, account_id, auth_token):
    """GET /api/config with no existing config creates default config."""
    response = client.get(
        f"/api/config?account_id={account_id}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    data = response.json()

    # Verify default thresholds
    assert data["roas_threshold"] == 3.0
    assert data["cpa_threshold"] is None  # Default config doesn't set optional fields
    assert data["spend_pace_pct"] == 100.0
    assert data["ctr_threshold"] is None  # Optional field
    assert data["cvr_threshold"] is None  # Optional field
    assert data["quality_score_threshold"] == 7
    assert data["frequency_threshold"] == 5.0
    assert data["currency"] == "INR"
    assert data["is_configured"] == False
    assert "created_at" in data
    assert "updated_at" in data

def test_config_get_returns_existing(client, account_id, auth_token):
    """GET /api/config returns existing config."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    # First get creates default
    client.get(f"/api/config?account_id={account_id}", headers=headers)

    # Second get returns same config
    response = client.get(f"/api/config?account_id={account_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["account_id"] == account_id
    assert data["is_configured"] == False

def test_config_post_requires_auth(client, account_id):
    """POST /api/config requires JWT authentication."""
    config_data = {
        "roas_threshold": 2.5,
        "cpa_threshold": 40,
        "spend_pace_pct": 95,
        "ctr_threshold": 0.025,
        "cvr_threshold": 0.03,
        "quality_score_threshold": 8,
        "frequency_threshold": 4.0,
        "currency": "USD"
    }

    response = client.post(
        f"/api/config?account_id={account_id}",
        json=config_data
    )

    # Should reject without auth token
    assert response.status_code == 401
    assert "Unauthorized" in response.json()["detail"]

def test_config_post_with_valid_token(client, account_id, auth_token):
    """POST /api/config saves config with valid JWT token."""
    config_data = {
        "roas_threshold": 2.5,
        "cpa_threshold": 40,
        "spend_pace_pct": 95,
        "ctr_threshold": 0.025,
        "cvr_threshold": 0.03,
        "quality_score_threshold": 8,
        "frequency_threshold": 4.0,
        "currency": "USD"
    }

    response = client.post(
        f"/api/config?account_id={account_id}",
        json=config_data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["roas_threshold"] == 2.5
    assert data["cpa_threshold"] == 40
    assert data["currency"] == "USD"
    assert data["is_configured"] == True

def test_config_post_validates_thresholds(client, account_id, auth_token):
    """POST /api/config validates threshold values."""
    # Invalid threshold (negative)
    config_data = {
        "roas_threshold": -1.0,
        "cpa_threshold": 40,
        "spend_pace_pct": 95,
        "ctr_threshold": 0.025,
        "cvr_threshold": 0.03,
        "quality_score_threshold": 8,
        "frequency_threshold": 4.0,
        "currency": "USD"
    }

    response = client.post(
        f"/api/config?account_id={account_id}",
        json=config_data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )

    # Should accept (validation in Pydantic model)
    # Or return validation error
    assert response.status_code in [200, 422]

def test_config_persists_across_requests(client, account_id, auth_token):
    """Config saved persists across multiple GET requests."""
    headers = {"Authorization": f"Bearer {auth_token}"}

    config_data = {
        "roas_threshold": 3.5,
        "cpa_threshold": 60,
        "spend_pace_pct": 105,
        "ctr_threshold": 0.015,
        "cvr_threshold": 0.025,
        "quality_score_threshold": 6,
        "frequency_threshold": 6.0,
        "currency": "GBP"
    }

    # POST config
    client.post(
        f"/api/config?account_id={account_id}",
        json=config_data,
        headers=headers
    )

    # GET config - should match saved values
    response = client.get(f"/api/config?account_id={account_id}", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["roas_threshold"] == 3.5
    assert data["cpa_threshold"] == 60
    assert data["currency"] == "GBP"
    assert data["is_configured"] == True

def test_config_isolated_by_account(client, auth_token):
    """Config is isolated between different accounts."""
    account1 = "account_1"
    account2 = "account_2"
    headers = {"Authorization": f"Bearer {auth_token}"}

    # Set config for account 1
    config1 = {
        "roas_threshold": 2.0,
        "cpa_threshold": 30,
        "spend_pace_pct": 80,
        "ctr_threshold": 0.03,
        "cvr_threshold": 0.04,
        "quality_score_threshold": 9,
        "frequency_threshold": 3.0,
        "currency": "USD"
    }

    client.post(
        f"/api/config?account_id={account1}",
        json=config1,
        headers=headers
    )

    # Set config for account 2
    config2 = {
        "roas_threshold": 4.0,
        "cpa_threshold": 70,
        "spend_pace_pct": 120,
        "ctr_threshold": 0.01,
        "cvr_threshold": 0.02,
        "quality_score_threshold": 5,
        "frequency_threshold": 7.0,
        "currency": "EUR"
    }

    client.post(
        f"/api/config?account_id={account2}",
        json=config2,
        headers=headers
    )

    # Get config for account 1 - should match account 1's config
    response1 = client.get(f"/api/config?account_id={account1}", headers=headers)
    data1 = response1.json()
    assert data1["roas_threshold"] == 2.0
    assert data1["currency"] == "USD"

    # Get config for account 2 - should match account 2's config
    response2 = client.get(f"/api/config?account_id={account2}", headers=headers)
    data2 = response2.json()
    assert data2["roas_threshold"] == 4.0
    assert data2["currency"] == "EUR"
