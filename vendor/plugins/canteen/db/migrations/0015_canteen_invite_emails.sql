-- =============================================================================
-- canteen 0015 — Invitations sent by email (ADR 0073): when, to a masked form of the address
-- (e.g. a***@gmail.com, never the address itself) and how many times (at most 3 per invitation)
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_invites'
                    AND COLUMN_NAME = 'email_count');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_invites ADD COLUMN emailed_at DATETIME NULL, ADD COLUMN email_hint VARCHAR(80) NULL, ADD COLUMN email_count TINYINT UNSIGNED NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0015_canteen_invite_emails');
