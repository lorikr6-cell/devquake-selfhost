-- =============================================================================
-- venue 0009 — Stock: ingredients and drinks, recipes, and every change to the stock (the
-- plugin's OWN database, ADR 0007)
--
-- Apply to the venue database (e.g. u962314563_venue), after 0008:
--   pnpm db:migrate --plugin venue     (uses VENUE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- ingredients: what the venue keeps (beans, milk, beer, buns…), the stock on hand and the level
-- to have each day and each week. recipe_lines: what one of a menu item uses. stock_moves: each
-- change (an order, a count, a delivery, waste), kept 90 days. A menu item is unavailable on its
-- own when an ingredient of its recipe runs short. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS ingredients (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  venue_id       INT UNSIGNED  NOT NULL,
  name           VARCHAR(80)   NOT NULL,
  unit           ENUM('g', 'kg', 'ml', 'l', 'pcs') NOT NULL DEFAULT 'pcs',
  stock          DECIMAL(12,3) NOT NULL DEFAULT 0,
  daily_target   DECIMAL(12,3) NOT NULL DEFAULT 0,
  weekly_target  DECIMAL(12,3) NOT NULL DEFAULT 0,
  counted_at     DATETIME      NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_ingredients_venue (venue_id, name),
  CONSTRAINT fk_ingredients_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS recipe_lines (
  item_id        INT UNSIGNED  NOT NULL,
  ingredient_id  INT UNSIGNED  NOT NULL,
  qty            DECIMAL(12,3) NOT NULL,
  PRIMARY KEY (item_id, ingredient_id),
  KEY ix_recipe_ingredient (ingredient_id),
  CONSTRAINT fk_recipe_item FOREIGN KEY (item_id) REFERENCES menu_items (id) ON DELETE CASCADE,
  CONSTRAINT fk_recipe_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_moves (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  venue_id       INT UNSIGNED  NOT NULL,
  ingredient_id  INT UNSIGNED  NOT NULL,
  change_qty     DECIMAL(12,3) NOT NULL,
  reason         ENUM('sale', 'unsale', 'count', 'delivery', 'waste') NOT NULL,
  ref            VARCHAR(40)   NULL,
  by_name        VARCHAR(80)   NOT NULL,
  at             DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_stock_moves_venue (venue_id, at),
  CONSTRAINT fk_stock_moves_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0009_venue_stock');
