-- =============================================================================
-- venue 0002 — Tips on the bill, set by the venue's owner (the plugin's OWN database, ADR 0007)
--
-- Apply to the venue database (e.g. u962314563_venue), after 0001:
--   pnpm db:migrate --plugin venue     (uses VENUE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- tip_mode: 'off' (no tip on the bill), 'percent' (the guest picks one of tip_percents, counted
-- on the bill before VAT) or 'fixed' (tip_fixed_minor, in the venue's minor units). Percentages
-- are basis points ("1500,2000,2500" = 15, 20 and 25 %). SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'venues' AND COLUMN_NAME = 'tip_mode') = 0,
  'ALTER TABLE venues ADD COLUMN tip_mode ENUM(''off'', ''percent'', ''fixed'') NOT NULL DEFAULT ''percent'' AFTER menu_public',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'venues' AND COLUMN_NAME = 'tip_percents') = 0,
  'ALTER TABLE venues ADD COLUMN tip_percents VARCHAR(60) CHARACTER SET ascii NOT NULL DEFAULT ''1500,2000,2500'' AFTER tip_mode',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'venues' AND COLUMN_NAME = 'tip_fixed_minor') = 0,
  'ALTER TABLE venues ADD COLUMN tip_fixed_minor BIGINT UNSIGNED NOT NULL DEFAULT 0 AFTER tip_percents',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0002_venue_tips');
