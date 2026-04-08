"""
Value normalization for standardizing dates, amounts, booleans, and CTR format.

Handles currency conversion, date parsing, CTR ratio/percentage detection,
and numeric value standardization with comprehensive error handling.
"""

import logging
from datetime import datetime
from typing import Any, Optional, List

logger = logging.getLogger(__name__)


def normalize_value(
    value: Any,
    field_name: str,
    sample_data: Optional[List] = None
) -> Any:
    """
    Normalize a single value based on field name and type detection.

    Performs field-specific normalization:
    - Currency fields (cost, cpc, cpm): Strip currency symbols, handle commas
    - Count fields (impressions, clicks, conversions): Parse as int, remove commas
    - CTR: Detect ratio vs percentage format, normalize to 0.0-1.0 range
    - Date fields (date_from, date_to): Parse to YYYY-MM-DD format
    - String fields: Strip whitespace

    Args:
        value: Raw value to normalize (str, int, float, etc.)
        field_name: Name of the field (e.g., "cost", "ctr", "date_from").
                   Used to determine normalization logic.
        sample_data: Optional list of dicts for format detection (used for CTR).
                    Used to analyze first 5 rows to detect CTR format.

    Returns:
        Normalized value in appropriate type (float, int, str, or None).
        Returns None if normalization fails and is logged as warning.

    Raises:
        ValueError: If normalization fails for field with details about the error.

    Examples:
        >>> normalize_value("₹1,000.50", "cost")
        1000.5

        >>> normalize_value("2.34", "ctr", sample_data=[{"ctr": "2.34"}])
        0.0234

        >>> normalize_value("26/03/2026", "date_from")
        '2026-03-26'

        >>> normalize_value("1,000,000", "impressions")
        1000000
    """
    if value is None or value == "":
        return None

    value_str = str(value).strip()

    try:
        # Currency fields: float with symbol/comma handling
        if field_name in ["cost", "cpc", "cpm"]:
            return float(_strip_currency(value_str))

        # Count fields: int with comma handling
        elif field_name in ["impressions", "clicks", "conversions", "reach"]:
            return int(float(_strip_currency(value_str)))

        # CTR: Detect format and normalize to ratio (0.0-1.0)
        elif field_name == "ctr":
            return _normalize_ctr(value_str, sample_data)

        # Date fields: Parse to YYYY-MM-DD
        elif field_name in ["date_from", "date_to"]:
            return _parse_date(value_str)

        # String fields: Strip whitespace
        else:
            return value_str

    except (ValueError, TypeError) as e:
        raise ValueError(
            f"Failed to normalize field '{field_name}' with value '{value}': {e}"
        ) from e


def _strip_currency(value_str: str) -> str:
    """
    Strip currency symbols and thousands separators from numeric strings.

    Handles common currency symbols: ₹ $ € £ ¥
    Removes thousands separators: , (comma)

    Examples:
        >>> _strip_currency("₹38,419.50")
        '38419.50'

        >>> _strip_currency("$1,234.56")
        '1234.56'

        >>> _strip_currency("€5.000,00")
        '5.00000'
    """
    # Remove currency symbols from start
    value_str = value_str.lstrip('₹$€£¥')
    # Remove thousands separators
    value_str = value_str.replace(',', '')
    return value_str.strip()


def _parse_date(date_str: str) -> str:
    """
    Parse date from various formats and return as ISO YYYY-MM-DD.

    Tries common date formats in order:
    - YYYY-MM-DD (2026-03-26)
    - DD/MM/YYYY (26/03/2026)
    - MM/DD/YYYY (03/26/2026)
    - DD-MM-YYYY (26-03-2026)
    - YYYY/MM/DD (2026/03/26)
    - DD Mon YYYY (26 Mar 2026)
    - DD Month YYYY (26 March 2026)

    Args:
        date_str: Date string to parse.

    Returns:
        ISO format date string (YYYY-MM-DD).

    Raises:
        ValueError: If date cannot be parsed with any format.

    Examples:
        >>> _parse_date("26/03/2026")
        '2026-03-26'

        >>> _parse_date("2026-03-26")
        '2026-03-26'
    """
    formats = [
        "%Y-%m-%d",      # 2026-03-26
        "%d/%m/%Y",      # 26/03/2026
        "%m/%d/%Y",      # 03/26/2026
        "%d-%m-%Y",      # 26-03-2026
        "%Y/%m/%d",      # 2026/03/26
        "%d %b %Y",      # 26 Mar 2026
        "%d %B %Y",      # 26 March 2026
    ]

    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue

    raise ValueError(f"Could not parse date '{date_str}' with any standard format")


def detect_ctr_format(sample_rows: List[dict]) -> str:
    """
    Detect CTR format (ratio vs percentage) from sample data.

    Analyzes first 5 rows of sample data to determine if CTR is stored as:
    - "ratio": 0.0234 (0.0-1.0 range)
    - "percentage": 2.34 (0.0-100.0 range)

    Logic:
    - If all CTR values < 1 → ratio format
    - If all CTR values > 1 → percentage format
    - If mixed or ambiguous → logs warning, returns "ambiguous"

    Args:
        sample_rows: List of dicts with at least 5 rows containing 'ctr' field.

    Returns:
        String: "ratio", "percentage", or "ambiguous"

    Examples:
        >>> detect_ctr_format([{"ctr": 0.02}, {"ctr": 0.034}])
        'ratio'

        >>> detect_ctr_format([{"ctr": 2.34}, {"ctr": 3.45}])
        'percentage'
    """
    if not sample_rows:
        logger.warning("No sample rows provided for CTR format detection")
        return "ambiguous"

    # Collect first 5 CTR values
    ctr_values = []
    for row in sample_rows[:5]:
        if "ctr" in row:
            try:
                val = float(row["ctr"])
                ctr_values.append(val)
            except (ValueError, TypeError):
                pass

    if not ctr_values:
        logger.warning("No valid CTR values in sample data")
        return "ambiguous"

    # Determine format based on all values
    all_less_than_one = all(v < 1 for v in ctr_values)
    all_greater_than_one = all(v > 1 for v in ctr_values)

    if all_less_than_one:
        logger.debug("Detected CTR format: ratio (0.0-1.0)")
        return "ratio"
    elif all_greater_than_one:
        logger.debug("Detected CTR format: percentage (0.0-100.0)")
        return "percentage"
    else:
        logger.warning(
            f"CTR format is ambiguous. Values: {ctr_values}. "
            "Treating as-is without conversion."
        )
        return "ambiguous"


def _normalize_ctr(ctr_str: str, sample_data: Optional[List] = None) -> Optional[float]:
    """
    Normalize CTR to ratio format (0.0-1.0).

    If sample_data is provided, detects format from sample.
    Otherwise, uses heuristic: if value > 1, treat as percentage.

    Args:
        ctr_str: CTR value as string (e.g., "2.34" or "0.0234").
        sample_data: Optional list of dicts with 'ctr' field for format detection.

    Returns:
        CTR as float in ratio format (0.0-1.0), or None if invalid.

    Examples:
        >>> _normalize_ctr("0.0234")
        0.0234

        >>> _normalize_ctr("2.34")
        0.0234

        >>> _normalize_ctr("invalid")
        None
    """
    try:
        val = float(ctr_str)

        # Try to detect format from sample data if provided
        if sample_data:
            format_detected = detect_ctr_format(sample_data)
            if format_detected == "percentage":
                return val / 100.0
            elif format_detected == "ratio":
                return val
            # else: ambiguous, use heuristic

        # Heuristic: if value > 1, assume percentage
        if val > 1:
            return val / 100.0

        return val

    except (ValueError, TypeError):
        logger.warning(f"Invalid CTR value: {ctr_str}")
        return None


def normalize_row(row: dict, context: dict) -> dict:
    """
    Normalize all values in a row dict.

    Currently returns row as-is. Field-specific normalization
    happens at import time via normalize_value() per field.

    Args:
        row: Dict of raw values
        context: Optional context dict (reserved for future use)

    Returns:
        Normalized row dict
    """
    return row


__all__ = [
    "normalize_value",
    "detect_ctr_format",
    "normalize_row",
]
