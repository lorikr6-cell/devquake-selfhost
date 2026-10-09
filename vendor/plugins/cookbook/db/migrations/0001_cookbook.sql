-- =============================================================================
-- cookbook 0001 — Cookbook (the plugin's OWN database, ADR 0007)
--
-- Apply to the cookbook database (e.g. u962314563_cookbook), NOT the platform database:
--   pnpm db:migrate --plugin cookbook     (uses COOKBOOK_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- The starter library lives in the code (src/lib/library.ts, every language); this database
-- holds members' own recipes, who they shared them with, and favourites. user ids are the
-- platform's, stored as plain numbers. Timestamps are UTC (ADR 0010).
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(100) NOT NULL,
  applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A member's own recipe. tags and allergens are comma-separated codes (lib/recipe.ts TAGS,
-- lib/foods.ts ALLERGENS) the author declared. share_code: anyone with /s/CODE (signed in)
-- may see it; null = private.
CREATE TABLE IF NOT EXISTS recipes (
  id             INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  owner_user_id  INT UNSIGNED      NOT NULL,
  owner_name     VARCHAR(80)       NOT NULL,
  title          VARCHAR(100)      NOT NULL,
  intro          TEXT              NULL,
  tips           TEXT              NULL,
  servings       TINYINT UNSIGNED  NOT NULL DEFAULT 2,
  prep_min       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  cook_min       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  difficulty     ENUM('easy','medium','hard') NOT NULL DEFAULT 'easy',
  cuisine        VARCHAR(40)       NULL,
  tags           VARCHAR(255)      CHARACTER SET ascii NOT NULL DEFAULT '',
  allergens      VARCHAR(160)      CHARACTER SET ascii NOT NULL DEFAULT '',
  share_code     CHAR(8)           CHARACTER SET ascii COLLATE ascii_bin NULL,
  created_at     DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_recipes_share (share_code),
  KEY ix_recipes_owner (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ingredients in order. food_id: a food of lib/foods.ts (nutrition, allergens), or null.
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  recipe_id  INT UNSIGNED     NOT NULL,
  position   TINYINT UNSIGNED NOT NULL,
  name       VARCHAR(80)      NOT NULL,
  qty        DECIMAL(10,3)    NULL,
  unit       VARCHAR(8)       CHARACTER SET ascii NOT NULL,
  food_id    VARCHAR(40)      CHARACTER SET ascii NULL,
  scaling    ENUM('linear','whole','spice','fixed') NOT NULL DEFAULT 'linear',
  note       VARCHAR(80)      NULL,
  PRIMARY KEY (recipe_id, position),
  CONSTRAINT fk_recipe_ingredients_recipe FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Steps in order, each with an optional timer (seconds) for cooking mode.
CREATE TABLE IF NOT EXISTS recipe_steps (
  recipe_id  INT UNSIGNED     NOT NULL,
  position   TINYINT UNSIGNED NOT NULL,
  text       TEXT             NOT NULL,
  timer_sec  INT UNSIGNED     NULL,
  PRIMARY KEY (recipe_id, position),
  CONSTRAINT fk_recipe_steps_recipe FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The recipe's photo, shrunk in the browser; JPEG, PNG or WebP, at most 2 MB, checked by content.
CREATE TABLE IF NOT EXISTS recipe_photos (
  recipe_id   INT UNSIGNED NOT NULL,
  mime        VARCHAR(20)  NOT NULL,
  data        MEDIUMBLOB   NOT NULL,
  bytes       INT UNSIGNED NOT NULL,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (recipe_id),
  CONSTRAINT fk_recipe_photos_recipe FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- People who opened a recipe's share link: they keep seeing it until the owner stops sharing.
CREATE TABLE IF NOT EXISTS recipe_access (
  recipe_id   INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (recipe_id, user_id),
  KEY ix_recipe_access_user (user_id),
  CONSTRAINT fk_recipe_access_recipe FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Favourites: a library recipe id ("shakshuka") or an own recipe's id as text ("12").
CREATE TABLE IF NOT EXISTS favourites (
  user_id     INT UNSIGNED NOT NULL,
  recipe_ref  VARCHAR(40)  CHARACTER SET ascii NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, recipe_ref)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0001_cookbook');
