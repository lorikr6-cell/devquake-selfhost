-- =============================================================================
-- canteen 0002 — Staff invitations: a one-time link with the role the organiser chose
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

-- One invitation = one person: the link works once, for 7 days. invited_by on the staff row
-- records who brought them in (the app is free for people a member invites, ADR 0043).
CREATE TABLE IF NOT EXISTS canteen_invites (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id      INT UNSIGNED NOT NULL,
  code        CHAR(12)     NOT NULL,
  role        ENUM('organiser','coordinator','kitchen','driver','medical') NOT NULL,
  created_by  INT UNSIGNED NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME     NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_canteen_invites_code (code),
  KEY ix_canteen_invites_org (org_id),
  CONSTRAINT fk_canteen_invites_org FOREIGN KEY (org_id) REFERENCES canteen_orgs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_staff'
                    AND COLUMN_NAME = 'invited_by');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_staff ADD COLUMN invited_by INT UNSIGNED NULL AFTER role',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0002_canteen_invites');
