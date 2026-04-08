"""Map raw column names to canonical schema fields using fuzzy matching.

Implements fuzzy column matching with token-level validation to map raw Excel/CSV
columns to standardized canonical field names. Supports exact matches, high-confidence
fuzzy matches, and flagging ambiguous matches for manual review.
"""
import logging
from typing import Dict, List
from rapidfuzz import fuzz
from . import CANONICAL_MAP

logger = logging.getLogger("ingestion")

# Matching thresholds
MIN_FUZZY_CONFIDENCE = 82  # 82% match required for auto-mapping
MIN_REVIEW_CONFIDENCE = 82  # 82% match required for needs_review flag
MIN_TOKEN_LENGTH = 3  # Minimum token length for fuzzy matching


def map_columns(columns) -> Dict[str, Dict]:
    """
    Fuzzy match column names to canonical schema fields.

    For each column name:
    1. Check for exact match (normalized case) → confidence 1.0
    2. If no exact match, use token_set_ratio fuzzy matching
    3. If ratio >= 90% → canonical match, confidence as ratio/100
    4. If 82% <= ratio < 90% → needs_review=True, confidence as ratio/100
    5. If ratio < 82% OR not in CANONICAL_MAP → unmapped

    Args:
        columns: List of column names or pandas DataFrame columns object

    Returns:
        Dict with format:
        {
            "raw_col_name": {
                "canonical": str | None,
                "confidence": 0.0-1.0,
                "needs_review": bool
            },
            ...
        }

    Note:
        Unmapped columns are stored in the response but not discarded,
        allowing user manual mapping in Step 2 UI.
    """
    mapping = {}

    for raw_col in columns:
        raw_lower = str(raw_col).lower().strip()

        # Try exact match first (case-insensitive)
        canonical = _exact_match(raw_lower)

        if canonical:
            mapping[raw_col] = {
                "canonical": canonical,
                "confidence": 1.0,
                "needs_review": False,
            }
            continue

        # Try fuzzy match with minimum token length check
        canonical, confidence_ratio = _fuzzy_match(raw_lower)

        if canonical is None:
            # No match found in CANONICAL_MAP
            mapping[raw_col] = {
                "canonical": None,
                "confidence": 0.0,
                "needs_review": True,
            }
        elif confidence_ratio >= 90:
            # High confidence fuzzy match (>= 90%)
            mapping[raw_col] = {
                "canonical": canonical,
                "confidence": confidence_ratio / 100.0,
                "needs_review": False,
            }
        elif confidence_ratio >= MIN_REVIEW_CONFIDENCE:
            # Moderate confidence (82-89%) - needs user review
            mapping[raw_col] = {
                "canonical": canonical,
                "confidence": confidence_ratio / 100.0,
                "needs_review": True,
            }
        else:
            # Low confidence - unmapped
            mapping[raw_col] = {
                "canonical": None,
                "confidence": confidence_ratio / 100.0,
                "needs_review": True,
            }

    return mapping


def _exact_match(raw_lower: str) -> str:
    """
    Check for exact match in canonical map (case-insensitive).

    Args:
        raw_lower: Normalized (lowercase, stripped) raw column name

    Returns:
        Canonical field name if exact match found, None otherwise
    """
    for canonical, variations in CANONICAL_MAP.items():
        for variation in variations:
            if raw_lower == variation.lower():
                return canonical
    return None


def _fuzzy_match(raw_lower: str) -> tuple:
    """
    Find best fuzzy match using token_set_ratio with minimum token length.

    Token-level matching helps match columns like "cost per link click" to "cpc"
    even though exact word order differs. Requires tokens to be >= 3 characters.

    Args:
        raw_lower: Normalized (lowercase, stripped) raw column name

    Returns:
        (canonical, confidence_ratio) tuple where:
        - canonical: best matching canonical field name (or None if no matches)
        - confidence_ratio: match ratio as integer 0-100
    """
    best_match = None
    best_score = 0

    for canonical, variations in CANONICAL_MAP.items():
        for variation in variations:
            variation_lower = variation.lower()

            # Minimum token length check: skip if either string has tokens < 3 chars
            if not _has_valid_tokens(raw_lower) or not _has_valid_tokens(variation_lower):
                continue

            # Use token_set_ratio for partial matches (order-independent)
            score = fuzz.token_set_ratio(raw_lower, variation_lower)

            if score > best_score:
                best_score = score
                best_match = canonical

    return best_match, best_score


def _has_valid_tokens(text: str) -> bool:
    """
    Check if text has at least one token of >= MIN_TOKEN_LENGTH characters.

    Args:
        text: Text to check

    Returns:
        True if text has valid tokens, False otherwise
    """
    tokens = text.split()
    return any(len(token) >= MIN_TOKEN_LENGTH for token in tokens)
