-- ==============================================================================
-- PG-Management-SaaS PostgreSQL Bootstrap Script
-- Installs required PostgreSQL extensions only.
-- Application schema DDL is managed exclusively by Flyway migrations in:
--   backend/src/main/resources/db/migration/
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
