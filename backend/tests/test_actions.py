"""Tests for /api/actions endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.connection import get_connection


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


@pytest.fixture
def non_admin_auth_token():
    """Fixture for non-admin auth token."""
    import uuid
    from jose import jwt
    from app.config import settings
    from datetime import datetime, timedelta

    user_id = str(uuid.uuid4())
    payload = {
        "sub": user_id,
        "role": "manager",
        "name": "Non-Admin User",
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token


# =============================================================================
# AUTH TESTS
# =============================================================================

def test_pause_requires_auth(client, account_id):
    """POST /api/actions/pause requires authorization header."""
    response = client.post(
        "/api/actions/pause",
        json={
            "entity_type": "campaign",
            "entity_id": "camp_123",
            "account_id": account_id,
            "parameters": {},
        },
    )

    # Should fail without auth
    assert response.status_code == 401


def test_resume_requires_auth(client, account_id):
    """POST /api/actions/resume requires authorization header."""
    response = client.post(
        "/api/actions/resume",
        json={
            "entity_type": "campaign",
            "entity_id": "camp_123",
            "account_id": account_id,
            "parameters": {},
        },
    )

    assert response.status_code == 401


def test_adjust_bid_requires_auth(client, account_id):
    """POST /api/actions/adjust-bid requires authorization header."""
    response = client.post(
        "/api/actions/adjust-bid",
        json={
            "entity_type": "keyword",
            "entity_id": "kw_123",
            "account_id": account_id,
            "parameters": {"new_bid": 1.5},
        },
    )

    assert response.status_code == 401


def test_increase_budget_requires_auth(client, account_id):
    """POST /api/actions/increase-budget requires authorization header."""
    response = client.post(
        "/api/actions/increase-budget",
        json={
            "entity_type": "campaign",
            "entity_id": "camp_123",
            "account_id": account_id,
            "parameters": {"new_budget": 1000},
        },
    )

    assert response.status_code == 401


def test_details_requires_auth(client, account_id):
    """GET /api/actions/details/{entity_id} requires authorization header."""
    response = client.get(
        "/api/actions/details/camp_123",
        params={"account_id": account_id},
    )

    assert response.status_code == 401


# =============================================================================
# PAUSE ACTION TESTS
# =============================================================================

def test_pause_action_success(client, account_id, auth_token):
    """POST /api/actions/pause successfully pauses entity."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post(
        "/api/actions/pause",
        json={
            "entity_type": "campaign",
            "entity_id": "camp_001",
            "account_id": account_id,
            "parameters": {},
        },
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()

    # Check response structure
    assert "success" in data
    assert data["success"] is True
    assert "message" in data
    assert "action_type" in data
    assert data["action_type"] == "pause"
    assert "updated_entity" in data
    assert "timestamp" in data


def test_pause_action_response_format(client, account_id, auth_token):
    """POST /api/actions/pause returns proper response structure."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post(
        "/api/actions/pause",
        json={
            "entity_type": "campaign",
            "entity_id": "camp_001",
            "account_id": account_id,
            "parameters": {},
        },
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()

    updated = data["updated_entity"]
    assert "entity_id" in updated
    assert "entity_type" in updated
    assert "field" in updated
    assert "previous_value" in updated
    assert "new_value" in updated

    assert updated["entity_id"] == "camp_001"
    assert updated["entity_type"] == "campaign"


# =============================================================================
# RESUME ACTION TESTS
# =============================================================================

def test_resume_action_success(client, account_id, auth_token):
    """POST /api/actions/resume successfully resumes entity."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post(
        "/api/actions/resume",
        json={
            "entity_type": "campaign",
            "entity_id": "camp_001",
            "account_id": account_id,
            "parameters": {},
        },
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["action_type"] == "resume"
    assert data["updated_entity"]["entity_id"] == "camp_001"


# =============================================================================
# ADJUST BID ACTION TESTS
# =============================================================================

def test_adjust_bid_action_success(client, account_id, auth_token):
    """POST /api/actions/adjust-bid successfully adjusts bid."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post(
        "/api/actions/adjust-bid",
        json={
            "entity_type": "keyword",
            "entity_id": "kw_001",
            "account_id": account_id,
            "parameters": {"new_bid": 1.5, "old_bid": 1.0},
        },
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["action_type"] == "adjust_bid"
    assert data["updated_entity"]["entity_type"] == "keyword"
    assert data["updated_entity"]["field"] == "bid"


def test_adjust_bid_with_parameters(client, account_id, auth_token):
    """POST /api/actions/adjust-bid includes parameters in response."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post(
        "/api/actions/adjust-bid",
        json={
            "entity_type": "keyword",
            "entity_id": "kw_123",
            "account_id": account_id,
            "parameters": {"new_bid": 2.0, "old_bid": 1.5},
        },
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()

    assert data["updated_entity"]["new_value"] == 2.0
    assert data["updated_entity"]["previous_value"] == 1.5


# =============================================================================
# INCREASE BUDGET ACTION TESTS
# =============================================================================

def test_increase_budget_action_success(client, account_id, auth_token):
    """POST /api/actions/increase-budget successfully increases budget."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post(
        "/api/actions/increase-budget",
        json={
            "entity_type": "campaign",
            "entity_id": "camp_001",
            "account_id": account_id,
            "parameters": {"new_budget": 2000, "old_budget": 1000},
        },
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()

    assert data["success"] is True
    assert data["action_type"] == "increase_budget"
    assert data["updated_entity"]["field"] == "budget"
    assert data["updated_entity"]["new_value"] == 2000


# =============================================================================
# GET DETAILS TESTS
# =============================================================================

def test_get_details_success(client, account_id, auth_token):
    """GET /api/actions/details/{entity_id} returns entity metadata."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get(
        "/api/actions/details/camp_001",
        params={"account_id": account_id},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()

    # Check required fields
    assert "entity_id" in data
    assert "entity_type" in data
    assert "name" in data
    assert "status" in data
    assert "account_id" in data

    assert data["entity_id"] == "camp_001"


def test_get_details_includes_metrics(client, account_id, auth_token):
    """GET /api/actions/details/{entity_id} includes performance metrics."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get(
        "/api/actions/details/camp_001",
        params={"account_id": account_id},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()

    # Should include key metric fields
    expected_metrics = ["roas", "ctr", "cpc"]
    for metric in expected_metrics:
        # Metrics should be present (may be None)
        assert metric in data


# =============================================================================
# ACCESS CONTROL TESTS
# =============================================================================

def test_non_admin_user_cannot_access_other_account(client, auth_token, non_admin_auth_token):
    """Non-admin user cannot execute actions on account they don't have access to."""
    # This test would require setting up user_accounts table entries
    # For now, we test that the endpoint checks access control
    headers = {"Authorization": f"Bearer {non_admin_auth_token}"}
    response = client.post(
        "/api/actions/pause",
        json={
            "entity_type": "campaign",
            "entity_id": "camp_001",
            "account_id": "unknown_account",
            "parameters": {},
        },
        headers=headers,
    )

    # Should return 403 (Forbidden) for non-admin trying to access different account
    assert response.status_code in [403, 401]


# =============================================================================
# RESPONSE VALIDATION TESTS
# =============================================================================

def test_action_response_has_timestamp(client, account_id, auth_token):
    """All action responses include ISO timestamp."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.post(
        "/api/actions/pause",
        json={
            "entity_type": "campaign",
            "entity_id": "camp_001",
            "account_id": account_id,
            "parameters": {},
        },
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()

    assert "timestamp" in data
    # Verify ISO format (ends with Z)
    assert data["timestamp"].endswith("Z")


def test_all_action_types_return_same_structure(client, account_id, auth_token):
    """All action endpoints return consistent response structure."""
    headers = {"Authorization": f"Bearer {auth_token}"}

    action_endpoints = [
        ("/api/actions/pause", {"entity_type": "campaign", "entity_id": "camp_001", "account_id": account_id}),
        ("/api/actions/resume", {"entity_type": "campaign", "entity_id": "camp_001", "account_id": account_id}),
        (
            "/api/actions/adjust-bid",
            {
                "entity_type": "keyword",
                "entity_id": "kw_001",
                "account_id": account_id,
                "parameters": {"new_bid": 1.5},
            },
        ),
        (
            "/api/actions/increase-budget",
            {
                "entity_type": "campaign",
                "entity_id": "camp_001",
                "account_id": account_id,
                "parameters": {"new_budget": 2000},
            },
        ),
    ]

    for endpoint, body in action_endpoints:
        response = client.post(
            endpoint,
            json=body,
                headers=headers,
        )

        assert response.status_code == 200, f"Failed for {endpoint}"
        data = response.json()

        # Verify all responses have same structure
        assert "success" in data
        assert "message" in data
        assert "action_type" in data
        assert "updated_entity" in data
        assert "timestamp" in data
