"""Parse Excel/CSV files and return sheets as DataFrames."""
import pandas as pd
import logging
from pathlib import Path
from typing import Dict, List

logger = logging.getLogger("ingestion")


class ParsingError(Exception):
    """Exception raised when file parsing fails."""
    def __init__(self, reason: str):
        self.reason = reason
        super().__init__(reason)


def parse_file(file_path: str) -> Dict[str, pd.DataFrame]:
    """
    Parse Excel (.xlsx, .xlsb) or CSV file and return dict of {sheet_name: DataFrame}.

    Args:
        file_path: Path to .xlsx, .xlsb, or .csv file

    Returns:
        Dict mapping sheet names to DataFrames

    Raises:
        ParsingError: If file type is unsupported or parsing fails
    """
    file_path = Path(file_path)

    if file_path.suffix.lower() == ".csv":
        return _parse_csv(file_path)
    elif file_path.suffix.lower() == ".xlsx":
        return _parse_xlsx(file_path)
    elif file_path.suffix.lower() == ".xlsb":
        return _parse_xlsb(file_path)
    else:
        raise ParsingError(f"Unsupported file type: {file_path.suffix}")


def _parse_csv(file_path: Path) -> Dict[str, pd.DataFrame]:
    """Parse CSV file. CSV is treated as single sheet named 'data'."""
    try:
        df = pd.read_csv(file_path, dtype=str)
        # Clean column names: strip whitespace
        df.columns = [col.strip() for col in df.columns]
        logger.info(f"Parsed CSV: {file_path.name} ({len(df)} rows, {len(df.columns)} columns)")
        return {"data": df}
    except Exception as e:
        logger.error(f"Failed to parse CSV: {e}")
        raise ParsingError(f"CSV parsing failed: {str(e)}")


def _parse_xlsx(file_path: Path) -> Dict[str, pd.DataFrame]:
    """Parse .xlsx file using openpyxl. Returns all sheets."""
    try:
        excel_file = pd.ExcelFile(file_path)
        sheets = {}

        for sheet_name in excel_file.sheet_names:
            df = pd.read_excel(file_path, sheet_name=sheet_name, dtype=str)
            # Clean column names: strip whitespace
            df.columns = [col.strip() if isinstance(col, str) else str(col) for col in df.columns]
            sheets[sheet_name] = df

        logger.info(f"Parsed {len(sheets)} sheets from {file_path.name}")
        return sheets
    except Exception as e:
        logger.error(f"Failed to parse XLSX: {e}")
        raise ParsingError(f"XLSX parsing failed: {str(e)}")


def _parse_xlsb(file_path: Path) -> Dict[str, pd.DataFrame]:
    """
    Parse .xlsb binary Excel file using pyxlsb row iterator.

    Uses row iterator instead of pd.read_excel to avoid loading entire
    file into memory, which can cause memory bloat with large files.
    """
    try:
        from pyxlsb import open_workbook

        sheets = {}
        with open_workbook(str(file_path)) as wb:
            for sheet_name in wb.sheets:
                sheet = wb.get_sheet(sheet_name)
                # Read sheet rows with row limit to avoid memory bloat
                rows = []
                for row_idx, row in enumerate(sheet.rows()):
                    row_data = [cell.v if cell else None for cell in row]
                    rows.append(row_data)
                    # Limit to first 10k rows to avoid memory bloat
                    if row_idx > 10000:
                        logger.warning(f"Sheet '{sheet_name}' truncated to 10000 rows")
                        break

                if rows:
                    # Find first non-empty row as headers
                    header_idx = _find_header_row(rows)
                    headers_row = rows[header_idx]
                    headers = [str(h).strip() if h else f"col_{i}" for i, h in enumerate(headers_row)]
                    data = rows[header_idx + 1:]

                    if data:  # Only create DataFrame if there's data after headers
                        df = pd.DataFrame(data, columns=headers)
                        df = df.astype(str)
                        sheets[sheet_name] = df
                    else:
                        # Empty sheet, create with headers only
                        df = pd.DataFrame(columns=headers)
                        sheets[sheet_name] = df

        logger.info(f"Parsed {len(sheets)} sheets from {file_path.name}")
        return sheets
    except Exception as e:
        logger.error(f"Failed to parse XLSB: {e}")
        raise ParsingError(f"XLSB parsing failed: {str(e)}")


def _find_header_row(rows: List) -> int:
    """Find the header row by looking for row with most non-None values.

    Header rows typically have many values filled in (column names).
    Skips empty rows at the beginning and finds the densest non-empty row.

    Args:
        rows: List of rows, where each row is a list of cell values

    Returns:
        Index of the likely header row (row with most non-None values)
    """
    max_non_none = 0
    header_idx = 0

    for idx, row in enumerate(rows):
        # Count non-None values in this row
        non_none_count = sum(1 for cell in row if cell is not None)

        # Header row should have many values (at least 50% of columns non-None)
        if non_none_count > max_non_none:
            max_non_none = non_none_count
            header_idx = idx

        # Early exit if we find a row that's more than 80% full
        if non_none_count > len(row) * 0.8:
            return idx

    return header_idx


def get_sheet_preview(df: pd.DataFrame, n_rows: int = 5) -> Dict:
    """Get preview of first N rows and column names."""
    return {
        "columns": list(df.columns),
        "row_count": len(df),
        "first_rows": df.head(n_rows).values.tolist(),
    }
