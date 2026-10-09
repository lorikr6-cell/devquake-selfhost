-- =============================================================================
-- cookbook 0002 — Public recipes, recommendations, comments; clearer recipes
--
-- recipes.is_public        1 = every member of the app sees it (Community), may recommend and
--                          comment; published_at = when it was made public.
-- recipes.equipment        what to have ready (pan, oven…), one per line.
-- recipes.nps_milestones   how many 100-recommendation milestones earned the author an NPS
--                          point (ADR 0037); the scheduled hook awards the missing ones.
-- recipe_steps.stage       prepare / cook / serve (the view groups steps by stage).
-- recipe_steps.uses        the ingredients a step uses: positions, comma-separated ("0,2").
-- recipe_recommendations   one per member and recipe (like a "like").
-- recipe_comments          comments on public recipes; notified_at = when the author was told.
-- Apply to the cookbook database (COOKBOOK_DB_*). SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recipes' AND COLUMN_NAME = 'is_public') = 0,
  'ALTER TABLE recipes ADD COLUMN is_public TINYINT(1) NOT NULL DEFAULT 0 AFTER share_code, ADD COLUMN published_at DATETIME NULL AFTER is_public, ADD COLUMN equipment VARCHAR(500) NULL AFTER tips, ADD COLUMN nps_milestones SMALLINT UNSIGNED NOT NULL DEFAULT 0 AFTER published_at, ADD KEY ix_recipes_public (is_public, published_at)',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'recipe_steps' AND COLUMN_NAME = 'stage') = 0,
  'ALTER TABLE recipe_steps ADD COLUMN stage ENUM(''prepare'',''cook'',''serve'') NOT NULL DEFAULT ''cook'' AFTER position, ADD COLUMN uses VARCHAR(160) CHARACTER SET ascii NULL AFTER timer_sec',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

CREATE TABLE IF NOT EXISTS recipe_recommendations (
  recipe_id   INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (recipe_id, user_id),
  KEY ix_recipe_recommendations_user (user_id),
  CONSTRAINT fk_recipe_recommendations_recipe FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recipe_comments (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  recipe_id    INT UNSIGNED NOT NULL,
  user_id      INT UNSIGNED NOT NULL,
  user_name    VARCHAR(80)  NOT NULL,
  body         TEXT         NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notified_at  DATETIME     NULL,
  PRIMARY KEY (id),
  KEY ix_recipe_comments_recipe (recipe_id, created_at),
  KEY ix_recipe_comments_user (user_id),
  KEY ix_recipe_comments_notify (notified_at),
  CONSTRAINT fk_recipe_comments_recipe FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0002_community');
