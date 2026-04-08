"""
Comprehensive test suite for ingestion service modules.

Tests all 4 modules with realistic data patterns and edge cases:
- funnel_detector: Campaign stage classification
- normalizer: Value normalization and format detection
- conflict_detector: Conflict detection and auto-acceptance
- importer: Atomic transaction import

Run with: pytest test_ingestion_modules.py -v
"""

import pytest
from datetime import datetime
from .funnel_detector import detect_stage
from .normalizer import normalize_value, detect_ctr_format
from .conflict_detector import detect_conflicts, auto_accept_conflicts
from .importer import _get_next_version_number, compute_file_hash


# ========== FUNNEL DETECTOR TESTS ==========

class TestFunnelDetector:
    """Test campaign funnel stage detection."""

    def test_detect_stage_with_explicit_funnel_column(self):
        """Test explicit funnel column takes highest priority."""
        # Explicit column should override campaign name
        stage, conf = detect_stage(
            campaign_name="Random Campaign",
            funnel_col_value="TOFU"
        )
        assert stage == "tofu"
        assert conf == 1.0

    def test_detect_stage_explicit_column_case_insensitive(self):
        """Test funnel column matching is case-insensitive."""
        for value in ["mofu", "MOFU", "Mofu", "MOfu"]:
            stage, conf = detect_stage("Some Campaign", value)
            assert stage == "mofu"
            assert conf == 1.0

    def test_detect_stage_bofu_pattern(self):
        """Test BOFU pattern matching."""
        campaigns = [
            "Conversion Campaign",
            "Purchase Intent",
            "Lead Generation",
            "Appointment Booking",
            "Competitor Targeting",
        ]
        for campaign in campaigns:
            stage, conf = detect_stage(campaign)
            assert stage == "bofu"
            assert conf == 0.8

    def test_detect_stage_mofu_pattern(self):
        """Test MOFU pattern matching."""
        campaigns = [
            "Retargeting Users",
            "Remarketing Campaign",
            "Engagement Focus",
            "Interest-Based Targeting",
            "Consideration Stage",
        ]
        for campaign in campaigns:
            stage, conf = detect_stage(campaign)
            assert stage == "mofu"
            assert conf == 0.8

    def test_detect_stage_tofu_pattern(self):
        """Test TOFU pattern matching."""
        campaigns = [
            "Brand Awareness",
            "Reach Campaign",
            "PMax Campaign",
            "Display Network",
            "YouTube Discovery",
            "DSA Campaign",
        ]
        for campaign in campaigns:
            stage, conf = detect_stage(campaign)
            assert stage == "tofu"
            assert conf == 0.8

    def test_detect_stage_unknown(self):
        """Test unknown campaign returns unknown stage."""
        stage, conf = detect_stage("Miscellaneous Campaign")
        assert stage == "unknown"
        assert conf == 0.0

    def test_detect_stage_partial_match(self):
        """Test partial pattern matches work correctly."""
        # "retargeting" is substring in campaign name
        stage, conf = detect_stage("Retargeting_Users_v2")
        assert stage == "mofu"
        assert conf == 0.8

    def test_detect_stage_explicit_overrides_pattern(self):
        """Test explicit funnel column overrides campaign name pattern."""
        # Campaign name suggests TOFU, but explicit column says BOFU
        stage, conf = detect_stage(
            campaign_name="Brand Awareness Campaign",
            funnel_col_value="bofu"
        )
        assert stage == "bofu"
        assert conf == 1.0


# ========== NORMALIZER TESTS ==========

class TestNormalizer:
    """Test value normalization."""

    def test_normalize_cost_with_currency_symbol(self):
        """Test currency value normalization."""
        assert normalize_value("₹1,000.50", "cost") == 1000.50
        assert normalize_value("$1,234.56", "cost") == 1234.56
        assert normalize_value("€500.00", "cost") == 500.00

    def test_normalize_cost_without_currency(self):
        """Test numeric cost values."""
        assert normalize_value("1000.50", "cost") == 1000.50
        assert normalize_value("5000", "cost") == 5000.0

    def test_normalize_impressions(self):
        """Test impression count normalization."""
        assert normalize_value("1,000,000", "impressions") == 1000000
        assert normalize_value("1000000", "impressions") == 1000000
        assert normalize_value("50000", "impressions") == 50000

    def test_normalize_clicks(self):
        """Test click count normalization."""
        assert normalize_value("1,500", "clicks") == 1500
        assert normalize_value("1500", "clicks") == 1500

    def test_normalize_conversions(self):
        """Test conversion count normalization."""
        assert normalize_value("100", "conversions") == 100
        assert normalize_value("500", "conversions") == 500

    def test_normalize_date_iso_format(self):
        """Test ISO date parsing."""
        assert normalize_value("2026-03-26", "date_from") == "2026-03-26"
        assert normalize_value("2026-03-26", "date_to") == "2026-03-26"

    def test_normalize_date_dd_mm_yyyy(self):
        """Test DD/MM/YYYY date parsing."""
        assert normalize_value("26/03/2026", "date_from") == "2026-03-26"

    def test_normalize_date_mm_dd_yyyy(self):
        """Test MM/DD/YYYY date parsing."""
        assert normalize_value("03/26/2026", "date_from") == "2026-03-26"

    def test_normalize_date_named_month(self):
        """Test named month date parsing."""
        assert normalize_value("26 Mar 2026", "date_from") == "2026-03-26"
        assert normalize_value("26 March 2026", "date_from") == "2026-03-26"

    def test_normalize_ctr_ratio_format(self):
        """Test CTR ratio (0.0-1.0) is kept as-is."""
        # When CTR < 1, treat as ratio
        assert normalize_value("0.0234", "ctr") == 0.0234

    def test_normalize_ctr_percentage_format(self):
        """Test CTR percentage (0-100) is divided by 100."""
        # When CTR > 1, treat as percentage
        assert normalize_value("2.34", "ctr") == pytest.approx(0.0234, rel=1e-4)

    def test_normalize_ctr_with_sample_detection(self):
        """Test CTR format detection from sample data."""
        sample = [
            {"ctr": "0.02"},
            {"ctr": "0.034"},
            {"ctr": "0.012"},
        ]
        # Sample indicates ratio format
        result = normalize_value("0.025", "ctr", sample)
        assert result == 0.025

    def test_detect_ctr_format_ratio(self):
        """Test ratio format detection."""
        sample = [
            {"ctr": 0.02},
            {"ctr": 0.034},
            {"ctr": 0.012},
        ]
        assert detect_ctr_format(sample) == "ratio"

    def test_detect_ctr_format_percentage(self):
        """Test percentage format detection."""
        sample = [
            {"ctr": 2.0},
            {"ctr": 3.4},
            {"ctr": 1.2},
        ]
        assert detect_ctr_format(sample) == "percentage"

    def test_detect_ctr_format_ambiguous(self):
        """Test ambiguous format detection."""
        sample = [
            {"ctr": 0.5},
            {"ctr": 2.0},
        ]
        assert detect_ctr_format(sample) == "ambiguous"

    def test_normalize_empty_value(self):
        """Test empty values return None."""
        assert normalize_value("", "cost") is None
        assert normalize_value(None, "impressions") is None

    def test_normalize_string_field(self):
        """Test string fields are stripped."""
        assert normalize_value("  Brand Campaign  ", "campaign_name") == "Brand Campaign"


# ========== CONFLICT DETECTOR TESTS ==========

class TestConflictDetector:
    """Test conflict detection between old and new data."""

    def test_detect_conflicts_no_match_key(self):
        """Test new data without match key is not flagged as conflict."""
        new = [{
            "account_id": "a1", "platform": "google", "campaign_name": "New Campaign",
            "date_from": "2026-03-01", "date_to": "2026-03-31",
            "cost": 1000.0
        }]
        existing = [{
            "account_id": "a1", "platform": "google", "campaign_name": "Other Campaign",
            "date_from": "2026-03-01", "date_to": "2026-03-31",
            "cost": 500.0
        }]
        conflicts = detect_conflicts(new, existing)
        assert len(conflicts) == 0

    def test_detect_conflicts_exact_match(self):
        """Test exact match produces no conflict."""
        new = [{
            "account_id": "a1", "platform": "google", "campaign_name": "Brand",
            "date_from": "2026-03-01", "date_to": "2026-03-31",
            "cost": 1000.0, "impressions": 50000
        }]
        existing = [{
            "account_id": "a1", "platform": "google", "campaign_name": "Brand",
            "date_from": "2026-03-01", "date_to": "2026-03-31",
            "cost": 1000.0, "impressions": 50000
        }]
        conflicts = detect_conflicts(new, existing)
        assert len(conflicts) == 0

    def test_detect_conflicts_within_threshold(self):
        """Test differences within 5% are not flagged."""
        new = [{
            "account_id": "a1", "platform": "google", "campaign_name": "Brand",
            "date_from": "2026-03-01", "date_to": "2026-03-31",
            "cost": 1020.0  # 2% increase
        }]
        existing = [{
            "account_id": "a1", "platform": "google", "campaign_name": "Brand",
            "date_from": "2026-03-01", "date_to": "2026-03-31",
            "cost": 1000.0
        }]
        conflicts = detect_conflicts(new, existing)
        assert len(conflicts) == 0

    def test_detect_conflicts_exceeds_threshold(self):
        """Test differences exceeding 5% are flagged."""
        new = [{
            "account_id": "a1", "platform": "google", "campaign_name": "Brand",
            "date_from": "2026-03-01", "date_to": "2026-03-31",
            "cost": 1060.0  # 6% increase
        }]
        existing = [{
            "account_id": "a1", "platform": "google", "campaign_name": "Brand",
            "date_from": "2026-03-01", "date_to": "2026-03-31",
            "cost": 1000.0
        }]
        conflicts = detect_conflicts(new, existing)
        assert len(conflicts) == 1
        assert conflicts[0]["field"] == "cost"
        assert conflicts[0]["pct_change"] == pytest.approx(6.0, abs=0.1)

    def test_detect_conflicts_multiple_fields(self):
        """Test multiple fields with conflicts."""
        new = [{
            "account_id": "a1", "platform": "google", "campaign_name": "Brand",
            "date_from": "2026-03-01", "date_to": "2026-03-31",
            "cost": 1060.0,  # 6% increase
            "impressions": 53000  # 6% increase
        }]
        existing = [{
            "account_id": "a1", "platform": "google", "campaign_name": "Brand",
            "date_from": "2026-03-01", "date_to": "2026-03-31",
            "cost": 1000.0,
            "impressions": 50000
        }]
        conflicts = detect_conflicts(new, existing)
        assert len(conflicts) == 2
        assert all(c["pct_change"] == pytest.approx(6.0, abs=0.1) for c in conflicts)

    def test_detect_conflicts_negative_change(self):
        """Test negative percentage changes."""
        new = [{
            "account_id": "a1", "platform": "google", "campaign_name": "Brand",
            "date_from": "2026-03-01", "date_to": "2026-03-31",
            "cost": 900.0  # 10% decrease
        }]
        existing = [{
            "account_id": "a1", "platform": "google", "campaign_name": "Brand",
            "date_from": "2026-03-01", "date_to": "2026-03-31",
            "cost": 1000.0
        }]
        conflicts = detect_conflicts(new, existing)
        assert len(conflicts) == 1
        assert conflicts[0]["pct_change"] == pytest.approx(-10.0, abs=0.1)

    def test_auto_accept_conflicts_below_threshold(self):
        """Test auto-accepting conflicts within threshold."""
        conflicts = [
            {"field": "cost", "pct_change": 3.0},
            {"field": "impressions", "pct_change": 4.5},
        ]
        to_review, accepted = auto_accept_conflicts(conflicts)
        assert len(to_review) == 0
        assert len(accepted) == 2

    def test_auto_accept_conflicts_above_threshold(self):
        """Test conflicts exceeding threshold are flagged for review."""
        conflicts = [
            {"field": "cost", "pct_change": 6.0},
            {"field": "impressions", "pct_change": 7.5},
        ]
        to_review, accepted = auto_accept_conflicts(conflicts)
        assert len(to_review) == 2
        assert len(accepted) == 0

    def test_auto_accept_conflicts_mixed(self):
        """Test mixed threshold results."""
        conflicts = [
            {"field": "cost", "pct_change": 3.0},
            {"field": "impressions", "pct_change": 7.5},
        ]
        to_review, accepted = auto_accept_conflicts(conflicts)
        assert len(to_review) == 1
        assert len(accepted) == 1


# ========== IMPORTER TESTS ==========

class TestImporter:
    """Test database import functionality."""

    def test_compute_file_hash(self, tmp_path):
        """Test file hash computation."""
        test_file = tmp_path / "test.txt"
        test_file.write_text("test content")

        hash1 = compute_file_hash(str(test_file))
        assert isinstance(hash1, str)
        assert len(hash1) == 64  # SHA256 hex is 64 chars

        # Same file should produce same hash
        hash2 = compute_file_hash(str(test_file))
        assert hash1 == hash2

    def test_compute_file_hash_different_files(self, tmp_path):
        """Test different files produce different hashes."""
        file1 = tmp_path / "file1.txt"
        file2 = tmp_path / "file2.txt"
        file1.write_text("content 1")
        file2.write_text("content 2")

        hash1 = compute_file_hash(str(file1))
        hash2 = compute_file_hash(str(file2))
        assert hash1 != hash2


# ========== INTEGRATION TESTS ==========

class TestIntegration:
    """Integration tests combining multiple modules."""

    def test_funnel_detector_normalizer_pipeline(self):
        """Test funnel detection combined with value normalization."""
        campaign = "Brand Awareness Campaign"
        stage, conf = detect_stage(campaign)
        assert stage == "tofu"

        cost = normalize_value("₹1,000.50", "cost")
        assert cost == 1000.50

    def test_conflict_detection_normalizer_pipeline(self):
        """Test conflict detection with normalized values."""
        # New data (already normalized)
        new = [{
            "account_id": "a1", "platform": "google", "campaign_name": "Brand",
            "date_from": "2026-03-01", "date_to": "2026-03-31",
            "cost": 1060.0,
            "impressions": 50000
        }]

        # Existing data (normalized)
        existing = [{
            "account_id": "a1", "platform": "google", "campaign_name": "Brand",
            "date_from": "2026-03-01", "date_to": "2026-03-31",
            "cost": 1000.0,
            "impressions": 50000
        }]

        conflicts = detect_conflicts(new, existing)
        assert len(conflicts) == 1

        to_review, accepted = auto_accept_conflicts(conflicts)
        assert len(to_review) == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
