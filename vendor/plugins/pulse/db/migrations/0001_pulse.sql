-- =============================================================================
-- pulse 0001 — Realtime events API (the plugin's OWN database, ADR 0007 and ADR 0023)
--
-- Apply to the pulse database (e.g. u962314563_pulse), NOT the platform database:
--   pnpm db:migrate --plugin pulse     (uses PULSE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- Secrets are never stored: an app's secret key is derived from PULSE_MASTER_KEY and a random
-- salt (secret_salt), shown once, and checked by deriving it again. IP addresses are stored only
-- as keyed hashes. user ids are the platform's user ids (no cross-database foreign keys).
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(100) NOT NULL,
  applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A member's plan beyond the standard subscription (set by DevQuake, e.g. after a "full access"
-- request). No row = standard.
CREATE TABLE IF NOT EXISTS accounts (
  user_id     INT UNSIGNED NOT NULL,
  plan        ENUM('standard', 'full') NOT NULL DEFAULT 'standard',
  note        VARCHAR(200) NULL,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- An API service ("app") of one member. Never shared with other members.
CREATE TABLE IF NOT EXISTS apps (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id            INT UNSIGNED NOT NULL,
  name               VARCHAR(80)  NOT NULL,
  public_key         VARCHAR(40)  CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  secret_salt        CHAR(32)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  secret_hint        CHAR(4)      CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  -- After a rotation the previous secret keeps working until prev_secret_until (a grace period).
  prev_secret_salt   CHAR(32)     CHARACTER SET ascii COLLATE ascii_bin NULL,
  prev_secret_until  DATETIME     NULL,
  secret_rotated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  browser_publish    TINYINT(1)   NOT NULL DEFAULT 0,
  strict_schema      TINYINT(1)   NOT NULL DEFAULT 0,
  allow_localhost    TINYINT(1)   NOT NULL DEFAULT 1,
  -- Optional: the only IP addresses the secret key may be used from (comma separated).
  server_ips         VARCHAR(400) NULL,
  paused             TINYINT(1)   NOT NULL DEFAULT 0,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_apps_public_key (public_key),
  KEY ix_apps_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Websites whose browsers may use the app's public key. An origin works once verified with a
-- DNS TXT record (localhost needs no verification, if the app allows it).
CREATE TABLE IF NOT EXISTS app_origins (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  app_id        INT UNSIGNED NOT NULL,
  origin        VARCHAR(200) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  verify_token  CHAR(32)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  verified_at   DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_app_origins (app_id, origin),
  KEY ix_app_origins_origin (origin),
  CONSTRAINT fk_app_origins_app FOREIGN KEY (app_id) REFERENCES apps (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The member's own key:value structure per event name: fields = JSON array of
-- {"key", "type": "string"|"number"|"boolean", "required"}.
CREATE TABLE IF NOT EXISTS event_types (
  app_id      INT UNSIGNED NOT NULL,
  name        VARCHAR(64)  CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  fields      TEXT         NOT NULL,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (app_id, name),
  CONSTRAINT fk_event_types_app FOREIGN KEY (app_id) REFERENCES apps (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Published events, kept for a short history (reconnecting clients catch up), then pruned.
-- No foreign key: written very often; removed with the app by the plugin.
CREATE TABLE IF NOT EXISTS events (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  app_id      INT UNSIGNED    NOT NULL,
  channel     VARCHAR(64)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  event       VARCHAR(64)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  data        TEXT            NOT NULL,
  source      ENUM('server', 'browser', 'token', 'console') NOT NULL,
  -- The `sub` of the client token that sent it (who it is in the member's own app).
  sender      VARCHAR(64)     NULL,
  created_at  DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY ix_events_app (app_id, id),
  KEY ix_events_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usage per app and UTC day (limits and the dashboard).
CREATE TABLE IF NOT EXISTS usage_daily (
  app_id    INT UNSIGNED NOT NULL,
  day       DATE         NOT NULL,
  events    INT UNSIGNED NOT NULL DEFAULT 0,
  rejected  INT UNSIGNED NOT NULL DEFAULT 0,
  streams   INT UNSIGNED NOT NULL DEFAULT 0,
  polls     INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (app_id, day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Where the secret key was used from (keyed hashes of IP addresses), to spot a shared key.
CREATE TABLE IF NOT EXISTS server_ips (
  app_id   INT UNSIGNED NOT NULL,
  day      DATE         NOT NULL,
  ip_hash  CHAR(16)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  PRIMARY KEY (app_id, day, ip_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refused calls and key changes, shown to the owner.
CREATE TABLE IF NOT EXISTS security_log (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  app_id      INT UNSIGNED    NOT NULL,
  kind        VARCHAR(32)     NOT NULL,
  detail      VARCHAR(200)    NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_security_log_app (app_id, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Open live connections (all server processes), for the per-app connection limit.
CREATE TABLE IF NOT EXISTS streams (
  id         CHAR(16)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  app_id     INT UNSIGNED NOT NULL,
  opened_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  seen_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_streams_app (app_id, seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0001_pulse');
