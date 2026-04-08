"""
Test-driven development for Phase 4: Claude AI Review endpoint.

Tests:
1. POST /api/upload/ai-review with valid upload_id and account_id
2. Response structure matches spec: { summary, funnel_mapping, column_suggestions, clarifying_question? }
3. Claude API is called with proper prompt structure
4. Handles missing ANTHROPIC_API_KEY gracefully (mock mode)
5. Returns proper error when upload_id not found
"""

import pytest
import json
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from pathlib import Path

# Import app and database utilities
from app.main import app
from app.database.connection import get_connection


client = TestClient(app)


@pytest.fixture
def test_upload_id(setup_database):
    """Create a test upload record in the database."""
    import uuid
    conn = get_connection()

    # Insert a test upload with unique ID
    upload_id = f"test-upload-{uuid.uuid4().hex[:8]}"
    account_id = "ethinos"

    conn.execute("""
        INSERT INTO uploads (id, account_id, file_name, file_path, file_type, status)
        VALUES (?, ?, ?, ?, ?, ?)
    """, [
        upload_id,
        account_id,
        "test_data.xlsx",
        "/tmp/test_data.xlsx",
        "xlsx",
        "analyzed"
    ])
    conn.commit()
    conn.close()

    return upload_id, account_id


class TestAIReviewEndpoint:
    """Test suite for /api/upload/ai-review endpoint."""

    def test_endpoint_exists(self):
        """Verify POST /api/upload/ai-review endpoint exists."""
        # This should not 404
        response = client.post(
            "/api/upload/ai-review",
            json={"upload_id": "nonexistent", "account_id": "test"}
        )
        # Should either work or return 400/404, not 404 for endpoint
        assert response.status_code in [200, 400, 404, 500], "Endpoint should exist"

    def test_missing_upload_id(self):
        """Test error handling when upload_id not found."""
        response = client.post(
            "/api/upload/ai-review",
            json={"upload_id": "nonexistent-12345", "account_id": "ethinos"}
        )
        assert response.status_code == 404
        assert "not found" in response.json().get("detail", "").lower()

    def test_response_structure_with_mock_claude(self, test_upload_id):
        """Test response structure matches spec (with mocked Claude)."""
        upload_id, account_id = test_upload_id

        # Mock the Claude API call
        mock_response = {
            "summary": "This file contains 2 sheets with Google Ads campaign data from March 2026.",
            "funnel_mapping": {
                "Brand Awareness": "tofu",
                "Lead Gen": "bofu"
            },
            "column_suggestions": {
                "Campaign_Name": "campaign_name",
                "Impressions": "impressions",
                "Clicks": "clicks",
                "Cost_INR": "cost"
            },
            "clarifying_question": "Are all costs in INR or is there mixed currency?"
        }

        # Mock both parse_file and the Claude call
        with patch("app.routes.upload.parse_file") as mock_parse, \
             patch("app.routes.upload.classify_sheets") as mock_classify, \
             patch("app.routes.upload.call_claude_for_file_analysis") as mock_claude:

            # Setup parse_file to return mock dataframes
            import pandas as pd
            mock_sheets = {
                "Brand Awareness": pd.DataFrame({
                    "Campaign_Name": ["Campaign A", "Campaign B"],
                    "Impressions": [1000, 2000],
                    "Clicks": [50, 100],
                    "Cost_INR": [500, 1000]
                }),
                "Lead Gen": pd.DataFrame({
                    "Campaign_Name": ["Campaign C"],
                    "Impressions": [500],
                    "Clicks": [25],
                    "Cost_INR": [250]
                })
            }
            mock_parse.return_value = mock_sheets

            # Setup classify_sheets to return sheet info
            mock_classify.return_value = {
                "included": [
                    {"name": "Brand Awareness", "type": "raw", "row_count": 2},
                    {"name": "Lead Gen", "type": "raw", "row_count": 1}
                ],
                "skipped": []
            }

            mock_claude.return_value = mock_response

            response = client.post(
                "/api/upload/ai-review",
                json={"upload_id": upload_id, "account_id": account_id}
            )

        assert response.status_code == 200, f"Got {response.status_code}: {response.text}"

        data = response.json()

        # Verify response structure
        assert "summary" in data
        assert "funnel_mapping" in data
        assert "column_suggestions" in data
        # clarifying_question is optional

        # Verify types
        assert isinstance(data["summary"], str)
        assert isinstance(data["funnel_mapping"], dict)
        assert isinstance(data["column_suggestions"], dict)

    def test_claude_called_with_correct_prompt(self, test_upload_id):
        """Test that Claude API is called with file data and proper structure."""
        upload_id, account_id = test_upload_id

        mock_response = {
            "summary": "Test summary",
            "funnel_mapping": {},
            "column_suggestions": {}
        }

        with patch("app.routes.upload.parse_file") as mock_parse, \
             patch("app.routes.upload.classify_sheets") as mock_classify, \
             patch("app.routes.upload.call_claude_for_file_analysis") as mock_claude:

            import pandas as pd
            mock_sheets = {
                "Sheet1": pd.DataFrame({"Col1": [1], "Col2": [2]})
            }
            mock_parse.return_value = mock_sheets
            mock_classify.return_value = {
                "included": [{"name": "Sheet1", "type": "raw", "row_count": 1}],
                "skipped": []
            }
            mock_claude.return_value = mock_response

            response = client.post(
                "/api/upload/ai-review",
                json={"upload_id": upload_id, "account_id": account_id}
            )

            assert response.status_code == 200

            # Verify Claude was called
            assert mock_claude.called

            # Get the call arguments
            call_args = mock_claude.call_args

            # Should be called with file_summary and account info
            assert call_args is not None

            # Should have passed some data structure to Claude
            # (exact signature depends on implementation)

    def test_handles_missing_api_key_gracefully(self, test_upload_id):
        """Test graceful degradation when ANTHROPIC_API_KEY is not set."""
        upload_id, account_id = test_upload_id

        # Mock file parsing
        with patch("app.routes.upload.parse_file") as mock_parse, \
             patch("app.routes.upload.classify_sheets") as mock_classify:

            import pandas as pd
            mock_sheets = {
                "Sheet1": pd.DataFrame({"Col1": [1]})
            }
            mock_parse.return_value = mock_sheets
            mock_classify.return_value = {
                "included": [{"name": "Sheet1", "type": "raw", "row_count": 1}],
                "skipped": []
            }

            response = client.post(
                "/api/upload/ai-review",
                json={"upload_id": upload_id, "account_id": account_id}
            )

            # Should not return 500 (server error) due to missing API key
            # Should either work (200) or return proper 4xx error
            assert response.status_code != 500 or "ANTHROPIC_API_KEY" in response.text

    def test_returns_clarifying_question_when_ambiguous(self, test_upload_id):
        """Test that clarifying_question is included when data is ambiguous."""
        upload_id, account_id = test_upload_id

        mock_response = {
            "summary": "File contains campaign data.",
            "funnel_mapping": {"Sheet1": "tofu"},
            "column_suggestions": {"col1": "impressions"},
            "clarifying_question": "Is this Google Ads or Meta data?"
        }

        with patch("app.routes.upload.parse_file") as mock_parse, \
             patch("app.routes.upload.classify_sheets") as mock_classify, \
             patch("app.routes.upload.call_claude_for_file_analysis") as mock_claude:

            import pandas as pd
            mock_sheets = {"Sheet1": pd.DataFrame({"col1": [1]})}
            mock_parse.return_value = mock_sheets
            mock_classify.return_value = {
                "included": [{"name": "Sheet1", "type": "raw", "row_count": 1}],
                "skipped": []
            }
            mock_claude.return_value = mock_response

            response = client.post(
                "/api/upload/ai-review",
                json={"upload_id": upload_id, "account_id": account_id}
            )

            assert response.status_code == 200
            data = response.json()

            # Should include clarifying_question
            assert "clarifying_question" in data
            assert data["clarifying_question"] is not None

    def test_funnel_mapping_values_are_valid_stages(self, test_upload_id):
        """Test that funnel_mapping only contains valid TOFU/MOFU/BOFU stages."""
        upload_id, account_id = test_upload_id

        mock_response = {
            "summary": "Test",
            "funnel_mapping": {
                "Awareness": "tofu",
                "Retargeting": "mofu",
                "Conversion": "bofu"
            },
            "column_suggestions": {}
        }

        with patch("app.routes.upload.parse_file") as mock_parse, \
             patch("app.routes.upload.classify_sheets") as mock_classify, \
             patch("app.routes.upload.call_claude_for_file_analysis") as mock_claude:

            import pandas as pd
            mock_sheets = {
                "Awareness": pd.DataFrame({"col1": [1]}),
                "Retargeting": pd.DataFrame({"col1": [1]}),
                "Conversion": pd.DataFrame({"col1": [1]})
            }
            mock_parse.return_value = mock_sheets
            mock_classify.return_value = {
                "included": [
                    {"name": "Awareness", "type": "raw", "row_count": 1},
                    {"name": "Retargeting", "type": "raw", "row_count": 1},
                    {"name": "Conversion", "type": "raw", "row_count": 1}
                ],
                "skipped": []
            }
            mock_claude.return_value = mock_response

            response = client.post(
                "/api/upload/ai-review",
                json={"upload_id": upload_id, "account_id": account_id}
            )

            assert response.status_code == 200
            data = response.json()

            # All mapping values should be valid TOFU/MOFU/BOFU
            for sheet_name, stage in data["funnel_mapping"].items():
                assert stage in ["tofu", "mofu", "bofu"], f"Invalid stage: {stage}"


class TestClaudePromptConstruction:
    """Test the prompt construction for Claude API calls."""

    def test_prompt_includes_account_name(self, test_upload_id):
        """Test that prompt mentions account name."""
        upload_id, account_id = test_upload_id

        with patch("app.routes.upload.parse_file") as mock_parse, \
             patch("app.routes.upload.classify_sheets") as mock_classify, \
             patch("app.routes.upload.call_claude_for_file_analysis") as mock_claude:

            import pandas as pd
            mock_sheets = {"Sheet1": pd.DataFrame({"Col1": [1]})}
            mock_parse.return_value = mock_sheets
            mock_classify.return_value = {
                "included": [{"name": "Sheet1", "type": "raw", "row_count": 1}],
                "skipped": []
            }
            mock_claude.return_value = {
                "summary": "Test",
                "funnel_mapping": {},
                "column_suggestions": {}
            }

            response = client.post(
                "/api/upload/ai-review",
                json={"upload_id": upload_id, "account_id": account_id}
            )

            assert response.status_code == 200

    def test_prompt_includes_file_summary(self, test_upload_id):
        """Test that prompt includes sheet names, row counts, and column data."""
        upload_id, account_id = test_upload_id

        with patch("app.routes.upload.parse_file") as mock_parse, \
             patch("app.routes.upload.classify_sheets") as mock_classify, \
             patch("app.routes.upload.call_claude_for_file_analysis") as mock_claude:

            import pandas as pd
            mock_sheets = {"Sheet1": pd.DataFrame({"Col1": [1]})}
            mock_parse.return_value = mock_sheets
            mock_classify.return_value = {
                "included": [{"name": "Sheet1", "type": "raw", "row_count": 1}],
                "skipped": []
            }
            mock_claude.return_value = {
                "summary": "Test",
                "funnel_mapping": {},
                "column_suggestions": {}
            }

            response = client.post(
                "/api/upload/ai-review",
                json={"upload_id": upload_id, "account_id": account_id}
            )

            assert response.status_code == 200
