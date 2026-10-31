-- =============================================================================
-- venue 0008 — Waiters' sections, guests calling the waiter, and browser push notifications
-- (the plugin's OWN database, ADR 0007)
--
-- Apply to the venue database (e.g. u962314563_venue), after 0007:
--   pnpm db:migrate --plugin venue     (uses VENUE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- venue_tables.waiter_staff_id: the waiter whose section the table is in. bills.waiter_*: who
-- looks after this seating (assigned when guests scan the sticker or staff open the bill).
-- venue_calls: a guest raised a hand (open → coming → done); kept 30 days for the history.
-- push_subscriptions: a device of a waiter (or the owner) that gets browser push notifications
-- (Web Push). push_keys: the app's own VAPID key pair, made on first use. menu_designs.format:
-- the menu's page shape (A4 or a ratio such as 1:1, 16:9, 4:5). SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'venue_tables' AND COLUMN_NAME = 'waiter_staff_id') = 0,
  'ALTER TABLE venue_tables ADD COLUMN waiter_staff_id INT UNSIGNED NULL AFTER seats',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bills' AND COLUMN_NAME = 'waiter_staff_id') = 0,
  'ALTER TABLE bills ADD COLUMN waiter_staff_id INT UNSIGNED NULL AFTER opened_by,
     ADD COLUMN waiter_name VARCHAR(80) NULL AFTER waiter_staff_id',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

CREATE TABLE IF NOT EXISTS venue_calls (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  venue_id         INT UNSIGNED  NOT NULL,
  table_id         INT UNSIGNED  NOT NULL,
  table_name       VARCHAR(40)   NOT NULL,
  waiter_staff_id  INT UNSIGNED  NULL,
  status           ENUM('open', 'coming', 'done') NOT NULL DEFAULT 'open',
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  answered_at      DATETIME      NULL,
  answered_by      VARCHAR(80)   NULL,
  PRIMARY KEY (id),
  KEY ix_venue_calls_open (venue_id, status, created_at),
  KEY ix_venue_calls_table (table_id, status),
  CONSTRAINT fk_venue_calls_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  venue_id    INT UNSIGNED  NOT NULL,
  -- The waiter it belongs to; NULL with is_owner = 1 for the owner's own device.
  staff_id    INT UNSIGNED  NULL,
  is_owner    TINYINT(1)    NOT NULL DEFAULT 0,
  endpoint    VARCHAR(500)  CHARACTER SET ascii NOT NULL,
  p256dh      VARCHAR(120)  CHARACTER SET ascii NOT NULL,
  auth        VARCHAR(40)   CHARACTER SET ascii NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_push_endpoint (endpoint(255)),
  KEY ix_push_venue (venue_id, staff_id),
  CONSTRAINT fk_push_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS push_keys (
  id           TINYINT UNSIGNED NOT NULL,
  public_key   VARCHAR(120)  CHARACTER SET ascii NOT NULL,
  private_key  VARCHAR(80)   CHARACTER SET ascii NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'menu_designs' AND COLUMN_NAME = 'format') = 0,
  'ALTER TABLE menu_designs ADD COLUMN format VARCHAR(8) CHARACTER SET ascii NOT NULL DEFAULT ''a4'' AFTER subtitle',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0008_venue_calls');
