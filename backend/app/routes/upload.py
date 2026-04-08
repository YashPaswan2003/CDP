"""Upload routes for Excel/CSV ingestion pipeline."""
import json
import logging
import os
import subprocess
import shutil
from pathlib import Path
from datetime import datetime
from uuid import uuid4
from typing import Optional, Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.database.connection import get_connection
from app.services.ingestion import (
    parse_file,
    classify_sheets,
    map_columns,
    detect_stage,
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

class AIReviewRequest(BaseModel):
    upload_id: str
    account_id: str

class AIReviewResponse(BaseModel):
    summary: str
    funnel_mapping: Dict[str, str]  # {sheet_name: "tofu"|"mofu"|"bofu"}
    column_suggestions: Dict[str, str]  # {raw_col: canonical_field}
    clarifying_question: Optional[str] = None

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

        # Save file (SECURITY FIX: use Path.name to prevent directory traversal)
        safe_filename = Path(file.filename).name
        file_path = UPLOADS_DIR / f"{upload_id}_{safe_filename}"
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        # Parse file
        sheets = parse_file(str(file_path))
        classified_list = classify_sheets(sheets)

        # Separate sheets into included and skipped
        included_sheets = [s for s in classified_list if s["type"] != "skip"]
        skipped_sheets = [s for s in classified_list if s["type"] == "skip"]

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
        for sheet_info in included_sheets:
            sheet_name = sheet_info["sheet_name"]
            df = sheets[sheet_name]

            # Get column mapping preview
            col_mapping = map_columns(list(df.columns))

            sheet_summaries[sheet_name] = {
                "type": sheet_info["type"],
                "row_count": sheet_info["rows"],
                "columns": list(df.columns),
                "column_mapping": {k: v["canonical"] for k, v in col_mapping.items()},
                "unmapped_columns": [col for col, meta in col_mapping.items() if meta["status"] == "unmapped"],
                "first_rows": df.head(3).values.tolist(),
            }

        logger.info(f"Upload {upload_id} analyzed: {len(included_sheets)} sheets, {len(skipped_sheets)} skipped")

        return AnalyzeResponse(
            upload_id=upload_id,
            status="analyzed",
            file_name=file.filename,
            sheets={
                "included": included_sheets,
                "skipped": skipped_sheets,
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
                    funnel_stage, _ = detect_stage(normalized["campaign_name"])
                    normalized["funnel_stage"] = funnel_stage

                rows.append(normalized)

            # Import rows
            import_result = import_metrics(account_id, upload_id, rows, conn)
            rows_imported += import_result["rows"]

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


def call_claude_for_file_analysis(
    file_summary: str,
    account_name: str,
    sheets_info: list,
    file_name: str
) -> Dict[str, Any]:
    """
    Call Claude Haiku to analyze file structure and suggest mappings.

    Args:
        file_summary: Human-readable summary of file contents
        account_name: Name of the account uploading the file
        sheets_info: List of sheet info dicts with names, row counts, columns, first rows
        file_name: Name of the uploaded file

    Returns:
        Dict with keys: summary, funnel_mapping, column_suggestions, clarifying_question (optional)
    """
    if not shutil.which("claude"):
        # Mock response when claude CLI not available
        logger.info("Using mock Claude response (claude CLI not available)")
        return {
            "summary": f"File '{file_name}' contains marketing data with {len(sheets_info)} sheets.",
            "funnel_mapping": {
                sheets_info[0]["name"]: "tofu" if len(sheets_info) > 0 else "bofu"
            } if sheets_info else {},
            "column_suggestions": {
                col: col.lower().replace(" ", "_")
                for sheet in sheets_info
                for col in sheet.get("columns", [])[:5]
            },
            "clarifying_question": None
        }

    # Construct detailed per-sheet data for Claude
    sheet_details = []
    for sheet_info in sheets_info:
        sheet_name = sheet_info["name"]
        columns = sheet_info.get("columns", [])
        first_rows = sheet_info.get("first_rows", [])
        row_count = sheet_info.get("row_count", 0)

        sheet_text = f"\nSheet: {sheet_name} ({row_count} rows)\n"
        sheet_text += f"Columns: {', '.join(columns)}\n"

        if first_rows:
            sheet_text += "First 3 rows:\n"
            for i, row in enumerate(first_rows[:3], 1):
                row_str = " | ".join(str(v)[:20] for v in row)
                sheet_text += f"  Row {i}: {row_str}\n"

        sheet_details.append(sheet_text)

    prompt = f"""You are analyzing a marketing data upload for {account_name}.

File: {file_name}
Sheets found: {', '.join(s['name'] for s in sheets_info)} ({len(sheets_info)} total)

{"".join(sheet_details)}

Based on this data:
1. State in 2-3 sentences what this file appears to contain (platform, campaign types, date range if visible)
2. Identify which sheets map to TOFU/MOFU/BOFU funnel stages based on campaign names (Awareness/Display/Brand → TOFU, Retargeting/Engagement → MOFU, Conversion/Lead/Purchase → BOFU)
3. Show your suggested column mappings as a JSON object where keys are raw column names and values are canonical fields (impressions, clicks, cost, conversions, ctr, cpc, campaign_name, etc.)
4. Ask ONE clarifying question if anything is ambiguous (use null if not needed)

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{{
  "summary": "2-3 sentence summary",
  "funnel_mapping": {{"Sheet1": "tofu", "Sheet2": "bofu"}},
  "column_suggestions": {{"Raw_Col_1": "canonical_field", "Raw_Col_2": "canonical_field"}},
  "clarifying_question": "Your question or null"
}}"""

    try:
        claude_bin = shutil.which("claude") or "/opt/homebrew/bin/claude"
        result = subprocess.run(
            [claude_bin, "-p", prompt],
            capture_output=True, text=True, timeout=60
        )
        if result.returncode != 0:
            raise RuntimeError(f"claude CLI failed: {result.stderr[:200]}")
        response_text = result.stdout.strip()

        # Try to parse as JSON
        try:
            result = json.loads(response_text)
        except json.JSONDecodeError:
            # If response is not valid JSON, extract JSON from code blocks
            if "```json" in response_text:
                json_str = response_text.split("```json")[1].split("```")[0].strip()
                result = json.loads(json_str)
            elif "```" in response_text:
                json_str = response_text.split("```")[1].split("```")[0].strip()
                result = json.loads(json_str)
            else:
                raise ValueError("Could not parse Claude response as JSON")

        # Ensure required fields
        result.setdefault("summary", "File analysis complete.")
        result.setdefault("funnel_mapping", {})
        result.setdefault("column_suggestions", {})
        # clarifying_question is optional

        logger.info(f"Claude analysis successful: {len(result.get('column_suggestions', {}))} column mappings suggested")
        return result

    except Exception as e:
        logger.error(f"Claude API call failed: {e}")
        # Return a safe default on error
        return {
            "summary": f"File '{file_name}' with {len(sheets_info)} sheets detected.",
            "funnel_mapping": {},
            "column_suggestions": {},
            "clarifying_question": "Could you provide more context about the data structure?"
        }


@router.post("/ai-review", response_model=AIReviewResponse)
async def ai_review_upload(request: AIReviewRequest):
    """
    Phase 4: Post-upload AI review using Claude.

    Analyzes the uploaded file and provides:
    - Summary of what the file contains
    - TOFU/MOFU/BOFU sheet mappings
    - Suggested column mappings
    - Clarifying question if needed

    Args:
        request: { upload_id: str, account_id: str }

    Returns:
        AIReviewResponse with analysis from Claude
    """
    try:
        conn = get_connection()

        # Fetch upload record
        upload_row = conn.execute(
            "SELECT file_name, file_path, account_id FROM uploads WHERE id = ?",
            [request.upload_id]
        ).fetchall()

        if not upload_row:
            raise HTTPException(status_code=404, detail=f"Upload not found: {request.upload_id}")

        file_name, file_path, db_account_id = upload_row[0]

        # Get account name
        account_row = conn.execute(
            "SELECT name FROM accounts WHERE id = ?",
            [request.account_id]
        ).fetchall()
        account_name = account_row[0][0] if account_row else request.account_id

        # Re-parse the file to get fresh analysis
        try:
            sheets = parse_file(file_path)
            classified_list = classify_sheets(sheets)
        except Exception as e:
            conn.close()
            logger.error(f"Failed to parse file {file_path}: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")

        # Build sheet info for Claude
        # classify_sheets returns a list of dicts with keys: sheet_name, type, rows, reason
        sheets_info = []
        for sheet_info in classified_list:
            sheet_name = sheet_info.get("sheet_name")
            sheet_type = sheet_info.get("type", "data")

            # Skip sheets that should not be imported
            if sheet_type == "skip":
                continue

            if sheet_name not in sheets:
                continue

            df = sheets[sheet_name]

            column_mapping = map_columns(list(df.columns))

            sheets_info.append({
                "name": sheet_name,
                "type": sheet_type,
                "row_count": sheet_info.get("rows", len(df)),
                "columns": list(df.columns),
                "column_mapping": {k: v["canonical"] for k, v in column_mapping.items()},
                "first_rows": df.head(3).values.tolist()
            })

        conn.close()

        # Call Claude for analysis
        claude_result = call_claude_for_file_analysis(
            file_summary="",
            account_name=account_name,
            sheets_info=sheets_info,
            file_name=file_name
        )

        logger.info(f"AI review completed for upload {request.upload_id}")

        return AIReviewResponse(**claude_result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI review failed for {request.upload_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
