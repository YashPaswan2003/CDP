"""Test-driven bug fixes for ingestion engine.

RED phase: Write failing tests that expose the bugs found in real data.
"""

import sys
sys.path.insert(0, '/Users/yash/CDP/backend')

import pytest
from app.services.ingestion import (
    normalize_value,
    detect_stage,
    parse_file,
)


class TestCurrencyParsing:
    """BUG #1: Currency symbol parsing fails - float conversion doesn't handle ₹ prefix."""

    def test_parses_indian_rupee_with_comma_separator(self):
        """Should convert ₹38,419.50 to 38419.5"""
        result = normalize_value('₹38,419.50', 'float')
        assert result == 38419.5, f"Expected 38419.5, got {result}"

    def test_parses_rupee_without_decimals(self):
        """Should convert ₹38,419 to 38419.0"""
        result = normalize_value('₹38,419', 'float')
        assert result == 38419.0, f"Expected 38419.0, got {result}"

    def test_parses_rupee_with_single_digit_decimals(self):
        """Should convert ₹1000.5 to 1000.5"""
        result = normalize_value('₹1000.5', 'float')
        assert result == 1000.5, f"Expected 1000.5, got {result}"

    def test_parses_dollar_with_comma_separator(self):
        """Should handle $ currency as well"""
        result = normalize_value('$38,419.50', 'float')
        assert result == 38419.5, f"Expected 38419.5, got {result}"

    def test_parses_euro_with_comma_separator(self):
        """Should handle € currency"""
        result = normalize_value('€38,419.50', 'float')
        assert result == 38419.5, f"Expected 38419.5, got {result}"

    def test_returns_none_for_invalid_currency_format(self):
        """Should return None for unparseable currency strings"""
        result = normalize_value('₹invalid', 'float')
        assert result is None, f"Expected None, got {result}"


class TestEmptyHeaderHandling:
    """BUG #2: Empty headers in XLSB sheets become 'col_0' instead of meaningful names."""

    def test_xlsb_sheet_with_empty_header_cells(self):
        """Should handle sheets where first row has None/empty values in header positions."""
        test_file = "/Users/yash/CDP/QI_Spine /ROI SEM - 26032026.xlsb"
        sheets = parse_file(test_file)

        # The "Date" sheet has empty headers at the start
        date_sheet = sheets.get('Date')
        assert date_sheet is not None, "Date sheet not found"

        # Headers should not be 'col_0', 'col_1', etc. for empty columns
        # They should either be skipped or have meaningful defaults
        headers = list(date_sheet.columns)

        # Check that we don't have many 'col_N' style headers
        col_style_headers = [h for h in headers if h.startswith('col_')]
        assert len(col_style_headers) < len(headers) * 0.5, \
            f"Too many col_N headers: {col_style_headers}"

    def test_xlsb_header_row_detection_skips_empty_rows(self):
        """Should detect that first actual data row, not empty row, contains headers."""
        test_file = "/Users/yash/CDP/QI_Spine /ROI SEM - 26032026.xlsb"
        sheets = parse_file(test_file)

        # Check RAW sheet which has real headers
        raw_sheet = sheets.get('RAW')
        assert raw_sheet is not None, "RAW sheet not found"

        headers = list(raw_sheet.columns)
        # RAW sheet should have meaningful headers like 'Combo', 'Month', etc.
        expected_headers = ['Combo', 'Month', 'Match Type', 'Final Campain Name']
        actual_headers = [h for h in headers[:4] if h and h != 'None']

        # At least some headers should match expected names
        matches = sum(1 for h in expected_headers if h in headers)
        assert matches > 0, f"No expected headers found in {headers[:5]}"


class TestFunnelDetection:
    """BUG #3: Funnel detection patterns incomplete - SEM_SpineV3_TOFU not matching TOFU."""

    def test_detects_explicit_tofu_in_campaign_name(self):
        """Should detect _TOFU suffix explicitly in campaign name"""
        stage, confidence = detect_stage('SEM_SpineV3_TOFU')
        assert stage == 'tofu', f"Expected 'tofu', got '{stage}'"
        assert confidence >= 0.8, f"Expected confidence >= 0.8, got {confidence}"

    def test_detects_explicit_mofu_in_campaign_name(self):
        """Should detect _MOFU suffix explicitly"""
        stage, confidence = detect_stage('Campaign_MOFU_Retargeting')
        assert stage == 'mofu', f"Expected 'mofu', got '{stage}'"
        assert confidence >= 0.8, f"Expected confidence >= 0.8, got {confidence}"

    def test_detects_explicit_bofu_in_campaign_name(self):
        """Should detect _BOFU suffix explicitly"""
        stage, confidence = detect_stage('Conversion_Campaign_BOFU')
        assert stage == 'bofu', f"Expected 'bofu', got '{stage}'"
        assert confidence >= 0.8, f"Expected confidence >= 0.8, got {confidence}"

    def test_detects_tofu_pattern_in_campaign_name(self):
        """Should detect TOFU patterns like 'awareness', 'brand', 'pmax'"""
        test_cases = [
            ('SEM_Brand_Awareness_Campaign', 'tofu'),
            ('Google_Brand_Campaign', 'tofu'),
            ('PMax_Performance_Max_Campaign', 'tofu'),
            ('Display_Network_Campaign', 'tofu'),
            ('YouTube_Video_Campaign', 'tofu'),
        ]
        for campaign_name, expected_stage in test_cases:
            stage, _ = detect_stage(campaign_name)
            assert stage == expected_stage, \
                f"Campaign '{campaign_name}' should be {expected_stage}, got {stage}"

    def test_detects_mofu_pattern_in_campaign_name(self):
        """Should detect MOFU patterns like 'remarketing', 'retargeting', 'engagement'"""
        test_cases = [
            ('QISpine_Remarketing_Campaign', 'mofu'),
            ('Website_Retargeting_Campaign', 'mofu'),
            ('Engagement_Video_Campaign', 'mofu'),
            ('Interest_Based_Campaign', 'mofu'),
        ]
        for campaign_name, expected_stage in test_cases:
            stage, _ = detect_stage(campaign_name)
            assert stage == expected_stage, \
                f"Campaign '{campaign_name}' should be {expected_stage}, got {stage}"

    def test_detects_bofu_pattern_in_campaign_name(self):
        """Should detect BOFU patterns like 'conversion', 'lead', 'appointment'"""
        test_cases = [
            ('Lead_Generation_Campaign', 'bofu'),
            ('Conversion_Optimized_Campaign', 'bofu'),
            ('Appointment_Booking_Campaign', 'bofu'),
            ('Category_Specific_Campaign', 'bofu'),
        ]
        for campaign_name, expected_stage in test_cases:
            stage, _ = detect_stage(campaign_name)
            assert stage == expected_stage, \
                f"Campaign '{campaign_name}' should be {expected_stage}, got {stage}"

    def test_returns_unknown_for_unclassifiable_campaign(self):
        """Should return 'unknown' if no patterns match"""
        stage, _ = detect_stage('Random_Campaign_XYZ_ABC')
        assert stage == 'unknown', f"Expected 'unknown' for unclassifiable, got '{stage}'"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
