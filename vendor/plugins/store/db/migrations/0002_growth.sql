-- =============================================================================
-- store 0002 — Growing the shop (ADR 0058): SEO, design, product types and fields, vendors,
-- campaigns, vouchers, announcements, automatic discounts, reviews, the shop's team with roles,
-- product statistics, buyers' accounts and messages, the newsletter, maintenance mode and the
-- shop's own languages.
--
-- Apply to the store database, NOT the platform database:
--   pnpm db:migrate --plugin store     (uses STORE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- Every new table carries store_id and goes when its store goes (ON DELETE CASCADE). Money in
-- whole cents; times in UTC. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

-- stores: search engine texts, the shop's design and tracking tags (JSON, checked by the app),
-- how reviews work, maintenance mode with its message, and the buyers' default language.
SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stores' AND COLUMN_NAME = 'seo_title') = 0,
  'ALTER TABLE stores ADD COLUMN seo_title VARCHAR(70) NULL AFTER about, ADD COLUMN seo_description VARCHAR(170) NULL AFTER seo_title, ADD COLUMN theme TEXT NULL AFTER seo_description, ADD COLUMN tracking TEXT NULL AFTER theme, ADD COLUMN reviews_mode ENUM(''off'',''moderated'',''verified'') NOT NULL DEFAULT ''moderated'' AFTER theme, ADD COLUMN maintenance TINYINT(1) NOT NULL DEFAULT 0 AFTER published, ADD COLUMN maintenance_message VARCHAR(300) NULL AFTER maintenance, ADD COLUMN default_language VARCHAR(3) CHARACTER SET ascii NULL AFTER maintenance_message',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

-- The shop's logo and banner.
CREATE TABLE IF NOT EXISTS store_assets (
  store_id    INT UNSIGNED NOT NULL,
  kind        ENUM('logo','banner') NOT NULL,
  mime        VARCHAR(20)  NOT NULL,
  data        MEDIUMBLOB   NOT NULL,
  bytes       INT UNSIGNED NOT NULL,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (store_id, kind),
  CONSTRAINT fk_store_assets_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The shop's team: members who help the owner, each with one or more roles.
CREATE TABLE IF NOT EXISTS store_staff (
  store_id      INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  display_name  VARCHAR(80)  NOT NULL,
  roles         SET('manager','catalog','marketing','support','shipping','maintenance') NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (store_id, user_id),
  UNIQUE KEY uq_store_staff_user (user_id),
  CONSTRAINT fk_store_staff_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One-time links to join the team: only the code's SHA-256 is kept.
CREATE TABLE IF NOT EXISTS store_invites (
  code_hash   CHAR(64)     CHARACTER SET ascii NOT NULL,
  store_id    INT UNSIGNED NOT NULL,
  roles       SET('manager','catalog','marketing','support','shipping','maintenance') NOT NULL,
  created_by  INT UNSIGNED NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at  DATETIME     NOT NULL,
  PRIMARY KEY (code_hash),
  KEY ix_store_invites_store (store_id),
  CONSTRAINT fk_store_invites_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Who supplies or makes the products (a brand, a workshop, a wholesaler).
CREATE TABLE IF NOT EXISTS vendors (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  store_id       INT UNSIGNED NOT NULL,
  name           VARCHAR(80)  NOT NULL,
  contact_name   VARCHAR(80)  NULL,
  email          VARCHAR(160) NULL,
  phone          VARCHAR(40)  NULL,
  website        VARCHAR(300) NULL,
  notes          TEXT         NULL,
  -- Shown to buyers as the product's brand
  is_brand       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vendors_name (store_id, name),
  CONSTRAINT fk_vendors_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product types and the fields their products fill in (Electronics: screen size, memory…).
CREATE TABLE IF NOT EXISTS product_types (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  store_id    INT UNSIGNED NOT NULL,
  name        VARCHAR(60)  NOT NULL,
  position    INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_types_name (store_id, name),
  CONSTRAINT fk_product_types_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- choices: one per line (select and multiselect fields).
CREATE TABLE IF NOT EXISTS product_fields (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  type_id     INT UNSIGNED NOT NULL,
  store_id    INT UNSIGNED NOT NULL,
  label       VARCHAR(60)  NOT NULL,
  kind        ENUM('text','textarea','number','boolean','select','multiselect','color','date','url') NOT NULL,
  unit        VARCHAR(20)  NULL,
  choices     TEXT         NULL,
  required    TINYINT(1)   NOT NULL DEFAULT 0,
  in_compare  TINYINT(1)   NOT NULL DEFAULT 1,
  position    INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY ix_product_fields_type (type_id, position),
  CONSTRAINT fk_product_fields_type FOREIGN KEY (type_id) REFERENCES product_types (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- products: search engine texts, brand codes, its type and vendor.
SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'seo_title') = 0,
  'ALTER TABLE products ADD COLUMN seo_title VARCHAR(70) NULL AFTER description, ADD COLUMN seo_description VARCHAR(170) NULL AFTER seo_title, ADD COLUMN gtin VARCHAR(14) NULL AFTER seo_description, ADD COLUMN type_id INT UNSIGNED NULL AFTER category, ADD COLUMN vendor_id INT UNSIGNED NULL AFTER type_id, ADD KEY ix_products_type (type_id), ADD KEY ix_products_vendor (vendor_id), ADD CONSTRAINT fk_products_type FOREIGN KEY (type_id) REFERENCES product_types (id) ON DELETE SET NULL, ADD CONSTRAINT fk_products_vendor FOREIGN KEY (vendor_id) REFERENCES vendors (id) ON DELETE SET NULL',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

CREATE TABLE IF NOT EXISTS product_values (
  product_id  INT UNSIGNED  NOT NULL,
  field_id    INT UNSIGNED  NOT NULL,
  value       VARCHAR(1000) NOT NULL,
  PRIMARY KEY (product_id, field_id),
  KEY ix_product_values_field (field_id),
  CONSTRAINT fk_product_values_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_product_values_field FOREIGN KEY (field_id) REFERENCES product_fields (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A campaign: a percentage off everything, a category or chosen products, for a while.
CREATE TABLE IF NOT EXISTS campaigns (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  store_id     INT UNSIGNED NOT NULL,
  name         VARCHAR(80)  NOT NULL,
  description  VARCHAR(300) NULL,
  percent_off  TINYINT UNSIGNED NOT NULL,
  scope        ENUM('all','category','products') NOT NULL DEFAULT 'all',
  category     VARCHAR(60)  NULL,
  starts_at    DATETIME     NULL,
  ends_at      DATETIME     NULL,
  active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_campaigns_store (store_id, active),
  CONSTRAINT fk_campaigns_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS campaign_products (
  campaign_id  INT UNSIGNED NOT NULL,
  product_id   INT UNSIGNED NOT NULL,
  PRIMARY KEY (campaign_id, product_id),
  KEY ix_campaign_products_product (product_id),
  CONSTRAINT fk_campaign_products_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE,
  CONSTRAINT fk_campaign_products_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A voucher code typed at checkout: percent or amount off the products, or free shipping.
CREATE TABLE IF NOT EXISTS vouchers (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  store_id         INT UNSIGNED NOT NULL,
  code             VARCHAR(30)  CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
  description      VARCHAR(160) NULL,
  kind             ENUM('percent','amount','shipping') NOT NULL,
  percent_off      TINYINT UNSIGNED NULL,
  amount_cents     INT UNSIGNED NULL,
  min_order_cents  INT UNSIGNED NULL,
  starts_at        DATETIME     NULL,
  ends_at          DATETIME     NULL,
  max_uses         INT UNSIGNED NULL,
  uses             INT UNSIGNED NOT NULL DEFAULT 0,
  once_per_buyer   TINYINT(1)   NOT NULL DEFAULT 0,
  active           TINYINT(1)   NOT NULL DEFAULT 1,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vouchers_code (store_id, code),
  CONSTRAINT fk_vouchers_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Automatic discounts and free shipping: from an amount spent ('spend', 'free_shipping') or a
-- number of pieces in the cart ('quantity'). threshold: cents or pieces.
CREATE TABLE IF NOT EXISTS price_rules (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  store_id     INT UNSIGNED NOT NULL,
  kind         ENUM('free_shipping','spend','quantity') NOT NULL,
  threshold    INT UNSIGNED NOT NULL,
  percent_off  TINYINT UNSIGNED NULL,
  starts_at    DATETIME     NULL,
  ends_at      DATETIME     NULL,
  active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_price_rules_store (store_id, active),
  CONSTRAINT fk_price_rules_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The shop's own labels: a new language (code like 'fr') or changes to a built-in one ('de').
CREATE TABLE IF NOT EXISTS store_languages (
  store_id    INT UNSIGNED NOT NULL,
  code        VARCHAR(3)   CHARACTER SET ascii NOT NULL,
  name        VARCHAR(40)  NOT NULL,
  messages    MEDIUMTEXT   NOT NULL,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (store_id, code),
  CONSTRAINT fk_store_languages_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A message on the shop's pages (a bar on top or a banner on the front page), for a while.
CREATE TABLE IF NOT EXISTS announcements (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  store_id     INT UNSIGNED NOT NULL,
  message      VARCHAR(200) NOT NULL,
  details      VARCHAR(500) NULL,
  tone         ENUM('info','sale','new','warning') NOT NULL DEFAULT 'info',
  placement    ENUM('bar','banner') NOT NULL DEFAULT 'bar',
  link_url     VARCHAR(500) NULL,
  link_label   VARCHAR(40)  NULL,
  voucher_id   INT UNSIGNED NULL,
  campaign_id  INT UNSIGNED NULL,
  starts_at    DATETIME     NULL,
  ends_at      DATETIME     NULL,
  active       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_announcements_store (store_id, active),
  CONSTRAINT fk_announcements_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT fk_announcements_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers (id) ON DELETE SET NULL,
  CONSTRAINT fk_announcements_campaign FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- orders: what automatic discounts and the voucher took off (discount_cents is both together).
SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'discount_cents') = 0,
  'ALTER TABLE orders ADD COLUMN discount_cents INT UNSIGNED NOT NULL DEFAULT 0 AFTER fee_cents, ADD COLUMN auto_discount_cents INT UNSIGNED NOT NULL DEFAULT 0 AFTER discount_cents, ADD COLUMN auto_discount_label VARCHAR(80) NULL AFTER auto_discount_cents, ADD COLUMN voucher_id INT UNSIGNED NULL AFTER auto_discount_label, ADD COLUMN voucher_code VARCHAR(30) NULL AFTER voucher_id, ADD KEY ix_orders_voucher (voucher_id)',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

-- Ratings and comments on products. order_id set: a verified buyer (from their order page).
CREATE TABLE IF NOT EXISTS reviews (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  store_id    INT UNSIGNED NOT NULL,
  product_id  INT UNSIGNED NOT NULL,
  order_id    INT UNSIGNED NULL,
  rating      TINYINT UNSIGNED NOT NULL,
  title       VARCHAR(100) NULL,
  body        TEXT         NULL,
  author      VARCHAR(60)  NOT NULL,
  verified    TINYINT(1)   NOT NULL DEFAULT 0,
  status      ENUM('pending','published','hidden') NOT NULL DEFAULT 'pending',
  reply       TEXT         NULL,
  replied_at  DATETIME     NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_order_product (order_id, product_id),
  KEY ix_reviews_product (product_id, status, created_at),
  KEY ix_reviews_store (store_id, status, created_at),
  CONSTRAINT fk_reviews_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Page views per product and day (UTC), for the statistics; never about a person.
CREATE TABLE IF NOT EXISTS product_views (
  product_id  INT UNSIGNED NOT NULL,
  store_id    INT UNSIGNED NOT NULL,
  day         DATE         NOT NULL,
  views       INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, day),
  KEY ix_product_views_store (store_id, day),
  CONSTRAINT fk_product_views_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Buyers' accounts: an email address and sign-in links sent to it; no passwords.
CREATE TABLE IF NOT EXISTS buyers (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  store_id      INT UNSIGNED NOT NULL,
  email         VARCHAR(160) NOT NULL,
  name          VARCHAR(120) NULL,
  locale        CHAR(2)      NOT NULL DEFAULT 'en',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at  DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_buyers_email (store_id, email),
  CONSTRAINT fk_buyers_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sign-in links (kind 'link', 30 minutes) and sessions (kind 'session', 90 days); hashes only.
CREATE TABLE IF NOT EXISTS buyer_tokens (
  token_hash  CHAR(64)     CHARACTER SET ascii NOT NULL,
  buyer_id    INT UNSIGNED NOT NULL,
  kind        ENUM('link','session') NOT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (token_hash),
  KEY ix_buyer_tokens_buyer (buyer_id),
  CONSTRAINT fk_buyer_tokens_buyer FOREIGN KEY (buyer_id) REFERENCES buyers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conversations between a buyer and the shop, optionally about one of their orders.
CREATE TABLE IF NOT EXISTS threads (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  store_id           INT UNSIGNED NOT NULL,
  buyer_id           INT UNSIGNED NOT NULL,
  order_id           INT UNSIGNED NULL,
  subject            VARCHAR(120) NOT NULL,
  status             ENUM('open','closed') NOT NULL DEFAULT 'open',
  last_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Who has read up to the last message
  shop_read          TINYINT(1)   NOT NULL DEFAULT 0,
  buyer_read         TINYINT(1)   NOT NULL DEFAULT 1,
  -- When the owner was emailed about the buyer's last message (the scheduled hook)
  owner_notified_at  DATETIME     NULL,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_threads_store (store_id, last_at),
  KEY ix_threads_buyer (buyer_id, last_at),
  CONSTRAINT fk_threads_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT fk_threads_buyer FOREIGN KEY (buyer_id) REFERENCES buyers (id) ON DELETE CASCADE,
  CONSTRAINT fk_threads_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- from_shop: written by the owner or the team (author_name is their name), else by the buyer.
CREATE TABLE IF NOT EXISTS messages (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  thread_id    INT UNSIGNED NOT NULL,
  from_shop    TINYINT(1)   NOT NULL,
  author_name  VARCHAR(80)  NOT NULL,
  body         TEXT         NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_messages_thread (thread_id, id),
  CONSTRAINT fk_messages_thread FOREIGN KEY (thread_id) REFERENCES threads (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The newsletter's subscribers: confirmed by a link (double opt-in); `token` unsubscribes.
CREATE TABLE IF NOT EXISTS subscribers (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  store_id         INT UNSIGNED NOT NULL,
  email            VARCHAR(160) NOT NULL,
  locale           CHAR(2)      NOT NULL DEFAULT 'en',
  status           ENUM('pending','confirmed','unsubscribed') NOT NULL DEFAULT 'pending',
  token            CHAR(32)     CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  source           VARCHAR(20)  NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at     DATETIME     NULL,
  unsubscribed_at  DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subscribers_email (store_id, email),
  UNIQUE KEY uq_subscribers_token (token),
  KEY ix_subscribers_status (store_id, status),
  CONSTRAINT fk_subscribers_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- An email campaign: a text, chosen products (promotions and new arrivals) and maybe a voucher.
CREATE TABLE IF NOT EXISTS newsletters (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  store_id      INT UNSIGNED NOT NULL,
  subject       VARCHAR(150) NOT NULL,
  preheader     VARCHAR(150) NULL,
  heading       VARCHAR(150) NULL,
  intro         TEXT         NULL,
  voucher_id    INT UNSIGNED NULL,
  status        ENUM('draft','sending','sent') NOT NULL DEFAULT 'draft',
  recipients    INT UNSIGNED NOT NULL DEFAULT 0,
  sent_count    INT UNSIGNED NOT NULL DEFAULT 0,
  failed_count  INT UNSIGNED NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  sent_at       DATETIME     NULL,
  PRIMARY KEY (id),
  KEY ix_newsletters_store (store_id, created_at),
  CONSTRAINT fk_newsletters_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT fk_newsletters_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- section: 'promo' (offers) or 'new' (newly available).
CREATE TABLE IF NOT EXISTS newsletter_products (
  newsletter_id  INT UNSIGNED NOT NULL,
  product_id     INT UNSIGNED NOT NULL,
  section        ENUM('promo','new') NOT NULL,
  position       INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (newsletter_id, product_id),
  KEY ix_newsletter_products_product (product_id),
  CONSTRAINT fk_newsletter_products_newsletter FOREIGN KEY (newsletter_id) REFERENCES newsletters (id) ON DELETE CASCADE,
  CONSTRAINT fk_newsletter_products_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per subscriber of a newsletter being sent; sent in small batches.
CREATE TABLE IF NOT EXISTS newsletter_deliveries (
  newsletter_id  INT UNSIGNED NOT NULL,
  subscriber_id  INT UNSIGNED NOT NULL,
  status         ENUM('queued','sent','failed') NOT NULL DEFAULT 'queued',
  sent_at        DATETIME     NULL,
  PRIMARY KEY (newsletter_id, subscriber_id),
  KEY ix_newsletter_deliveries_queue (newsletter_id, status),
  KEY ix_newsletter_deliveries_subscriber (subscriber_id),
  CONSTRAINT fk_newsletter_deliveries_newsletter FOREIGN KEY (newsletter_id) REFERENCES newsletters (id) ON DELETE CASCADE,
  CONSTRAINT fk_newsletter_deliveries_subscriber FOREIGN KEY (subscriber_id) REFERENCES subscribers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- orders: the buyer's language (for emails to them) and when they were emailed about it.
SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'buyer_locale') = 0,
  'ALTER TABLE orders ADD COLUMN buyer_locale CHAR(2) NOT NULL DEFAULT ''en'' AFTER buyer_phone, ADD COLUMN buyer_mailed_at DATETIME NULL AFTER owner_notified_at, ADD KEY ix_orders_buyer (store_id, buyer_email)',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0002_growth');
