"""
DuckDB schema for the Ethinos Marketing Platform.
Tables match the frontend data model exactly.
"""


def create_tables(conn):
    """Create all DuckDB tables."""

    conn.execute("""
        CREATE TABLE IF NOT EXISTS accounts (
            id                VARCHAR PRIMARY KEY,
            name              VARCHAR NOT NULL,
            industry          VARCHAR,
            currency          VARCHAR(3) DEFAULT 'INR',
            client_type       VARCHAR(5) DEFAULT 'web',
            platforms         VARCHAR DEFAULT 'google,dv360,meta',
            brand_primary     VARCHAR,
            brand_secondary   VARCHAR,
            brand_accent      VARCHAR,
            created_at        TIMESTAMP DEFAULT NOW()
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

    # ========== INGESTION ENGINE TABLES ==========
    conn.execute("""
        CREATE TABLE IF NOT EXISTS uploads (
            id            VARCHAR PRIMARY KEY,
            account_id    VARCHAR NOT NULL,
            uploaded_by   VARCHAR,
            file_name     VARCHAR NOT NULL,
            file_path     VARCHAR NOT NULL,
            file_type     VARCHAR(20),
            status        VARCHAR(30) DEFAULT 'pending',
            rows_imported INTEGER DEFAULT 0,
            conflicts_count INTEGER DEFAULT 0,
            created_at    TIMESTAMP DEFAULT NOW()
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS upload_versions (
            id                 VARCHAR PRIMARY KEY,
            upload_id          VARCHAR NOT NULL,
            version_number     INTEGER NOT NULL,
            file_hash          VARCHAR(64),
            status             VARCHAR(30),
            conflicts_detected INTEGER DEFAULT 0,
            created_at         TIMESTAMP DEFAULT NOW(),
            UNIQUE (upload_id, version_number)
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS campaign_metrics (
            id                VARCHAR PRIMARY KEY,
            account_id        VARCHAR NOT NULL,
            upload_id         VARCHAR,
            version_id        VARCHAR,
            date_from         DATE,
            date_to           DATE,
            period_type       VARCHAR(10),
            platform          VARCHAR(20),
            campaign_name     VARCHAR(500),
            campaign_id       VARCHAR(100),
            adset_name        VARCHAR(500),
            adset_id          VARCHAR(100),
            ad_name           VARCHAR(500),
            funnel_stage      VARCHAR(10),
            category          VARCHAR(100),
            city              VARCHAR(100),
            theme             VARCHAR(100),
            impressions       BIGINT,
            reach             BIGINT,
            clicks            INTEGER,
            ctr               DECIMAL(8,4),
            cpc               DECIMAL(10,2),
            cpm               DECIMAL(10,2),
            cost              DECIMAL(12,2),
            stage_values      JSON,
            data_type         VARCHAR(20),
            is_current_version BOOLEAN DEFAULT TRUE,
            created_at        TIMESTAMP DEFAULT NOW()
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS upload_conflicts (
            id            VARCHAR PRIMARY KEY,
            upload_id     VARCHAR NOT NULL,
            metric_id     VARCHAR,
            field_name    VARCHAR(100),
            old_value     TEXT,
            new_value     TEXT,
            pct_change    DECIMAL(8,2),
            resolved_by   VARCHAR,
            resolution    VARCHAR(20),
            resolved_at   TIMESTAMP
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS column_mappings (
            id               VARCHAR PRIMARY KEY,
            account_id       VARCHAR NOT NULL,
            raw_column_name  VARCHAR(200),
            canonical_field  VARCHAR(100),
            confidence       DECIMAL(4,2),
            source           VARCHAR(20),
            created_at       TIMESTAMP DEFAULT NOW()
        )
    """)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS funnel_stages (
            id               VARCHAR PRIMARY KEY,
            account_id       VARCHAR NOT NULL,
            name             VARCHAR(50) NOT NULL,
            label            VARCHAR(100) NOT NULL,
            order_index      INTEGER NOT NULL,
            is_revenue_stage BOOLEAN DEFAULT FALSE,
            created_at       TIMESTAMP DEFAULT NOW()
        )
    """)

    # ========== PERFORMANCE INDEXES ==========
    conn.execute("CREATE INDEX IF NOT EXISTS idx_campaign_metrics_account_date_platform ON campaign_metrics (account_id, date_from, platform)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_campaign_metrics_upload_id ON campaign_metrics (upload_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_upload_conflicts_upload_id ON upload_conflicts (upload_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_uploads_account_id ON uploads (account_id)")

    conn.commit()


def drop_all_tables(conn):
    """Drop all tables. Use only in dev/testing."""
    tables = [
        "funnel_stages", "column_mappings", "upload_conflicts", "campaign_metrics",
        "upload_versions", "uploads", "upload_history", "pmax_channels", "search_terms", "creatives",
        "placements", "demographics", "geo_data", "daily_metrics",
        "line_items", "insertion_orders", "ad_sets", "ad_groups",
        "campaigns", "auth_tokens", "user_accounts", "users", "accounts"
    ]
    for table in tables:
        conn.execute(f"DROP TABLE IF EXISTS {table}")
    conn.commit()
