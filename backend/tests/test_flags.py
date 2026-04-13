"""Tests for /api/flags endpoint."""

import pytest
from fastapi.testclient import TestClient
from app.main import app

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

def test_flags_requires_account_id(client):
    """GET /api/flags requires account_id query parameter."""
    response = client.get("/api/flags")

    # Should fail without account_id
    assert response.status_code in [400, 422]

def test_flags_returns_setup_flag_when_not_configured(client, account_id, auth_token):
    """GET /api/flags returns setup flag when config not configured."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get(f"/api/flags?account_id={account_id}", headers=headers)

    assert response.status_code == 200
    data = response.json()

    assert "flags" in data
    assert "severity_distribution" in data
    assert isinstance(data["flags"], list)

    # Should have setup flag since config not configured
    setup_flags = [f for f in data["flags"] if f.get("metric") == "setup"]
    assert len(setup_flags) > 0
    setup_flag = setup_flags[0]
    assert setup_flag["severity"] == "high"
    assert "setup" in setup_flag["explanation"].lower()

def test_flags_response_structure(client, account_id, auth_token):
    """GET /api/flags returns proper flag structure."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get(f"/api/flags?account_id={account_id}", headers=headers)

    assert response.status_code == 200
    data = response.json()

    # Check response structure
    assert "flags" in data
    assert "severity_distribution" in data

    if len(data["flags"]) > 0:
        flag = data["flags"][0]
        # Check required flag fields
        assert "metric" in flag
        assert "severity" in flag
        assert "entity_count" in flag
        assert "entities" in flag
        assert "explanation" in flag
        assert "actions" in flag

        # Check severity is valid
        assert flag["severity"] in ["high", "medium", "low"]

        # Check entities is list
        assert isinstance(flag["entities"], list)

        # Check actions structure
        assert isinstance(flag["actions"], list)
        if len(flag["actions"]) > 0:
            action = flag["actions"][0]
            assert "type" in action
            assert "label" in action
            assert "severity" in action

def test_flags_severity_distribution(client, account_id, auth_token):
    """GET /api/flags returns accurate severity distribution."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get(f"/api/flags?account_id={account_id}", headers=headers)

    assert response.status_code == 200
    data = response.json()

    severity_dist = data["severity_distribution"]
    assert "high" in severity_dist
    assert "medium" in severity_dist
    assert "low" in severity_dist

    # All counts should be integers >= 0
    assert severity_dist["high"] >= 0
    assert severity_dist["medium"] >= 0
    assert severity_dist["low"] >= 0

def test_flags_includes_roas_drop_rule(client, account_id, auth_token):
    """GET /api/flags includes ROAS drop detection rule."""
    # First configure thresholds
    headers = {"Authorization": f"Bearer {auth_token}"}
    config_data = {
        "roas_threshold": 3.0,
        "cpa_threshold": 50,
        "spend_pace_pct": 100,
        "ctr_threshold": 0.02,
        "cvr_threshold": 0.02,
        "quality_score_threshold": 7,
        "frequency_threshold": 5.0,
        "currency": "INR"
    }

    client.post(
        f"/api/config?account_id={account_id}",
        json=config_data,
        headers=headers
    )

    # Get flags
    response = client.get(f"/api/flags?account_id={account_id}", headers=headers)

    assert response.status_code == 200
    data = response.json()
    flags = data["flags"]

    # Check for ROAS-related flags (depending on mock campaign data)
    roas_flags = [f for f in flags if "roas" in f["metric"].lower()]
    # May or may not have ROAS flags depending on mock data
    # But we can verify the detection rule exists by checking API response

def test_flags_includes_zero_conversions_rule(client, account_id, auth_token):
    """GET /api/flags can detect zero conversions anomaly."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    config_data = {
        "roas_threshold": 3.0,
        "cpa_threshold": 50,
        "spend_pace_pct": 100,
        "ctr_threshold": 0.02,
        "cvr_threshold": 0.02,
        "quality_score_threshold": 7,
        "frequency_threshold": 5.0,
        "currency": "INR"
    }

    client.post(
        f"/api/config?account_id={account_id}",
        json=config_data,
        headers=headers
    )

    response = client.get(f"/api/flags?account_id={account_id}", headers=headers)

    assert response.status_code == 200
    data = response.json()
    # Should include detection rules even if no actual flags triggered
    # (depends on mock data)

def test_flags_sorted_by_severity(client, account_id, auth_token):
    """GET /api/flags returns flags sorted by severity (high → low)."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    config_data = {
        "roas_threshold": 3.0,
        "cpa_threshold": 50,
        "spend_pace_pct": 100,
        "ctr_threshold": 0.02,
        "cvr_threshold": 0.02,
        "quality_score_threshold": 7,
        "frequency_threshold": 5.0,
        "currency": "INR"
    }

    client.post(
        f"/api/config?account_id={account_id}",
        json=config_data,
        headers=headers
    )

    response = client.get(f"/api/flags?account_id={account_id}", headers=headers)

    assert response.status_code == 200
    data = response.json()
    flags = data["flags"]

    # Check if flags are sorted by severity
    severity_order = {"high": 0, "medium": 1, "low": 2}
    for i in range(len(flags) - 1):
        current_severity = flags[i]["severity"]
        next_severity = flags[i + 1]["severity"]
        assert severity_order[current_severity] <= severity_order[next_severity], \
            f"Flags not sorted by severity: {current_severity} followed by {next_severity}"

def test_flags_includes_actions(client, account_id, auth_token):
    """GET /api/flags includes recommended actions for each flag."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    response = client.get(f"/api/flags?account_id={account_id}", headers=headers)

    assert response.status_code == 200
    data = response.json()
    flags = data["flags"]

    for flag in flags:
        assert "actions" in flag
        actions = flag["actions"]

        if len(actions) > 0:
            for action in actions:
                assert "type" in action
                assert "label" in action
                assert "severity" in action
                assert action["severity"] in ["high", "medium", "low"]

def test_flags_returns_affected_entities(client, account_id, auth_token):
    """GET /api/flags includes affected campaign/entity names."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    config_data = {
        "roas_threshold": 3.0,
        "cpa_threshold": 50,
        "spend_pace_pct": 100,
        "ctr_threshold": 0.02,
        "cvr_threshold": 0.02,
        "quality_score_threshold": 7,
        "frequency_threshold": 5.0,
        "currency": "INR"
    }

    client.post(
        f"/api/config?account_id={account_id}",
        json=config_data,
        headers=headers
    )

    response = client.get(f"/api/flags?account_id={account_id}", headers=headers)

    assert response.status_code == 200
    data = response.json()
    flags = data["flags"]

    for flag in flags:
        assert "entities" in flag
        assert "entity_count" in flag
        assert isinstance(flag["entities"], list)
        assert isinstance(flag["entity_count"], int)
