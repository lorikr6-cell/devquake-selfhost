-- =============================================================================
-- canteen 0017 — Invitations keep their history: open, accepted (by whom, when) or revoked,
-- instead of being deleted when used. Expired is an open one past expires_at. The history of
-- the last 180 days is shown to organisers on the staff page; older rows are removed when the
-- next invitation is made.
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_invites'
                    AND COLUMN_NAME = 'status');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_invites ADD COLUMN status ENUM(''open'',''accepted'',''revoked'') NOT NULL DEFAULT ''open'', ADD COLUMN accepted_by INT UNSIGNED NULL, ADD COLUMN accepted_name VARCHAR(80) NULL, ADD COLUMN closed_at DATETIME NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0017_canteen_invite_history');
