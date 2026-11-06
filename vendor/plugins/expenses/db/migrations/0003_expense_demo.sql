-- =============================================================================
-- expenses 0003 — Demo groups (the plugin's OWN database, ADR 0055)
--
-- Apply to the expenses database, NOT the platform database:
--   pnpm db:migrate --plugin expenses     (uses EXPENSES_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- expense_groups.is_demo: a group made by "Open a demo group" with sample members, expenses,
-- comments and a payment. One per person; it is an ordinary group otherwise (deletable).
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'expense_groups' AND COLUMN_NAME = 'is_demo') = 0,
  'ALTER TABLE expense_groups ADD COLUMN is_demo TINYINT(1) NOT NULL DEFAULT 0 AFTER currency',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0003_expense_demo');
