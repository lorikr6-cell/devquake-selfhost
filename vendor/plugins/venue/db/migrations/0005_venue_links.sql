-- =============================================================================
-- venue 0005 — What the venue is linked to in other apps (the plugin's OWN database, ADR 0007;
-- app connections: ADR 0035)
--
-- Apply to the venue database (e.g. u962314563_venue), after 0004:
--   pnpm db:migrate --plugin venue     (uses VENUE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- venue_links: the owner's choice in each connected app, e.g. the shopping list the venue buys
-- with (its costs). `ref` is the other app's id for it, `name` how it was called then.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS venue_links (
  venue_id    INT UNSIGNED  NOT NULL,
  kind        VARCHAR(24)   CHARACTER SET ascii NOT NULL,
  ref         VARCHAR(40)   NOT NULL,
  name        VARCHAR(100)  NOT NULL,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (venue_id, kind),
  CONSTRAINT fk_venue_links_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0005_venue_links');
