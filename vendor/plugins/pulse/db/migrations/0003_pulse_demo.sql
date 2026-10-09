-- =============================================================================
-- pulse 0003 — The live demo service (the plugin's OWN database, ADR 0029)
--
-- Apply to the pulse database, NOT the platform database:
--   pnpm db:migrate --plugin pulse     (uses PULSE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- apps.demo = 1 marks DevQuake's own demo service (user_id 0, created by the app on first use):
-- members try Pulse between two of their browsers on their own private channel, with client
-- tokens signed by the demo service, without using their own services or plan. It is never
-- listed as anyone's service, and its events are removed after an hour.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'apps' AND COLUMN_NAME = 'demo') = 0,
  'ALTER TABLE apps ADD COLUMN demo TINYINT(1) NOT NULL DEFAULT 0 AFTER paused',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0003_pulse_demo');
