"""Detect funnel stage (TOFU/MOFU/BOFU) from campaign name or explicit funnel column."""
import logging
from typing import Tuple

logger = logging.getLogger("ingestion")

TOFU_PATTERNS = [
    "brand", "awareness", "reach", "pmax", "performance max",
    "display", "youtube", "dsa"
]

MOFU_PATTERNS = [
    "retargeting", "remarketing", "engagement", "interest",
    "consideration", "non-brand", "non brand"
]

BOFU_PATTERNS = [
    "conversion", "purchase", "lead", "appointment", "category",
    "exact match", "competitor"
]


def detect_funnel_stage(
    campaign_name: str,
    funnel_col_value: str = None
) -> Tuple[str, float]:
    """
    Detect funnel stage from explicit column or campaign name patterns.

    Args:
        campaign_name: Campaign name (e.g., "SEM_SpineV3_TOFU")
        funnel_col_value: Value from explicit "Funnel" column if present

    Returns:
        (stage, confidence) where stage in ["tofu", "mofu", "bofu", "unknown"]
        and confidence in [0.0, 1.0]
    """
    # Check explicit funnel column first (highest confidence)
    if funnel_col_value:
        val_lower = str(funnel_col_value).lower().strip()
        if "tofu" in val_lower:
            return "tofu", 1.0
        if "mofu" in val_lower:
            return "mofu", 1.0
        if "bofu" in val_lower:
            return "bofu", 1.0

    # Check for explicit funnel stage keywords in campaign name (_TOFU, _MOFU, _BOFU)
    name_lower = campaign_name.lower()
    if "_tofu" in name_lower or name_lower.endswith("tofu"):
        return "tofu", 0.95
    if "_mofu" in name_lower or name_lower.endswith("mofu"):
        return "mofu", 0.95
    if "_bofu" in name_lower or name_lower.endswith("bofu"):
        return "bofu", 0.95

    # Pattern match on campaign name (lower confidence)
    for pattern in TOFU_PATTERNS:
        if pattern in name_lower:
            return "tofu", 0.8

    for pattern in MOFU_PATTERNS:
        if pattern in name_lower:
            return "mofu", 0.8

    for pattern in BOFU_PATTERNS:
        if pattern in name_lower:
            return "bofu", 0.8

    return "unknown", 0.0


def detect_all_rows(df, campaign_col: str, funnel_col: str = None) -> dict:
    """
    Detect funnel stage for all rows in DataFrame.

    Args:
        df: DataFrame with campaign data
        campaign_col: Name of campaign column (e.g., "campaign_name")
        funnel_col: Name of explicit funnel column, if present

    Returns:
        {row_index: (stage, confidence), ...}
    """
    results = {}

    for idx, row in df.iterrows():
        campaign_name = row.get(campaign_col, "")
        funnel_val = row.get(funnel_col) if funnel_col else None

        stage, conf = detect_funnel_stage(campaign_name, funnel_val)
        results[idx] = (stage, conf)

    return results
