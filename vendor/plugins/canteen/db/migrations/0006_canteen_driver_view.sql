-- =============================================================================
-- canteen 0006 — The driver's own view: a driver linked to a staff account, and stops ticked
-- as delivered
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

-- The DevQuake account of a driver (staff with the driver role); NULL: printed sheet only.
SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_drivers'
                    AND COLUMN_NAME = 'user_id');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_drivers ADD COLUMN user_id INT UNSIGNED NULL AFTER phone, ADD KEY ix_canteen_drivers_user (user_id)',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- When the meal was handed over (UTC), ticked by the driver on their phone.
SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_route_stops'
                    AND COLUMN_NAME = 'delivered_at');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_route_stops ADD COLUMN delivered_at DATETIME NULL AFTER position',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0006_canteen_driver_view');
