"""Detect sheet type: RAW data, CRM, or PIVOT/SUMMARY (skip)."""
import logging
from typing import Literal, Tuple
import pandas as pd

logger = logging.getLogger("ingestion")

# Explicit skip patterns
EXPLICIT_SKIP_TABS = ["mom", "pivot", "summary", "overview", "wow"]

# Sheet type patterns
RAW_PATTERNS = ["raw", "data", "roi"]
CRM_PATTERNS = ["pmd", "crm", "calls", "leads"]
PLAN_PATTERNS = ["plan", "projection", "forecast"]

# CRM column indicators
CRM_COLUMNS = ["mobile", "patient", "did number", "phone", "call"]

SheetType = Literal["raw", "crm", "plan", "pivot", "unknown"]


def detect_sheet_type(sheet_name: str, df: pd.DataFrame) -> Tuple[SheetType, str]:
    """
    Classify a sheet as RAW, CRM, PLAN, PIVOT, or UNKNOWN.

    Returns:
        (type, reason) tuple
    """
    sheet_lower = sheet_name.lower().strip()

    # Check explicit skip list first
    if any(skip in sheet_lower for skip in EXPLICIT_SKIP_TABS):
        return "pivot", f"Matches skip pattern: {sheet_lower}"

    # Check row/column counts
    row_count = len(df)
    col_count = len(df.columns)

    # Pivot sheets are small
    if row_count < 30:
        return "pivot", f"Too small ({row_count} rows < 30)"

    # Check column names for CRM indicators
    col_names_lower = [str(col).lower() for col in df.columns]
    if any(crm_col in col_names for crm_col in CRM_COLUMNS for col_names in [col_names_lower]):
        return "crm", f"Contains CRM columns: {[c for c in df.columns if any(crm in str(c).lower() for crm in CRM_COLUMNS)]}"

    # Check sheet name patterns
    for pattern in CRM_PATTERNS:
        if pattern in sheet_lower:
            return "crm", f"Matches CRM pattern: {pattern}"

    for pattern in PLAN_PATTERNS:
        if pattern in sheet_lower:
            return "plan", f"Matches plan pattern: {pattern}"

    for pattern in RAW_PATTERNS:
        if pattern in sheet_lower:
            return "raw", f"Matches RAW pattern: {pattern}"

    # Default: if >50 rows and >10 cols, likely RAW data
    if row_count > 50 and col_count > 10:
        return "raw", f"Large sheet ({row_count} rows, {col_count} cols)"

    return "unknown", f"Unclear classification ({row_count} rows, {col_count} cols)"


def classify_sheets(sheets: dict) -> dict:
    """Classify all sheets in a workbook.

    Returns:
        {
            "included": [{"name": str, "type": str, "row_count": int, "reason": str}, ...],
            "skipped": [{"name": str, "type": str, "reason": str}, ...]
        }
    """
    included = []
    skipped = []

    for sheet_name, df in sheets.items():
        sheet_type, reason = detect_sheet_type(sheet_name, df)

        metadata = {
            "name": sheet_name,
            "type": sheet_type,
            "row_count": len(df),
            "reason": reason,
        }

        if sheet_type in ["pivot", "unknown"]:
            skipped.append(metadata)
        else:
            included.append(metadata)

        logger.info(f"Sheet '{sheet_name}': {sheet_type} ({reason})")

    return {
        "included": included,
        "skipped": skipped,
    }
