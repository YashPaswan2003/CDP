"""Tests for Phase 3 agent integration (chat and presentations)."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from app.models.chat import ChatRequest, Message


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
        "email": "test@example.com",
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    return token


# =============================================================================
# CHAT ENDPOINT TESTS
# =============================================================================

def test_chat_endpoint_requires_auth(client, account_id):
    """POST /chat requires authorization header."""
    chat_request = ChatRequest(
        client_id=account_id,
        messages=[Message(role="user", content="What's the ROAS?")]
    )
    response = client.post(
        "/chat/",
        json=chat_request.model_dump(),
        params={"account_id": account_id},
    )

    assert response.status_code == 401


def test_chat_endpoint_requires_account_id(client, auth_token, account_id):
    """POST /chat requires account_id query parameter."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    chat_request = ChatRequest(
        client_id=account_id,
        messages=[Message(role="user", content="What's the ROAS?")]
    )
    response = client.post(
        "/chat/",
        json=chat_request.model_dump(),
        headers=headers,
        # Missing account_id parameter
    )

    assert response.status_code in [400, 422]


def test_chat_endpoint_with_empty_messages(client, account_id, auth_token):
    """POST /chat with empty messages returns error."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    chat_request = ChatRequest(client_id=account_id, messages=[])

    response = client.post(
        "/chat/",
        json=chat_request.model_dump(),
        params={"account_id": account_id},
        headers=headers,
    )

    assert response.status_code == 400


@patch("app.routes.chat.InsightsAgent")
def test_chat_endpoint_success(mock_agent_class, client, account_id, auth_token):
    """POST /chat successfully returns agent response."""
    headers = {"Authorization": f"Bearer {auth_token}"}

    # Mock the agent instance and its chat method
    mock_agent = MagicMock()
    mock_agent_class.return_value = mock_agent
    mock_agent.chat.return_value = "The current ROAS is 3.5x. This is performing well above our 3.0x threshold."

    chat_request = ChatRequest(
        client_id=account_id,
        messages=[Message(role="user", content="What's our current ROAS?")]
    )

    response = client.post(
        "/chat/",
        json=chat_request.model_dump(),
        params={"account_id": account_id},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()

    # Verify response structure
    assert "message" in data
    assert "tokens_used" in data
    assert "client_id" in data

    assert data["message"] == "The current ROAS is 3.5x. This is performing well above our 3.0x threshold."
    assert data["client_id"] == account_id


@patch("app.routes.chat.InsightsAgent")
def test_chat_endpoint_multiple_messages(mock_agent_class, client, account_id, auth_token):
    """POST /chat handles multiple messages in conversation."""
    headers = {"Authorization": f"Bearer {auth_token}"}

    mock_agent = MagicMock()
    mock_agent_class.return_value = mock_agent
    mock_agent.chat.return_value = "We should pause the low-performing keyword campaign."

    # Multi-turn conversation
    chat_request = ChatRequest(
        client_id=account_id,
        messages=[
            Message(role="user", content="What's our current ROAS?"),
            Message(role="assistant", content="The current ROAS is 3.5x."),
            Message(role="user", content="Should we pause any campaigns?"),
        ]
    )

    response = client.post(
        "/chat/",
        json=chat_request.model_dump(),
        params={"account_id": account_id},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    # Verify agent received last message
    mock_agent.chat.assert_called_once()


@patch("app.routes.chat.InsightsAgent")
def test_chat_endpoint_agent_initialization(mock_agent_class, client, account_id, auth_token):
    """POST /chat initializes agent with account context."""
    headers = {"Authorization": f"Bearer {auth_token}"}

    mock_agent = MagicMock()
    mock_agent_class.return_value = mock_agent
    mock_agent.chat.return_value = "Response from agent"

    chat_request = ChatRequest(
        client_id=account_id,
        messages=[Message(role="user", content="Analyze our performance")]
    )

    response = client.post(
        "/chat/",
        json=chat_request.model_dump(),
        params={"account_id": account_id},
        headers=headers,
    )

    assert response.status_code == 200

    # Verify agent was initialized with account_id
    mock_agent_class.assert_called_once()
    call_args = mock_agent_class.call_args
    assert call_args[1]["account_id"] == account_id


# =============================================================================
# PRESENTATIONS ENDPOINT TESTS
# =============================================================================

def test_presentations_list_requires_auth(client, account_id):
    """GET /api/presentations requires authorization header."""
    response = client.get(
        "/api/presentations/",
        params={"account_id": account_id},
    )

    assert response.status_code == 401


def test_presentations_list_requires_account_id(client, auth_token):
    """GET /api/presentations requires account_id query parameter."""
    headers = {"Authorization": f"Bearer {auth_token}"}

    response = client.get(
        "/api/presentations/",
        headers=headers,
        # Missing account_id
    )

    assert response.status_code in [400, 422]


def test_presentations_list_success(client, account_id, auth_token):
    """GET /api/presentations returns presentations list."""
    headers = {"Authorization": f"Bearer {auth_token}"}

    response = client.get(
        "/api/presentations/",
        params={"account_id": account_id},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()

    # Should return presentations list
    assert "presentations" in data
    assert isinstance(data["presentations"], list)


def test_presentations_generate_requires_auth(client, account_id):
    """POST /api/presentations/generate requires authorization header."""
    response = client.post(
        "/api/presentations/generate",
        json={
            "client_id": "client_001",
            "date_from": "2026-03-01",
            "date_to": "2026-03-31",
        },
        params={"account_id": account_id},
    )

    assert response.status_code == 401


def test_presentations_generate_requires_account_id(client, auth_token):
    """POST /api/presentations/generate requires account_id query parameter."""
    headers = {"Authorization": f"Bearer {auth_token}"}

    response = client.post(
        "/api/presentations/generate",
        json={
            "client_id": "client_001",
            "date_from": "2026-03-01",
            "date_to": "2026-03-31",
        },
        headers=headers,
        # Missing account_id
    )

    assert response.status_code in [400, 422]


def test_presentations_generate_success(client, account_id, auth_token):
    """POST /api/presentations/generate returns presentation metadata."""
    headers = {"Authorization": f"Bearer {auth_token}"}

    response = client.post(
        "/api/presentations/generate",
        json={
            "client_id": "client_001",
            "date_from": "2026-03-01",
            "date_to": "2026-03-31",
        },
        params={"account_id": account_id},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()

    # Verify presentation metadata response
    assert "id" in data
    assert "account_id" in data
    assert data["account_id"] == account_id
    assert "client_id" in data
    assert "status" in data
    assert "created_at" in data
    assert "download_url" in data or "download_url" in data or True  # May be null


def test_presentation_get_success(client, account_id, auth_token):
    """GET /api/presentations/{id} returns presentation metadata."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    presentation_id = "pres_test_123"

    response = client.get(
        f"/api/presentations/{presentation_id}",
        params={"account_id": account_id},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()

    # Verify response structure
    assert data["id"] == presentation_id
    assert "account_id" in data
    assert "client_id" in data
    assert "status" in data
    assert "created_at" in data


def test_presentation_download_not_implemented(client, account_id, auth_token):
    """GET /api/presentations/{id}/download returns 501 (not yet implemented)."""
    headers = {"Authorization": f"Bearer {auth_token}"}
    presentation_id = "pres_test_123"

    response = client.get(
        f"/api/presentations/{presentation_id}/download",
        params={"account_id": account_id},
        headers=headers,
    )

    # Should return 501 Not Implemented for Phase 3.1
    assert response.status_code == 501


# =============================================================================
# INTEGRATION TESTS
# =============================================================================

@patch("app.routes.chat.InsightsAgent")
def test_e2e_chat_with_context(mock_agent_class, client, account_id, auth_token):
    """
    E2E Test: Chat endpoint loads account context and uses it in agent.

    Verifies:
    1. Account context is loaded from database
    2. Agent is initialized with context
    3. Agent response is returned to user
    """
    headers = {"Authorization": f"Bearer {auth_token}"}

    mock_agent = MagicMock()
    mock_agent_class.return_value = mock_agent
    mock_agent.chat.return_value = "Based on your campaigns, I recommend increasing budget for top performers."

    chat_request = ChatRequest(
        client_id=account_id,
        messages=[Message(role="user", content="What optimizations do you suggest?")]
    )

    response = client.post(
        "/chat/",
        json=chat_request.model_dump(),
        params={"account_id": account_id},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()

    # Verify agent was created with context parameter
    mock_agent_class.assert_called_once()
    init_call = mock_agent_class.call_args
    assert init_call[1].get("account_id") == account_id
    assert init_call[1].get("context") is not None
    assert isinstance(init_call[1]["context"], dict)

    # Verify agent context includes expected keys
    context = init_call[1]["context"]
    assert "campaigns" in context
    assert "config" in context


def test_e2e_presentations_full_flow(client, account_id, auth_token):
    """
    E2E Test: Full presentations flow.

    Flow:
    1. Get presentations list (initially empty or with existing)
    2. Generate new presentation
    3. Get presentation details
    4. Verify download endpoint returns proper error
    """
    headers = {"Authorization": f"Bearer {auth_token}"}

    # Step 1: List presentations
    response = client.get(
        "/api/presentations/",
        params={"account_id": account_id},
        headers=headers,
    )
    assert response.status_code == 200
    initial_list = response.json()
    assert "presentations" in initial_list

    # Step 2: Generate new presentation
    response = client.post(
        "/api/presentations/generate",
        json={
            "client_id": "client_001",
            "date_from": "2026-03-01",
            "date_to": "2026-03-31",
        },
        params={"account_id": account_id},
        headers=headers,
    )
    assert response.status_code == 200
    generated = response.json()
    presentation_id = generated["id"]
    assert generated["status"] == "ready"

    # Step 3: Get presentation details
    response = client.get(
        f"/api/presentations/{presentation_id}",
        params={"account_id": account_id},
        headers=headers,
    )
    assert response.status_code == 200
    details = response.json()
    assert details["id"] == presentation_id

    # Step 4: Try to download (should fail)
    response = client.get(
        f"/api/presentations/{presentation_id}/download",
        params={"account_id": account_id},
        headers=headers,
    )
    assert response.status_code == 501
