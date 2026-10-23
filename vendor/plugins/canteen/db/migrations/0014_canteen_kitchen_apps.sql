-- =============================================================================
-- canteen 0014 — Dishes from Cookbook and the purchasing list in Shopping (app links, ADR 0035)
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
--
-- canteen_dishes             a recipe picked from a staff member's Cookbook, copied for the
--                            organisation (it stays when that person leaves): its name, the
--                            servings it is written for, allergens, nutrition per portion. A menu
--                            line with the same name is that dish (menus stay plain text).
-- canteen_dish_ingredients   its ingredients for `base_servings`, with how each one scales.
-- canteen_org_links          the organisation's chosen list in another app (its purchasing list).
-- canteen_shopping_exports   each week sent to that list (a digest, to warn about sending twice).
-- Everything cascades from canteen_orgs.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS canteen_dishes (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id          INT UNSIGNED NOT NULL,
  recipe_ref      VARCHAR(40)  CHARACTER SET ascii NULL,
  title           VARCHAR(100) NOT NULL,
  base_servings   SMALLINT UNSIGNED NOT NULL,
  allergens       VARCHAR(160) CHARACTER SET ascii NOT NULL DEFAULT '',
  kcal            DECIMAL(7,1) NULL,
  imported_by     INT UNSIGNED NULL,
  imported_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_canteen_dishes_title (org_id, title),
  CONSTRAINT fk_canteen_dishes_org FOREIGN KEY (org_id) REFERENCES canteen_orgs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS canteen_dish_ingredients (
  dish_id   INT UNSIGNED     NOT NULL,
  position  TINYINT UNSIGNED NOT NULL,
  name      VARCHAR(80)      NOT NULL,
  qty       DECIMAL(10,3)    NULL,
  unit      VARCHAR(16)      NULL,
  scaling   ENUM('linear','whole','spice','fixed') NOT NULL DEFAULT 'linear',
  PRIMARY KEY (dish_id, position),
  CONSTRAINT fk_canteen_dish_ingredients_dish FOREIGN KEY (dish_id) REFERENCES canteen_dishes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS canteen_org_links (
  org_id       INT UNSIGNED NOT NULL,
  app          ENUM('shopping') NOT NULL,
  external_id  INT UNSIGNED NOT NULL,
  label        VARCHAR(80)  NOT NULL,
  set_by       INT UNSIGNED NULL,
  set_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (org_id, app),
  CONSTRAINT fk_canteen_org_links_org FOREIGN KEY (org_id) REFERENCES canteen_orgs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS canteen_shopping_exports (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id       INT UNSIGNED NOT NULL,
  week         DATE         NOT NULL,
  list_id      INT UNSIGNED NOT NULL,
  items        SMALLINT UNSIGNED NOT NULL,
  digest       CHAR(64)     CHARACTER SET ascii NOT NULL,
  exported_by  INT UNSIGNED NULL,
  exported_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_canteen_shopping_exports_week (org_id, week),
  CONSTRAINT fk_canteen_shopping_exports_org FOREIGN KEY (org_id) REFERENCES canteen_orgs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0014_canteen_kitchen_apps');
