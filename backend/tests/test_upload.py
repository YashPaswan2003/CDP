import pytest
from fastapi.testclient import TestClient
from io import BytesIO
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_upload_valid_csv(client):
    """Test uploading a valid CSV file."""
    # Use existing campaign ID from seed data
    csv_content = """date,campaign_id,campaign_name,platform,impressions,clicks,spend,conversions,revenue
2026-04-11,550e8400-e29b-41d4-a716-446655440001,TechStore Product Launch,google_ads,1000,50,100.00,5,500.00
2026-04-12,550e8400-e29b-41d4-a716-446655440001,TechStore Product Launch,google_ads,1100,55,110.00,6,600.00"""

    response = client.post(
        "/upload/csv",
        files={"file": ("test.csv", BytesIO(csv_content.encode()), "text/csv")},
        params={"client_id": "550e8400-e29b-41d4-a716-446655440000", "platform": "google_ads"}
    )
    assert response.status_code == 200

    data = response.json()
    assert data["filename"] == "test.csv"
    assert data["rows_imported"] == 2
    assert data["status"] == "success"

def test_upload_non_csv_file(client):
    """Test uploading a non-CSV file."""
    response = client.post(
        "/upload/csv",
        files={"file": ("test.txt", BytesIO(b"not csv"), "text/plain")},
        params={"client_id": "test-client"}
    )
    assert response.status_code == 400

def test_upload_invalid_csv(client):
    """Test uploading CSV with missing columns."""
    csv_content = """date,campaign_id
2026-04-01,test-campaign"""

    response = client.post(
        "/upload/csv",
        files={"file": ("test.csv", BytesIO(csv_content.encode()), "text/csv")},
        params={"client_id": "test-client"}
    )
    assert response.status_code == 400

def test_upload_empty_csv(client):
    """Test uploading an empty CSV file."""
    csv_content = ""

    response = client.post(
        "/upload/csv",
        files={"file": ("test.csv", BytesIO(csv_content.encode()), "text/csv")},
        params={"client_id": "test-client"}
    )
    assert response.status_code == 400

def test_upload_csv_with_data_validation(client):
    """Test CSV upload validates data types."""
    # CSV with invalid numeric values
    csv_content = """date,campaign_id,campaign_name,platform,impressions,clicks,spend,conversions,revenue
2026-04-01,550e8400-e29b-41d4-a716-446655440099,Test,google_ads,invalid,50,100.00,5,500.00"""

    response = client.post(
        "/upload/csv",
        files={"file": ("test.csv", BytesIO(csv_content.encode()), "text/csv")},
        params={"client_id": "test-client"}
    )
    assert response.status_code == 400
