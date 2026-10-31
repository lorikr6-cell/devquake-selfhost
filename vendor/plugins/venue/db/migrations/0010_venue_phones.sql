-- =============================================================================
-- venue 0010 — Waiters' phones: pairing by QR and phone notifications (the plugin's OWN
-- database, ADR 0007; ADR 0083)
--
-- Apply to the venue database (e.g. u962314563_venue), after 0009:
--   pnpm db:migrate --plugin venue     (uses VENUE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- tablets.kind: a shared tablet (browser cookie) or a waiter's phone (the Venue app, paired by
-- QR; its token is kept only as a hash like a tablet's). phone_pairings: a one-time code the
-- owner shows as a QR, valid 10 minutes, deleted when used. phone_push: the phone's push
-- address from Google (FCM) or Apple (APNs), one per phone. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tablets' AND COLUMN_NAME = 'kind') = 0,
  'ALTER TABLE tablets ADD COLUMN kind ENUM(''tablet'',''phone'') NOT NULL DEFAULT ''tablet'' AFTER name',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

CREATE TABLE IF NOT EXISTS phone_pairings (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  venue_id    INT UNSIGNED  NOT NULL,
  name        VARCHAR(80)   NOT NULL,
  code_hash   CHAR(64)      CHARACTER SET ascii NOT NULL,
  expires_at  DATETIME      NOT NULL,
  created_by  INT UNSIGNED  NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_phone_pairings_code (code_hash),
  KEY ix_phone_pairings_venue (venue_id),
  CONSTRAINT fk_phone_pairings_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS phone_push (
  tablet_id   INT UNSIGNED  NOT NULL,
  venue_id    INT UNSIGNED  NOT NULL,
  platform    ENUM('fcm','apns') NOT NULL,
  token       VARCHAR(255)  CHARACTER SET ascii NOT NULL,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (tablet_id),
  KEY ix_phone_push_venue (venue_id),
  CONSTRAINT fk_phone_push_tablet FOREIGN KEY (tablet_id) REFERENCES tablets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0010_venue_phones');
