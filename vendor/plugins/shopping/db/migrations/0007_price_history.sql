-- =============================================================================
-- shopping 0007 — Correct prices in the store, and the price history (inflation)
--
-- items.estimated_price: the price planned before shopping, kept when someone corrects the price
--   in the store (items.price is then the real one). NULL when never corrected.
-- items.price_corrected_at / price_corrected_by / _by_name: who corrected it and when.
-- price_observations: every planned (estimate) and paid (actual) price, dated with the list's
--   shopping day, so the statistics can show how prices change over time. They stay when the
--   item is deleted (item_id becomes NULL) and go with the list.
--
-- Apply to the shopping database: pnpm db:migrate --plugin shopping, or phpMyAdmin → Import.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items' AND COLUMN_NAME = 'estimated_price') = 0,
  'ALTER TABLE items
     ADD COLUMN estimated_price DECIMAL(10,2) NULL AFTER price,
     ADD COLUMN price_corrected_at DATETIME NULL AFTER estimated_price,
     ADD COLUMN price_corrected_by INT UNSIGNED NULL AFTER price_corrected_at,
     ADD COLUMN price_corrected_by_name VARCHAR(100) NULL AFTER price_corrected_by',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

CREATE TABLE IF NOT EXISTS price_observations (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  list_id      INT UNSIGNED    NOT NULL,
  item_id      INT UNSIGNED    NULL,
  user_id      INT UNSIGNED    NULL,
  product      VARCHAR(120)    NOT NULL,
  unit         VARCHAR(16)     NULL,
  store_name   VARCHAR(80)     NULL,
  kind         ENUM('estimate','actual') NOT NULL,
  price        DECIMAL(10,2)   NOT NULL,
  observed_on  DATE            NOT NULL,
  created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_price_observations_list (list_id),
  KEY ix_price_observations_product (product, observed_on),
  CONSTRAINT fk_price_observations_list FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE,
  CONSTRAINT fk_price_observations_item FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Prices entered before this migration count as estimates on their list's day (once).
INSERT INTO price_observations (list_id, item_id, user_id, product, unit, store_name, kind, price, observed_on, created_at)
SELECT i.list_id, i.id, i.added_by, i.name, i.unit, s.name, 'estimate', i.price, l.shop_date, i.created_at
  FROM items i JOIN lists l ON l.id = i.list_id LEFT JOIN stores s ON s.id = i.store_id
 WHERE i.price IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '0007_price_history');

INSERT IGNORE INTO schema_migrations (version) VALUES ('0007_price_history');
