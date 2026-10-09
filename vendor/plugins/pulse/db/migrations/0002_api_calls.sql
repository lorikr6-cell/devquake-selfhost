-- =============================================================================
-- Pulse 0002 — API call log and totals
--
-- api_calls   one row per call of the developer API (/v1/events, /v1/stream, /v1/poll):
--             when, which service (NULL when the key was not recognised), route, method,
--             HTTP status, source and duration. No keys, tokens, bodies or addresses.
--             Cleaned by an admin in the app (now, or automatically every N days).
-- api_totals  the number of calls, kept apart from the log so cleaning never changes it:
--             app_id 0 = every call ever made to Pulse, others = one API service (removed with
--             the service).
-- settings    app-wide settings, e.g. the automatic clean-up interval of the call log.
--
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS api_calls (
  id          BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  app_id      INT UNSIGNED      NULL,
  called_at   DATETIME(3)       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  method      VARCHAR(8)        CHARACTER SET ascii NOT NULL,
  route       VARCHAR(40)       CHARACTER SET ascii NOT NULL,
  status      SMALLINT UNSIGNED NOT NULL,
  -- server / browser / token (NULL when the caller was not identified).
  source      VARCHAR(16)       CHARACTER SET ascii NULL,
  duration_ms INT UNSIGNED      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_api_calls_app (app_id, id),
  KEY ix_api_calls_time (called_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS api_totals (
  app_id    INT UNSIGNED    NOT NULL,
  calls     BIGINT UNSIGNED NOT NULL DEFAULT 0,
  refused   BIGINT UNSIGNED NOT NULL DEFAULT 0,
  first_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_at   DATETIME        NULL,
  PRIMARY KEY (app_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
  name        VARCHAR(40)   CHARACTER SET ascii NOT NULL,
  value       VARCHAR(200)  NOT NULL,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by  INT UNSIGNED  NULL,
  PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clean the call log automatically: entries older than 30 days (0 = only by hand).
INSERT IGNORE INTO settings (name, value) VALUES ('call_log_days', '30');

INSERT IGNORE INTO schema_migrations (version) VALUES ('0002_api_calls');
