-- =============================================================================
-- venue 0001 — Venue: the venue, its staff and tablets, and the menu (the plugin's OWN database,
-- ADR 0007; tablets and PINs: ADR 0080)
--
-- Apply to the venue database (e.g. u962314563_venue), NOT the platform database:
--   pnpm db:migrate --plugin venue     (uses VENUE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- Prices are whole minor units of the venue's currency (BIGINT), VAT rates basis points (2700 =
-- 27 %). PINs and tablet tokens are stored only as hashes. Every DATETIME is UTC. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(100) NOT NULL,
  applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS venues (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  -- One venue per member for now (several venues later).
  owner_user_id  INT UNSIGNED  NOT NULL,
  slug           VARCHAR(40)   CHARACTER SET ascii NOT NULL,
  name           VARCHAR(80)   NOT NULL,
  country        CHAR(2)       CHARACTER SET ascii NOT NULL,
  currency       CHAR(3)       CHARACTER SET ascii NOT NULL,
  -- Comma-separated basis points, the standard rate first ("2700,1800,500").
  vat_rates      VARCHAR(60)   CHARACTER SET ascii NOT NULL,
  decimals       TINYINT UNSIGNED NOT NULL DEFAULT 2,
  menu_public    TINYINT(1)    NOT NULL DEFAULT 1,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_venues_owner (owner_user_id),
  UNIQUE KEY uq_venues_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  venue_id    INT UNSIGNED  NOT NULL,
  name        VARCHAR(80)   NOT NULL,
  role        ENUM('manager','waiter','kitchen','bar') NOT NULL,
  -- scrypt of the PIN with its own salt ("salt:hash", hex); NULL until a PIN is set.
  pin_hash    VARCHAR(200)  CHARACTER SET ascii NULL,
  active      TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_staff_venue (venue_id, active),
  CONSTRAINT fk_staff_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tablets (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  venue_id      INT UNSIGNED  NOT NULL,
  name          VARCHAR(80)   NOT NULL,
  token_hash    CHAR(64)      CHARACTER SET ascii NOT NULL,
  created_by    INT UNSIGNED  NOT NULL,
  last_used_at  DATETIME      NULL,
  revoked_at    DATETIME      NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tablets_token (token_hash),
  KEY ix_tablets_venue (venue_id),
  CONSTRAINT fk_tablets_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_categories (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  venue_id    INT UNSIGNED  NOT NULL,
  name        VARCHAR(80)   NOT NULL,
  sort_order  SMALLINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_menu_categories_venue (venue_id, sort_order),
  CONSTRAINT fk_menu_categories_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menu_items (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  venue_id     INT UNSIGNED  NOT NULL,
  category_id  INT UNSIGNED  NOT NULL,
  name         VARCHAR(80)   NOT NULL,
  description  VARCHAR(400)  NULL,
  price_minor  BIGINT UNSIGNED NOT NULL,
  vat_rate     SMALLINT UNSIGNED NOT NULL,
  station      ENUM('kitchen','bar','coffee','none') NOT NULL DEFAULT 'kitchen',
  -- The EU's 14 allergens as bits (lib/model.ts ALLERGENS).
  allergens    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  available    TINYINT(1)    NOT NULL DEFAULT 1,
  sort_order   SMALLINT      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_menu_items_venue (venue_id, category_id, sort_order),
  CONSTRAINT fk_menu_items_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE,
  CONSTRAINT fk_menu_items_category FOREIGN KEY (category_id) REFERENCES menu_categories (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0001_venue');
