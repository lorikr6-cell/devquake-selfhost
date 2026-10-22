-- =============================================================================
-- canteen 0011 — Drivers' licences: the picture, the number, the expiry date, and whether the
-- driver's name was found on it
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- The picture and the number are stored ENCRYPTED (lib/crypto.ts); the expiry date is plain,
-- for the warnings. Deleting the driver deletes the licence.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS canteen_driver_licences (
  driver_id       INT UNSIGNED NOT NULL,
  mime            VARCHAR(40)  NOT NULL,
  data            MEDIUMBLOB   NOT NULL,
  thumb_mime      VARCHAR(40)  NULL,
  thumb           MEDIUMBLOB   NULL,
  number_sealed   VARCHAR(200) NULL,
  expires_on      DATE         NOT NULL,
  name_checked    TINYINT(1)   NOT NULL DEFAULT 0,
  uploaded_by     INT UNSIGNED NOT NULL,
  uploaded_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (driver_id),
  CONSTRAINT fk_canteen_driver_licences_driver FOREIGN KEY (driver_id) REFERENCES canteen_drivers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0011_canteen_driver_licences');
