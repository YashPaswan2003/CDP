import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_register(client):
    """Test user registration."""
    response = client.post(
        "/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "password123",
            "name": "New User"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["name"] == "New User"
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_register_duplicate(client):
    """Test registering with duplicate email."""
    # First registration
    client.post(
        "/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "password123",
            "name": "User"
        }
    )
    # Second registration with same email
    response = client.post(
        "/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "password456",
            "name": "Another User"
        }
    )
    assert response.status_code == 400

def test_login_success(client):
    """Test successful login with demo account."""
    response = client.post(
        "/auth/login",
        json={
            "email": "demo@example.com",
            "password": "demo123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "demo@example.com"
    assert "access_token" in data

def test_login_wrong_password(client):
    """Test login with wrong password."""
    response = client.post(
        "/auth/login",
        json={
            "email": "demo@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401

def test_login_nonexistent_user(client):
    """Test login with non-existent user."""
    response = client.post(
        "/auth/login",
        json={
            "email": "nonexistent@example.com",
            "password": "password123"
        }
    )
    assert response.status_code == 401

def test_logout(client):
    """Test logout."""
    # Login first
    login_response = client.post(
        "/auth/login",
        json={
            "email": "demo@example.com",
            "password": "demo123"
        }
    )
    token = login_response.json()["access_token"]

    # Logout
    response = client.post(
        "/auth/logout",
        params={"token": token}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "logged_out"
