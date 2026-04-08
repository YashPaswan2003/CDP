"""Detect conflicts when data is re-uploaded."""
import logging
from typing import List, Dict, Tuple
from decimal import Decimal

logger = logging.getLogger("ingestion")

CONFLICT_THRESHOLD = 5.0  # Only surface conflicts > 5% difference


def detect_conflicts(
    new_rows: List[Dict],
    existing_rows: List[Dict],
    match_keys: List[str]
) -> List[Dict]:
    """
    Compare new rows against existing and find conflicts.

    Args:
        new_rows: Newly uploaded rows
        existing_rows: Current database rows
        match_keys: Keys to match on (e.g., ["platform", "campaign_name", "date"])

    Returns:
        List of conflicts [{
            "metric_id": ...,
            "field": "cost",
            "old_value": 1000,
            "new_value": 950,
            "pct_change": -5.0
        }, ...]
    """
    conflicts = []

    # Build index of existing rows by match keys
    existing_idx = {}
    for row in existing_rows:
        key = tuple(row.get(k) for k in match_keys)
        existing_idx[key] = row

    # Compare new rows
    for new_row in new_rows:
        key = tuple(new_row.get(k) for k in match_keys)

        if key not in existing_idx:
            continue  # New data, no conflict

        old_row = existing_idx[key]

        # Compare numeric fields
        for field in ["cost", "impressions", "clicks", "conversions", "revenue"]:
            if field not in new_row or field not in old_row:
                continue

            old_val = _to_number(old_row.get(field))
            new_val = _to_number(new_row.get(field))

            if old_val is None or new_val is None:
                continue

            pct_change = _calculate_pct_change(old_val, new_val)

            # Only surface conflicts > threshold
            if abs(pct_change) > CONFLICT_THRESHOLD:
                conflicts.append({
                    "match_key": key,
                    "field": field,
                    "old_value": old_val,
                    "new_value": new_val,
                    "pct_change": pct_change,
                })
                logger.info(
                    f"Conflict detected: {field} changed {pct_change:+.1f}% "
                    f"({old_val} → {new_val})"
                )

    return conflicts


def _to_number(value) -> float:
    """Convert value to number or None."""
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def _calculate_pct_change(old: float, new: float) -> float:
    """Calculate percentage change from old to new."""
    if old == 0:
        return 100.0 if new > 0 else 0.0
    return ((new - old) / abs(old)) * 100.0


def auto_accept_conflicts(conflicts: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
    """
    Split conflicts into auto-accept (<=5%) and manual review (>5%).

    Returns:
        (auto_accept_list, manual_review_list)
    """
    auto_accept = []
    manual_review = []

    for conflict in conflicts:
        if abs(conflict["pct_change"]) <= CONFLICT_THRESHOLD:
            auto_accept.append(conflict)
            logger.info(f"Auto-accepting {conflict['field']}: {conflict['pct_change']:+.1f}%")
        else:
            manual_review.append(conflict)

    return auto_accept, manual_review
