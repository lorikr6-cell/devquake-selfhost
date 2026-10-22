-- =============================================================================
-- canteen 0008 — The organisation's own page: logo, description and whether visitors see it
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- The logo is public once the page is (not encrypted); nothing about the people served is ever
-- on that page.
-- =============================================================================

SET NAMES utf8mb4;

SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_orgs'
                    AND COLUMN_NAME = 'description');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_orgs ADD COLUMN description TEXT NULL AFTER name, ADD COLUMN public_page TINYINT(1) NOT NULL DEFAULT 0 AFTER description, ADD COLUMN logo_mime VARCHAR(40) NULL AFTER public_page, ADD COLUMN logo MEDIUMBLOB NULL AFTER logo_mime, ADD COLUMN logo_updated_at DATETIME NULL AFTER logo',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0008_canteen_org_page');
