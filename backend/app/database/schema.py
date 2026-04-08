"""
DuckDB schema for the Ethinos Marketing Platform.
Tables match the frontend data model exactly.
"""


def create_tables(conn):
    """Create all DuckDB tables."""

    conn.execute("""
        CREATE TABLE IF NOT EXISTS accounts (
            id          VARCHAR PRIMARY KEY,
            name        VARCHAR NOT NULL,
            industry    VARCHAR,
            currency    VARCHAR(3) DEFAULT 'INR',
            client_type VARCHAR(5) DEFAULT 'web',
            platforms   VARCHAR DEFAULT 'google,dv360,meta',
            created_at  TIMESTAMP DEFAULT NOW()
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            VARCHAR PRIMARY KEY,
            name          VARCHAR NOT NULL,
            email         VARCHAR NOT NULL UNIQUE,
            password_hash VARCHAR NOT NULL,
            role          VARCHAR DEFAULT 'viewer',
            created_at    TIMESTAMP DEFAULT NOW()
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS user_accounts (
            user_id    VARCHAR,
            account_id VARCHAR,
            PRIMARY KEY (user_id, account_id)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS auth_tokens (
            token      VARCHAR PRIMARY KEY,
            user_id    VARCHAR NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            expires_at TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS campaigns (
            id          VARCHAR PRIMARY KEY,
            account_id  VARCHAR,
            name        VARCHAR NOT NULL,
            platform    VARCHAR NOT NULL,
            type        VARCHAR,
            objective   VARCHAR,
            status      VARCHAR DEFAULT 'active',
            budget      DECIMAL(15,2),
            spent       DECIMAL(15,2),
            impressions BIGINT,
            clicks      BIGINT,
            conversions INTEGER,
            revenue     DECIMAL(15,2),
            ctr         DECIMAL(8,4),
            cpc         DECIMAL(8,4),
            cvr         DECIMAL(8,4),
            roas        DECIMAL(8,4),
            reach       BIGINT,
            frequency   DECIMAL(8,4),
            created_at  TIMESTAMP DEFAULT NOW()
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS ad_groups (
            id          VARCHAR PRIMARY KEY,
            campaign_id VARCHAR NOT NULL,
            account_id  VARCHAR,
            name        VARCHAR NOT NULL,
            impressions BIGINT,
            clicks      BIGINT,
            spend       DECIMAL(15,2),
            conversions INTEGER,
            ctr         DECIMAL(8,4),
            cpc         DECIMAL(8,4),
            cvr         DECIMAL(8,4)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS ad_sets (
            id          VARCHAR PRIMARY KEY,
            campaign_id VARCHAR NOT NULL,
            account_id  VARCHAR,
            name        VARCHAR NOT NULL,
            budget      DECIMAL(15,2),
            spent       DECIMAL(15,2),
            impressions BIGINT,
            clicks      BIGINT,
            conversions INTEGER,
            revenue     DECIMAL(15,2),
            targeting   VARCHAR
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS insertion_orders (
            id             VARCHAR PRIMARY KEY,
            campaign_id    VARCHAR,
            account_id     VARCHAR,
            name           VARCHAR NOT NULL,
            budget         DECIMAL(15,2),
            spent          DECIMAL(15,2),
            impressions    BIGINT,
            clicks         BIGINT,
            conversions    INTEGER,
            revenue        DECIMAL(15,2),
            pacing_percent DECIMAL(8,2)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS line_items (
            id                 VARCHAR PRIMARY KEY,
            insertion_order_id VARCHAR NOT NULL,
            account_id         VARCHAR,
            name               VARCHAR NOT NULL,
            budget             DECIMAL(15,2),
            spent              DECIMAL(15,2),
            impressions        BIGINT,
            clicks             BIGINT,
            conversions        INTEGER,
            revenue            DECIMAL(15,2),
            vtc                INTEGER,
            ctc                INTEGER,
            vtr                DECIMAL(8,4)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS daily_metrics (
            id          VARCHAR PRIMARY KEY,
            campaign_id VARCHAR,
            account_id  VARCHAR NOT NULL,
            platform    VARCHAR NOT NULL,
            date        DATE NOT NULL,
            impressions BIGINT,
            clicks      BIGINT,
            spend       DECIMAL(15,2),
            conversions INTEGER,
            revenue     DECIMAL(15,2),
            views       BIGINT DEFAULT 0,
            UNIQUE (campaign_id, date)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS geo_data (
            id          VARCHAR PRIMARY KEY,
            account_id  VARCHAR,
            platform    VARCHAR NOT NULL,
            city        VARCHAR NOT NULL,
            state       VARCHAR NOT NULL,
            impressions BIGINT,
            clicks      BIGINT,
            spend       DECIMAL(15,2),
            conversions INTEGER,
            ctr         DECIMAL(8,4),
            cpc         DECIMAL(8,4)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS demographics (
            id          VARCHAR PRIMARY KEY,
            account_id  VARCHAR,
            platform    VARCHAR NOT NULL,
            dimension   VARCHAR NOT NULL,
            segment     VARCHAR NOT NULL,
            impressions BIGINT,
            clicks      BIGINT,
            spend       DECIMAL(15,2),
            conversions INTEGER
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS placements (
            id             VARCHAR PRIMARY KEY,
            account_id     VARCHAR,
            platform       VARCHAR NOT NULL,
            placement_name VARCHAR NOT NULL,
            placement_type VARCHAR,
            surface        VARCHAR,
            impressions    BIGINT,
            clicks         BIGINT,
            spend          DECIMAL(15,2),
            conversions    INTEGER,
            views          BIGINT DEFAULT 0,
            vtr            DECIMAL(8,4),
            reach          BIGINT,
            frequency      DECIMAL(8,4),
            ctr            DECIMAL(8,4)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS creatives (
            id          VARCHAR PRIMARY KEY,
            account_id  VARCHAR,
            campaign_id VARCHAR,
            platform    VARCHAR NOT NULL,
            name        VARCHAR NOT NULL,
            format      VARCHAR,
            size        VARCHAR,
            impressions BIGINT,
            clicks      BIGINT,
            conversions INTEGER,
            spend       DECIMAL(15,2),
            frequency   DECIMAL(8,4),
            ctr         DECIMAL(8,4),
            cvr         DECIMAL(8,4),
            roas        DECIMAL(8,4)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS search_terms (
            id            VARCHAR PRIMARY KEY,
            account_id    VARCHAR,
            keyword       VARCHAR NOT NULL,
            match_type    VARCHAR,
            impressions   BIGINT,
            clicks        BIGINT,
            spend         DECIMAL(15,2),
            conversions   INTEGER,
            quality_score INTEGER,
            ctr           DECIMAL(8,4),
            cpc           DECIMAL(8,4),
            cvr           DECIMAL(8,4)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS pmax_channels (
            id          VARCHAR PRIMARY KEY,
            account_id  VARCHAR,
            channel     VARCHAR NOT NULL,
            impressions BIGINT,
            clicks      BIGINT,
            conversions INTEGER,
            spend       DECIMAL(15,2),
            revenue     DECIMAL(15,2),
            ctr         DECIMAL(8,4),
            cpc         DECIMAL(8,4),
            cvr         DECIMAL(8,4),
            roas        DECIMAL(8,4)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS upload_history (
            id             VARCHAR PRIMARY KEY,
            account_id     VARCHAR,
            platform       VARCHAR NOT NULL,
            filename       VARCHAR NOT NULL,
            rows_imported  INTEGER DEFAULT 0,
            rows_skipped   INTEGER DEFAULT 0,
            status         VARCHAR DEFAULT 'pending',
            error_message  TEXT,
            column_mapping VARCHAR,
            uploaded_at    TIMESTAMP DEFAULT NOW()
        )
    """)

    conn.commit()


def drop_all_tables(conn):
    """Drop all tables. Use only in dev/testing."""
    tables = [
        "upload_history", "pmax_channels", "search_terms", "creatives",
        "placements", "demographics", "geo_data", "daily_metrics",
        "line_items", "insertion_orders", "ad_sets", "ad_groups",
        "campaigns", "auth_tokens", "user_accounts", "users", "accounts"
    ]
    for table in tables:
        conn.execute(f"DROP TABLE IF EXISTS {table}")
    conn.commit()
