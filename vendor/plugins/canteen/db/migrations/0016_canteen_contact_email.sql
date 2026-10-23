-- =============================================================================
-- canteen 0016 — The organisation's contact email: shown on its page and used as the reply
-- address of its invitation emails. NULL = DevQuake's contact@devquake.com (the default).
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_orgs'
                    AND COLUMN_NAME = 'contact_email');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_orgs ADD COLUMN contact_email VARCHAR(254) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0016_canteen_contact_email');
