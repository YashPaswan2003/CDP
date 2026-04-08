"""Tests for normalizer module."""
import pytest
from app.services.ingestion.normalizer import normalize_value, detect_ctr_format


def test_cost_normalization():
    """Test cost field normalization."""
    assert normalize_value("₹1,000.50", "cost") == 1000.50
    assert normalize_value("$500", "cost") == 500.0
    assert normalize_value("1000", "cost") == 1000.0


def test_currency_symbol_stripping():
    """Test that currency symbols are removed."""
    assert normalize_value("₹500", "cost") == 500.0
    assert normalize_value("€100", "cost") == 100.0
    assert normalize_value("$50.50", "cost") == 50.50


def test_clicks_normalization():
    """Test clicks field normalization."""
    assert normalize_value("1,000", "clicks") == 1000
    assert normalize_value("500", "clicks") == 500
    assert normalize_value(1000, "clicks") == 1000


def test_ctr_ratio_format():
    """Test CTR in ratio format (0.0-1.0)."""
    sample = [{"ctr": 0.023}, {"ctr": 0.045}, {"ctr": 0.012}]
    format_type = detect_ctr_format(sample)
    
    assert format_type == "ratio"


def test_ctr_percentage_format():
    """Test CTR in percentage format (0-100)."""
    sample = [{"ctr": 2.3}, {"ctr": 4.5}, {"ctr": 1.2}]
    format_type = detect_ctr_format(sample)
    
    assert format_type == "percentage"


def test_ctr_normalization_to_ratio():
    """Test normalizing CTR to ratio format."""
    # If detected as percentage, normalize to ratio
    result = normalize_value(2.5, "ctr", sample_data=[{"ctr": 2.5}, {"ctr": 3.0}])
    
    # Result should be close to 0.025 (2.5%)
    assert result < 1.0  # Should be in ratio format


def test_impressions_normalization():
    """Test impressions field normalization."""
    assert normalize_value("1,000,000", "impressions") == 1000000
    assert normalize_value("500,000", "impressions") == 500000


def test_date_normalization():
    """Test date field normalization."""
    assert normalize_value("2026-04-08", "date_from") == "2026-04-08"
    assert normalize_value("04/08/2026", "date_to") == "2026-08-04"


def test_whitespace_stripping():
    """Test that whitespace is stripped from string fields."""
    result = normalize_value("  Campaign Name  ", "campaign_name")
    assert result == "Campaign Name"
