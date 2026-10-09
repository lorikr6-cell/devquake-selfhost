-- =============================================================================
-- cookbook 0006 — Public links to recipes (ADR 0047)
--
-- recipes.public_code  the code of the recipe's public link (/p/CODE), set by its author: anyone
--                      who has the link sees the recipe and its photo, signed in or not, for
--                      example from Facebook, WhatsApp or Pinterest. NULL = no public link.
--                      Separate from share_code (members-only links, recipe_access).
-- Apply to the cookbook database (COOKBOOK_DB_*). SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recipes' AND COLUMN_NAME = 'public_code') = 0,
  'ALTER TABLE recipes ADD COLUMN public_code CHAR(10) CHARACTER SET ascii COLLATE ascii_bin NULL AFTER share_code, ADD UNIQUE KEY uq_recipes_public (public_code)',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0006_public_links');
