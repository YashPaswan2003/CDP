import json
import logging
from datetime import datetime
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.connection import init_db, get_connection
from app.database.seed import seed_database

# Configure logging
log_dir = settings.LOG_DIR
log_dir.mkdir(parents=True, exist_ok=True)

# JSON logger for API logs
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_obj = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "source": "api",
            "message": record.getMessage()
        }
        return json.dumps(log_obj)

api_logger = logging.getLogger("api")
api_logger.setLevel(logging.INFO)
api_handler = logging.FileHandler(log_dir / "api.log")
api_handler.setFormatter(JSONFormatter())
api_logger.addHandler(api_handler)

db_logger = logging.getLogger("database")
db_logger.setLevel(logging.INFO)
db_handler = logging.FileHandler(log_dir / "database.log")
db_handler.setFormatter(JSONFormatter())
db_logger.addHandler(db_handler)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan context manager."""
    # Startup
    api_logger.info("Initializing database...")
    init_db()

    # Check if data needs loading
    conn = get_connection()
    result = conn.execute("SELECT COUNT(*) as count FROM metrics").fetchall()
    metrics_count = result[0][0]
    conn.close()

    if metrics_count == 0:
        api_logger.info("Loading sample data...")
        seed_database()

    api_logger.info(f"Database ready. Metrics records: {metrics_count}")

    yield

    # Shutdown
    api_logger.info("Shutting down...")

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="CDP Marketing Platform API",
    version="0.1.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

# Database query endpoint for testing
@app.get("/api/metrics/count")
def get_metrics_count():
    """Get total metrics count."""
    conn = get_connection()
    result = conn.execute("SELECT COUNT(*) as count FROM metrics").fetchall()
    count = result[0][0]
    conn.close()

    api_logger.info(f"GET /api/metrics/count - returned {count}")

    return {"total_metrics": count}

@app.get("/api/clients")
def get_clients():
    """Get all clients."""
    conn = get_connection()
    result = conn.execute("SELECT id, name, industry FROM clients").fetchall()
    conn.close()

    clients = [{"id": str(row[0]), "name": row[1], "industry": row[2]} for row in result]

    api_logger.info(f"GET /api/clients - returned {len(clients)} clients")

    return {"clients": clients}

@app.get("/api/campaigns")
def get_campaigns(client_id: str = None):
    """Get campaigns, optionally filtered by client."""
    conn = get_connection()

    if client_id:
        result = conn.execute(
            "SELECT id, client_id, platform, name, budget FROM campaigns WHERE client_id = ?",
            [client_id]
        ).fetchall()
    else:
        result = conn.execute(
            "SELECT id, client_id, platform, name, budget FROM campaigns"
        ).fetchall()

    conn.close()

    campaigns = [
        {
            "id": str(row[0]),
            "client_id": str(row[1]),
            "platform": row[2],
            "name": row[3],
            "budget": float(row[4]) if row[4] else 0
        }
        for row in result
    ]

    api_logger.info(f"GET /api/campaigns - returned {len(campaigns)} campaigns")

    return {"campaigns": campaigns}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
