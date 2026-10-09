-- =============================================================================
-- shopping 0004 — "Not needed" items and list activity
--
-- items.dropped_at: an item was struck out as not needed any more. When it had already been
-- bought (done_at set too) the money is spent anyway: the list shows it darker and statistics
-- count it as "bought but not needed".
--
-- list_events: who did what on a list ("Ana added Milk", "Bob ticked off Bread"), for the
-- in-app notifications. Kept for 30 days.
--
-- Apply to the shopping database: pnpm db:migrate --plugin shopping, or phpMyAdmin → Import.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items' AND COLUMN_NAME = 'dropped_at') = 0,
  'ALTER TABLE items ADD COLUMN dropped_at DATETIME NULL AFTER done_by_name,
     ADD COLUMN dropped_by INT UNSIGNED NULL AFTER dropped_at,
     ADD COLUMN dropped_by_name VARCHAR(100) NULL AFTER dropped_by',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

CREATE TABLE IF NOT EXISTS list_events (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  list_id     INT UNSIGNED    NOT NULL,
  user_id     INT UNSIGNED    NULL,
  user_name   VARCHAR(100)    NULL,
  kind        VARCHAR(24)     NOT NULL,
  item_name   VARCHAR(120)    NULL,
  created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_list_events_list (list_id, id),
  KEY ix_list_events_created (created_at),
  CONSTRAINT fk_list_events_list FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0004_not_needed_and_activity');
