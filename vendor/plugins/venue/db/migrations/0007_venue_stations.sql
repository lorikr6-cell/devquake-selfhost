-- =============================================================================
-- venue 0007 — Kitchen and bar screens: what is ready to bring (the plugin's OWN database,
-- ADR 0007)
--
-- Apply to the venue database (e.g. u962314563_venue), after 0006:
--   pnpm db:migrate --plugin venue     (uses VENUE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- bill_lines.ready: how many of a line the kitchen, bar or coffee station has made (0 to qty);
-- the waiter brings them (delivered). ready_at: when the last one was made. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bill_lines' AND COLUMN_NAME = 'ready') = 0,
  'ALTER TABLE bill_lines ADD COLUMN ready SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER qty,
     ADD COLUMN ready_at DATETIME NULL AFTER delivered',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0007_venue_stations');
