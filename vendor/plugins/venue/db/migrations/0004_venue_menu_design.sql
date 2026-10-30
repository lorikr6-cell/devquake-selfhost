-- =============================================================================
-- venue 0004 — The menu's own design: a background picture and how the texts look (the plugin's
-- OWN database, ADR 0007)
--
-- Apply to the venue database (e.g. u962314563_venue), after 0003:
--   pnpm db:migrate --plugin venue     (uses VENUE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- menu_designs: one per venue. The owner places up to 5 pictures in the browser, which flattens
-- them into ONE background (an A4 page, at most 2 MB) kept here, never on disk; the menu's texts
-- are drawn on top with the chosen font, colours, panel and columns. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS menu_designs (
  venue_id        INT UNSIGNED  NOT NULL,
  title           VARCHAR(80)   NULL,
  subtitle        VARCHAR(120)  NULL,
  font            ENUM('serif', 'sans', 'hand', 'classic', 'modern') NOT NULL DEFAULT 'serif',
  text_color      CHAR(7)       CHARACTER SET ascii NOT NULL DEFAULT '#1f1f1f',
  accent_color    CHAR(7)       CHARACTER SET ascii NOT NULL DEFAULT '#b4532a',
  panel           ENUM('none', 'light', 'dark') NOT NULL DEFAULT 'light',
  columns         TINYINT UNSIGNED NOT NULL DEFAULT 1,
  show_allergens  TINYINT(1)    NOT NULL DEFAULT 1,
  on_public       TINYINT(1)    NOT NULL DEFAULT 1,
  bg_mime         VARCHAR(16)   CHARACTER SET ascii NULL,
  bg_data         MEDIUMBLOB    NULL,
  bg_bytes        INT UNSIGNED  NOT NULL DEFAULT 0,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (venue_id),
  CONSTRAINT fk_menu_designs_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0004_venue_menu_design');
