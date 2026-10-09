-- =============================================================================
-- shopping 0001 — Shared shopping lists (the plugin's OWN database, ADR 0007)
--
-- Apply to the shopping database (e.g. u962314563_shopping), NOT the platform database:
--   pnpm db:migrate --plugin shopping     (uses SHOPPING_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- user ids are the platform's user ids, stored as plain numbers (no cross-database foreign
-- keys). Display names are copied in so the plugin never reads the platform database.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(100) NOT NULL,
  applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lists (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name           VARCHAR(80)   NOT NULL,
  currency       CHAR(3)       NOT NULL DEFAULT 'RON',
  owner_user_id  INT UNSIGNED  NOT NULL,
  -- Bumped on every change; clients poll it to refresh ("live" updates without websockets).
  version        INT UNSIGNED  NOT NULL DEFAULT 1,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_lists_owner (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS list_members (
  list_id       INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  role          ENUM('owner','member') NOT NULL DEFAULT 'member',
  display_name  VARCHAR(100) NOT NULL,
  joined_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (list_id, user_id),
  KEY ix_list_members_user (user_id),
  CONSTRAINT fk_list_members_list FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS list_invites (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  list_id     INT UNSIGNED NOT NULL,
  code        CHAR(8) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_by  INT UNSIGNED NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at  DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_list_invites_code (code),
  KEY ix_list_invites_list (list_id),
  CONSTRAINT fk_list_invites_list FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stores used by a list: which shop, what kind of shop (type code from the app's catalogue,
-- e.g. 'grocery', 'hardware_diy'), where it is, and a free description.
CREATE TABLE IF NOT EXISTS stores (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  list_id      INT UNSIGNED NOT NULL,
  name         VARCHAR(80)  NOT NULL,
  type         VARCHAR(30)  NOT NULL DEFAULT 'other',
  location     VARCHAR(160) NULL,
  description  VARCHAR(255) NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_stores_list (list_id),
  CONSTRAINT fk_stores_list FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS items (
  id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  list_id        INT UNSIGNED   NOT NULL,
  store_id       INT UNSIGNED   NULL,
  name           VARCHAR(120)   NOT NULL,
  quantity       DECIMAL(10,3)  NOT NULL DEFAULT 1,
  unit           VARCHAR(16)    NULL,
  -- Price per unit; line total = price x quantity.
  price          DECIMAL(10,2)  NULL,
  description    VARCHAR(255)   NULL,
  added_by       INT UNSIGNED   NULL,
  added_by_name  VARCHAR(100)   NULL,
  done_at        DATETIME       NULL,
  done_by        INT UNSIGNED   NULL,
  done_by_name   VARCHAR(100)   NULL,
  position       INT            NOT NULL DEFAULT 0,
  created_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_items_list (list_id, done_at, position),
  KEY ix_items_store (store_id),
  CONSTRAINT fk_items_list  FOREIGN KEY (list_id)  REFERENCES lists (id)  ON DELETE CASCADE,
  CONSTRAINT fk_items_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0001_shopping_lists');
