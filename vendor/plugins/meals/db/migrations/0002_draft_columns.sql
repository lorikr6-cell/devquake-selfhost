-- =============================================================================
-- meals 0002 — Bring databases made from an early draft of 0001 up to date
--
-- 0001 creates its tables only when they are missing, so a meals database imported from an
-- earlier draft kept that draft's tables: production lacked meals.set_id and every week plan
-- failed ("Unknown column 'm.set_id'"). This adds each later column of meals and meal_items when
-- it is missing; the saved-meal tables come from 0001 itself (re-run it first, it skips what
-- exists).
--
-- Apply to the meals database: pnpm db:migrate --plugin meals, or phpMyAdmin → Import
-- (0001_meals.sql, then this file).
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meals' AND COLUMN_NAME = 'servings') = 0,
  'ALTER TABLE meals ADD COLUMN servings TINYINT UNSIGNED NOT NULL DEFAULT 2 AFTER title',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meals' AND COLUMN_NAME = 'leftovers') = 0,
  'ALTER TABLE meals ADD COLUMN leftovers TINYINT(1) NOT NULL DEFAULT 0 AFTER servings',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meals' AND COLUMN_NAME = 'cooked') = 0,
  'ALTER TABLE meals ADD COLUMN cooked TINYINT(1) NOT NULL DEFAULT 0 AFTER leftovers',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meals' AND COLUMN_NAME = 'note') = 0,
  'ALTER TABLE meals ADD COLUMN note VARCHAR(200) NULL AFTER cooked',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meals' AND COLUMN_NAME = 'remind') = 0,
  'ALTER TABLE meals ADD COLUMN remind VARCHAR(160) NULL AFTER note',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meals' AND COLUMN_NAME = 'set_id') = 0,
  'ALTER TABLE meals ADD COLUMN set_id INT UNSIGNED NULL AFTER remind',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meals' AND COLUMN_NAME = 'created_by') = 0,
  'ALTER TABLE meals ADD COLUMN created_by INT UNSIGNED NULL AFTER set_id',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meal_items' AND COLUMN_NAME = 'recipe_ref') = 0,
  'ALTER TABLE meal_items ADD COLUMN recipe_ref VARCHAR(40) CHARACTER SET ascii NULL AFTER position',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meal_items' AND COLUMN_NAME = 'qty') = 0,
  'ALTER TABLE meal_items ADD COLUMN qty DECIMAL(10,3) NULL AFTER name',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meal_items' AND COLUMN_NAME = 'unit') = 0,
  'ALTER TABLE meal_items ADD COLUMN unit VARCHAR(16) NULL AFTER qty',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meal_items' AND COLUMN_NAME = 'kcal') = 0,
  'ALTER TABLE meal_items ADD COLUMN kcal DECIMAL(7,1) NULL AFTER unit',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meal_items' AND COLUMN_NAME = 'protein') = 0,
  'ALTER TABLE meal_items ADD COLUMN protein DECIMAL(6,1) NULL AFTER kcal',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meal_items' AND COLUMN_NAME = 'carbs') = 0,
  'ALTER TABLE meal_items ADD COLUMN carbs DECIMAL(6,1) NULL AFTER protein',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meal_items' AND COLUMN_NAME = 'fat') = 0,
  'ALTER TABLE meal_items ADD COLUMN fat DECIMAL(6,1) NULL AFTER carbs',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0002_draft_columns');
