-- =============================================================================
-- canteen 0013 — Demo organisations: made by a platform admin with sample people, menus,
-- routes and medical files, to see every feature; their maker may view them in any role
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_orgs'
                    AND COLUMN_NAME = 'is_demo');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_orgs ADD COLUMN is_demo TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0013_canteen_demo');
