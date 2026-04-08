"""Test-driven development for accounts API - Phase 1.

RED phase: Write tests that fail until accounts.py is implemented.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


class TestGetAccounts:
    """Test GET /api/accounts endpoint."""

    def test_list_all_accounts(self, client):
        """Should return list of all accounts from database."""
        response = client.get("/api/accounts")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0

        # Check that ethinos account is present
        account_ids = [acc["id"] for acc in data]
        assert "ethinos" in account_ids

    def test_account_has_required_fields(self, client):
        """Each account should have all required fields."""
        response = client.get("/api/accounts")
        assert response.status_code == 200

        data = response.json()
        required_fields = ["id", "name", "industry", "currency", "client_type", "platforms"]

        for account in data:
            for field in required_fields:
                assert field in account, f"Missing field: {field}"

    def test_account_includes_brand_colors(self, client):
        """Each account should include brand color columns."""
        response = client.get("/api/accounts")
        assert response.status_code == 200

        data = response.json()
        brand_fields = ["brand_primary", "brand_secondary", "brand_accent"]

        for account in data:
            for field in brand_fields:
                assert field in account, f"Missing brand field: {field}"


class TestCreateAccount:
    """Test POST /api/accounts endpoint."""

    def test_create_new_client_account(self, client):
        """Should create a new client account with POST request."""
        payload = {
            "name": "Test Client Company",
            "industry": "Technology",
            "currency": "USD",
            "client_type": "web",
            "platforms": ["google", "meta"]
        }

        response = client.post("/api/accounts", json=payload)
        assert response.status_code == 201

        data = response.json()
        assert data["name"] == "Test Client Company"
        assert data["industry"] == "Technology"
        assert data["currency"] == "USD"
        assert data["client_type"] == "web"
        assert "google" in data["platforms"]
        assert "meta" in data["platforms"]

    def test_create_account_generates_id(self, client):
        """Created account should have an auto-generated ID."""
        payload = {
            "name": "Another Test Client",
            "industry": "Finance",
            "currency": "INR",
            "client_type": "web",
            "platforms": ["google"]
        }

        response = client.post("/api/accounts", json=payload)
        assert response.status_code == 201

        data = response.json()
        assert "id" in data
        assert data["id"] is not None
        assert data["id"] != ""

    def test_create_account_with_brand_colors(self, client):
        """Should accept and store brand color columns."""
        payload = {
            "name": "Branded Client",
            "industry": "Retail",
            "currency": "INR",
            "client_type": "web",
            "platforms": ["google", "meta"],
            "brand_primary": "#1E40AF",
            "brand_secondary": "#3B82F6",
            "brand_accent": "#F59E0B"
        }

        response = client.post("/api/accounts", json=payload)
        assert response.status_code == 201

        data = response.json()
        assert data["brand_primary"] == "#1E40AF"
        assert data["brand_secondary"] == "#3B82F6"
        assert data["brand_accent"] == "#F59E0B"

    def test_create_account_missing_required_field(self, client):
        """Should reject account creation without required fields."""
        payload = {
            "name": "Incomplete Client",
            # Missing industry, currency, client_type, platforms
        }

        response = client.post("/api/accounts", json=payload)
        assert response.status_code == 422  # Validation error

    def test_new_account_appears_in_list(self, client):
        """After creating account, it should appear in GET /api/accounts."""
        # Create account
        payload = {
            "name": "Newly Created Account",
            "industry": "Healthcare",
            "currency": "INR",
            "client_type": "web",
            "platforms": ["google"]
        }

        create_response = client.post("/api/accounts", json=payload)
        assert create_response.status_code == 201
        new_account_id = create_response.json()["id"]

        # List accounts
        list_response = client.get("/api/accounts")
        assert list_response.status_code == 200

        # Find the newly created account
        account_ids = [acc["id"] for acc in list_response.json()]
        assert new_account_id in account_ids


class TestSeedData:
    """Test that seed data includes expected accounts."""

    def test_kotak_mf_account_exists(self, client):
        """Seed should create kotak-mf account."""
        response = client.get("/api/accounts")
        assert response.status_code == 200

        data = response.json()
        account_ids = [acc["id"] for acc in data]
        assert "kotak-mf" in account_ids, f"kotak-mf not found in {account_ids}"

    def test_qi_spine_account_exists(self, client):
        """Seed should create qi-spine account."""
        response = client.get("/api/accounts")
        assert response.status_code == 200

        data = response.json()
        account_ids = [acc["id"] for acc in data]
        assert "qi-spine" in account_ids, f"qi-spine not found in {account_ids}"

    def test_old_accounts_not_in_seed(self, client):
        """Old placeholder accounts should be replaced."""
        response = client.get("/api/accounts")
        assert response.status_code == 200

        data = response.json()
        account_ids = [acc["id"] for acc in data]

        # These should NOT be present (they were placeholders)
        assert "acc-001" not in account_ids or \
               not any(acc.get("name") == "TechStore E-Commerce" for acc in data), \
               "TechStore should be replaced"
