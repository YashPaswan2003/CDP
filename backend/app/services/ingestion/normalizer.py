"""Normalize raw values to canonical types and formats."""
import logging
from datetime import datetime
from typing import Any, Optional

logger = logging.getLogger("ingestion")


def normalize_value(value: Any, field_type: str) -> Any:
    """
    Normalize a value to the canonical type.

    Args:
        value: Raw value (str, int, float, etc)
        field_type: Target type (int, float, decimal, date, string)

    Returns:
        Normalized value or None if invalid
    """
    if value is None or value == "":
        return None

    value_str = str(value).strip()

    try:
        if field_type == "int":
            return int(float(value_str))  # Handle "1.0" -> 1
        elif field_type == "float":
            return float(value_str)
        elif field_type == "decimal":
            return float(value_str)  # DuckDB uses float for DECIMAL
        elif field_type == "date":
            return _parse_date(value_str)
        elif field_type == "string":
            return value_str
        else:
            return value_str
    except (ValueError, TypeError) as e:
        logger.warning(f"Failed to normalize '{value}' as {field_type}: {e}")
        return None


def _parse_date(date_str: str) -> Optional[str]:
    """Parse date from various formats. Returns ISO date string (YYYY-MM-DD)."""
    # Try common formats
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

    logger.warning(f"Could not parse date: {date_str}")
    return None


def normalize_ctr(ctr_value: Any) -> Optional[float]:
    """
    Normalize CTR (Click-Through Rate).
    Detect whether it's ratio (0.0234) or percentage (2.34) and normalize to ratio.
    """
    try:
        val = float(ctr_value)
        # If value > 1, assume percentage
        if val > 1:
            return val / 100.0
        return val
    except (ValueError, TypeError):
        logger.warning(f"Invalid CTR value: {ctr_value}")
        return None


def normalize_row(row: dict, schema: dict) -> dict:
    """
    Normalize all fields in a row according to schema.

    Args:
        row: Raw row dict {field: value, ...}
        schema: {field: type_str, ...}

    Returns:
        Normalized row dict
    """
    normalized = {}

    for field, raw_value in row.items():
        field_type = schema.get(field, "string")

        if field == "ctr":
            normalized[field] = normalize_ctr(raw_value)
        else:
            normalized[field] = normalize_value(raw_value, field_type)

    return normalized
