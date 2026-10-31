-- =============================================================================
-- venue 0011 — The demo venue (the plugin's OWN database, ADR 0007)
--
-- Apply to the venue database (e.g. u962314563_venue), after 0010:
--   pnpm db:migrate --plugin venue     (uses VENUE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- An owner may have a demo venue beside their own (venues.is_demo = 1): a sample café filled
-- with every feature, to try the app without touching the real one. One of each per owner.
-- venue_owner_view: which of the two the owner works in now (no row: their own). Deleting the
-- demo venue removes everything in it (every table cascades from venues). SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'venues' AND COLUMN_NAME = 'is_demo') = 0,
  'ALTER TABLE venues ADD COLUMN is_demo TINYINT(1) NOT NULL DEFAULT 0 AFTER owner_user_id',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

-- One own venue and one demo venue per owner (was: one venue).
SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'venues' AND INDEX_NAME = 'uq_venues_owner_demo') = 0,
  'ALTER TABLE venues ADD UNIQUE KEY uq_venues_owner_demo (owner_user_id, is_demo)',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'venues' AND INDEX_NAME = 'uq_venues_owner') > 0,
  'ALTER TABLE venues DROP INDEX uq_venues_owner',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

CREATE TABLE IF NOT EXISTS venue_owner_view (
  user_id  INT UNSIGNED NOT NULL,
  demo     TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0011_venue_demo');
