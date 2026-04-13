"""Models for action execution endpoints."""

from pydantic import BaseModel
from typing import Optional, Literal, Dict, Any


class ActionExecutionRequest(BaseModel):
    """Request to execute an action."""
    entity_type: str  # 'campaign', 'keyword', 'ad_group', etc.
    entity_id: str
    account_id: str
    parameters: Optional[Dict[str, Any]] = None


class EntityUpdate(BaseModel):
    """Updated entity state after action execution."""
    entity_id: str
    entity_type: str
    field: str  # e.g., 'status', 'budget', 'bid'
    previous_value: Any
    new_value: Any


class ActionExecutionResponse(BaseModel):
    """Response from action execution."""
    success: bool
    message: str
    action_type: str
    updated_entity: Optional[EntityUpdate] = None
    timestamp: str


class EntityDetailsResponse(BaseModel):
    """Response containing entity details."""
    entity_id: str
    entity_type: str
    account_id: str
    name: str
    status: Literal["active", "paused", "ended"]
    platform: Literal["google", "dv360", "meta"]
    budget: Optional[float] = None
    spend: Optional[float] = None
    impressions: Optional[int] = None
    clicks: Optional[int] = None
    conversions: Optional[int] = None
    revenue: Optional[float] = None
    ctr: Optional[float] = None
    cpc: Optional[float] = None
    cvr: Optional[float] = None
    roas: Optional[float] = None
    quality_score: Optional[int] = None
    bid_strategy: Optional[str] = None
    created_at: str
    updated_at: str
