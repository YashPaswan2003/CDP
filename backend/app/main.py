import json
import logging
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.connection import init_db, get_connection
from app.database.seed import seed_database
from app.database.seed_realistic import seed_all as seed_realistic_data
from app.routes import auth, upload, dashboard, chat, analytics, accounts, alerts, config, flags, actions, presentations
from app.routes.funnel_stages import router as funnel_stages_router

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

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="CDP Marketing Platform API",
    version="0.1.0",
)

# Add CORS middleware with environment-driven origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event handler
@app.on_event("startup")
async def startup_event():
    """Initialize database on app startup."""
    api_logger.info("Initializing database...")
    try:
        init_db()

        # Check if data needs loading
        conn = get_connection()
        result = conn.execute("SELECT COUNT(*) as count FROM campaigns").fetchall()
        campaigns_count = result[0][0]
        conn.close()

        if campaigns_count == 0:
            api_logger.info("Loading sample data...")
            seed_database()

        # Seed realistic client data (always check, independent of campaigns_count)
        check_conn = None
        try:
            check_conn = get_connection()
            realistic_check = check_conn.execute("SELECT COUNT(*) FROM accounts WHERE id = 'urbancart'").fetchone()
            if realistic_check[0] == 0:
                api_logger.info("Seeding realistic client data (UrbanCart, PropNest, CloudStack, FreshBite)...")
                seed_realistic_data(check_conn)
                api_logger.info("Realistic client data seeded successfully")
            else:
                api_logger.info("Realistic client data already exists, skipping")
        except Exception as e:
            api_logger.error(f"Failed to seed realistic data: {str(e)}", exc_info=True)
        finally:
            if check_conn:
                check_conn.close()

        api_logger.info(f"Database ready. Campaigns records: {campaigns_count}")
    except Exception as e:
        api_logger.error(f"Startup error: {str(e)}", exc_info=True)

# Include routers
app.include_router(config.router)  # Client config (required for flags)
app.include_router(flags.router)   # Monitor/Diagnose/Act flags
app.include_router(actions.router)  # Action execution (pause, resume, adjust, etc.)
app.include_router(presentations.router)  # Presentation generation
app.include_router(alerts.router, prefix="/api")  # Health alerts and anomaly detection
app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(upload.router)
app.include_router(funnel_stages_router)
app.include_router(dashboard.router)
app.include_router(chat.router)
app.include_router(analytics.router)

# Health check endpoint
@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

# Analytics endpoints are now in analytics.py router
# Legacy test endpoints have been removed - use /api/analytics/* instead

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
