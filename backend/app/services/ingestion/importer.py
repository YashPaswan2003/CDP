"""Import normalized campaign metrics into DuckDB."""
import logging
import json
import hashlib
from typing import List, Dict
from datetime import datetime
from uuid import uuid4

logger = logging.getLogger("ingestion")


def import_metrics(
    conn,
    account_id: str,
    rows: List[Dict],
    upload_id: str,
    file_hash: str
) -> Dict:
    """
    Import campaign metrics into DuckDB atomically.

    Args:
        conn: DuckDB connection
        account_id: Client account ID
        rows: Normalized rows to import [{field: value, ...}, ...]
        upload_id: Upload ID for tracking
        file_hash: SHA256 hash of file for deduplication

    Returns:
        {
            "rows_imported": int,
            "rows_failed": int,
            "errors": [str, ...]
        }
    """
    rows_imported = 0
    rows_failed = 0
    errors = []

    # Create upload_versions record
    version_id = str(uuid4())
    version_number = _get_next_version_number(conn, upload_id)

    try:
        conn.execute("BEGIN TRANSACTION")

        # Insert version record
        conn.execute(f"""
            INSERT INTO upload_versions (id, upload_id, version_number, file_hash, status)
            VALUES (?, ?, ?, ?, ?)
        """, [version_id, upload_id, version_number, file_hash, "active"])

        # Mark previous versions as superseded
        conn.execute(f"""
            UPDATE campaign_metrics SET is_current_version = FALSE
            WHERE upload_id = ? AND is_current_version = TRUE
        """, [upload_id])

        # Insert metric rows
        for row_idx, row in enumerate(rows):
            try:
                metric_id = str(uuid4())

                # Build stage_values JSON
                stage_values = {}
                for key in ["leads", "appointment_booked", "first_consultation", "paid_consultation", "revenue"]:
                    if key in row and row[key]:
                        stage_values[key] = row[key]

                # Prepare values
                values = [
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

                conn.execute(f"""
                    INSERT INTO campaign_metrics (
                        id, account_id, upload_id, version_id,
                        date_from, date_to, period_type, platform,
                        campaign_name, campaign_id, adset_name, adset_id, ad_name,
                        funnel_stage, category, city, theme,
                        impressions, reach, clicks, ctr, cpc, cpm, cost,
                        stage_values, data_type, is_current_version
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, values)

                rows_imported += 1

            except Exception as e:
                rows_failed += 1
                errors.append(f"Row {row_idx}: {str(e)}")
                logger.error(f"Failed to import row {row_idx}: {e}")

        # Update upload record
        conn.execute(f"""
            UPDATE uploads SET
                status = ?,
                rows_imported = ?,
                conflicts_count = ?
            WHERE id = ?
        """, ["completed", rows_imported, 0, upload_id])

        conn.execute("COMMIT")
        logger.info(f"Imported {rows_imported} rows, {rows_failed} failed")

        return {
            "rows_imported": rows_imported,
            "rows_failed": rows_failed,
            "errors": errors,
        }

    except Exception as e:
        conn.execute("ROLLBACK")
        logger.error(f"Import transaction failed: {e}")
        raise


def _get_next_version_number(conn, upload_id: str) -> int:
    """Get next version number for an upload."""
    result = conn.execute(f"""
        SELECT MAX(version_number) FROM upload_versions WHERE upload_id = ?
    """, [upload_id]).fetchall()

    current = result[0][0] if result and result[0][0] else 0
    return current + 1


def compute_file_hash(file_path: str) -> str:
    """Compute SHA256 hash of a file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()
