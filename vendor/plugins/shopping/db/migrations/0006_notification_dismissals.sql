-- =============================================================================
-- shopping 0006 — Clearing notifications
--
-- notification_clears: everything up to and including cleared_up_to is gone from that person's
--   bell ("Clear all"), on every device.
-- notification_dismissals: single notifications a person removed. Removed with the event
--   (events are kept 30 days) or the person.
--
-- Apply to the shopping database: pnpm db:migrate --plugin shopping, or phpMyAdmin → Import.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS notification_clears (
  user_id        INT UNSIGNED    NOT NULL,
  cleared_up_to  BIGINT UNSIGNED NOT NULL,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_dismissals (
  user_id   INT UNSIGNED    NOT NULL,
  event_id  BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (user_id, event_id),
  KEY ix_notification_dismissals_event (event_id),
  CONSTRAINT fk_notification_dismissals_event FOREIGN KEY (event_id) REFERENCES list_events (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0006_notification_dismissals');
