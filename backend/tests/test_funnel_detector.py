"""Tests for funnel_detector module."""
import pytest
from app.services.ingestion.funnel_detector import detect_stage


def test_direct_funnel_column_tofu():
    """Test direct funnel detection from column value."""
    stage, confidence = detect_stage("Any Campaign", "TOFU")
    assert stage == "tofu"
    assert confidence == 1.0


def test_direct_funnel_column_mofu():
    """Test MOFU detection from column."""
    stage, confidence = detect_stage("Campaign Name", "MOFU")
    assert stage == "mofu"
    assert confidence == 1.0


def test_direct_funnel_column_bofu():
    """Test BOFU detection from column."""
    stage, confidence = detect_stage("Campaign Name", "BOFU")
    assert stage == "bofu"
    assert confidence == 1.0


def test_pattern_match_tofu():
    """Test TOFU pattern detection from campaign name."""
    stage, confidence = detect_stage("Brand_Awareness_Campaign")
    assert stage == "tofu"
    assert confidence == 0.8


def test_pattern_match_mofu():
    """Test MOFU pattern detection (retargeting)."""
    stage, confidence = detect_stage("Retargeting_Interest_Audience")
    assert stage == "mofu"
    assert confidence == 0.8


def test_pattern_match_bofu():
    """Test BOFU pattern detection (conversion)."""
    stage, confidence = detect_stage("Conversion_Category_Campaign")
    assert stage == "bofu"
    assert confidence == 0.8


def test_unknown_stage():
    """Test unknown funnel stage."""
    stage, confidence = detect_stage("RandomCampaignName")
    assert stage == "unknown"
    assert confidence == 0.0


def test_youtube_pattern_tofu():
    """Test YouTube pattern detected as TOFU."""
    stage, confidence = detect_stage("YouTube_Display_Reach")
    assert stage == "tofu"


def test_pmax_pattern_tofu():
    """Test PMax (Performance Max) pattern as TOFU."""
    stage, confidence = detect_stage("PMax_Campaign_2026")
    assert stage == "tofu"


def test_column_value_overrides_pattern():
    """Test that column value takes precedence over pattern."""
    stage, confidence = detect_stage("Brand_Campaign", "bofu")
    # Column value should override pattern match
    assert stage == "bofu"
    assert confidence == 1.0
