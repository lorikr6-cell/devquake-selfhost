-- =============================================================================
-- canteen 0003 — Meal planning: residents' meal times, menus per day, diet variants, the days
-- each person gets a delivery
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

-- The care home's meals each day with their strict window, e.g. breakfast 8:00–8:30.
-- Times are minutes after midnight in the organisation's local time (a wall-clock time, not an
-- instant, so it stays 8:00 across daylight saving time).
CREATE TABLE IF NOT EXISTS canteen_meal_times (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id      INT UNSIGNED NOT NULL,
  name        VARCHAR(40)  NOT NULL,
  starts_min  SMALLINT UNSIGNED NOT NULL,
  ends_min    SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  KEY ix_canteen_meal_times_org (org_id, starts_min),
  CONSTRAINT fk_canteen_meal_times_org FOREIGN KEY (org_id) REFERENCES canteen_orgs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- What is cooked: per day and meal. meal_time_id 0 = the delivered meal of the day; otherwise
-- one of the residents' meal times. dishes: one dish per line.
CREATE TABLE IF NOT EXISTS canteen_menus (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id        INT UNSIGNED NOT NULL,
  day           DATE         NOT NULL,
  meal_time_id  INT UNSIGNED NOT NULL DEFAULT 0,
  dishes        TEXT         NOT NULL,
  updated_by    INT UNSIGNED NOT NULL,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_canteen_menus_meal (org_id, day, meal_time_id),
  CONSTRAINT fk_canteen_menus_org FOREIGN KEY (org_id) REFERENCES canteen_orgs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A diet's own version of a menu (the diabetic or the soft one); without one, that diet gets the
-- menu itself.
CREATE TABLE IF NOT EXISTS canteen_menu_variants (
  menu_id  INT UNSIGNED NOT NULL,
  diet     ENUM('normal','diabetic','low_salt','soft','pureed','vegetarian') NOT NULL,
  dishes   TEXT         NOT NULL,
  PRIMARY KEY (menu_id, diet),
  CONSTRAINT fk_canteen_menu_variants_menu FOREIGN KEY (menu_id) REFERENCES canteen_menus (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The weekdays a person who lives at home gets a meal delivered (1 = Monday … 7 = Sunday).
-- Residents eat every day at every meal time.
CREATE TABLE IF NOT EXISTS canteen_delivery_days (
  person_id  INT UNSIGNED NOT NULL,
  weekday    TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (person_id, weekday),
  CONSTRAINT fk_canteen_delivery_days_person FOREIGN KEY (person_id) REFERENCES canteen_people (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0003_canteen_meals');
