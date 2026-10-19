-- =============================================================================
-- cookbook 0007 — Food names in Italian and Spanish (ADR 0011)
--
-- foods.name_it, foods.name_es  the food's name in Italian and Spanish, next to name_en … name_hu.
--                               NULL until filled: on its next load the app fills them for the
--                               built-in foods (lib/foods.ts, lib/foods-extra.ts) without touching
--                               the other columns, so names staff changed stay. Foods staff added
--                               show the English name until staff enter the new names.
-- Apply to the cookbook database (COOKBOOK_DB_*). SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'foods' AND COLUMN_NAME = 'name_it') = 0,
  'ALTER TABLE foods ADD COLUMN name_it VARCHAR(80) NULL AFTER name_hu',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'foods' AND COLUMN_NAME = 'name_es') = 0,
  'ALTER TABLE foods ADD COLUMN name_es VARCHAR(80) NULL AFTER name_it',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0007_food_names_it_es');
