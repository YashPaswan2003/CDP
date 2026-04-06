from pydantic import BaseModel
from typing import Optional
from datetime import date

class MetricRow(BaseModel):
    date: date
    impressions: int
    clicks: int
    spend: float
    conversions: int
    revenue: float
    platform: str
    campaign_name: str

class CampaignMetrics(BaseModel):
    campaign_id: str
    campaign_name: str
    platform: str
    budget: float
    total_spend: float
    total_impressions: int
    total_clicks: int
    total_conversions: int
    total_revenue: float
    average_cpc: float
    conversion_rate: float
    roas: float
    metrics: list[MetricRow]

class DashboardResponse(BaseModel):
    client_id: str
    client_name: str
    total_spend: float
    total_revenue: float
    total_impressions: int
    total_clicks: int
    total_conversions: int
    campaigns: list[CampaignMetrics]
    date_range: dict
