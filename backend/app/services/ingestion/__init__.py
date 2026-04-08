"""
Smart Excel/CSV Ingestion Engine for multi-tenant marketing data.
Supports CSV, XLSX, XLSB files with automatic schema detection.
"""

# ==== CONSTANTS FIRST (before imports) ====

# Canonical column mappings for fuzzy matching
CANONICAL_MAP = {
    # Cost fields
    "cost": ["cost", "amount spent", "amount spent (inr)", "budget", "spend"],
    # Clicks
    "clicks": ["clicks", "link clicks", "interactions"],
    # Impressions
    "impressions": ["impressions", "available impr"],
    # CTR
    "ctr": ["ctr", "interaction rate", "click through rate"],
    # CPC
    "cpc": ["cpc", "avg cpc", "avg. cpc", "cost per link click", "avg. cost"],
    # Funnel stages (generic names)
    "leads": ["lead", "leads", "lead ", "results", "meta leads"],
    "appointment_booked": ["ab", "ab ", "appointment booked"],
    "first_consultation": ["fc", "fc ", "first consultation"],
    "paid_consultation": ["pc", "pc ", "paid consultation"],
    "revenue": ["revenue", "revenue "],
    # Dimensions
    "campaign_name": ["campaign_name", "final campain name", "campaign"],
    "adset_name": ["adset_name", "final adset_name", "ad set name", "adgroup"],
    "platform": ["platform", "platform-2"],
    "city": ["city", "location", "geo"],
    "category": ["category", "condition 1", "condition 2", "theme"],
    "funnel_stage": ["funnel", "funnel stage"],
    "week": ["week", "week  "],
    "month": ["month", "mon"],
}

# Sheet classification patterns
EXPLICIT_SKIP_TABS = ["mom", "pivot", "summary", "overview", "wow"]
RAW_PATTERNS = ["raw", "data", "roi"]
CRM_PATTERNS = ["pmd", "crm", "calls"]
PLAN_PATTERNS = ["plan", "projection"]

# Funnel stage detection patterns
TOFU_PATTERNS = ["brand", "awareness", "reach", "pmax", "performance max", "display", "youtube", "dsa"]
MOFU_PATTERNS = ["retargeting", "remarketing", "engagement", "interest", "consideration", "non-brand", "non brand"]
BOFU_PATTERNS = ["conversion", "purchase", "lead", "appointment", "category", "exact match", "competitor"]

# QI Spine funnel stages (default for new clients)
DEFAULT_FUNNEL_STAGES = [
    {"name": "lead", "label": "Lead", "order_index": 1, "is_revenue_stage": False},
    {"name": "ab", "label": "Appointment Booked", "order_index": 2, "is_revenue_stage": False},
    {"name": "fc", "label": "First Consultation", "order_index": 3, "is_revenue_stage": False},
    {"name": "pc", "label": "Paid Consultation", "order_index": 4, "is_revenue_stage": False},
    {"name": "revenue", "label": "Revenue", "order_index": 5, "is_revenue_stage": True},
]

# ==== NOW IMPORT SERVICE FUNCTIONS ====

# Import service functions
from .parser import parse_file, get_sheet_preview, ParsingError
from .sheet_detector import classify_sheets
from .column_mapper import map_columns
from .funnel_detector import detect_stage
from .normalizer import normalize_value, detect_ctr_format, normalize_row
from .conflict_detector import detect_conflicts, auto_accept_conflicts
from .importer import import_metrics, compute_file_hash

__all__ = [
    # Service functions
    "parse_file",
    "get_sheet_preview",
    "ParsingError",
    "classify_sheets",
    "map_columns",
    "detect_stage",
    "normalize_value",
    "normalize_row",
    "detect_ctr_format",
    "detect_conflicts",
    "auto_accept_conflicts",
    "import_metrics",
    "compute_file_hash",
    # Constants
    "CANONICAL_MAP",
    "EXPLICIT_SKIP_TABS",
    "RAW_PATTERNS",
    "CRM_PATTERNS",
    "PLAN_PATTERNS",
    "TOFU_PATTERNS",
    "MOFU_PATTERNS",
    "BOFU_PATTERNS",
    "DEFAULT_FUNNEL_STAGES",
]
