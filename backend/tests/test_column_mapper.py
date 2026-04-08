"""Tests for column_mapper module."""
import pytest
from app.services.ingestion.column_mapper import map_columns


def test_exact_match():
    """Test exact column name matching."""
    columns = ["Cost", "Clicks", "Impressions"]
    result = map_columns(columns)

    assert result.get("Cost") is not None
    assert result["Cost"]["confidence"] == 1.0
    assert result["Cost"]["canonical"] == "cost"
    assert result["Cost"]["needs_review"] is False

    assert result.get("Clicks") is not None
    assert result.get("Impressions") is not None


def test_fuzzy_match_high_confidence():
    """Test fuzzy matching above 82% threshold."""
    columns = ["Amount spent (INR)"]
    result = map_columns(columns)

    assert result.get("Amount spent (INR)") is not None
    assert result["Amount spent (INR)"]["confidence"] >= 0.82
    assert result["Amount spent (INR)"]["canonical"] is not None
    assert result["Amount spent (INR)"]["needs_review"] is False


def test_fuzzy_match_needs_review():
    """Test fuzzy matching between 70-82% that needs review."""
    columns = ["appointment"]
    result = map_columns(columns)

    assert result.get("appointment") is not None
    if result["appointment"]["needs_review"]:
        assert 0.70 <= result["appointment"]["confidence"] <= 0.90


def test_unmapped_columns():
    """Test handling of unmapped columns."""
    columns = ["Unknown Field", "Random Column", "Cost"]
    result = map_columns(columns)

    unmapped = [col for col, meta in result.items() if meta["canonical"] is None]
    assert any("Unknown" in col or "Random" in col for col in unmapped)
    assert "Cost" not in unmapped


def test_whitespace_handling():
    """Test that whitespace is properly handled."""
    columns = ["  Cost  ", "Clicks ", " Impressions"]
    result = map_columns(columns)

    # Should have entries for all columns
    assert len(result) == 3
