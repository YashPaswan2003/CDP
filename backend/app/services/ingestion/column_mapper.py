"""Map raw column names to canonical schema fields."""
import logging
from typing import Dict, List, Tuple
from rapidfuzz import fuzz

logger = logging.getLogger("ingestion")

# Canonical field mappings
CANONICAL_MAP = {
    "cost": ["cost", "amount spent", "amount spent (inr)", "budget", "spend"],
    "clicks": ["clicks", "link clicks", "interactions"],
    "impressions": ["impressions", "available impr"],
    "ctr": ["ctr", "interaction rate", "click through rate"],
    "cpc": ["cpc", "avg cpc", "avg. cpc", "cost per link click", "avg. cost"],
    "leads": ["lead", "leads", "lead ", "results", "meta leads"],
    "appointment_booked": ["ab", "ab ", "appointment booked"],
    "first_consultation": ["fc", "fc ", "first consultation"],
    "paid_consultation": ["pc", "pc ", "paid consultation"],
    "revenue": ["revenue", "revenue "],
    "campaign_name": ["campaign_name", "final campain name", "campaign"],
    "adset_name": ["adset_name", "final adset_name", "ad set name", "adgroup"],
    "platform": ["platform", "platform-2"],
    "city": ["city", "location", "geo"],
    "category": ["category", "condition 1", "condition 2", "theme"],
    "funnel_stage": ["funnel", "funnel stage"],
    "week": ["week", "week  "],
    "month": ["month", "mon"],
}

FUZZY_THRESHOLD = 82  # 82% match required for auto-mapping


def map_columns(raw_columns: List[str]) -> Dict[str, dict]:
    """
    Map raw column names to canonical fields.

    Returns:
        {
            "raw_col": {
                "canonical": "field_name" | None,
                "confidence": 0.0-1.0,
                "status": "exact" | "fuzzy" | "unmapped"
            },
            ...
        }
    """
    mapping = {}

    for raw_col in raw_columns:
        raw_lower = raw_col.lower().strip()

        # Try exact match first (very quick)
        canonical, exact_match = _exact_match(raw_lower)

        if exact_match:
            mapping[raw_col] = {
                "canonical": canonical,
                "confidence": 1.0,
                "status": "exact",
            }
            continue

        # Try fuzzy match
        canonical, confidence = _fuzzy_match(raw_lower)

        if confidence >= FUZZY_THRESHOLD:
            mapping[raw_col] = {
                "canonical": canonical,
                "confidence": confidence / 100.0,
                "status": "fuzzy",
            }
        elif confidence >= 70:
            # Flag for user review (70-82%)
            mapping[raw_col] = {
                "canonical": canonical,
                "confidence": confidence / 100.0,
                "status": "needs_review",
            }
        else:
            # Unmapped
            mapping[raw_col] = {
                "canonical": None,
                "confidence": 0.0,
                "status": "unmapped",
            }

    return mapping


def _exact_match(raw_lower: str) -> Tuple[str, bool]:
    """Check for exact match in canonical map."""
    for canonical, variations in CANONICAL_MAP.items():
        for variation in variations:
            if raw_lower == variation.lower():
                return canonical, True
    return None, False


def _fuzzy_match(raw_lower: str) -> Tuple[str, float]:
    """Find best fuzzy match using token_set_ratio."""
    best_match = None
    best_score = 0

    for canonical, variations in CANONICAL_MAP.items():
        for variation in variations:
            # Use token_set_ratio for partial matches (order-independent)
            score = fuzz.token_set_ratio(raw_lower, variation.lower())
            if score > best_score:
                best_score = score
                best_match = canonical

    return best_match, best_score


def get_unmapped_columns(mapping: Dict[str, dict]) -> List[str]:
    """Get list of columns that weren't mapped."""
    return [col for col, meta in mapping.items() if meta["status"] == "unmapped"]


def get_review_columns(mapping: Dict[str, dict]) -> List[Tuple[str, str, float]]:
    """Get columns that need user review."""
    return [
        (col, meta["canonical"], meta["confidence"])
        for col, meta in mapping.items()
        if meta["status"] == "needs_review"
    ]
