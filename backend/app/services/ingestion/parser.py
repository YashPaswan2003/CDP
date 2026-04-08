"""Parse Excel/CSV files and return sheets as DataFrames."""
import pandas as pd
import logging
from pathlib import Path
from typing import Dict, List, Tuple

logger = logging.getLogger("ingestion")


def parse_file(file_path: str) -> Dict[str, pd.DataFrame]:
    """
    Parse Excel (.xlsx, .xlsb) or CSV file and return dict of {sheet_name: DataFrame}.

    Args:
        file_path: Path to .xlsx, .xlsb, or .csv file

    Returns:
        Dict mapping sheet names to DataFrames
    """
    file_path = Path(file_path)

    if file_path.suffix.lower() == ".csv":
        return _parse_csv(file_path)
    elif file_path.suffix.lower() == ".xlsx":
        return _parse_xlsx(file_path)
    elif file_path.suffix.lower() == ".xlsb":
        return _parse_xlsb(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_path.suffix}")


def _parse_csv(file_path: Path) -> Dict[str, pd.DataFrame]:
    """Parse CSV file. CSV is treated as single sheet named 'data'."""
    try:
        df = pd.read_csv(file_path, dtype=str)
        # Clean column names: strip whitespace, lowercase, underscores
        df.columns = [col.strip() for col in df.columns]
        return {"data": df}
    except Exception as e:
        logger.error(f"Failed to parse CSV: {e}")
        raise


def _parse_xlsx(file_path: Path) -> Dict[str, pd.DataFrame]:
    """Parse .xlsx file using openpyxl. Returns all sheets."""
    try:
        excel_file = pd.ExcelFile(file_path)
        sheets = {}

        for sheet_name in excel_file.sheet_names:
            df = pd.read_excel(file_path, sheet_name=sheet_name, dtype=str)
            # Clean column names
            df.columns = [col.strip() if isinstance(col, str) else str(col) for col in df.columns]
            sheets[sheet_name] = df

        logger.info(f"Parsed {len(sheets)} sheets from {file_path.name}")
        return sheets
    except Exception as e:
        logger.error(f"Failed to parse XLSX: {e}")
        raise


def _parse_xlsb(file_path: Path) -> Dict[str, pd.DataFrame]:
    """Parse .xlsb binary Excel file using pyxlsb."""
    try:
        from pyxlsb import open_workbook

        sheets = {}
        with open_workbook(str(file_path)) as wb:
            for sheet in wb.sheets:
                # Try to read the sheet
                rows = []
                for row_idx, row in enumerate(sheet.rows):
                    row_data = [cell.v if cell else None for cell in row]
                    rows.append(row_data)
                    # Limit to first 10k rows to avoid memory bloat
                    if row_idx > 10000:
                        break

                if rows:
                    # First row is headers
                    headers = [str(h).strip() if h else f"col_{i}" for i, h in enumerate(rows[0])]
                    data = rows[1:]
                    df = pd.DataFrame(data, columns=headers)
                    df = df.astype(str)
                    sheets[sheet.name] = df

        logger.info(f"Parsed {len(sheets)} sheets from {file_path.name}")
        return sheets
    except Exception as e:
        logger.error(f"Failed to parse XLSB: {e}")
        raise


def get_sheet_preview(df: pd.DataFrame, n_rows: int = 5) -> Dict:
    """Get preview of first N rows and column names."""
    return {
        "columns": list(df.columns),
        "row_count": len(df),
        "first_rows": df.head(n_rows).values.tolist(),
    }
