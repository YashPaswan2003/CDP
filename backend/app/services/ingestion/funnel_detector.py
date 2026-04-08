"""
Funnel stage detection for marketing campaigns.

Classifies campaigns by funnel stage (TOFU/MOFU/BOFU) based on campaign names
and explicit funnel column values. Uses pattern matching with configurable
confidence scoring.
"""

import logging
from typing import Tuple, Optional

from . import TOFU_PATTERNS, MOFU_PATTERNS, BOFU_PATTERNS

logger = logging.getLogger(__name__)


def detect_stage(
    campaign_name: str,
    funnel_col_value: Optional[str] = None
) -> Tuple[str, float]:
    """
    Detect funnel stage for a campaign.

    Classifies campaigns into funnel stages (TOFU/MOFU/BOFU) based on:
    1. Explicit funnel column value (if provided) → confidence 1.0
    2. Campaign name pattern matching → confidence 0.8
    3. No match → unknown with confidence 0.0

    Args:
        campaign_name: Name of the campaign to classify.
                      Examples: "Brand Awareness Campaign", "SEM_BOFU_Retargeting"
        funnel_col_value: Optional explicit funnel stage value from data.
                         Examples: "TOFU", "mofu", "Top-of-Funnel"

    Returns:
        Tuple of (stage, confidence) where:
        - stage: One of "tofu", "mofu", "bofu", or "unknown"
        - confidence: Float 0.0-1.0 indicating classification confidence
                     1.0 = explicit column value matched
                     0.8 = pattern matched campaign name
                     0.0 = no match (user classification required)

    Examples:
        >>> detect_stage("Brand Awareness Campaign")
        ('tofu', 0.8)

        >>> detect_stage("Retargeting Users", "MOFU")
        ('mofu', 1.0)

        >>> detect_stage("Other Campaign")
        ('unknown', 0.0)

    Logic:
        1. If funnel_col_value provided:
           - Check if contains "tofu"/"mofu"/"bofu" (case-insensitive)
           - If match found → return (stage, 1.0)
        2. Pattern match campaign_name against TOFU_PATTERNS, MOFU_PATTERNS, BOFU_PATTERNS:
           - Checks each pattern as substring match (case-insensitive)
           - If match found → return (stage, 0.8)
        3. If no match → return ("unknown", 0.0) with warning log
    """
    if funnel_col_value:
        funnel_lower = str(funnel_col_value).lower().strip()

        # Check for explicit stage keywords in funnel column
        if "tofu" in funnel_lower:
            return ("tofu", 1.0)
        elif "mofu" in funnel_lower:
            return ("mofu", 1.0)
        elif "bofu" in funnel_lower:
            return ("bofu", 1.0)

    # Pattern match against campaign name
    campaign_lower = campaign_name.lower()

    # Check for explicit _TOFU, _MOFU, _BOFU suffixes first
    if "_tofu" in campaign_lower:
        logger.debug(f"Campaign '{campaign_name}' matched explicit _TOFU suffix")
        return ("tofu", 0.8)
    if "_mofu" in campaign_lower:
        logger.debug(f"Campaign '{campaign_name}' matched explicit _MOFU suffix")
        return ("mofu", 0.8)
    if "_bofu" in campaign_lower:
        logger.debug(f"Campaign '{campaign_name}' matched explicit _BOFU suffix")
        return ("bofu", 0.8)

    # Check BOFU patterns first (most specific: conversion, purchase, lead)
    if _matches_patterns(campaign_lower, BOFU_PATTERNS):
        logger.debug(f"Campaign '{campaign_name}' matched BOFU patterns")
        return ("bofu", 0.8)

    # Check MOFU patterns (retargeting, engagement, consideration)
    if _matches_patterns(campaign_lower, MOFU_PATTERNS):
        logger.debug(f"Campaign '{campaign_name}' matched MOFU patterns")
        return ("mofu", 0.8)

    # Check TOFU patterns (brand, awareness, reach, display)
    if _matches_patterns(campaign_lower, TOFU_PATTERNS):
        logger.debug(f"Campaign '{campaign_name}' matched TOFU patterns")
        return ("tofu", 0.8)

    # No match found
    logger.warning(
        f"Campaign '{campaign_name}' did not match any funnel patterns. "
        "User classification required."
    )
    return ("unknown", 0.0)


def _matches_patterns(text: str, patterns: list[str]) -> bool:
    """
    Check if text contains any of the given patterns as substrings.

    Args:
        text: Text to search (should be lowercase for consistency).
        patterns: List of pattern strings to match against.

    Returns:
        True if any pattern is found as a substring in text.

    Examples:
        >>> _matches_patterns("brand awareness campaign", ["brand", "reach"])
        True

        >>> _matches_patterns("retargeting users", ["brand", "display"])
        False
    """
    for pattern in patterns:
        if pattern.lower() in text:
            return True
    return False


__all__ = ["detect_stage"]
