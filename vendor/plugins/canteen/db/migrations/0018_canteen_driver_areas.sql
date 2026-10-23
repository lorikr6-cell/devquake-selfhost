-- =============================================================================
-- canteen 0018 — Driver areas: the driver whose area a person living at home belongs to
-- (proposed from the addresses, changed by the organisers). Routes are built from it per day,
-- so drivers do not overlap. NULL = no area yet. Removing the driver clears it.
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_people'
                    AND COLUMN_NAME = 'area_driver_id');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_people ADD COLUMN area_driver_id INT UNSIGNED NULL, ADD CONSTRAINT fk_canteen_people_area_driver FOREIGN KEY (area_driver_id) REFERENCES canteen_drivers (id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0018_canteen_driver_areas');
