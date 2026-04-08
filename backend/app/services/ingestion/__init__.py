"""Excel/CSV ingestion pipeline for marketing data."""
from .parser import parse_file
from .sheet_detector import detect_sheet_type, classify_sheets
from .column_mapper import map_columns
from .funnel_detector import detect_funnel_stage
from .normalizer import normalize_row
from .conflict_detector import detect_conflicts
from .importer import import_metrics

__all__ = [
    "parse_file",
    "detect_sheet_type",
    "classify_sheets",
    "map_columns",
    "detect_funnel_stage",
    "normalize_row",
    "detect_conflicts",
    "import_metrics",
]
