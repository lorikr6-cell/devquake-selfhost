-- =============================================================================
-- canteen 0004 — Delivery routes: drivers and their shifts, each person's delivery window,
-- routes per day and driver with the order of their stops
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- Times of day are wall-clock minutes after midnight (8:00 stays 8:00 across daylight saving).
-- =============================================================================

SET NAMES utf8mb4;

-- When a person at home can receive their meal, e.g. 11:00–13:00 (NULL: any time of the shift).
SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_people'
                    AND COLUMN_NAME = 'window_from_min');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_people ADD COLUMN window_from_min SMALLINT UNSIGNED NULL AFTER observation, ADD COLUMN window_to_min SMALLINT UNSIGNED NULL AFTER window_from_min',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- The people who deliver: they need no DevQuake account (they get a printed sheet). weekdays is
-- a list like "1,2,3,4,5" (1 = Monday).
CREATE TABLE IF NOT EXISTS canteen_drivers (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id          INT UNSIGNED NOT NULL,
  name            VARCHAR(80)  NOT NULL,
  phone           VARCHAR(40)  NULL,
  weekdays        VARCHAR(20)  NOT NULL DEFAULT '1,2,3,4,5',
  shift_from_min  SMALLINT UNSIGNED NOT NULL DEFAULT 660,
  shift_to_min    SMALLINT UNSIGNED NOT NULL DEFAULT 840,
  active          TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY ix_canteen_drivers_org (org_id, active),
  CONSTRAINT fk_canteen_drivers_org FOREIGN KEY (org_id) REFERENCES canteen_orgs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The stops of a driver's route on a day, in order. A person is on at most one route a day.
CREATE TABLE IF NOT EXISTS canteen_route_stops (
  org_id     INT UNSIGNED NOT NULL,
  day        DATE         NOT NULL,
  person_id  INT UNSIGNED NOT NULL,
  driver_id  INT UNSIGNED NOT NULL,
  position   SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (org_id, day, person_id),
  KEY ix_canteen_route_stops_driver (driver_id, day, position),
  CONSTRAINT fk_canteen_route_stops_org FOREIGN KEY (org_id) REFERENCES canteen_orgs (id) ON DELETE CASCADE,
  CONSTRAINT fk_canteen_route_stops_person FOREIGN KEY (person_id) REFERENCES canteen_people (id) ON DELETE CASCADE,
  CONSTRAINT fk_canteen_route_stops_driver FOREIGN KEY (driver_id) REFERENCES canteen_drivers (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Minutes a stop takes on average (driving and handing over), for the estimated times.
SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_orgs'
                    AND COLUMN_NAME = 'minutes_per_stop');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_orgs ADD COLUMN minutes_per_stop TINYINT UNSIGNED NOT NULL DEFAULT 12 AFTER name',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0004_canteen_routes');
