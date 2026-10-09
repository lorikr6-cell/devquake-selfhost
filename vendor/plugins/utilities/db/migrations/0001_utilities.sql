-- =============================================================================
-- utilities 0001 — Utility bill manager (the plugin's OWN database, ADR 0007)
--
-- Apply to the bills database (e.g. u962314563_utilities), NOT the platform database:
--   pnpm db:migrate --plugin utilities     (uses UTILITIES_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- user ids are the platform's user ids, stored as plain numbers (no cross-database foreign
-- keys). Display names are copied in so the plugin never reads the platform database.
-- Money is DECIMAL(12,2) in the utility's currency; consumption DECIMAL(14,3) in its unit.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(100) NOT NULL,
  applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Every person using the app gives their full name and address (to check their meter if
-- needed). Shown only to the people they share a utility with.
CREATE TABLE IF NOT EXISTS profiles (
  user_id       INT UNSIGNED NOT NULL,
  full_name     VARCHAR(120) NOT NULL,
  address       VARCHAR(255) NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A utility (electricity, gas, a Steam subscription...) that receives a bill every period.
-- category is a code from lib/categories.ts; meter_required = every participant sends a meter
-- reading with a photo, and the bill is split by consumption.
CREATE TABLE IF NOT EXISTS utilities (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id   INT UNSIGNED NOT NULL,
  name            VARCHAR(80)  NOT NULL,
  category        VARCHAR(20)  NOT NULL DEFAULT 'custom',
  provider        VARCHAR(80)  NULL,
  unit            VARCHAR(12)  NULL,
  currency        CHAR(3)      NOT NULL DEFAULT 'RON',
  meter_required  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_utilities_owner (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS utility_members (
  utility_id    INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  role          ENUM('owner','member') NOT NULL DEFAULT 'member',
  display_name  VARCHAR(100) NOT NULL,
  joined_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (utility_id, user_id),
  KEY ix_utility_members_user (user_id),
  CONSTRAINT fk_utility_members_utility FOREIGN KEY (utility_id) REFERENCES utilities (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS utility_invites (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  utility_id  INT UNSIGNED NOT NULL,
  code        CHAR(8) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_by  INT UNSIGNED NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at  DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_utility_invites_code (code),
  KEY ix_utility_invites_utility (utility_id),
  CONSTRAINT fk_utility_invites_utility FOREIGN KEY (utility_id) REFERENCES utilities (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One bill from the provider. period = first day of the month it is for. unit_price is what the
-- provider charged per unit (from the PDF or typed); when empty the app derives it.
-- provider_paid = the owner has paid (or marked as paid) the provider.
CREATE TABLE IF NOT EXISTS bills (
  id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  utility_id     INT UNSIGNED   NOT NULL,
  period         DATE           NOT NULL,
  due_on         DATE           NULL,
  total          DECIMAL(12,2)  NOT NULL,
  consumption    DECIMAL(14,3)  NULL,
  unit_price     DECIMAL(12,6)  NULL,
  provider_paid  TINYINT(1)     NOT NULL DEFAULT 0,
  note           VARCHAR(255)   NULL,
  created_by     INT UNSIGNED   NULL,
  created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_bills_utility (utility_id, period),
  CONSTRAINT fk_bills_utility FOREIGN KEY (utility_id) REFERENCES utilities (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The provider's PDF, at most one per bill (max 4 MB, checked by content).
CREATE TABLE IF NOT EXISTS bill_files (
  bill_id      INT UNSIGNED NOT NULL,
  file_name    VARCHAR(160) NOT NULL,
  data         MEDIUMBLOB   NOT NULL,
  bytes        INT UNSIGNED NOT NULL,
  uploaded_by  INT UNSIGNED NULL,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (bill_id),
  CONSTRAINT fk_bill_files_bill FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Who shares a bill: the utility's members when the bill was added (and people who join later,
-- for bills of their joining month onwards).
CREATE TABLE IF NOT EXISTS bill_participants (
  bill_id       INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  PRIMARY KEY (bill_id, user_id),
  KEY ix_bill_participants_user (user_id),
  CONSTRAINT fk_bill_participants_bill FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A participant's meter reading for a bill: previous and current index (consumption is their
-- difference), or a consumption typed directly.
CREATE TABLE IF NOT EXISTS readings (
  bill_id         INT UNSIGNED   NOT NULL,
  user_id         INT UNSIGNED   NOT NULL,
  previous_index  DECIMAL(14,3)  NULL,
  current_index   DECIMAL(14,3)  NULL,
  consumption     DECIMAL(14,3)  NOT NULL,
  entered_by      INT UNSIGNED   NULL,
  updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (bill_id, user_id),
  KEY ix_readings_user (user_id),
  CONSTRAINT fk_readings_bill FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The photo of the meter behind a reading (shrunk in the browser; JPEG, PNG or WebP, max 2 MB).
CREATE TABLE IF NOT EXISTS reading_photos (
  bill_id     INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  mime        VARCHAR(20)  NOT NULL,
  data        MEDIUMBLOB   NOT NULL,
  bytes       INT UNSIGNED NOT NULL,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (bill_id, user_id),
  KEY ix_reading_photos_user (user_id),
  CONSTRAINT fk_reading_photos_bill FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- What the owner received from a participant for a bill (cash, card or other). Money is not
-- moved by the app; the owner records it. The difference to what was due is carried over.
CREATE TABLE IF NOT EXISTS payments (
  bill_id      INT UNSIGNED  NOT NULL,
  user_id      INT UNSIGNED  NOT NULL,
  amount       DECIMAL(12,2) NOT NULL,
  method       ENUM('cash','card','other') NOT NULL DEFAULT 'cash',
  received_on  DATE          NULL,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (bill_id, user_id),
  KEY ix_payments_user (user_id),
  CONSTRAINT fk_payments_bill FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bill_comments (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  bill_id     INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  user_name   VARCHAR(100) NOT NULL,
  body        TEXT         NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_bill_comments_bill (bill_id, id),
  KEY ix_bill_comments_user (user_id),
  CONSTRAINT fk_bill_comments_bill FOREIGN KEY (bill_id) REFERENCES bills (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0001_utilities');
