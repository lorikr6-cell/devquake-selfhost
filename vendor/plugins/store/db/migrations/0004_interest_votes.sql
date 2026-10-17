-- =============================================================================
-- 0004 — Interest votes before selling a product (ADR 0060)
--
-- products.interest_only     shown with a vote instead of a price; never sold while set.
-- products.unit_cost_cents   the owner's estimate per piece (materials, printing), for the ROI.
-- products.setup_cost_cents  one-time investment (design, screens, samples), for the ROI.
-- interest_votes             one vote per person and product: interested or not, an optional
--                            acceptable price range and preferred options (JSON, checked by the app).
--                            voter_key: 'u<id>' a DevQuake member, 'b<id>' a buyer account.
-- Run on the Store's own database (STORE_DB_*). SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'interest_only') = 0,
  'ALTER TABLE products ADD COLUMN interest_only TINYINT(1) NOT NULL DEFAULT 0 AFTER published, ADD COLUMN unit_cost_cents INT UNSIGNED NULL AFTER interest_only, ADD COLUMN setup_cost_cents INT UNSIGNED NULL AFTER unit_cost_cents',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

CREATE TABLE IF NOT EXISTS interest_votes (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  store_id    INT UNSIGNED NOT NULL,
  product_id  INT UNSIGNED NOT NULL,
  voter_key   VARCHAR(24) CHARACTER SET ascii NOT NULL,
  interested  TINYINT(1)   NOT NULL,
  min_cents   INT UNSIGNED NULL,
  max_cents   INT UNSIGNED NULL,
  choices     VARCHAR(1000) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_interest_votes_voter (product_id, voter_key),
  KEY ix_interest_votes_store (store_id),
  KEY ix_interest_votes_voter (voter_key),
  CONSTRAINT fk_interest_votes_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT fk_interest_votes_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0004_interest_votes');
