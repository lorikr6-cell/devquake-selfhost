-- =============================================================================
-- canteen 0010 — The driver's comment on a stop (e.g. "not home, left with the neighbour")
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_route_stops'
                    AND COLUMN_NAME = 'delivery_note');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_route_stops ADD COLUMN delivery_note VARCHAR(500) NULL AFTER delivered_at',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0010_canteen_delivery_notes');
