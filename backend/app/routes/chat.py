import os
from fastapi import APIRouter, HTTPException
from app.models.chat import ChatRequest, ChatResponse
import logging

logger = logging.getLogger("api")
router = APIRouter(prefix="/chat", tags=["chat"])

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat with Claude AI for insights and analysis."""
    try:
        # Phase 0: Mock response. Phase 1+: Integrate with Claude API
        user_message = request.messages[-1].content if request.messages else ""

        # Mock Claude response based on keywords
        if "spend" in user_message.lower() or "budget" in user_message.lower():
            response = "Based on the campaign data, your total advertising spend across all platforms is optimized for ROI. Consider increasing budget on high-performing campaigns (ROAS > 2.0) and reviewing low-performing ones."
        elif "conversion" in user_message.lower():
            response = "Your conversion rate has been steady. The Meta platform shows the highest conversion efficiency with an average 3.2% conversion rate. Consider scaling budget there while testing new audiences on other platforms."
        elif "campaign" in user_message.lower():
            response = "You have 11 active campaigns across 3 platforms. Your best performing campaigns are the Product Launch and Seasonal Promotion on Google Ads with strong ROI. The Display campaigns on DV360 are building brand awareness with good impression volume."
        else:
            response = "I've analyzed your advertising data. What specific aspect would you like to explore? I can help with: campaign performance, budget optimization, platform comparison, or conversion analysis."

        logger.info(f"Chat request from client {request.client_id}: {user_message[:100]}")

        return ChatResponse(
            message=response,
            tokens_used=100,  # Mock token count
            client_id=request.client_id
        )

    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
