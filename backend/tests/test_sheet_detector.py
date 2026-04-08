"""Tests for sheet_detector module."""
import pytest
import pandas as pd
from app.services.ingestion.sheet_detector import classify_sheets


def test_raw_data_sheet_detection():
    """Test detection of RAW data sheets."""
    sheets = {
        "raw_data": pd.DataFrame({
            "Campaign": ["C1", "C2"] * 30,
            "Clicks": [100, 200] * 30,
            "Cost": [50.0, 100.0] * 30,
            "Impressions": [1000, 2000] * 30,
        }),
        "summary": pd.DataFrame({"A": [1, 2]})
    }
    
    result = classify_sheets(sheets)
    raw_sheet = next((s for s in result if s["sheet_name"] == "raw_data"), None)
    summary_sheet = next((s for s in result if s["sheet_name"] == "summary"), None)
    
    assert raw_sheet is not None
    assert raw_sheet["type"] == "raw"
    assert raw_sheet["rows"] == 60
    
    assert summary_sheet is not None
    assert summary_sheet["type"] == "skip"


def test_crm_sheet_detection():
    """Test detection of CRM sheets."""
    sheets = {
        "pmd_data": pd.DataFrame({
            "mobile": ["9876543210"] * 100,
            "patient": ["John Doe"] * 100,
            "did_number": ["123"] * 100,
        })
    }
    
    result = classify_sheets(sheets)
    crm_sheet = next(s for s in result if s["sheet_name"] == "pmd_data")
    
    assert crm_sheet["type"] == "crm"


def test_explicit_skip_list():
    """Test that explicit skip list is honored."""
    sheets = {
        "mom": pd.DataFrame({"A": range(100)}),
        "pivot": pd.DataFrame({"A": range(100)}),
        "summary": pd.DataFrame({"A": range(100)}),
    }
    
    result = classify_sheets(sheets)
    
    for sheet in result:
        assert sheet["type"] == "skip"
        assert "explicit skip list" in sheet["reason"].lower()


def test_pivot_table_detection():
    """Test detection of pivot/summary tables."""
    sheets = {
        "pivot_table": pd.DataFrame({
            "Campaign": ["Total"] * 25,
            "(All)": [1] * 25,
        })
    }
    
    result = classify_sheets(sheets)
    pivot_sheet = next(s for s in result if s["sheet_name"] == "pivot_table")
    
    assert pivot_sheet["type"] == "skip"


def test_reason_provided():
    """Test that classification reason is always provided."""
    sheets = {
        "test": pd.DataFrame({"X": [1, 2, 3]})
    }
    
    result = classify_sheets(sheets)
    
    assert all("reason" in sheet for sheet in result)
    assert all(len(sheet["reason"]) > 0 for sheet in result)
