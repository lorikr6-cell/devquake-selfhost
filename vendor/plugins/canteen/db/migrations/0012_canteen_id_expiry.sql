-- =============================================================================
-- canteen 0012 — The expiry date of a person's ID card, next to the CNP and the series and number
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- A plain DATE (shown as stored); the CNP and the number stay encrypted.
-- =============================================================================

SET NAMES utf8mb4;

SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_people'
                    AND COLUMN_NAME = 'id_expires_on');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_people ADD COLUMN id_expires_on DATE NULL AFTER cnp_sealed',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0012_canteen_id_expiry');
