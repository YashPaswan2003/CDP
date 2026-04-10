from pydantic import BaseModel
from typing import Optional, Literal, List


class Alert(BaseModel):
    """Health alert for a marketing account."""
    id: str
    severity: Literal['error', 'warning', 'success']
    message: str
    campaign: Optional[str] = None
    platform: Optional[str] = None


class AlertsResponse(BaseModel):
    """Response containing a list of alerts."""
    alerts: List[Alert]
