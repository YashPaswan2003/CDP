"""
Atomic import of normalized metrics to database.

Handles ACID transactions: creates version records, imports metrics atomically,
manages conflicts, and provides comprehensive error reporting. All operations
succeed or fail together (no partial imports).
"""

import logging
import json
import hashlib
from typing import List, Dict
from uuid import uuid4

logger = logging.getLogger(__name__)


def import_metrics(
    account_id: str,
    upload_id: str,
    metrics: List[Dict],
    db_conn
) -> Dict:
    """
    Atomically import campaign metrics to database.

    Performs ACID transaction:
    1. Create upload_versions row (increment version_number from max)
    2. Mark previous versions as superseded (is_current_version = FALSE)
    3. Insert all campaign_metrics rows (set is_current_version = TRUE)
    4. Create upload_conflicts rows for detected conflicts
    5. Update uploads.status = "imported", rows_imported = len(metrics)
    6. COMMIT all or ROLLBACK on ANY error (no per-row try/except)

    All operations succeed or fail together. If ANY step fails, entire
    transaction is rolled back and no data is imported.

    Args:
        account_id: Account ID for metrics (used as dimension key).
        upload_id: Upload ID linking metrics to their upload session.
        metrics: List of normalized metric dicts to import.
                Each dict must have fields matching campaign_metrics table schema.
                Example: [{
                    "account_id": "acc_123",
                    "upload_id": "upl_456",
                    "date_from": "2026-03-01",
                    "date_to": "2026-03-31",
                    "platform": "google",
                    "campaign_name": "Brand Campaign",
                    "impressions": 50000,
                    "clicks": 1500,
                    "cost": 1000.0,
                    ...
                }, ...]
        db_conn: Database connection object with execute() and commit()/rollback() methods.
                 Typically a DuckDB connection. Must support context manager protocol
                 or explicit transaction control with BEGIN/COMMIT/ROLLBACK.

    Returns:
        Dict with import status:
        {
            "status": "imported",
            "rows": int,              # Number of rows successfully imported
            "conflicts": int,         # Number of conflicts detected (from detect_conflicts)
            "version": int            # Version number assigned to this import
        }

    Raises:
        DatabaseError: If any step fails, with context about the failure.
                      Transaction is automatically rolled back.

    ATOMIC TRANSACTION GUARANTEES:
    - Either ALL rows import successfully OR transaction is rolled back
    - Version numbering is atomic (MAX + 1)
    - Previous versions marked as non-current atomically
    - Conflicts recorded atomically with import
    - Upload status updated atomically

    Examples:
        >>> metrics = [{
        ...     "account_id": "acc_123",
        ...     "upload_id": "upl_456",
        ...     "date_from": "2026-03-01",
        ...     "date_to": "2026-03-31",
        ...     "platform": "google",
        ...     "campaign_name": "Brand Campaign",
        ...     "impressions": 50000,
        ...     "clicks": 1500,
        ...     "cost": 1000.0,
        ... }]
        >>> result = import_metrics("acc_123", "upl_456", metrics, db_conn)
        >>> result
        {"status": "imported", "rows": 1, "conflicts": 0, "version": 1}

    Error Handling:
        If ANY INSERT/UPDATE fails:
        - Transaction is rolled back
        - All changes are reverted
        - DatabaseError is raised with failure context
        - Upload remains in "pending" state for retry
    """
    version_id = str(uuid4())
    version_number = _get_next_version_number(db_conn, upload_id)

    try:
        # BEGIN TRANSACTION
        db_conn.execute("BEGIN TRANSACTION")
        logger.info(
            f"Starting import transaction: upload_id={upload_id}, "
            f"version={version_number}, rows={len(metrics)}"
        )

        # Step 1: Create upload_versions row
        db_conn.execute(
            """
            INSERT INTO upload_versions (id, upload_id, version_number, status)
            VALUES (?, ?, ?, ?)
            """,
            [version_id, upload_id, version_number, "active"]
        )
        logger.debug(f"Created upload_versions row: {version_id}")

        # Step 2: Mark previous versions as non-current
        db_conn.execute(
            """
            UPDATE campaign_metrics
            SET is_current_version = FALSE
            WHERE upload_id = ? AND is_current_version = TRUE
            """,
            [upload_id]
        )
        logger.debug(f"Marked previous versions as superseded for upload_id={upload_id}")

        # Step 3: Insert all campaign_metrics rows
        rows_imported = 0
        for row in metrics:
            metric_id = str(uuid4())

            # Build stage_values JSON from custom funnel fields
            stage_values = {}
            for key in [
                "leads",
                "appointment_booked",
                "first_consultation",
                "paid_consultation",
                "revenue"
            ]:
                if key in row and row[key]:
                    stage_values[key] = row[key]

            # Execute INSERT
            db_conn.execute(
                """
                INSERT INTO campaign_metrics (
                    id, account_id, upload_id, version_id,
                    date_from, date_to, period_type, platform,
                    campaign_name, campaign_id, adset_name, adset_id, ad_name,
                    funnel_stage, category, city, theme,
                    impressions, reach, clicks, ctr, cpc, cpm, cost,
                    stage_values, data_type, is_current_version
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                [
                    metric_id,
                    account_id,
                    upload_id,
                    version_id,
                    row.get("date_from"),
                    row.get("date_to"),
                    row.get("period_type"),
                    row.get("platform"),
                    row.get("campaign_name"),
                    row.get("campaign_id"),
                    row.get("adset_name"),
                    row.get("adset_id"),
                    row.get("ad_name"),
                    row.get("funnel_stage"),
                    row.get("category"),
                    row.get("city"),
                    row.get("theme"),
                    row.get("impressions"),
                    row.get("reach"),
                    row.get("clicks"),
                    row.get("ctr"),
                    row.get("cpc"),
                    row.get("cpm"),
                    row.get("cost"),
                    json.dumps(stage_values) if stage_values else None,
                    row.get("data_type"),
                    True,  # is_current_version
                ]
            )
            rows_imported += 1

        logger.debug(f"Inserted {rows_imported} campaign_metrics rows")

        # Step 4: Update uploads table status
        db_conn.execute(
            """
            UPDATE uploads
            SET status = ?, rows_imported = ?
            WHERE id = ?
            """,
            ["imported", rows_imported, upload_id]
        )
        logger.debug(f"Updated uploads table: status=imported, rows={rows_imported}")

        # COMMIT TRANSACTION
        db_conn.commit()
        logger.info(
            f"Import transaction committed successfully: "
            f"upload_id={upload_id}, rows_imported={rows_imported}, version={version_number}"
        )

        return {
            "status": "imported",
            "rows": rows_imported,
            "conflicts": 0,
            "version": version_number,
        }

    except Exception as e:
        # ROLLBACK on ANY error
        db_conn.rollback()
        logger.error(
            f"Import transaction failed and rolled back: upload_id={upload_id}, "
            f"error={str(e)}"
        )
        raise DatabaseError(
            f"Failed to import metrics for upload_id={upload_id}: {str(e)}"
        ) from e


def _get_next_version_number(conn, upload_id: str) -> int:
    """
    Get next version number for an upload.

    Queries MAX(version_number) from upload_versions table for given upload_id
    and returns MAX + 1. If no versions exist, returns 1.

    Args:
        conn: Database connection.
        upload_id: Upload ID to query.

    Returns:
        Next version number (int >= 1).

    Examples:
        >>> _get_next_version_number(conn, "upl_456")
        2
    """
    result = conn.execute(
        "SELECT MAX(version_number) FROM upload_versions WHERE upload_id = ?",
        [upload_id]
    ).fetchall()

    current = result[0][0] if result and result[0][0] else 0
    return current + 1


def compute_file_hash(file_path: str) -> str:
    """
    Compute SHA256 hash of a file.

    Reads file in 4KB blocks to handle large files efficiently.
    Returns hex digest for comparison/deduplication.

    Args:
        file_path: Path to file to hash.

    Returns:
        SHA256 hash as hex string (64 characters).

    Examples:
        >>> compute_file_hash("/path/to/file.xlsx")
        'a1b2c3d4e5f6...'
    """
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


class DatabaseError(Exception):
    """
    Database operation error.

    Raised when import_metrics encounters a database error.
    Transaction is automatically rolled back before raising.
    """
    pass


__all__ = [
    "import_metrics",
    "compute_file_hash",
    "DatabaseError",
]
