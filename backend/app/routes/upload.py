import csv
import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.upload import UploadResponse
from app.database.connection import get_connection
import logging

logger = logging.getLogger("api")
router = APIRouter(prefix="/upload", tags=["upload"])

ALLOWED_PLATFORMS = {"google_ads", "dv360", "meta"}

@router.post("/csv", response_model=UploadResponse)
async def upload_csv(
    file: UploadFile = File(...),
    client_id: str = None,
    platform: str = None
):
    """Upload CSV file with metrics data."""
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are allowed")

        content = await file.read()
        csv_data = content.decode('utf-8').splitlines()
        reader = csv.DictReader(csv_data)

        if not reader.fieldnames:
            raise HTTPException(status_code=400, detail="CSV file is empty")

        # Validate required columns
        required_cols = {"date", "campaign_id", "campaign_name", "platform", "impressions", "clicks", "spend", "conversions", "revenue"}
        if not required_cols.issubset(set(reader.fieldnames)):
            raise HTTPException(status_code=400, detail=f"Missing required columns. Need: {required_cols}")

        conn = get_connection()
        imported_count = 0
        campaign_ids = set()

        for row_num, row in enumerate(reader, start=2):
            try:
                # Insert metric
                conn.execute(
                    """
                    INSERT INTO metrics (id, campaign_id, date, impressions, clicks, spend, conversions, revenue, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    [
                        str(uuid.uuid4()),
                        row["campaign_id"],
                        row["date"],
                        int(row["impressions"]),
                        int(row["clicks"]),
                        float(row["spend"]),
                        int(row["conversions"]),
                        float(row["revenue"]),
                        datetime.now()
                    ]
                )
                imported_count += 1
                campaign_ids.add(row["campaign_id"])
            except Exception as e:
                logger.error(f"Error importing row {row_num}: {str(e)}")
                conn.rollback()
                raise HTTPException(status_code=400, detail=f"Error at row {row_num}: {str(e)}")

        conn.commit()
        conn.close()

        logger.info(f"CSV uploaded: {file.filename} - {imported_count} rows imported")

        return UploadResponse(
            filename=file.filename,
            rows_imported=imported_count,
            platform=row.get("platform", "unknown"),
            client_id=client_id or "unknown",
            campaign_ids=list(campaign_ids),
            status="success"
        )

    except Exception as e:
        logger.error(f"Upload failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
