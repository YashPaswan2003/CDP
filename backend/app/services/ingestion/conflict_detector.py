"""
Conflict detection for re-uploaded data.

Detects when new data differs from existing data by more than 5%.
Supports automatic acceptance of minor differences and manual review workflow.
"""

import logging
from typing import List, Dict, Tuple

logger = logging.getLogger(__name__)

# Threshold for surfacing conflicts (percentage change)
CONFLICT_THRESHOLD = 5.0


def detect_conflicts(
    new_metrics: List[Dict],
    existing_metrics: List[Dict]
) -> List[Dict]:
    """
    Detect conflicts between new and existing metrics.

    Compares newly uploaded metrics against existing database metrics,
    matching on account_id + platform + campaign_name + date_from + date_to.
    Surfaces numeric field differences > 5% (absolute) as conflicts.

    Args:
        new_metrics: List of newly uploaded metric dicts.
                    Must include: account_id, platform, campaign_name,
                                 date_from, date_to, and numeric fields
                    Example: [{
                        "account_id": "acc_123",
                        "platform": "google",
                        "campaign_name": "Brand Campaign",
                        "date_from": "2026-03-01",
                        "date_to": "2026-03-31",
                        "cost": 1000.0,
                        "impressions": 50000,
                        ...
                    }, ...]

        existing_metrics: List of existing metric dicts from database.
                         Must have same structure as new_metrics.

    Returns:
        List of conflict dicts with structure:
        [{
            "match_key": "acc_123|google|Brand Campaign|2026-03-01|2026-03-31",
            "field": "cost",
            "old_value": 950.0,
            "new_value": 1000.0,
            "pct_change": 5.26
        }, ...]

    Numeric fields checked for conflicts:
        - cost, cpc, cpm (currency)
        - impressions, clicks, conversions, reach (counts)
        - revenue (currency)

    Logic:
        1. Build index of existing metrics by match key (account_id|platform|campaign|dates)
        2. For each new metric:
           - Look up existing metric with same match key
           - If not found → skip (new data, no conflict)
           - If found → compare numeric fields:
             * Calculate pct_change = ((new - old) / old) * 100
             * If abs(pct_change) > 5.0 → add to conflicts list
             * If abs(pct_change) <= 5.0 → auto-accept, log info only

    Examples:
        >>> new = [{
        ...     "account_id": "a1", "platform": "google", "campaign_name": "Brand",
        ...     "date_from": "2026-03-01", "date_to": "2026-03-31",
        ...     "cost": 1050.0, "impressions": 50000
        ... }]
        >>> existing = [{
        ...     "account_id": "a1", "platform": "google", "campaign_name": "Brand",
        ...     "date_from": "2026-03-01", "date_to": "2026-03-31",
        ...     "cost": 1000.0, "impressions": 50000
        ... }]
        >>> detect_conflicts(new, existing)
        [{"match_key": "...", "field": "cost", "old_value": 1000.0,
          "new_value": 1050.0, "pct_change": 5.0}]
    """
    conflicts = []

    # Build index of existing metrics by match key
    existing_idx = {}
    for row in existing_metrics:
        key = _build_match_key(row)
        existing_idx[key] = row

    # Compare new rows against existing
    for new_row in new_metrics:
        key = _build_match_key(new_row)

        if key not in existing_idx:
            # New data, no conflict possible
            continue

        old_row = existing_idx[key]

        # Numeric fields to check for conflicts
        numeric_fields = [
            "cost", "cpc", "cpm",
            "impressions", "clicks", "conversions", "reach",
            "revenue"
        ]

        for field in numeric_fields:
            if field not in new_row or field not in old_row:
                continue

            old_val = _to_number(old_row.get(field))
            new_val = _to_number(new_row.get(field))

            if old_val is None or new_val is None:
                continue

            pct_change = _calculate_pct_change(old_val, new_val)

            # Only surface conflicts > threshold
            if abs(pct_change) > CONFLICT_THRESHOLD:
                conflict = {
                    "match_key": key,
                    "field": field,
                    "old_value": old_val,
                    "new_value": new_val,
                    "pct_change": pct_change,
                }
                conflicts.append(conflict)
                logger.info(
                    f"Conflict detected in {field}: {pct_change:+.2f}% "
                    f"({old_val} → {new_val}) for match key: {key}"
                )
            else:
                # Auto-accept small differences
                logger.debug(
                    f"Auto-accepting {field}: {pct_change:+.2f}% change "
                    f"(threshold: {CONFLICT_THRESHOLD}%)"
                )

    return conflicts


def auto_accept_conflicts(
    conflicts: List[Dict],
    threshold: float = CONFLICT_THRESHOLD
) -> Tuple[List[Dict], List[Dict]]:
    """
    Split conflicts into manual review and auto-accepted.

    Separates conflicts based on percentage change threshold.
    Automatically accepts conflicts within threshold, flags larger
    differences for manual review.

    Args:
        conflicts: List of conflict dicts from detect_conflicts().
                  Each must have "pct_change" field.
        threshold: Percentage change threshold for auto-acceptance.
                  Defaults to CONFLICT_THRESHOLD (5.0).

    Returns:
        Tuple of (conflicts_to_review, auto_accepted_conflicts):
        - conflicts_to_review: List of conflicts with abs(pct_change) > threshold
        - auto_accepted_conflicts: List of conflicts with abs(pct_change) <= threshold

    Examples:
        >>> conflicts = [
        ...     {"field": "cost", "pct_change": 3.0},   # < 5%
        ...     {"field": "impressions", "pct_change": 7.5}  # > 5%
        ... ]
        >>> to_review, accepted = auto_accept_conflicts(conflicts)
        >>> len(to_review)
        1
        >>> len(accepted)
        1
    """
    conflicts_to_review = []
    auto_accepted = []

    for conflict in conflicts:
        pct_change = conflict.get("pct_change", 0.0)

        if abs(pct_change) <= threshold:
            auto_accepted.append(conflict)
            logger.info(
                f"Auto-accepting {conflict.get('field')}: "
                f"{pct_change:+.2f}% (within {threshold}% threshold)"
            )
        else:
            conflicts_to_review.append(conflict)
            logger.warning(
                f"Flagging for review: {conflict.get('field')} "
                f"{pct_change:+.2f}% (exceeds {threshold}% threshold)"
            )

    return conflicts_to_review, auto_accepted


def _build_match_key(row: Dict) -> str:
    """
    Build composite match key from metric row.

    Concatenates: account_id|platform|campaign_name|date_from|date_to

    Used to uniquely identify a metric record across uploads.

    Args:
        row: Metric row dict.

    Returns:
        String match key.
    """
    account_id = row.get("account_id", "")
    platform = row.get("platform", "")
    campaign_name = row.get("campaign_name", "")
    date_from = row.get("date_from", "")
    date_to = row.get("date_to", "")

    return f"{account_id}|{platform}|{campaign_name}|{date_from}|{date_to}"


def _to_number(value) -> float:
    """
    Convert value to float, returning None if not numeric.

    Args:
        value: Value to convert (any type).

    Returns:
        Float value or None if conversion fails.
    """
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def _calculate_pct_change(old: float, new: float) -> float:
    """
    Calculate percentage change from old to new value.

    Formula: pct_change = ((new - old) / abs(old)) * 100

    Handles edge case: if old == 0:
    - Returns 100.0 if new > 0 (new value appeared)
    - Returns 0.0 if new == 0 (both zero)

    Args:
        old: Previous value.
        new: New value.

    Returns:
        Percentage change (positive = increase, negative = decrease).

    Examples:
        >>> _calculate_pct_change(1000, 1050)
        5.0

        >>> _calculate_pct_change(1000, 950)
        -5.0

        >>> _calculate_pct_change(0, 100)
        100.0
    """
    if old == 0:
        return 100.0 if new > 0 else 0.0
    return ((new - old) / abs(old)) * 100.0


__all__ = ["detect_conflicts", "auto_accept_conflicts"]
