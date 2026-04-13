import os
from fastapi import APIRouter, HTTPException, Depends, Query
from app.models.chat import ChatRequest, ChatResponse
from app.routes.auth import get_current_user
from app.services.agents import InsightsAgent
from app.database.connection import get_connection
import logging

logger = logging.getLogger("api")
router = APIRouter(prefix="/chat", tags=["chat"])


def _get_account_context(account_id: str) -> dict:
    """Get account context (campaigns, metrics, flags, config) for agent.

    Args:
        account_id: Account ID

    Returns:
        Dict with context data
    """
    context = {
        "campaigns": [],
        "flags": [],
        "config": {},
    }

    try:
        conn = get_connection()

        # Get campaigns
        campaigns = conn.execute(
            "SELECT name, spent, revenue, roas FROM campaigns WHERE account_id = ? LIMIT 10",
            [account_id]
        ).fetchall()
        context["campaigns"] = [
            {
                "name": c[0],
                "spent": float(c[1]) if c[1] else 0,
                "revenue": float(c[2]) if c[2] else 0,
                "roas": float(c[3]) if c[3] else 0,
            }
            for c in campaigns
        ]

        # Get config
        config = conn.execute(
            "SELECT roas_threshold, cpa_threshold, quality_score_threshold, frequency_threshold, currency FROM client_config WHERE account_id = ?",
            [account_id]
        ).fetchone()
        if config:
            context["config"] = {
                "roas_threshold": float(config[0]) if config[0] else 3.0,
                "cpa_threshold": float(config[1]) if config[1] else None,
                "quality_score_threshold": int(config[2]) if config[2] else 7,
                "frequency_threshold": float(config[3]) if config[3] else 5.0,
                "currency": config[4] or "INR",
            }

        conn.close()
    except Exception as e:
        logger.warning(f"Error loading account context: {str(e)}")

    return context


@router.post("/", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),
    account_id: str = Query(..., description="Account ID"),
):
    """Chat with Claude AI for insights and analysis."""
    try:
        user_message = request.messages[-1].content if request.messages else ""

        if not user_message:
            raise HTTPException(status_code=400, detail="Message required")

        # Get account context for agent
        context = _get_account_context(account_id)

        # Initialize insights agent with context
        agent = InsightsAgent(account_id=account_id, context=context)

        # Get response from Claude
        response = agent.chat(user_message)

        logger.info(f"Chat request from {current_user.get('name', 'unknown')} account {account_id}: {user_message[:100]}")

        return ChatResponse(
            message=response,
            tokens_used=0,  # Claude API handles token counting
            client_id=account_id,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to generate response. Please try again."
        )
