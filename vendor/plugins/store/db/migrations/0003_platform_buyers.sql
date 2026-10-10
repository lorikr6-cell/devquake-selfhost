-- =============================================================================
-- 0003 — Buyers who are DevQuake members, and buyers' saved details (ADR 0059)
--
-- buyers.platform_user_id  the DevQuake member who connected this account ("Continue with
--                          DevQuake"), once per shop; NULL for buyers who signed up by email.
-- buyers.phone … country    the delivery details the buyer saved, to fill in the checkout.
-- Run on the Store's own database (STORE_DB_*). SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'buyers' AND COLUMN_NAME = 'platform_user_id') = 0,
  'ALTER TABLE buyers ADD COLUMN platform_user_id INT UNSIGNED NULL AFTER email, ADD COLUMN phone VARCHAR(40) NULL AFTER name, ADD COLUMN address_line VARCHAR(255) NULL AFTER phone, ADD COLUMN city VARCHAR(80) NULL AFTER address_line, ADD COLUMN postal_code VARCHAR(20) NULL AFTER city, ADD COLUMN country CHAR(2) CHARACTER SET ascii NULL AFTER postal_code, ADD UNIQUE KEY uq_buyers_platform (store_id, platform_user_id)',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0003_platform_buyers');
