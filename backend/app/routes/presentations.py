"""Presentation generation, management, slide chat, and PPTX download endpoints."""

from fastapi import APIRouter, HTTPException, Header, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Any
from app.routes.auth import get_current_user
from app.database.connection import get_connection
from app.services.pptx_generator import generate_pptx
import logging
import uuid
import json
from datetime import datetime

logger = logging.getLogger("api")
router = APIRouter(prefix="/api/presentations", tags=["presentations"])

# ---------------------------------------------------------------------------
# In-memory store (simple dict; survives for server lifetime)
# ---------------------------------------------------------------------------
_presentations_store: dict[str, dict] = {}

# ---------------------------------------------------------------------------
# Template definitions
# ---------------------------------------------------------------------------
TEMPLATES = {
    "monthly_performance": {
        "title_suffix": "Monthly Performance Report",
        "slides": [
            {"type": "title", "title": "Title Slide"},
            {"type": "executive_summary", "title": "Executive Summary"},
            {"type": "platform_overview", "title": "Platform Overview"},
            {"type": "campaign_performance", "title": "Campaign Performance"},
            {"type": "keyword_analysis", "title": "Keyword Analysis"},
            {"type": "funnel_analysis", "title": "Funnel Analysis"},
            {"type": "recommendations", "title": "Recommendations"},
            {"type": "custom", "title": "Next Steps"},
        ],
    },
    "campaign_deep_dive": {
        "title_suffix": "Campaign Deep Dive",
        "slides": [
            {"type": "title", "title": "Title Slide"},
            {"type": "executive_summary", "title": "Campaign Overview"},
            {"type": "campaign_performance", "title": "Performance Breakdown"},
            {"type": "keyword_analysis", "title": "Keyword Analysis"},
            {"type": "funnel_analysis", "title": "Funnel Performance"},
            {"type": "recommendations", "title": "Optimization Plan"},
        ],
    },
    "client_qbr": {
        "title_suffix": "Quarterly Business Review",
        "slides": [
            {"type": "title", "title": "Title Slide"},
            {"type": "executive_summary", "title": "Executive Summary"},
            {"type": "platform_overview", "title": "Platform Overview — Google"},
            {"type": "platform_overview", "title": "Platform Overview — DV360"},
            {"type": "platform_overview", "title": "Platform Overview — Meta"},
            {"type": "campaign_performance", "title": "Top Campaigns"},
            {"type": "campaign_performance", "title": "Underperforming Campaigns"},
            {"type": "keyword_analysis", "title": "Keyword Performance"},
            {"type": "funnel_analysis", "title": "Funnel Analysis"},
            {"type": "custom", "title": "Competitive Landscape"},
            {"type": "custom", "title": "Budget Allocation"},
            {"type": "recommendations", "title": "Strategic Recommendations"},
            {"type": "custom", "title": "Next Quarter Goals"},
        ],
    },
    "weekly_pulse": {
        "title_suffix": "Weekly Pulse",
        "slides": [
            {"type": "title", "title": "Title Slide"},
            {"type": "executive_summary", "title": "This Week's Highlights"},
            {"type": "campaign_performance", "title": "Campaign Snapshot"},
            {"type": "recommendations", "title": "Action Items"},
        ],
    },
}


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------
class PresentationGenerateRequest(BaseModel):
    template_type: str  # monthly_performance, campaign_deep_dive, client_qbr, weekly_pulse
    client_id: str
    date_from: str
    date_to: str
    platforms: List[str] = ["google", "dv360", "meta"]


class SlideData(BaseModel):
    type: str
    title: str
    bullets: List[str] = []
    metrics: List[dict] = []
    table_headers: List[str] = []
    table_rows: List[list] = []
    notes: Optional[str] = None


class PresentationResponse(BaseModel):
    id: str
    title: str
    template_type: str
    client_id: str
    client_name: str
    date_from: str
    date_to: str
    platforms: List[str]
    slides: List[dict]
    status: str
    created_at: str


class PresentationListItem(BaseModel):
    id: str
    title: str
    client_id: str
    client_name: str
    date_from: str
    date_to: str
    template_type: str
    status: str
    slide_count: int
    created_at: str


class PresentationListResponse(BaseModel):
    presentations: List[PresentationListItem]


class SlideChatRequest(BaseModel):
    message: str
    slide_type: Optional[str] = None
    slide_data: Optional[dict] = None


class SlideChatResponse(BaseModel):
    response: str
    suggested_content: Optional[dict] = None


class SlideUpdateRequest(BaseModel):
    slides: List[dict]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _check_access(authorization: str, account_id: str) -> dict:
    """Verify auth and account access. Returns user dict."""
    try:
        user = get_current_user(authorization)
    except HTTPException:
        raise HTTPException(status_code=401, detail="Unauthorized")

    conn = get_connection()
    try:
        if user["role"] != "admin":
            access = conn.execute(
                "SELECT 1 FROM user_accounts WHERE user_id = ? AND account_id = ?",
                [user["id"], account_id],
            ).fetchone()
            if not access:
                raise HTTPException(status_code=403, detail="Access denied")
    finally:
        conn.close()
    return user


def _get_client_name(client_id: str) -> str:
    """Lookup client name from accounts table."""
    conn = get_connection()
    try:
        row = conn.execute("SELECT name FROM accounts WHERE id = ?", [client_id]).fetchone()
        return row[0] if row else client_id
    finally:
        conn.close()


def _query_slide_data(account_id: str, client_id: str, date_from: str, date_to: str,
                      platforms: list[str], slide_type: str) -> dict:
    """Query real DB data to populate a slide. All queries use parameterized placeholders."""
    conn = get_connection()
    try:
        # Build safe IN clause with parameterized placeholders
        plat_placeholders = ",".join(["?" for _ in platforms])
        base_params = [client_id] + platforms + [date_from, date_to]
        campaign_params = [client_id] + platforms

        if slide_type == "executive_summary":
            row = conn.execute(f"""
                SELECT COALESCE(SUM(spend), 0), COALESCE(SUM(clicks), 0),
                       COALESCE(SUM(impressions), 0), COALESCE(SUM(conversions), 0),
                       COALESCE(SUM(revenue), 0)
                FROM daily_metrics
                WHERE account_id = ? AND platform IN ({plat_placeholders})
                  AND date BETWEEN ? AND ?
            """, base_params).fetchone()

            spend, clicks, imps, convs, rev = row if row else (0, 0, 0, 0, 0)
            roas = round(float(rev) / float(spend), 2) if spend and spend > 0 else 0
            ctr = round(float(clicks) / float(imps) * 100, 2) if imps and imps > 0 else 0
            cpc = round(float(spend) / float(clicks), 2) if clicks and clicks > 0 else 0

            return {
                "metrics": [
                    {"label": "Total Spend", "value": f"${spend:,.0f}" if spend else "$0"},
                    {"label": "Conversions", "value": f"{convs:,}" if convs else "0"},
                    {"label": "ROAS", "value": f"{roas}x"},
                    {"label": "CTR", "value": f"{ctr}%"},
                ],
                "bullets": [
                    f"Total spend of ${spend:,.0f} across {len(platforms)} platforms" if spend else "No spend data available",
                    f"Generated {convs:,} conversions at ${cpc:.2f} CPC" if convs else "No conversion data",
                    f"Overall ROAS of {roas}x with {imps:,} impressions" if imps else "No impression data",
                ],
            }

        elif slide_type == "platform_overview":
            rows = conn.execute(f"""
                SELECT platform, COALESCE(SUM(spend), 0), COALESCE(SUM(clicks), 0),
                       COALESCE(SUM(impressions), 0), COALESCE(SUM(conversions), 0),
                       COALESCE(SUM(revenue), 0)
                FROM daily_metrics
                WHERE account_id = ? AND platform IN ({plat_placeholders})
                  AND date BETWEEN ? AND ?
                GROUP BY platform
            """, base_params).fetchall()

            metrics, bullets = [], []
            for r in rows:
                plat, sp, cl, imp, conv, rev = r
                roas = round(float(rev) / float(sp), 2) if sp and sp > 0 else 0
                metrics.append({"label": f"{plat.title()} Spend", "value": f"${sp:,.0f}" if sp else "$0"})
                bullets.append(f"{plat.title()}: ${sp:,.0f} spend, {conv:,} conversions, {roas}x ROAS")
            return {"metrics": metrics[:4], "bullets": bullets}

        elif slide_type == "campaign_performance":
            rows = conn.execute(f"""
                SELECT name, platform, spent, clicks, conversions, revenue, roas
                FROM campaigns
                WHERE account_id = ? AND platform IN ({plat_placeholders})
                ORDER BY COALESCE(revenue, 0) DESC LIMIT 10
            """, campaign_params).fetchall()

            headers = ["Campaign", "Platform", "Spend", "Clicks", "Conversions", "Revenue", "ROAS"]
            table_rows, bullets = [], []
            for r in rows:
                name, plat, sp, cl, conv, rev, roas_val = r
                table_rows.append([
                    name or "", plat or "",
                    f"${sp:,.0f}" if sp else "$0", f"{cl:,}" if cl else "0",
                    str(conv or 0), f"${rev:,.0f}" if rev else "$0",
                    f"{roas_val:.2f}x" if roas_val else "0x",
                ])
            if rows:
                top = rows[0]
                bullets.append(f"Top campaign: {top[0]} with ${top[5]:,.0f} revenue" if top[5] else f"Top campaign: {top[0]}")
            return {"table_headers": headers, "table_rows": table_rows, "bullets": bullets}

        elif slide_type == "keyword_analysis":
            rows = conn.execute("""
                SELECT keyword, impressions, clicks, spend, conversions, quality_score
                FROM search_terms WHERE account_id = ?
                ORDER BY COALESCE(conversions, 0) DESC LIMIT 10
            """, [client_id]).fetchall()

            headers = ["Keyword", "Impressions", "Clicks", "Spend", "Conversions", "QS"]
            table_rows = []
            for r in rows:
                kw, imp, cl, sp, conv, qs = r
                table_rows.append([
                    kw or "", f"{imp:,}" if imp else "0", f"{cl:,}" if cl else "0",
                    f"${sp:,.0f}" if sp else "$0", str(conv or 0), str(qs or "-"),
                ])
            bullets = []
            if rows:
                bullets.append(f"Top keyword: '{rows[0][0]}' with {rows[0][4] or 0} conversions")
                high_qs = [r for r in rows if r[5] and r[5] >= 8]
                if high_qs:
                    bullets.append(f"{len(high_qs)} keywords with quality score 8+")
            return {"table_headers": headers, "table_rows": table_rows, "bullets": bullets}

        elif slide_type == "funnel_analysis":
            rows = conn.execute(f"""
                SELECT funnel_stage, COUNT(*), COALESCE(SUM(spent), 0), COALESCE(SUM(conversions), 0)
                FROM campaigns
                WHERE account_id = ? AND platform IN ({plat_placeholders}) AND funnel_stage IS NOT NULL
                GROUP BY funnel_stage
            """, campaign_params).fetchall()

            metrics, bullets = [], []
            for r in rows:
                stage, count, spend, conv = r
                label = {"tofu": "Top of Funnel", "mofu": "Mid Funnel", "bofu": "Bottom Funnel"}.get(stage, stage)
                metrics.append({"label": label, "value": f"{conv:,} conv"})
                bullets.append(f"{label}: {count} campaigns, ${spend:,.0f} spend, {conv:,} conversions")
            return {"metrics": metrics[:4], "bullets": bullets}

        elif slide_type == "recommendations":
            bullets = []
            low_roas = conn.execute(f"""
                SELECT name, roas FROM campaigns
                WHERE account_id = ? AND platform IN ({plat_placeholders})
                  AND roas IS NOT NULL AND roas < 2
                ORDER BY roas ASC LIMIT 3
            """, campaign_params).fetchall()
            for r in low_roas:
                bullets.append(f"Review '{r[0]}' — ROAS at {r[1]:.2f}x, consider pausing or optimizing")

            bad_kw = conn.execute("""
                SELECT keyword, spend, conversions FROM search_terms
                WHERE account_id = ? AND spend > 100 AND (conversions IS NULL OR conversions = 0)
                LIMIT 3
            """, [client_id]).fetchall()
            for r in bad_kw:
                bullets.append(f"Negative-match keyword '{r[0]}' — ${r[1]:,.0f} spend with 0 conversions")

            if not bullets:
                bullets = [
                    "Continue optimizing top-performing campaigns",
                    "Test new ad creatives for underperforming ad groups",
                    "Review budget allocation across platforms",
                ]
            return {"bullets": bullets}

        else:
            return {"bullets": ["Custom slide — add content via the AI chat panel"]}

    except Exception as e:
        logger.error(f"Error querying slide data: {e}")
        return {"bullets": ["Data temporarily unavailable"]}
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@router.post("/generate", response_model=PresentationResponse)
def generate_presentation(
    request: PresentationGenerateRequest,
    account_id: str = Query(..., description="Account ID"),
    authorization: str = Header(None),
):
    """Generate a presentation from a template with real data."""
    _check_access(authorization, account_id)

    template = TEMPLATES.get(request.template_type)
    if not template:
        raise HTTPException(status_code=400, detail=f"Unknown template: {request.template_type}")

    client_name = _get_client_name(request.client_id)
    pres_id = f"pres_{uuid.uuid4().hex[:12]}"
    now = datetime.utcnow().isoformat() + "Z"

    # Build slides with real data
    slides = []
    for tmpl_slide in template["slides"]:
        slide_type = tmpl_slide["type"]
        slide_title = tmpl_slide["title"]

        if slide_type == "title":
            slides.append({
                "type": "title",
                "title": f"{client_name} — {template['title_suffix']}",
                "bullets": [],
                "metrics": [],
            })
            continue

        data = _query_slide_data(
            account_id, request.client_id,
            request.date_from, request.date_to,
            request.platforms, slide_type,
        )

        slides.append({
            "type": slide_type,
            "title": slide_title,
            "bullets": data.get("bullets", []),
            "metrics": data.get("metrics", []),
            "table_headers": data.get("table_headers", []),
            "table_rows": data.get("table_rows", []),
            "notes": data.get("notes"),
        })

    title = f"{client_name} — {template['title_suffix']}"

    presentation = {
        "id": pres_id,
        "title": title,
        "template_type": request.template_type,
        "client_id": request.client_id,
        "client_name": client_name,
        "date_from": request.date_from,
        "date_to": request.date_to,
        "platforms": request.platforms,
        "slides": slides,
        "status": "ready",
        "created_at": now,
    }

    _presentations_store[pres_id] = presentation

    # Also persist to DuckDB
    conn = get_connection()
    try:
        conn.execute(
            """INSERT INTO presentations (id, account_id, title, template_type, client_id,
               date_from, date_to, platforms, slides_json, status, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            [pres_id, account_id, title, request.template_type, request.client_id,
             request.date_from, request.date_to, ",".join(request.platforms),
             json.dumps(slides), "ready", now],
        )
        conn.commit()
    except Exception as e:
        logger.warning(f"Failed to persist presentation to DB: {e}")
    finally:
        conn.close()

    return PresentationResponse(**presentation)


@router.get("/", response_model=PresentationListResponse)
def list_presentations(
    account_id: str = Query(..., description="Account ID"),
    authorization: str = Header(None),
):
    """List presentations for an account."""
    _check_access(authorization, account_id)

    items = []

    # Try DB first
    conn = get_connection()
    try:
        rows = conn.execute(
            """SELECT id, title, template_type, client_id, date_from, date_to,
                      platforms, slides_json, status, created_at
               FROM presentations
               WHERE account_id = ?
               ORDER BY created_at DESC""",
            [account_id],
        ).fetchall()

        for r in rows:
            pres_id, title, tmpl, cid, df, dt, plats, sj, status, created = r
            slide_count = 0
            try:
                slide_count = len(json.loads(sj)) if sj else 0
            except Exception:
                pass
            items.append(PresentationListItem(
                id=pres_id,
                title=title or "",
                client_id=cid or "",
                client_name=_get_client_name(cid or ""),
                date_from=str(df) if df else "",
                date_to=str(dt) if dt else "",
                template_type=tmpl or "",
                status=status or "ready",
                slide_count=slide_count,
                created_at=str(created) if created else "",
            ))
    except Exception as e:
        logger.warning(f"DB query for presentations failed: {e}")
    finally:
        conn.close()

    # Also include in-memory ones not in DB
    db_ids = {i.id for i in items}
    for pres in _presentations_store.values():
        if pres["id"] not in db_ids:
            items.append(PresentationListItem(
                id=pres["id"],
                title=pres.get("title", ""),
                client_id=pres.get("client_id", ""),
                client_name=pres.get("client_name", ""),
                date_from=pres.get("date_from", ""),
                date_to=pres.get("date_to", ""),
                template_type=pres.get("template_type", ""),
                status=pres.get("status", "ready"),
                slide_count=len(pres.get("slides", [])),
                created_at=pres.get("created_at", ""),
            ))

    return PresentationListResponse(presentations=items)


@router.get("/{presentation_id}", response_model=PresentationResponse)
def get_presentation(
    presentation_id: str,
    account_id: str = Query(..., description="Account ID"),
    authorization: str = Header(None),
):
    """Get full presentation with all slides."""
    _check_access(authorization, account_id)

    # Check in-memory first (verify account ownership)
    if presentation_id in _presentations_store:
        pres = _presentations_store[presentation_id]
        if pres.get("client_id") and pres.get("client_id") != account_id:
            # Check if user has access to the presentation's account
            pass  # Allow if they passed _check_access for the query account_id
        return PresentationResponse(**pres)

    # Check DB
    conn = get_connection()
    try:
        row = conn.execute(
            """SELECT id, title, template_type, client_id, date_from, date_to,
                      platforms, slides_json, status, created_at
               FROM presentations WHERE id = ?""",
            [presentation_id],
        ).fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Presentation not found")

        pres_id, title, tmpl, cid, df, dt, plats, sj, status, created = row
        slides = json.loads(sj) if sj else []
        platforms = plats.split(",") if plats else []

        pres = {
            "id": pres_id,
            "title": title,
            "template_type": tmpl,
            "client_id": cid,
            "client_name": _get_client_name(cid),
            "date_from": str(df),
            "date_to": str(dt),
            "platforms": platforms,
            "slides": slides,
            "status": status,
            "created_at": str(created),
        }
        _presentations_store[pres_id] = pres
        return PresentationResponse(**pres)
    finally:
        conn.close()


@router.put("/{presentation_id}/slides")
def update_slides(
    presentation_id: str,
    request: SlideUpdateRequest,
    account_id: str = Query(..., description="Account ID"),
    authorization: str = Header(None),
):
    """Update slides for a presentation (save from editor)."""
    _check_access(authorization, account_id)

    if presentation_id in _presentations_store:
        _presentations_store[presentation_id]["slides"] = request.slides

    # Persist to DB (works even if not in memory)
    conn = get_connection()
    try:
        result = conn.execute(
            "UPDATE presentations SET slides_json = ? WHERE id = ? AND account_id = ?",
            [json.dumps(request.slides), presentation_id, account_id],
        )
        conn.commit()
        # If not in memory and not in DB, 404
        if presentation_id not in _presentations_store and result.fetchone() is None:
            raise HTTPException(status_code=404, detail="Presentation not found")
    except HTTPException:
        raise
    except Exception:
        pass
    finally:
        conn.close()

    return {"status": "saved"}


@router.post("/{presentation_id}/slides/{slide_index}/chat", response_model=SlideChatResponse)
def slide_chat(
    presentation_id: str,
    slide_index: int,
    request: SlideChatRequest,
    account_id: str = Query(..., description="Account ID"),
    authorization: str = Header(None),
):
    """AI chat for a specific slide."""
    _check_access(authorization, account_id)

    # Get presentation context (check memory, then DB)
    pres = _presentations_store.get(presentation_id)
    if not pres:
        conn = get_connection()
        try:
            row = conn.execute(
                "SELECT id, title, template_type, client_id, date_from, date_to, platforms, slides_json, status, created_at FROM presentations WHERE id = ? AND account_id = ?",
                [presentation_id, account_id],
            ).fetchone()
            if row:
                pres = {
                    "id": row[0], "title": row[1], "template_type": row[2], "client_id": row[3],
                    "client_name": _get_client_name(row[3]), "date_from": str(row[4]),
                    "date_to": str(row[5]), "platforms": row[6].split(",") if row[6] else [],
                    "slides": json.loads(row[7]) if row[7] else [], "status": row[8],
                    "created_at": str(row[9]),
                }
                _presentations_store[presentation_id] = pres
        finally:
            conn.close()
    if not pres:
        raise HTTPException(status_code=404, detail="Presentation not found")

    slides = pres.get("slides", [])
    if slide_index < 0 or slide_index >= len(slides):
        raise HTTPException(status_code=400, detail="Invalid slide index")

    current_slide = slides[slide_index]
    slide_type = request.slide_type or current_slide.get("type", "custom")
    slide_data = request.slide_data or current_slide

    try:
        from app.services.agents.presentation_agent import PresentationAgent
        agent = PresentationAgent(account_id, pres.get("client_name", "Client"))
        result = agent.chat_about_slide(slide_type, slide_data, request.message)
        return SlideChatResponse(
            response=result.get("response", ""),
            suggested_content=result.get("suggested_content"),
        )
    except Exception as e:
        logger.error(f"Slide chat error: {e}")
        return SlideChatResponse(
            response=f"AI chat unavailable: {str(e)}. Try editing the slide content directly.",
        )


@router.get("/{presentation_id}/download")
def download_presentation(
    presentation_id: str,
    account_id: str = Query(..., description="Account ID"),
    authorization: str = Header(None),
):
    """Download presentation as a .pptx file."""
    _check_access(authorization, account_id)

    pres = _presentations_store.get(presentation_id)
    if not pres:
        # Try DB
        conn = get_connection()
        try:
            row = conn.execute(
                "SELECT title, client_id, date_from, date_to, slides_json FROM presentations WHERE id = ? AND account_id = ?",
                [presentation_id, account_id],
            ).fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Presentation not found")
            title, cid, df, dt, sj = row
            pres = {
                "title": title,
                "client_name": _get_client_name(cid),
                "date_from": str(df),
                "date_to": str(dt),
                "slides": json.loads(sj) if sj else [],
            }
        finally:
            conn.close()

    buffer = generate_pptx(pres)

    import re
    safe_title = re.sub(r'[^a-zA-Z0-9_\-]', '_', pres.get('title', 'presentation'))[:100]
    filename = f"{safe_title}.pptx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
