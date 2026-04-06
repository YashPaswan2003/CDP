import duckdb
from app.config import settings

def get_connection():
    """Get DuckDB connection."""
    return duckdb.connect(settings.DB_PATH)

def init_db():
    """Initialize database and create schema."""
    conn = get_connection()
    from app.database.schema import create_tables
    create_tables(conn)
    conn.close()
