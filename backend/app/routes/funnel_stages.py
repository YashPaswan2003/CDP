"""Funnel stage management routes."""
from fastapi import APIRouter, HTTPException
from app.database.connection import get_connection
from app.services.ingestion import DEFAULT_FUNNEL_STAGES

router = APIRouter(prefix="/api/clients", tags=["funnel_stages"])


@router.post("/{account_id}/seed-funnel-stages")
async def seed_funnel_stages(account_id: str):
    """Seed default funnel stages for a new client (QI Spine)."""
    conn = get_connection()
    try:
        # Check if stages already exist
        existing = conn.execute(
            "SELECT COUNT(*) as cnt FROM funnel_stages WHERE account_id = ?",
            [account_id]
        ).fetchall()

        if existing and existing[0][0] > 0:
            conn.close()
            return {"status": "already_seeded", "message": "Funnel stages already exist for this account"}

        # Insert default stages
        for stage in DEFAULT_FUNNEL_STAGES:
            conn.execute(
                """
                INSERT INTO funnel_stages (account_id, name, label, order_index, is_revenue_stage)
                VALUES (?, ?, ?, ?, ?)
                """,
                [account_id, stage["name"], stage["label"], stage["order_index"], stage["is_revenue_stage"]]
            )

        conn.commit()
        conn.close()
        return {"status": "seeded", "count": len(DEFAULT_FUNNEL_STAGES), "stages": DEFAULT_FUNNEL_STAGES}

    except Exception as e:
        conn.close()
        raise HTTPException(status_code=500, detail=f"Failed to seed funnel stages: {str(e)}")
