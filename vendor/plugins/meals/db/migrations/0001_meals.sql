-- =============================================================================
-- meals 0001 — Meal planner (the plugin's OWN database, ADR 0007)
--
-- Apply to the meals database (e.g. u962314563_meals), NOT the platform database:
--   pnpm db:migrate --plugin meals     (uses MEALS_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- Recipes stay in the cookbook app: a meal's recipe part keeps the recipe's ref and a copy of its
-- title and nutrition per portion (so the plan still reads well if the cookbook changes or is gone).
-- user ids are the platform's, stored as plain numbers. Timestamps are UTC (ADR 0010); DATE
-- columns are calendar days.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(100) NOT NULL,
  applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A household. diet = a cookbook diet tag for suggestions (or empty); avoid = allergen codes
-- (comma-separated) suggestions leave out; dislikes = words, one per line. time_zone = the
-- creator's zone when last saved (reminders). Targets are per person and day.
CREATE TABLE IF NOT EXISTS households (
  id              INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  owner_user_id   INT UNSIGNED      NOT NULL,
  name            VARCHAR(60)       NOT NULL,
  diet            VARCHAR(20)       CHARACTER SET ascii NOT NULL DEFAULT '',
  avoid           VARCHAR(160)      CHARACTER SET ascii NOT NULL DEFAULT '',
  dislikes        VARCHAR(500)      NULL,
  kcal_target     SMALLINT UNSIGNED NOT NULL DEFAULT 2000,
  protein_target  SMALLINT UNSIGNED NOT NULL DEFAULT 60,
  time_zone       VARCHAR(64)       NOT NULL DEFAULT 'UTC',
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_households_owner (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Members with an account: the planner(s) change everything; members see the plan, swap and
-- mark meals cooked.
CREATE TABLE IF NOT EXISTS household_members (
  household_id  INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  name          VARCHAR(80)  NOT NULL,
  role          ENUM('planner','member') NOT NULL DEFAULT 'member',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (household_id, user_id),
  KEY ix_household_members_user (user_id),
  CONSTRAINT fk_household_members_household FOREIGN KEY (household_id) REFERENCES households (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS household_invites (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  household_id  INT UNSIGNED NOT NULL,
  code          CHAR(8) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_by    INT UNSIGNED NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at    DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_household_invites_code (code),
  KEY ix_household_invites_household (household_id),
  CONSTRAINT fk_household_invites_household FOREIGN KEY (household_id) REFERENCES households (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Who eats (with or without an account): portion_size 1 = an adult, 0.5 = a small child.
-- (Not "portion": MariaDB reserves that word.)
CREATE TABLE IF NOT EXISTS eaters (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  household_id  INT UNSIGNED NOT NULL,
  name          VARCHAR(60)  NOT NULL,
  portion_size  DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_eaters_household (household_id),
  CONSTRAINT fk_eaters_household FOREIGN KEY (household_id) REFERENCES households (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A planned meal: a day and slot, the servings to cook, and its parts (meal_items). leftovers = 1:
-- eaten from what was cooked earlier (nothing to cook or buy). remind = a note emailed the evening
-- before ("take the chicken out of the freezer"). set_id = the saved meal it came from.
CREATE TABLE IF NOT EXISTS meals (
  id            INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  household_id  INT UNSIGNED     NOT NULL,
  day           DATE             NOT NULL,
  slot          ENUM('breakfast','lunch','dinner','snack') NOT NULL,
  title         VARCHAR(100)     NOT NULL,
  servings      TINYINT UNSIGNED NOT NULL DEFAULT 2,
  leftovers     TINYINT(1)       NOT NULL DEFAULT 0,
  cooked        TINYINT(1)       NOT NULL DEFAULT 0,
  note          VARCHAR(200)     NULL,
  remind        VARCHAR(160)     NULL,
  set_id        INT UNSIGNED     NULL,
  created_by    INT UNSIGNED     NULL,
  created_at    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_meals_household_day (household_id, day),
  KEY ix_meals_remind (day),
  CONSTRAINT fk_meals_household FOREIGN KEY (household_id) REFERENCES households (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A meal's parts: a cookbook recipe (recipe_ref "shakshuka" or "12", with a copy of its title and
-- nutrition per portion taken when planned) or a simple item with a quantity ("bread, 1 pcs").
CREATE TABLE IF NOT EXISTS meal_items (
  meal_id     INT UNSIGNED     NOT NULL,
  position    TINYINT UNSIGNED NOT NULL,
  recipe_ref  VARCHAR(40)      CHARACTER SET ascii NULL,
  name        VARCHAR(100)     NOT NULL,
  qty         DECIMAL(10,3)    NULL,
  unit        VARCHAR(16)      NULL,
  kcal        DECIMAL(7,1)     NULL,
  protein     DECIMAL(6,1)     NULL,
  carbs       DECIMAL(6,1)     NULL,
  fat         DECIMAL(6,1)     NULL,
  PRIMARY KEY (meal_id, position),
  CONSTRAINT fk_meal_items_meal FOREIGN KEY (meal_id) REFERENCES meals (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Evening-before reminders already sent (one per meal and day), so nobody gets one twice.
CREATE TABLE IF NOT EXISTS meal_reminders_sent (
  meal_id  INT UNSIGNED NOT NULL,
  day      DATE         NOT NULL,
  sent_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (meal_id, day),
  CONSTRAINT fk_meal_reminders_meal FOREIGN KEY (meal_id) REFERENCES meals (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A saved meal (a meal's configuration to reuse): its parts, for how many servings, private to its
-- owner or public (every member of the app may use it, recommend it and comment on it). A public
-- meal only uses library or public cookbook recipes, so others can read them.
CREATE TABLE IF NOT EXISTS meal_sets (
  id             INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  owner_user_id  INT UNSIGNED     NOT NULL,
  owner_name     VARCHAR(80)      NOT NULL,
  title          VARCHAR(100)     NOT NULL,
  description    TEXT             NULL,
  slot           ENUM('breakfast','lunch','dinner','snack') NOT NULL DEFAULT 'dinner',
  servings       TINYINT UNSIGNED NOT NULL DEFAULT 2,
  is_public      TINYINT(1)       NOT NULL DEFAULT 0,
  published_at   DATETIME         NULL,
  created_at     DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_meal_sets_owner (owner_user_id),
  KEY ix_meal_sets_public (is_public, published_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meal_set_items (
  set_id      INT UNSIGNED     NOT NULL,
  position    TINYINT UNSIGNED NOT NULL,
  recipe_ref  VARCHAR(40)      CHARACTER SET ascii NULL,
  name        VARCHAR(100)     NOT NULL,
  qty         DECIMAL(10,3)    NULL,
  unit        VARCHAR(16)      NULL,
  kcal        DECIMAL(7,1)     NULL,
  protein     DECIMAL(6,1)     NULL,
  carbs       DECIMAL(6,1)     NULL,
  fat         DECIMAL(6,1)     NULL,
  PRIMARY KEY (set_id, position),
  CONSTRAINT fk_meal_set_items_set FOREIGN KEY (set_id) REFERENCES meal_sets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS meal_set_recommendations (
  set_id      INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (set_id, user_id),
  KEY ix_meal_set_recommendations_user (user_id),
  CONSTRAINT fk_meal_set_recommendations_set FOREIGN KEY (set_id) REFERENCES meal_sets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comments on public saved meals; notified_at = when the owner was told (scheduled hook).
CREATE TABLE IF NOT EXISTS meal_set_comments (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  set_id       INT UNSIGNED NOT NULL,
  user_id      INT UNSIGNED NOT NULL,
  user_name    VARCHAR(80)  NOT NULL,
  body         TEXT         NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notified_at  DATETIME     NULL,
  PRIMARY KEY (id),
  KEY ix_meal_set_comments_set (set_id, created_at),
  KEY ix_meal_set_comments_user (user_id),
  KEY ix_meal_set_comments_notify (notified_at),
  CONSTRAINT fk_meal_set_comments_set FOREIGN KEY (set_id) REFERENCES meal_sets (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0001_meals');
