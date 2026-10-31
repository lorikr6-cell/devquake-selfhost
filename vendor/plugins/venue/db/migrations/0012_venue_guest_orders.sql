-- =============================================================================
-- venue 0012 — Guests order from the table, the waiter confirms (the plugin's OWN database)
--
-- Apply to the venue database (e.g. u962314563_venue), after 0011:
--   pnpm db:migrate --plugin venue     (uses VENUE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- venues.guest_orders: whether guests may order from the sticker's page (the owner's setting, on
-- by default). guest_orders: what a guest asked for (items as JSON: item id, quantity, note),
-- waiting for the table's waiter, who confirms it (then it goes onto the bill and to the
-- stations, through the normal order) or refuses it. No names; kept 30 days. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'venues' AND COLUMN_NAME = 'guest_orders') = 0,
  'ALTER TABLE venues ADD COLUMN guest_orders TINYINT(1) NOT NULL DEFAULT 1 AFTER menu_public',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

CREATE TABLE IF NOT EXISTS guest_orders (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  venue_id         INT UNSIGNED  NOT NULL,
  table_id         INT UNSIGNED  NOT NULL,
  table_name       VARCHAR(40)   NOT NULL,
  items            TEXT          NOT NULL,
  status           ENUM('waiting','confirmed','refused') NOT NULL DEFAULT 'waiting',
  waiter_staff_id  INT UNSIGNED  NULL,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  answered_at      DATETIME      NULL,
  answered_by      VARCHAR(80)   NULL,
  PRIMARY KEY (id),
  KEY ix_guest_orders_venue (venue_id, status),
  KEY ix_guest_orders_table (table_id, id),
  CONSTRAINT fk_guest_orders_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0012_venue_guest_orders');
