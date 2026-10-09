-- =============================================================================
-- expenses 0002 — Where an expense came from (the plugin's OWN database, ADR 0055)
--
-- Apply to the expenses database, NOT the platform database:
--   pnpm db:migrate --plugin expenses     (uses EXPENSES_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- expenses.source: set when another app added the expense through the link point expense.add
-- (ADR 0035), e.g. "utilities:bill:42" or "shopping:list:7". One expense per source and group,
-- so adding the same bill or list twice changes nothing.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'expenses' AND COLUMN_NAME = 'source') = 0,
  'ALTER TABLE expenses ADD COLUMN source VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER note',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'expenses' AND INDEX_NAME = 'uq_expenses_source') = 0,
  'ALTER TABLE expenses ADD UNIQUE KEY uq_expenses_source (group_id, source)',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0002_expense_source');
