from pydantic import BaseModel
from typing import Optional, List, Literal
from decimal import Decimal


class ClientConfigRequest(BaseModel):
    """Client config setup request."""
    roas_threshold: float = 3.0
    cpa_threshold: Optional[float] = None
    spend_pace_pct: float = 100.0
    ctr_threshold: Optional[float] = None
    cvr_threshold: Optional[float] = None
    quality_score_threshold: int = 7
    frequency_threshold: float = 5.0
    currency: str = "INR"


class ClientConfig(BaseModel):
    """Client config response."""
    id: str
    account_id: str
    roas_threshold: float
    cpa_threshold: Optional[float]
    spend_pace_pct: float
    ctr_threshold: Optional[float]
    cvr_threshold: Optional[float]
    quality_score_threshold: int
    frequency_threshold: float
    currency: str
    is_configured: bool
    created_at: str
    updated_at: str


class Action(BaseModel):
    """Action available for a flag."""
    type: Literal["pause", "increase_budget", "adjust_bid", "review_quality", "details"]
    label: str
    severity: Literal["high", "medium", "low"]


class Flag(BaseModel):
    """Flag/alert for an account."""
    metric: str
    current: Optional[float] = None
    previous: Optional[float] = None
    entities: List[str] = []
    entity_count: int = 0
    severity: Literal["high", "medium", "low"]
    explanation: str
    campaign_name: Optional[str] = None
    client_name: Optional[str] = None
    platform: Optional[str] = None
    actions: List[Action] = []


class FlagsResponse(BaseModel):
    """Response containing flags for an account."""
    flags: List[Flag] = []
    severity_distribution: dict = {}
