-- =============================================================================
-- pulse 0004 — DevQuake's platform service (the plugin's OWN database, ADR 0063)
--
-- Apply to the pulse database, NOT the platform database:
--   pnpm db:migrate --plugin pulse     (uses PULSE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- apps.platform = 1 marks DevQuake's own platform service (user_id 0, created by the app on
-- first use): the website and DevQuake's native apps get their live updates through it. It is
-- never listed as anyone's service, has the "platform" plan without quotas, and only admins
-- see it (/platform).
--
-- accounts.plan = 'staff': DevQuake's admins and owner. Set when they use Pulse while they are
-- staff, taken back when they use it without being staff any more; their own services get the
-- platform plan too. Members keep their trial, standard or full plan.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'apps' AND COLUMN_NAME = 'platform') = 0,
  'ALTER TABLE apps ADD COLUMN platform TINYINT(1) NOT NULL DEFAULT 0 AFTER demo',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

ALTER TABLE accounts MODIFY plan ENUM('standard', 'full', 'staff') NOT NULL DEFAULT 'standard';

INSERT IGNORE INTO schema_migrations (version) VALUES ('0004_pulse_platform');
