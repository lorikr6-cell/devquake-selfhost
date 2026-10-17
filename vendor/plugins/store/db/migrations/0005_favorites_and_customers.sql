-- =============================================================================
-- 0005 — Favourites and the shop's customers (ADR 0064)
--
-- favorites           products a buyer or a DevQuake member saved, with the price when they
--                     saved it (to show the difference to today's price). owner_key: 'u<id>' a
--                     DevQuake member, 'b<id>' a buyer account (as interest_votes.voter_key).
--                     product_id becomes NULL when the product is deleted: the favourite stays,
--                     struck through, with the name it had (product_name, product_slug).
-- buyers.blocked_at   set by the owner in Customers: the buyer cannot sign in, write reviews or
--                     messages, vote or save favourites. Their orders stay.
-- Run on the Store's own database (STORE_DB_*). SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'buyers' AND COLUMN_NAME = 'blocked_at') = 0,
  'ALTER TABLE buyers ADD COLUMN blocked_at DATETIME NULL AFTER last_seen_at',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

CREATE TABLE IF NOT EXISTS favorites (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  store_id      INT UNSIGNED NOT NULL,
  product_id    INT UNSIGNED NULL,
  owner_key     VARCHAR(24) CHARACTER SET ascii NOT NULL,
  product_name  VARCHAR(120) NOT NULL,
  product_slug  VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  -- The lowest price when it was saved, in the shop's currency (cents)
  price_cents   INT UNSIGNED NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_favorites_owner (store_id, owner_key, product_id),
  KEY ix_favorites_owner (owner_key),
  KEY ix_favorites_product (product_id),
  CONSTRAINT fk_favorites_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0005_favorites_and_customers');
