"""Detect sheet type: RAW, CRM, PLAN, or SKIP.

Classifies sheets based on sheet name patterns, column indicators, and data size.
Returns detailed metadata for each sheet including classification reason.
"""
import logging
from typing import Dict, List
import pandas as pd
from . import (
    EXPLICIT_SKIP_TABS,
    RAW_PATTERNS,
    CRM_PATTERNS,
    PLAN_PATTERNS,
)

logger = logging.getLogger("ingestion")

# CRM column indicators
CRM_COLUMNS = ["mobile", "patient", "did number", "phone", "call"]


def classify_sheets(sheets: Dict[str, pd.DataFrame]) -> List[Dict]:
    """
    Classify all sheets in a workbook as RAW, CRM, PLAN, or SKIP.

    Args:
        sheets: Dict mapping sheet names to DataFrames

    Returns:
        List of dicts with format:
        [
            {
                "sheet_name": str,
                "type": "raw" | "crm" | "plan" | "skip",
                "rows": int,
                "reason": str
            },
            ...
        ]
    """
    result = []

    for sheet_name, df in sheets.items():
        sheet_type, reason = _classify_sheet(sheet_name, df)

        metadata = {
            "sheet_name": sheet_name,
            "type": sheet_type,
            "rows": len(df),
            "reason": reason,
        }

        result.append(metadata)
        logger.info(f"Sheet '{sheet_name}': {sheet_type} - {reason}")

    return result


def _classify_sheet(sheet_name: str, df: pd.DataFrame) -> tuple:
    """
    Classify a single sheet and return (type, reason).

    Classification logic:
    1. If sheet_name in EXPLICIT_SKIP_TABS → skip
    2. If contains "Month 1", "Month 2" columns → plan
    3. If sheet_name contains CRM_PATTERNS OR columns include CRM keywords → crm
    4. If sheet_name contains RAW_PATTERNS OR (rows > 50 AND cols > 10) → raw
    5. If rows < 30 OR contains "(All)" → skip
    6. Else → skip

    Args:
        sheet_name: Name of the sheet
        df: DataFrame for the sheet

    Returns:
        (type, reason) tuple
    """
    sheet_lower = sheet_name.lower().strip()
    row_count = len(df)
    col_count = len(df.columns)
    col_names_lower = [str(col).lower() for col in df.columns]

    # 1. Check explicit skip list
    if any(skip in sheet_lower for skip in EXPLICIT_SKIP_TABS):
        return "skip", "explicit skip list"

    # 2. Check for media plan projection columns (Month 1, Month 2, etc.)
    if any("month" in col and any(c.isdigit() for c in col) for col in col_names_lower):
        return "plan", "media plan projection"

    # 3. Check for CRM indicators
    # Check sheet name patterns first
    for pattern in CRM_PATTERNS:
        if pattern in sheet_lower:
            return "crm", "CRM/call tracking detected"

    # Check column names for CRM keywords
    crm_cols = [c for c in col_names_lower if any(kw in c for kw in CRM_COLUMNS)]
    if crm_cols:
        return "crm", "CRM/call tracking detected"

    # 4. Check for RAW data patterns
    for pattern in RAW_PATTERNS:
        if pattern in sheet_lower:
            return "raw", "data table detected"

    # Check data size and consistency for raw data
    if row_count > 50 and col_count > 10:
        # Check header consistency: at least 80% of columns have non-None values in first row
        if _has_consistent_header(df):
            return "raw", "data table detected"

    # 5. Skip small sheets or pivot tables
    if row_count < 30:
        return "skip", "summary/pivot table"

    # Check for "(All)" which indicates aggregated/pivot data
    if any("(all)" in str(col).lower() for col in df.columns):
        return "skip", "summary/pivot table"

    # 6. Default to skip for ambiguous sheets
    return "skip", "ambiguous format"


def _has_consistent_header(df: pd.DataFrame) -> bool:
    """
    Check if DataFrame has a consistent header row.

    A consistent header is one where at least 80% of columns have non-empty values.

    Args:
        df: DataFrame to check

    Returns:
        True if header is consistent, False otherwise
    """
    if df.empty or len(df) == 0:
        return False

    first_row = df.iloc[0]
    non_empty_count = sum(1 for val in first_row if pd.notna(val) and str(val).strip())
    consistency_ratio = non_empty_count / len(first_row)

    return consistency_ratio >= 0.8
