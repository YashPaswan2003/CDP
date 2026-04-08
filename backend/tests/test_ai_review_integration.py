"""
Integration tests for Phase 4 AI Review endpoint.
Tests with realistic mock files and Claude responses.
"""

import pytest
import json
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from pathlib import Path
import pandas as pd
import tempfile

from app.main import app
from app.database.connection import get_connection


client = TestClient(app)


@pytest.fixture
def test_excel_file():
    """Create a temporary Excel file with realistic campaign data."""
    with tempfile.NamedTemporaryFile(suffix=".xlsx", delete=False) as f:
        # Create a workbook with realistic sheets
        with pd.ExcelWriter(f.name, engine='openpyxl') as writer:
            # Brand Awareness sheet (TOFU)
            awareness_data = pd.DataFrame({
                "Campaign_Name": ["Brand Awareness Campaign 1", "Brand Awareness Campaign 2"],
                "Impressions": [50000, 60000],
                "Clicks": [2500, 3000],
                "Cost_INR": [5000, 6000],
                "CTR": [0.05, 0.05],
                "CPC": [2.0, 2.0]
            })
            awareness_data.to_excel(writer, sheet_name="Brand Awareness", index=False)

            # Retargeting sheet (MOFU)
            retargeting_data = pd.DataFrame({
                "Campaign_Name": ["Retargeting Campaign 1"],
                "Impressions": [20000],
                "Clicks": [1000],
                "Cost_INR": [2000],
                "CTR": [0.05],
                "CPC": [2.0]
            })
            retargeting_data.to_excel(writer, sheet_name="Retargeting", index=False)

            # Lead Gen sheet (BOFU)
            lead_data = pd.DataFrame({
                "Campaign_Name": ["Lead Generation Campaign"],
                "Impressions": [10000],
                "Clicks": [500],
                "Cost_INR": [1000],
                "Conversions": [50],
                "Revenue": [5000]
            })
            lead_data.to_excel(writer, sheet_name="Lead Gen", index=False)

        yield f.name

    # Cleanup
    Path(f.name).unlink(missing_ok=True)


@pytest.fixture
def test_upload_with_real_file(setup_database, test_excel_file):
    """Create upload record with real file."""
    import uuid
    conn = get_connection()

    upload_id = f"test-excel-{uuid.uuid4().hex[:8]}"
    account_id = "ethinos"

    conn.execute("""
        INSERT INTO uploads (id, account_id, file_name, file_path, file_type, status)
        VALUES (?, ?, ?, ?, ?, ?)
    """, [
        upload_id,
        account_id,
        "realistic_data.xlsx",
        test_excel_file,
        "xlsx",
        "analyzed"
    ])
    conn.commit()
    conn.close()

    return upload_id, account_id


class TestAIReviewIntegration:
    """Integration tests with realistic mock data and Claude responses."""

    def test_ai_review_with_realistic_data(self, test_upload_with_real_file):
        """Test AI review with realistic Excel file."""
        upload_id, account_id = test_upload_with_real_file

        mock_claude_response = {
            "summary": "This file contains 3 sheets of Google Ads campaign data from March 2026. The data spans three campaign types: awareness (Brand Awareness), engagement (Retargeting), and lead generation (Lead Gen).",
            "funnel_mapping": {
                "Brand Awareness": "tofu",
                "Retargeting": "mofu",
                "Lead Gen": "bofu"
            },
            "column_suggestions": {
                "Campaign_Name": "campaign_name",
                "Impressions": "impressions",
                "Clicks": "clicks",
                "Cost_INR": "cost",
                "CTR": "ctr",
                "CPC": "cpc",
                "Conversions": "conversions",
                "Revenue": "revenue"
            },
            "clarifying_question": None
        }

        with patch("app.routes.upload.call_claude_for_file_analysis") as mock_claude:
            mock_claude.return_value = mock_claude_response

            response = client.post(
                "/api/upload/ai-review",
                json={"upload_id": upload_id, "account_id": account_id}
            )

        assert response.status_code == 200, f"Got {response.status_code}: {response.text}"

        data = response.json()

        # Verify response structure
        assert data["summary"]
        assert "Brand Awareness" in data["funnel_mapping"]
        assert data["funnel_mapping"]["Brand Awareness"] == "tofu"
        assert data["funnel_mapping"]["Retargeting"] == "mofu"
        assert data["funnel_mapping"]["Lead Gen"] == "bofu"

        # Verify column mappings
        assert data["column_suggestions"]["Campaign_Name"] == "campaign_name"
        assert data["column_suggestions"]["Impressions"] == "impressions"
        assert data["column_suggestions"]["Cost_INR"] == "cost"

    def test_ai_review_no_clarifying_question_if_clear(self, test_upload_with_real_file):
        """Test that clarifying_question is None/missing when data is unambiguous."""
        upload_id, account_id = test_upload_with_real_file

        mock_response = {
            "summary": "Clear Google Ads data.",
            "funnel_mapping": {"Brand Awareness": "tofu"},
            "column_suggestions": {"Impressions": "impressions"},
            "clarifying_question": None
        }

        with patch("app.routes.upload.call_claude_for_file_analysis") as mock_claude:
            mock_claude.return_value = mock_response

            response = client.post(
                "/api/upload/ai-review",
                json={"upload_id": upload_id, "account_id": account_id}
            )

            assert response.status_code == 200
            data = response.json()

            # Should have clarifying_question key even if None
            assert "clarifying_question" in data
            assert data["clarifying_question"] is None

    def test_ai_review_multiple_sheets_correctly_classified(self, test_upload_with_real_file):
        """Test that multiple sheets are all correctly classified."""
        upload_id, account_id = test_upload_with_real_file

        mock_response = {
            "summary": "Multi-sheet campaign data.",
            "funnel_mapping": {
                "Brand Awareness": "tofu",
                "Retargeting": "mofu",
                "Lead Gen": "bofu"
            },
            "column_suggestions": {
                "Campaign_Name": "campaign_name",
                "Impressions": "impressions"
            }
        }

        with patch("app.routes.upload.call_claude_for_file_analysis") as mock_claude:
            mock_claude.return_value = mock_response

            response = client.post(
                "/api/upload/ai-review",
                json={"upload_id": upload_id, "account_id": account_id}
            )

            assert response.status_code == 200
            data = response.json()

            # All 3 sheets should be classified
            assert len(data["funnel_mapping"]) == 3

            # Each should have valid stage
            for sheet_name, stage in data["funnel_mapping"].items():
                assert stage in ["tofu", "mofu", "bofu"]

    def test_ai_review_fallback_when_api_key_missing(self, test_upload_with_real_file):
        """Test that endpoint works with fallback when API key is not set."""
        upload_id, account_id = test_upload_with_real_file

        # Don't mock call_claude_for_file_analysis
        # It should use the built-in mock when ANTHROPIC_API_KEY is not set
        response = client.post(
            "/api/upload/ai-review",
            json={"upload_id": upload_id, "account_id": account_id}
        )

        # Should work even without real Claude API
        assert response.status_code == 200

        data = response.json()

        # Should have basic response structure
        assert "summary" in data
        assert "funnel_mapping" in data
        assert "column_suggestions" in data


class TestClaudeIntegration:
    """Test Claude-specific integration."""

    def test_call_claude_with_real_structure(self, test_upload_with_real_file):
        """Test that call_claude_for_file_analysis receives correctly structured data."""
        upload_id, account_id = test_upload_with_real_file

        call_args_captured = {}

        def mock_claude_with_capture(*args, **kwargs):
            # Capture the arguments
            call_args_captured["args"] = args
            call_args_captured["kwargs"] = kwargs
            return {
                "summary": "Test",
                "funnel_mapping": {},
                "column_suggestions": {}
            }

        with patch("app.routes.upload.call_claude_for_file_analysis", side_effect=mock_claude_with_capture):
            response = client.post(
                "/api/upload/ai-review",
                json={"upload_id": upload_id, "account_id": account_id}
            )

            assert response.status_code == 200

            # Verify Claude was called with expected arguments
            assert call_args_captured["args"] or call_args_captured["kwargs"]

    def test_response_format_is_valid_json(self, test_upload_with_real_file):
        """Test that response is valid JSON matching AIReviewResponse schema."""
        upload_id, account_id = test_upload_with_real_file

        mock_response = {
            "summary": "Test data",
            "funnel_mapping": {"Sheet1": "tofu"},
            "column_suggestions": {"Col1": "col1"},
            "clarifying_question": "Is this final data?"
        }

        with patch("app.routes.upload.call_claude_for_file_analysis") as mock_claude:
            mock_claude.return_value = mock_response

            response = client.post(
                "/api/upload/ai-review",
                json={"upload_id": upload_id, "account_id": account_id}
            )

            assert response.status_code == 200

            # Should be valid JSON
            data = response.json()
            assert isinstance(data, dict)

            # Should match schema
            assert "summary" in data
            assert "funnel_mapping" in data
            assert "column_suggestions" in data

            # Should be serializable back to JSON
            json_str = json.dumps(data)
            assert len(json_str) > 0
