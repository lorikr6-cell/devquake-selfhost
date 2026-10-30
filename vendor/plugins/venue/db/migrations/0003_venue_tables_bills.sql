-- =============================================================================
-- venue 0003 — Tables with QR stickers, bills, staff on tablets, and the sales numbers
-- (the plugin's OWN database, ADR 0007; tablets and PINs: ADR 0080)
--
-- Apply to the venue database (e.g. u962314563_venue), after 0002:
--   pnpm db:migrate --plugin venue     (uses VENUE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- venue_tables: each table's fixed sticker code (/t/<code>). bills: one per seating, with its own
-- code for the guests (/b/<code>); finalised bills are deleted after 6 months by the scheduled
-- run, and only sales_days / sales_items (the numbers) stay. Lines keep a snapshot of the item's
-- name, price and VAT rate. Money in minor units, VAT in basis points, every DATETIME UTC.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS venue_tables (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  venue_id    INT UNSIGNED  NOT NULL,
  name        VARCHAR(40)   NOT NULL,
  seats       TINYINT UNSIGNED NOT NULL DEFAULT 4,
  code        CHAR(10)      CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  sort_order  SMALLINT      NOT NULL DEFAULT 0,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_venue_tables_code (code),
  KEY ix_venue_tables_venue (venue_id, sort_order),
  CONSTRAINT fk_venue_tables_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bills (
  id                 INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  venue_id           INT UNSIGNED  NOT NULL,
  table_id           INT UNSIGNED  NULL,
  table_name         VARCHAR(40)   NULL,
  code               CHAR(12)      CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  status             ENUM('open', 'final') NOT NULL DEFAULT 'open',
  opened_by          VARCHAR(80)   NOT NULL,
  opened_at          DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- The guest's tip choice: a percentage (basis points), 'fixed', or none.
  tip_percent        SMALLINT UNSIGNED NULL,
  tip_fixed          TINYINT(1)    NOT NULL DEFAULT 0,
  finalized_at       DATETIME      NULL,
  finalized_by       VARCHAR(80)   NULL,
  payment            ENUM('cash', 'card', 'other') NULL,
  gross_minor        BIGINT        NOT NULL DEFAULT 0,
  tip_minor          BIGINT        NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_bills_code (code),
  KEY ix_bills_venue (venue_id, status, opened_at),
  KEY ix_bills_final (status, finalized_at),
  CONSTRAINT fk_bills_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bill_lines (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  bill_id      INT UNSIGNED  NOT NULL,
  item_id      INT UNSIGNED  NULL,
  name         VARCHAR(80)   NOT NULL,
  price_minor  BIGINT        NOT NULL,
  vat_rate     SMALLINT UNSIGNED NOT NULL,
  station      ENUM('kitchen', 'bar', 'coffee', 'none') NOT NULL DEFAULT 'kitchen',
  qty          SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  delivered    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  note         VARCHAR(120)  NULL,
  added_by     VARCHAR(80)   NOT NULL,
  added_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_bill_lines_bill (bill_id),
  CONSTRAINT fk_bill_lines_bill FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The numbers that stay after the bills are deleted (the owner's reports).
CREATE TABLE IF NOT EXISTS sales_days (
  venue_id     INT UNSIGNED  NOT NULL,
  day          DATE          NOT NULL,
  bills        INT UNSIGNED  NOT NULL DEFAULT 0,
  gross_minor  BIGINT        NOT NULL DEFAULT 0,
  net_minor    BIGINT        NOT NULL DEFAULT 0,
  tip_minor    BIGINT        NOT NULL DEFAULT 0,
  cash_minor   BIGINT        NOT NULL DEFAULT 0,
  card_minor   BIGINT        NOT NULL DEFAULT 0,
  other_minor  BIGINT        NOT NULL DEFAULT 0,
  PRIMARY KEY (venue_id, day),
  CONSTRAINT fk_sales_days_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sales_items (
  venue_id     INT UNSIGNED  NOT NULL,
  month        CHAR(7)       CHARACTER SET ascii NOT NULL,
  name         VARCHAR(80)   NOT NULL,
  qty          INT UNSIGNED  NOT NULL DEFAULT 0,
  gross_minor  BIGINT        NOT NULL DEFAULT 0,
  PRIMARY KEY (venue_id, month, name),
  CONSTRAINT fk_sales_items_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Who is on a tablet now (a staff member switched in with their PIN, ADR 0080), and PIN tries.
SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tablets' AND COLUMN_NAME = 'staff_id') = 0,
  'ALTER TABLE tablets ADD COLUMN staff_id INT UNSIGNED NULL AFTER name,
     ADD COLUMN staff_until DATETIME NULL AFTER staff_id',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff' AND COLUMN_NAME = 'pin_failures') = 0,
  'ALTER TABLE staff ADD COLUMN pin_failures TINYINT UNSIGNED NOT NULL DEFAULT 0,
     ADD COLUMN pin_locked_until DATETIME NULL',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0003_venue_tables_bills');
