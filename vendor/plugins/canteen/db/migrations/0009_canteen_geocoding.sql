-- =============================================================================
-- canteen 0009 — Map positions for computing the order of delivery stops (OpenRouteService)
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- An address is looked up once; geo_address keeps the text it was looked up from, so a changed
-- address is looked up again. Only addresses are sent, never names.
-- =============================================================================

SET NAMES utf8mb4;

SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_people'
                    AND COLUMN_NAME = 'geo_lat');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_people ADD COLUMN geo_lat DECIMAL(9,6) NULL, ADD COLUMN geo_lng DECIMAL(9,6) NULL, ADD COLUMN geo_address VARCHAR(255) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Where the routes start: the organisation's kitchen.
SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_orgs'
                    AND COLUMN_NAME = 'kitchen_address');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_orgs ADD COLUMN kitchen_address VARCHAR(255) NULL, ADD COLUMN kitchen_lat DECIMAL(9,6) NULL, ADD COLUMN kitchen_lng DECIMAL(9,6) NULL, ADD COLUMN kitchen_geo_address VARCHAR(255) NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0009_canteen_geocoding');
