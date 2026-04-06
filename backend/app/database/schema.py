def create_tables(conn):
    """Create DuckDB tables."""

    # Clients table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS clients (
            id UUID PRIMARY KEY,
            name VARCHAR NOT NULL,
            industry VARCHAR,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Campaigns table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS campaigns (
            id UUID PRIMARY KEY,
            client_id UUID NOT NULL,
            platform VARCHAR NOT NULL,
            name VARCHAR NOT NULL,
            budget DECIMAL(12, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id)
        )
    """)

    # Metrics table
    conn.execute("""
        CREATE TABLE IF NOT EXISTS metrics (
            id UUID PRIMARY KEY,
            campaign_id UUID NOT NULL,
            date DATE NOT NULL,
            impressions BIGINT,
            clicks BIGINT,
            spend DECIMAL(12, 2),
            conversions INTEGER,
            revenue DECIMAL(12, 2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
        )
    """)

    conn.commit()
