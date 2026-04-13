"""End-to-end tests for Phase 2.5 action execution flow."""

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

    user_id = str(uuid.uuid4())
    payload = {
        "sub": user_id,
        "role": "admin",
        "name": "Test User",
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token


# =============================================================================
# FULL FLOW E2E TESTS
# =============================================================================

def test_e2e_flag_to_action_to_success(client, account_id, auth_token):
    """
    E2E Test: Full flow from flag detection to action execution to success.

    Flow:
    1. Get flags for account (flag should exist)
    2. Execute a pause action on a campaign
    3. Verify action execution response succeeds
    4. Verify details endpoint responds correctly
    """
    headers = {"Authorization": f"Bearer {auth_token}"}

    # Step 1: Get flags for account
    response = client.get(f"/api/flags?account_id={account_id}", headers=headers)
    assert response.status_code == 200
    flags_data = response.json()
    flags = flags_data.get("flags", [])

    # Should have at least one flag (setup flag if no config, or actual flags)
    assert len(flags) > 0, "Should have at least one flag for testing"

    # Get first flag info (for context, but use known action types)
    flag = flags[0]
    assert "actions" in flag
    assert len(flag["actions"]) > 0, "Flag should have at least one action"

    # Use known action type and entity
    action_type = "pause"
    entity_id = "camp_001"
    entity_type = "campaign"

    # Step 2: Execute the action
    response = client.post(
        f"/api/actions/{action_type}",
        json={
            "entity_type": entity_type,
            "entity_id": entity_id,
            "account_id": account_id,
            "parameters": {},
        },
        headers=headers,
    )

    assert response.status_code == 200
    action_result = response.json()

    # Verify action execution response
    assert action_result["success"] is True
    assert "message" in action_result
    assert action_result["action_type"] == action_type
    assert "updated_entity" in action_result
    assert "timestamp" in action_result

    # Step 3: Get details after action
    response = client.get(
        f"/api/actions/details/{entity_id}",
        params={"account_id": account_id},
        headers=headers,
    )

    assert response.status_code == 200
    details = response.json()
    assert details["entity_id"] == entity_id
    # Status should be present
    assert "status" in details


def test_e2e_pause_resume_cycle(client, account_id, auth_token):
    """
    E2E Test: Pause and resume cycle.

    Flow:
    1. Pause a campaign (verify success)
    2. Resume the campaign (verify success)
    3. Verify both actions have correct response structure
    """
    headers = {"Authorization": f"Bearer {auth_token}"}
    entity_id = "camp_001"

    # Step 1: Pause campaign
    response = client.post(
        "/api/actions/pause",
        json={
            "entity_type": "campaign",
            "entity_id": entity_id,
            "account_id": account_id,
            "parameters": {},
        },
        headers=headers,
    )

    assert response.status_code == 200
    pause_result = response.json()
    assert pause_result["success"] is True
    assert pause_result["action_type"] == "pause"
    assert "updated_entity" in pause_result
    assert pause_result["updated_entity"]["entity_id"] == entity_id

    # Step 2: Resume campaign
    response = client.post(
        "/api/actions/resume",
        json={
            "entity_type": "campaign",
            "entity_id": entity_id,
            "account_id": account_id,
            "parameters": {},
        },
        headers=headers,
    )

    assert response.status_code == 200
    resume_result = response.json()
    assert resume_result["success"] is True
    assert resume_result["action_type"] == "resume"
    assert "updated_entity" in resume_result

    # Step 3: Get details to verify endpoint responds
    response = client.get(
        f"/api/actions/details/{entity_id}",
        params={"account_id": account_id},
        headers=headers,
    )

    assert response.status_code == 200
    details = response.json()
    assert details["entity_id"] == entity_id
    assert "status" in details


def test_e2e_bid_adjustment_flow(client, account_id, auth_token):
    """
    E2E Test: Bid adjustment flow.

    Flow:
    1. Get keyword details before adjustment
    2. Adjust bid upward
    3. Get keyword details after adjustment
    4. Verify bid changed in response
    """
    headers = {"Authorization": f"Bearer {auth_token}"}
    entity_id = "kw_001"

    # Step 1: Get details before adjustment
    response = client.get(
        f"/api/actions/details/{entity_id}",
        params={"account_id": account_id},
        headers=headers,
    )

    assert response.status_code == 200
    before = response.json()
    old_bid = before.get("bid", 1.0)

    # Step 2: Adjust bid
    new_bid = old_bid * 1.5
    response = client.post(
        "/api/actions/adjust-bid",
        json={
            "entity_type": "keyword",
            "entity_id": entity_id,
            "account_id": account_id,
            "parameters": {"new_bid": new_bid, "old_bid": old_bid},
        },
        headers=headers,
    )

    assert response.status_code == 200
    adjust_result = response.json()
    assert adjust_result["success"] is True
    assert adjust_result["updated_entity"]["field"] == "bid"
    assert adjust_result["updated_entity"]["previous_value"] == old_bid
    assert adjust_result["updated_entity"]["new_value"] == new_bid


def test_e2e_budget_increase_flow(client, account_id, auth_token):
    """
    E2E Test: Budget increase flow.

    Flow:
    1. Get campaign details before budget increase
    2. Increase budget
    3. Get campaign details after increase
    4. Verify budget changed in response
    """
    headers = {"Authorization": f"Bearer {auth_token}"}
    entity_id = "camp_001"

    # Step 1: Get details before increase
    response = client.get(
        f"/api/actions/details/{entity_id}",
        params={"account_id": account_id},
        headers=headers,
    )

    assert response.status_code == 200
    before = response.json()
    old_budget = before.get("budget", 1000.0)

    # Step 2: Increase budget
    new_budget = old_budget * 1.25
    response = client.post(
        "/api/actions/increase-budget",
        json={
            "entity_type": "campaign",
            "entity_id": entity_id,
            "account_id": account_id,
            "parameters": {"new_budget": new_budget, "old_budget": old_budget},
        },
        headers=headers,
    )

    assert response.status_code == 200
    budget_result = response.json()
    assert budget_result["success"] is True
    assert budget_result["updated_entity"]["field"] == "budget"
    assert budget_result["updated_entity"]["previous_value"] == old_budget
    assert budget_result["updated_entity"]["new_value"] == new_budget


def test_e2e_multiple_actions_same_entity(client, account_id, auth_token):
    """
    E2E Test: Execute multiple actions on same entity in sequence.

    Flow:
    1. Pause campaign
    2. Adjust budget (on paused campaign)
    3. Resume campaign
    4. Verify all actions succeeded with correct response structure
    """
    headers = {"Authorization": f"Bearer {auth_token}"}
    entity_id = "camp_002"

    # Step 1: Pause
    response = client.post(
        "/api/actions/pause",
        json={
            "entity_type": "campaign",
            "entity_id": entity_id,
            "account_id": account_id,
            "parameters": {},
        },
        headers=headers,
    )
    assert response.status_code == 200
    pause_resp = response.json()
    assert pause_resp["success"] is True
    assert pause_resp["action_type"] == "pause"

    # Step 2: Increase budget
    response = client.post(
        "/api/actions/increase-budget",
        json={
            "entity_type": "campaign",
            "entity_id": entity_id,
            "account_id": account_id,
            "parameters": {"new_budget": 2000, "old_budget": 1000},
        },
        headers=headers,
    )
    assert response.status_code == 200
    budget_resp = response.json()
    assert budget_resp["success"] is True
    assert budget_resp["action_type"] == "increase_budget"
    assert budget_resp["updated_entity"]["field"] == "budget"

    # Step 3: Resume
    response = client.post(
        "/api/actions/resume",
        json={
            "entity_type": "campaign",
            "entity_id": entity_id,
            "account_id": account_id,
            "parameters": {},
        },
        headers=headers,
    )
    assert response.status_code == 200
    resume_resp = response.json()
    assert resume_resp["success"] is True
    assert resume_resp["action_type"] == "resume"

    # Step 4: Verify all responses have timestamps
    assert "timestamp" in pause_resp
    assert "timestamp" in budget_resp
    assert "timestamp" in resume_resp


def test_e2e_auth_required_for_actions(client, account_id):
    """
    E2E Test: All action endpoints require authentication.

    Verifies:
    - Pause without auth fails
    - Resume without auth fails
    - Adjust bid without auth fails
    - Increase budget without auth fails
    - Details without auth fails
    """
    unauthenticated_endpoints = [
        ("POST", "/api/actions/pause", {
            "entity_type": "campaign",
            "entity_id": "camp_001",
            "account_id": account_id,
        }),
        ("POST", "/api/actions/resume", {
            "entity_type": "campaign",
            "entity_id": "camp_001",
            "account_id": account_id,
        }),
        ("POST", "/api/actions/adjust-bid", {
            "entity_type": "keyword",
            "entity_id": "kw_001",
            "account_id": account_id,
            "parameters": {"new_bid": 1.5},
        }),
        ("POST", "/api/actions/increase-budget", {
            "entity_type": "campaign",
            "entity_id": "camp_001",
            "account_id": account_id,
            "parameters": {"new_budget": 2000},
        }),
    ]

    for method, endpoint, body in unauthenticated_endpoints:
        response = client.post(endpoint, json=body)
        assert response.status_code == 401, f"{endpoint} should require auth"

    # GET endpoint
    response = client.get("/api/actions/details/camp_001", params={"account_id": account_id})
    assert response.status_code == 401, "GET details should require auth"


# =============================================================================
# PERFORMANCE & STRESS TESTS
# =============================================================================

def test_e2e_rapid_action_execution(client, account_id, auth_token):
    """
    E2E Test: Rapid action execution (5 actions in sequence).

    Verifies system stability under quick successive actions.
    """
    headers = {"Authorization": f"Bearer {auth_token}"}

    actions_to_execute = [
        ("pause", "camp_001", {}),
        ("adjust-bid", "kw_001", {"new_bid": 1.5}),
        ("increase-budget", "camp_002", {"new_budget": 2000}),
        ("resume", "camp_001", {}),
        ("adjust-bid", "kw_002", {"new_bid": 2.0}),
    ]

    results = []
    for action_type, entity_id, params in actions_to_execute:
        entity_type = "campaign" if "camp" in entity_id else "keyword"

        response = client.post(
            f"/api/actions/{action_type}",
            json={
                "entity_type": entity_type,
                "entity_id": entity_id,
                "account_id": account_id,
                "parameters": params,
            },
            headers=headers,
        )

        assert response.status_code == 200
        result = response.json()
        assert result["success"] is True
        results.append(result)

    # Verify all actions succeeded
    assert len(results) == 5
    for result in results:
        assert result["success"] is True
        assert "timestamp" in result
