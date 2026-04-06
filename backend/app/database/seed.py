import csv
import json
import uuid
from pathlib import Path
from datetime import datetime
from app.database.connection import get_connection
from app.config import settings

def seed_database():
    """Load sample CSV data into DuckDB."""
    conn = get_connection()

    # Client data
    clients = [
        {
            "id": "550e8400-e29b-41d4-a716-446655440000",
            "name": "TechStore E-commerce",
            "industry": "Retail / E-commerce"
        },
        {
            "id": "550e8400-e29b-41d4-a716-446655440010",
            "name": "RealEstate Luxury",
            "industry": "Real Estate"
        }
    ]

    # Insert clients
    for client in clients:
        conn.execute(
            """
            INSERT INTO clients (id, name, industry, created_at)
            VALUES (?, ?, ?, ?)
            """,
            [client["id"], client["name"], client["industry"], datetime.now()]
        )

    # Campaign data
    campaigns = [
        {"id": "550e8400-e29b-41d4-a716-446655440001", "client_id": "550e8400-e29b-41d4-a716-446655440000", "name": "TechStore Product Launch", "platform": "google_ads", "budget": 5000},
        {"id": "550e8400-e29b-41d4-a716-446655440011", "client_id": "550e8400-e29b-41d4-a716-446655440000", "name": "TechStore Seasonal Promotion", "platform": "google_ads", "budget": 8000},
        {"id": "550e8400-e29b-41d4-a716-446655440021", "client_id": "550e8400-e29b-41d4-a716-446655440000", "name": "TechStore Retargeting", "platform": "google_ads", "budget": 6000},
        {"id": "550e8400-e29b-41d4-a716-446655440031", "client_id": "550e8400-e29b-41d4-a716-446655440010", "name": "RealEstate Property Showcase", "platform": "google_ads", "budget": 12000},
        {"id": "550e8400-e29b-41d4-a716-446655440032", "client_id": "550e8400-e29b-41d4-a716-446655440010", "name": "RealEstate Lead Generation", "platform": "google_ads", "budget": 15000},
        {"id": "650e8400-e29b-41d4-a716-446655440001", "client_id": "550e8400-e29b-41d4-a716-446655440010", "name": "RealEstate Luxury Display", "platform": "dv360", "budget": 10000},
        {"id": "650e8400-e29b-41d4-a716-446655440011", "client_id": "550e8400-e29b-41d4-a716-446655440010", "name": "RealEstate Prospects Video", "platform": "dv360", "budget": 8000},
        {"id": "650e8400-e29b-41d4-a716-446655440021", "client_id": "550e8400-e29b-41d4-a716-446655440010", "name": "RealEstate Retargeting", "platform": "dv360", "budget": 7000},
        {"id": "750e8400-e29b-41d4-a716-446655440001", "client_id": "550e8400-e29b-41d4-a716-446655440000", "name": "TechStore Facebook Feed", "platform": "meta", "budget": 4000},
        {"id": "750e8400-e29b-41d4-a716-446655440011", "client_id": "550e8400-e29b-41d4-a716-446655440000", "name": "TechStore Instagram Stories", "platform": "meta", "budget": 3500},
        {"id": "750e8400-e29b-41d4-a716-446655440021", "client_id": "550e8400-e29b-41d4-a716-446655440000", "name": "TechStore Retargeting Audience", "platform": "meta", "budget": 3000},
    ]

    # Insert campaigns
    for campaign in campaigns:
        conn.execute(
            """
            INSERT INTO campaigns (id, client_id, platform, name, budget, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            [campaign["id"], campaign["client_id"], campaign["platform"], campaign["name"], campaign["budget"], datetime.now()]
        )

    # Load CSV files
    csv_files = [
        ("google_ads_sample.csv", Path(settings.LOG_DIR).parent.parent / "data" / "google_ads_sample.csv"),
        ("dv360_sample.csv", Path(settings.LOG_DIR).parent.parent / "data" / "dv360_sample.csv"),
        ("meta_sample.csv", Path(settings.LOG_DIR).parent.parent / "data" / "meta_sample.csv"),
    ]

    for csv_name, csv_path in csv_files:
        if csv_path.exists():
            with open(csv_path, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    conn.execute(
                        """
                        INSERT INTO metrics (id, campaign_id, date, impressions, clicks, spend, conversions, revenue, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        [
                            str(uuid.uuid4()),
                            row['campaign_id'],
                            row['date'],
                            int(row['impressions']),
                            int(row['clicks']),
                            float(row['spend']),
                            int(row['conversions']),
                            float(row['revenue']),
                            datetime.now()
                        ]
                    )

    conn.commit()
    conn.close()

    print("✅ Sample data loaded successfully")

if __name__ == "__main__":
    seed_database()
