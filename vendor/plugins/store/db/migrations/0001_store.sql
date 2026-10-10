-- =============================================================================
-- store 0001 — A lightweight shop (the plugin's OWN database, ADR 0007 and ADR 0057)
--
-- Apply to the store database, NOT the platform database:
--   pnpm db:migrate --plugin store     (uses STORE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- Every table carries store_id (several stores from day one). Money is in whole cents (INT) in
-- the store's currency; prices include VAT. Secrets of the payment providers are encrypted with
-- STORE_MASTER_KEY (AES-256-GCM) before they are stored. Times are UTC.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(100) NOT NULL,
  applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A shop: its address (/s/<slug>), seller details, legal texts and payment settings.
CREATE TABLE IF NOT EXISTS stores (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id       INT UNSIGNED NOT NULL,
  slug                VARCHAR(60) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name                VARCHAR(80)  NOT NULL,
  tagline             VARCHAR(160) NULL,
  about               TEXT         NULL,
  currency            CHAR(3)      NOT NULL DEFAULT 'EUR',
  vat_rate            DECIMAL(5,2) NOT NULL DEFAULT 0,
  published           TINYINT(1)   NOT NULL DEFAULT 0,
  -- Seller details (shown in the shop's footer and legal page)
  company_name        VARCHAR(120) NULL,
  company_number      VARCHAR(60)  NULL,
  vat_number          VARCHAR(40)  NULL,
  address             VARCHAR(255) NULL,
  contact_email       VARCHAR(160) NULL,
  contact_phone       VARCHAR(40)  NULL,
  terms               TEXT         NULL,
  returns_policy      TEXT         NULL,
  show_anpc           TINYINT(1)   NOT NULL DEFAULT 0,
  -- Payment methods
  cod_enabled         TINYINT(1)   NOT NULL DEFAULT 0,
  cod_fee_cents       INT UNSIGNED NOT NULL DEFAULT 0,
  bank_enabled        TINYINT(1)   NOT NULL DEFAULT 0,
  bank_holder         VARCHAR(120) NULL,
  bank_iban           VARCHAR(40)  NULL,
  bank_name           VARCHAR(80)  NULL,
  stripe_enabled      TINYINT(1)   NOT NULL DEFAULT 0,
  stripe_secret       TEXT         NULL,
  stripe_webhook      TEXT         NULL,
  paypal_enabled      TINYINT(1)   NOT NULL DEFAULT 0,
  paypal_live         TINYINT(1)   NOT NULL DEFAULT 0,
  paypal_client_id    VARCHAR(120) NULL,
  paypal_secret       TEXT         NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_stores_slug (slug),
  UNIQUE KEY uq_stores_owner (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  store_id     INT UNSIGNED NOT NULL,
  slug         VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  name         VARCHAR(120) NOT NULL,
  summary      VARCHAR(300) NULL,
  description  TEXT         NULL,
  category     VARCHAR(60)  NULL,
  -- NULL: the store's VAT rate
  vat_rate     DECIMAL(5,2) NULL,
  published    TINYINT(1)   NOT NULL DEFAULT 0,
  position     INT          NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (store_id, slug),
  KEY ix_products_store (store_id, published, position),
  CONSTRAINT fk_products_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- What a buyer picks: a size, a colour… Every product has at least one (its name may be empty).
-- stock NULL: not counted. sale_cents applies from sale_from to sale_until (each optional).
CREATE TABLE IF NOT EXISTS variants (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id   INT UNSIGNED NOT NULL,
  store_id     INT UNSIGNED NOT NULL,
  name         VARCHAR(80)  NOT NULL DEFAULT '',
  sku          VARCHAR(60)  NULL,
  price_cents  INT UNSIGNED NOT NULL,
  sale_cents   INT UNSIGNED NULL,
  sale_from    DATETIME     NULL,
  sale_until   DATETIME     NULL,
  stock        INT          NULL,
  position     INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_variants_product (product_id, position),
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_photos (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id  INT UNSIGNED NOT NULL,
  store_id    INT UNSIGNED NOT NULL,
  mime        VARCHAR(20)  NOT NULL,
  data        MEDIUMBLOB   NOT NULL,
  thumb_mime  VARCHAR(20)  NULL,
  thumb       MEDIUMBLOB   NULL,
  bytes       INT UNSIGNED NOT NULL,
  position    INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_product_photos_product (product_id, position),
  CONSTRAINT fk_product_photos_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Where the shop ships: countries (ISO codes, comma separated; '*' = everywhere else), a flat
-- rate and an optional amount above which shipping is free.
CREATE TABLE IF NOT EXISTS shipping_zones (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  store_id         INT UNSIGNED NOT NULL,
  name             VARCHAR(80)  NOT NULL,
  countries        VARCHAR(800) CHARACTER SET ascii NOT NULL,
  rate_cents       INT UNSIGNED NOT NULL DEFAULT 0,
  free_from_cents  INT UNSIGNED NULL,
  position         INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_shipping_zones_store (store_id, position),
  CONSTRAINT fk_shipping_zones_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- An order; `code` is the buyer's secret link to it (/s/<slug>/orders/<code>).
CREATE TABLE IF NOT EXISTS orders (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  store_id        INT UNSIGNED NOT NULL,
  code            CHAR(20) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  status          ENUM('awaiting_payment','paid','shipped','delivered','cancelled') NOT NULL DEFAULT 'awaiting_payment',
  payment_method  ENUM('stripe','paypal','bank','cod') NOT NULL,
  currency        CHAR(3)      NOT NULL,
  items_cents     INT UNSIGNED NOT NULL,
  shipping_cents  INT UNSIGNED NOT NULL DEFAULT 0,
  fee_cents       INT UNSIGNED NOT NULL DEFAULT 0,
  total_cents     INT UNSIGNED NOT NULL,
  vat_cents       INT UNSIGNED NOT NULL DEFAULT 0,
  buyer_name      VARCHAR(120) NOT NULL,
  buyer_email     VARCHAR(160) NOT NULL,
  buyer_phone     VARCHAR(40)  NULL,
  address_line    VARCHAR(255) NOT NULL,
  city            VARCHAR(80)  NOT NULL,
  postal_code     VARCHAR(20)  NULL,
  country         CHAR(2)      NOT NULL,
  note            VARCHAR(500) NULL,
  shipping_zone   VARCHAR(80)  NULL,
  carrier         VARCHAR(30)  NULL,
  tracking_number VARCHAR(80)  NULL,
  tracking_url    VARCHAR(500) NULL,
  provider_ref    VARCHAR(160) NULL,
  paid_at         DATETIME     NULL,
  shipped_at      DATETIME     NULL,
  delivered_at    DATETIME     NULL,
  cancelled_at    DATETIME     NULL,
  -- When the owner was emailed about the order (the scheduled hook, once per order)
  owner_notified_at DATETIME   NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_code (code),
  KEY ix_orders_store (store_id, created_at),
  KEY ix_orders_provider (provider_ref),
  KEY ix_orders_notify (owner_notified_at),
  CONSTRAINT fk_orders_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- What was ordered, as it was when ordered (later product changes do not touch it).
CREATE TABLE IF NOT EXISTS order_items (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id     INT UNSIGNED NOT NULL,
  product_id   INT UNSIGNED NULL,
  variant_id   INT UNSIGNED NULL,
  name         VARCHAR(120) NOT NULL,
  option_name  VARCHAR(80)  NOT NULL DEFAULT '',
  unit_cents   INT UNSIGNED NOT NULL,
  vat_rate     DECIMAL(5,2) NOT NULL,
  quantity     INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY ix_order_items_order (order_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0001_store');
