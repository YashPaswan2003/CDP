import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_chat_spend_question(client):
    """Test chat with spend-related question."""
    response = client.post(
        "/chat/",
        json={
            "client_id": "550e8400-e29b-41d4-a716-446655440000",
            "messages": [
                {
                    "role": "user",
                    "content": "How is my advertising spend performing?"
                }
            ]
        }
    )
    assert response.status_code == 200

    data = response.json()
    assert data["client_id"] == "550e8400-e29b-41d4-a716-446655440000"
    assert "message" in data
    assert len(data["message"]) > 0
    assert "spend" in data["message"].lower()

def test_chat_conversion_question(client):
    """Test chat with conversion-related question."""
    response = client.post(
        "/chat/",
        json={
            "client_id": "550e8400-e29b-41d4-a716-446655440000",
            "messages": [
                {
                    "role": "user",
                    "content": "What are my conversion rates?"
                }
            ]
        }
    )
    assert response.status_code == 200

    data = response.json()
    assert "conversion" in data["message"].lower()

def test_chat_campaign_question(client):
    """Test chat with campaign-related question."""
    response = client.post(
        "/chat/",
        json={
            "client_id": "550e8400-e29b-41d4-a716-446655440010",
            "messages": [
                {
                    "role": "user",
                    "content": "Tell me about my campaigns"
                }
            ]
        }
    )
    assert response.status_code == 200

    data = response.json()
    assert "campaign" in data["message"].lower()

def test_chat_generic_question(client):
    """Test chat with generic question."""
    response = client.post(
        "/chat/",
        json={
            "client_id": "550e8400-e29b-41d4-a716-446655440000",
            "messages": [
                {
                    "role": "user",
                    "content": "Hello"
                }
            ]
        }
    )
    assert response.status_code == 200

    data = response.json()
    assert "message" in data
    assert data["tokens_used"] >= 0

def test_chat_response_structure(client):
    """Test chat response has required fields."""
    response = client.post(
        "/chat/",
        json={
            "client_id": "550e8400-e29b-41d4-a716-446655440000",
            "messages": [
                {
                    "role": "user",
                    "content": "Test message"
                }
            ]
        }
    )
    assert response.status_code == 200

    data = response.json()
    assert "message" in data
    assert "tokens_used" in data
    assert "client_id" in data
    assert isinstance(data["tokens_used"], int)
