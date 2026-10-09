-- =============================================================================
-- cookbook 0003 — The food catalogue in the database
--
-- foods   the ingredients recipes link to: names in every language, a kind (vegetable, herb,
--         spice…), a drawn thumbnail (icon key + colour), nutrition per 100 g, the weight of a
--         piece or spoon (grams, JSON), density, EU allergens (comma-separated), origin (for the
--         diet tags), spice (scales less than linearly) and is_active (0: kept for the recipes
--         that use it, not offered any more). Ids are stored in recipes: never rename or delete.
--
-- The app fills the table itself: on first use it adds the built-in foods (lib/foods.ts,
-- lib/foods-extra.ts) that are missing, and staff edit them under /admin/foods.
-- Apply to the cookbook database (COOKBOOK_DB_*). SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS foods (
  id          VARCHAR(40)  CHARACTER SET ascii NOT NULL,
  kind        VARCHAR(16)  CHARACTER SET ascii NOT NULL,
  icon        VARCHAR(16)  CHARACTER SET ascii NOT NULL,
  colour      CHAR(7)      CHARACTER SET ascii NULL,
  name_en     VARCHAR(80)  NOT NULL,
  name_de     VARCHAR(80)  NOT NULL,
  name_ro     VARCHAR(80)  NOT NULL,
  name_hu     VARCHAR(80)  NOT NULL,
  kcal        DECIMAL(6,1) NOT NULL,
  protein     DECIMAL(5,1) NOT NULL,
  carbs       DECIMAL(5,1) NOT NULL,
  fat         DECIMAL(5,1) NOT NULL,
  fibre       DECIMAL(5,1) NOT NULL,
  salt        DECIMAL(6,2) NOT NULL,
  grams       VARCHAR(300) CHARACTER SET ascii NULL,
  density     DECIMAL(5,3) NULL,
  allergens   VARCHAR(160) CHARACTER SET ascii NULL,
  origin      VARCHAR(8)   CHARACTER SET ascii NOT NULL,
  is_spice    TINYINT(1)   NOT NULL DEFAULT 0,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_foods_kind (kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0003_foods');
