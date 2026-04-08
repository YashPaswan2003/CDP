"""Tests for conflict_detector module."""
import pytest
from app.services.ingestion.conflict_detector import detect_conflicts, auto_accept_conflicts


def test_no_conflicts_identical_data():
    """Test that identical data produces no conflicts."""
    existing = [
        {
            "account_id": "acc1",
            "platform": "google",
            "campaign_name": "Campaign 1",
            "date_from": "2026-04-01",
            "date_to": "2026-04-07",
            "cost": 100.0,
            "clicks": 50,
        }
    ]
    
    new = [existing[0].copy()]
    
    conflicts = detect_conflicts(new, existing)
    assert len(conflicts) == 0


def test_conflict_above_5_percent():
    """Test that >5% difference triggers conflict."""
    existing = [
        {
            "account_id": "acc1",
            "platform": "google",
            "campaign_name": "Campaign 1",
            "date_from": "2026-04-01",
            "date_to": "2026-04-07",
            "cost": 100.0,
            "clicks": 50,
        }
    ]
    
    new = [
        {
            "account_id": "acc1",
            "platform": "google",
            "campaign_name": "Campaign 1",
            "date_from": "2026-04-01",
            "date_to": "2026-04-07",
            "cost": 106.0,  # 6% increase
            "clicks": 50,
        }
    ]
    
    conflicts = detect_conflicts(new, existing)
    assert len(conflicts) == 1
    assert conflicts[0]["field"] == "cost"
    assert abs(conflicts[0]["pct_change"]) > 5


def test_auto_accept_below_5_percent():
    """Test that <5% differences are auto-accepted."""
    existing = [
        {
            "account_id": "acc1",
            "platform": "google",
            "campaign_name": "Campaign 1",
            "date_from": "2026-04-01",
            "date_to": "2026-04-07",
            "cost": 100.0,
        }
    ]
    
    new = [
        {
            "account_id": "acc1",
            "platform": "google",
            "campaign_name": "Campaign 1",
            "date_from": "2026-04-01",
            "date_to": "2026-04-07",
            "cost": 102.0,  # 2% increase
        }
    ]
    
    conflicts = detect_conflicts(new, existing)
    auto_accept, review = auto_accept_conflicts(conflicts, threshold=5.0)
    
    # 2% is auto-accepted, not flagged for review
    assert len(review) == 0


def test_zero_division_handling():
    """Test handling of zero division in percentage calculation."""
    existing = [
        {
            "account_id": "acc1",
            "platform": "google",
            "campaign_name": "Campaign 1",
            "date_from": "2026-04-01",
            "date_to": "2026-04-07",
            "cost": 0.0,
        }
    ]
    
    new = [
        {
            "account_id": "acc1",
            "platform": "google",
            "campaign_name": "Campaign 1",
            "date_from": "2026-04-01",
            "date_to": "2026-04-07",
            "cost": 100.0,
        }
    ]
    
    # Should not raise ZeroDivisionError
    conflicts = detect_conflicts(new, existing)
    assert len(conflicts) >= 0
