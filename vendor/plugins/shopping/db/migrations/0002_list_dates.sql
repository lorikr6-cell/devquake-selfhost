-- =============================================================================
-- shopping 0002 — Shopping dates and optional quantities
--
-- Every list gets the day it is planned for (lists.shop_date, shown in the calendar; existing
-- lists get the day they were created). Item quantities become optional: a product like
-- "Milk 1 l" needs only a name and a unit; the price is per unit (or per item when no quantity).
--
-- Apply to the shopping database: pnpm db:migrate --plugin shopping, or phpMyAdmin → Import.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lists' AND COLUMN_NAME = 'shop_date') = 0,
  'ALTER TABLE lists ADD COLUMN shop_date DATE NULL AFTER currency',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

UPDATE lists SET shop_date = DATE(created_at) WHERE shop_date IS NULL;

ALTER TABLE lists MODIFY shop_date DATE NOT NULL;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lists' AND INDEX_NAME = 'ix_lists_shop_date') = 0,
  'ALTER TABLE lists ADD KEY ix_lists_shop_date (shop_date)',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

ALTER TABLE items MODIFY quantity DECIMAL(10,3) NULL DEFAULT NULL;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0002_list_dates');
