-- =============================================================================
-- venue 0006 — The venue's darts tournaments on its public menu (the plugin's OWN database,
-- ADR 0007; app connections: ADR 0035)
--
-- Apply to the venue database (e.g. u962314563_venue), after 0005:
--   pnpm db:migrate --plugin venue     (uses VENUE_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- venue_darts: a short copy of the owner's open tournaments in Darts (name, game, status, the
-- join link), refreshed when the owner opens Venue (at most every 10 minutes), so guests on the
-- public menu see them without Darts being asked for each visit. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS venue_darts (
  venue_id    INT UNSIGNED  NOT NULL,
  ref         VARCHAR(20)   CHARACTER SET ascii NOT NULL,
  name        VARCHAR(80)   NOT NULL,
  game        VARCHAR(60)   NOT NULL,
  status      VARCHAR(12)   CHARACTER SET ascii NOT NULL,
  players     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  fee         VARCHAR(20)   NULL,
  url         VARCHAR(500)  NULL,
  synced_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (venue_id, ref),
  CONSTRAINT fk_venue_darts_venue FOREIGN KEY (venue_id) REFERENCES venues (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0006_venue_darts');
