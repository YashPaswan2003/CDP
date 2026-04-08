"""Upload routes for Excel/CSV ingestion pipeline."""
import json
import logging
from pathlib import Path
from datetime import datetime
from uuid import uuid4
from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.database.connection import get_connection
from app.services.ingestion import (
    parse_file,
    detect_sheet_type,
    classify_sheets,
    map_columns,
    detect_funnel_stage,
    normalize_row,
)
from app.services.ingestion.importer import compute_file_hash, import_metrics

logger = logging.getLogger("ingestion")
router = APIRouter(prefix="/api/upload", tags=["upload"])

# Ensure uploads directory exists
UPLOADS_DIR = Path(__file__).parent.parent.parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Request/Response models
class AnalyzeRequest(BaseModel):
    account_id: str

class AnalyzeResponse(BaseModel):
    upload_id: str
    status: str
    file_name: str
    sheets: dict

class ConfirmRequest(BaseModel):
    upload_id: str
    account_id: str
    sheet_mappings: dict  # {sheet_name: {"column_map": {...}, "selected_columns": [...]}}

class StatusResponse(BaseModel):
    upload_id: str
    status: str
    rows_imported: int
    log_lines: list

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_upload(
    file: UploadFile = File(...),
    account_id: str = None
):
    """
    Step 1: Analyze uploaded file.
    - Parse Excel/CSV
    - Detect sheets
    - Preview columns

    Returns upload_id for next step.
    """
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file provided")

        # Validate file type
        allowed_ext = [".xlsx", ".xlsb", ".csv"]
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in allowed_ext:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type. Allowed: {', '.join(allowed_ext)}"
            )

        # Create upload record
        upload_id = str(uuid4())
        conn = get_connection()

        # Save file
        file_path = UPLOADS_DIR / f"{upload_id}_{file.filename}"
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # Parse file
        sheets = parse_file(str(file_path))
        classified = classify_sheets(sheets)

        # Create upload record in DB
        conn.execute(f"""
            INSERT INTO uploads (id, account_id, file_name, file_path, file_type, status)
            VALUES (?, ?, ?, ?, ?, ?)
        """, [
            upload_id,
            account_id or "unknown",
            file.filename,
            str(file_path),
            file_ext.lstrip("."),
            "analyzing"
        ])
        conn.commit()
        conn.close()

        # Prepare sheet summaries with column previews
        sheet_summaries = {}
        for sheet_info in classified["included"]:
            sheet_name = sheet_info["name"]
            df = sheets[sheet_name]

            # Get column mapping preview
            col_mapping = map_columns(list(df.columns))

            sheet_summaries[sheet_name] = {
                "type": sheet_info["type"],
                "row_count": sheet_info["row_count"],
                "columns": list(df.columns),
                "column_mapping": {k: v["canonical"] for k, v in col_mapping.items()},
                "unmapped_columns": [col for col, meta in col_mapping.items() if meta["status"] == "unmapped"],
                "first_rows": df.head(3).values.tolist(),
            }

        logger.info(f"Upload {upload_id} analyzed: {len(classified['included'])} sheets, {len(classified['skipped'])} skipped")

        return AnalyzeResponse(
            upload_id=upload_id,
            status="analyzed",
            file_name=file.filename,
            sheets={
                "included": classified["included"],
                "skipped": classified["skipped"],
                "summaries": sheet_summaries,
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/confirm")
async def confirm_upload(
    request: ConfirmRequest,
    background_tasks: BackgroundTasks
):
    """
    Step 2: Confirm upload with column mappings.
    - Store mapping decisions
    - Enqueue background import task
    - Return immediately

    Frontend polls /status/{id} for progress.
    """
    try:
        conn = get_connection()

        # Update upload status
        conn.execute(f"""
            UPDATE uploads SET status = ? WHERE id = ?
        """, ["processing", request.upload_id])

        # Store mapping decisions as JSON
        conn.execute(f"""
            UPDATE upload_history SET column_mapping = ? WHERE id = ?
        """, [json.dumps(request.sheet_mappings), request.upload_id])

        conn.commit()
        conn.close()

        # Enqueue background import task
        background_tasks.add_task(
            process_upload_async,
            request.upload_id,
            request.account_id,
            request.sheet_mappings
        )

        logger.info(f"Upload {request.upload_id} confirmed, processing in background")

        return {
            "status": "processing",
            "upload_id": request.upload_id,
            "message": "Import queued. Poll /status/{id} for progress."
        }

    except Exception as e:
        logger.error(f"Confirm failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def process_upload_async(upload_id: str, account_id: str, sheet_mappings: dict):
    """Background task: import data and detect conflicts."""
    try:
        conn = get_connection()

        # Get upload record
        upload = conn.execute(f"""
            SELECT file_path, file_name FROM uploads WHERE id = ?
        """, [upload_id]).fetchall()

        if not upload:
            logger.error(f"Upload record not found: {upload_id}")
            return

        file_path = upload[0][0]

        # Parse file again
        sheets = parse_file(file_path)

        # Process each sheet
        rows_imported = 0
        file_hash = compute_file_hash(file_path)

        for sheet_name, df in sheets.items():
            if sheet_name not in sheet_mappings:
                continue  # Skip unmapped sheets

            mapping = sheet_mappings[sheet_name]

            # Apply column mappings
            canonical_df = df.copy()
            canonical_df.columns = [
                mapping.get(col, col) for col in df.columns
            ]

            # Convert to normalized rows
            rows = []
            for idx, row in canonical_df.iterrows():
                normalized = normalize_row(row.to_dict(), {})

                # Add funnel detection
                if "campaign_name" in normalized:
                    funnel_stage, _ = detect_funnel_stage(normalized["campaign_name"])
                    normalized["funnel_stage"] = funnel_stage

                rows.append(normalized)

            # Import rows
            import_result = import_metrics(conn, account_id, rows, upload_id, file_hash)
            rows_imported += import_result["rows_imported"]

        # Update final status
        conn.execute(f"""
            UPDATE uploads SET status = ?, rows_imported = ? WHERE id = ?
        """, ["completed", rows_imported, upload_id])
        conn.commit()
        conn.close()

        logger.info(f"Upload {upload_id} completed: {rows_imported} rows imported")

    except Exception as e:
        logger.error(f"Background import failed for {upload_id}: {e}")
        conn = get_connection()
        conn.execute(f"""
            UPDATE uploads SET status = ? WHERE id = ?
        """, ["failed", upload_id])
        conn.commit()
        conn.close()


@router.get("/status/{upload_id}", response_model=StatusResponse)
async def get_upload_status(upload_id: str):
    """Poll upload status."""
    try:
        conn = get_connection()

        upload = conn.execute(f"""
            SELECT status, rows_imported FROM uploads WHERE id = ?
        """, [upload_id]).fetchall()

        if not upload:
            raise HTTPException(status_code=404, detail=f"Upload not found: {upload_id}")

        status, rows_imported = upload[0]

        return StatusResponse(
            upload_id=upload_id,
            status=status,
            rows_imported=rows_imported or 0,
            log_lines=[
                {"type": "info", "message": f"Status: {status}"},
                {"type": "info", "message": f"Rows imported: {rows_imported or 0}"},
            ]
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Status check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/uploads/{client_id}/history")
async def get_upload_history(client_id: str):
    """Get upload history for a client."""
    try:
        conn = get_connection()

        history = conn.execute(f"""
            SELECT id, file_name, status, rows_imported, created_at
            FROM uploads
            WHERE account_id = ?
            ORDER BY created_at DESC
            LIMIT 20
        """, [client_id]).fetchall()

        conn.close()

        return {
            "client_id": client_id,
            "uploads": [
                {
                    "id": row[0],
                    "file_name": row[1],
                    "status": row[2],
                    "rows_imported": row[3],
                    "created_at": row[4],
                }
                for row in history
            ]
        }

    except Exception as e:
        logger.error(f"History fetch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
