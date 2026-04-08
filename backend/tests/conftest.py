"""Pytest configuration and shared fixtures for all tests."""

import pytest
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from app.database.connection import init_db, get_connection
from app.database.schema import drop_all_tables
from app.database.seed import seed_database


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Initialize database for test session.

    This runs ONCE per test session before any tests run.
    TestClient doesn't trigger lifespan, so we manually initialize.
    """
    print("\n=== Setting up test database ===")

    # Clear old data first
    conn = get_connection()
    drop_all_tables(conn)
    conn.close()
    print("✓ Old database dropped")

    # Initialize schema
    init_db()
    print("✓ Database schema created")

    # Seed with test data
    seed_database()
    print("✓ Test data loaded")

    yield

    # Cleanup (optional - commented out to preserve db for inspection)
    # conn = get_connection()
    # drop_all_tables(conn)
    # conn.close()
    # print("✓ Database cleaned up")


@pytest.fixture(autouse=True)
def reset_campaigns_count():
    """Reset campaigns count check state between tests if needed."""
    yield
    # Each test gets a fresh check, no cleanup needed since DB persists
