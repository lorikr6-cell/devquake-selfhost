-- =============================================================================
-- canteen 0019 — Social work: social workers, places, the waiting list and visits
--
-- canteen_staff.social_worker   a staff member is (also) the organisation's social worker: the
--                               "Social work" tab (places, waiting list, visits), whatever role.
-- canteen_orgs.max_residents    how many residents and home deliveries the organisation takes
-- canteen_orgs.max_delivery     (NULL = no limit); active and paused people take a place.
-- canteen_people.status         gains 'waiting': on the waiting list (no meals, no routes),
-- canteen_people.waiting_since  since when.
-- canteen_staff.roles           several roles per staff member (role stays the main one).
-- canteen_people.social_worker_user  the social worker responsible for a person.
-- canteen_assessments           the social assessment questionnaire, answers ENCRYPTED.
-- canteen_visits                a social worker's visit to a person (assessment, home visit,
--                               follow-up): when (UTC), who goes, planned / done / cancelled,
--                               notes ENCRYPTED (lib/crypto.ts). Deleted with the person.
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_staff'
                    AND COLUMN_NAME = 'social_worker');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_staff ADD COLUMN social_worker TINYINT(1) NOT NULL DEFAULT 0',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_orgs'
                    AND COLUMN_NAME = 'max_residents');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_orgs ADD COLUMN max_residents SMALLINT UNSIGNED NULL, ADD COLUMN max_delivery SMALLINT UNSIGNED NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE canteen_people
  MODIFY status ENUM('active','paused','ended','waiting') NOT NULL DEFAULT 'active';

SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_people'
                    AND COLUMN_NAME = 'waiting_since');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_people ADD COLUMN waiting_since DATE NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS canteen_visits (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id        INT UNSIGNED NOT NULL,
  person_id     INT UNSIGNED NOT NULL,
  planned_at    DATETIME     NOT NULL,
  kind          ENUM('assessment','home_visit','follow_up','other') NOT NULL DEFAULT 'home_visit',
  status        ENUM('planned','done','cancelled') NOT NULL DEFAULT 'planned',
  assigned_to   INT UNSIGNED NULL,
  notes_sealed  TEXT         NULL,
  created_by    INT UNSIGNED NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at     DATETIME     NULL,
  PRIMARY KEY (id),
  KEY ix_canteen_visits_org (org_id, planned_at),
  CONSTRAINT fk_canteen_visits_org FOREIGN KEY (org_id) REFERENCES canteen_orgs (id) ON DELETE CASCADE,
  CONSTRAINT fk_canteen_visits_person FOREIGN KEY (person_id) REFERENCES canteen_people (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Several roles per staff member (even all of them): `roles` holds them all; `role` stays the
-- main one (ordering, "View as"). Filled from `role` for everyone already on the staff.
SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_staff'
                    AND COLUMN_NAME = 'roles');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_staff ADD COLUMN roles SET(''organiser'',''coordinator'',''kitchen'',''driver'',''medical'') NOT NULL DEFAULT ''''',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
UPDATE canteen_staff SET roles = role WHERE roles = '';

-- Social workers split the people between them: the one responsible for a person (a staff
-- member's account), NULL = nobody yet.
SET @has_col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'canteen_people'
                    AND COLUMN_NAME = 'social_worker_user');
SET @sql := IF(@has_col = 0,
  'ALTER TABLE canteen_people ADD COLUMN social_worker_user INT UNSIGNED NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- A social assessment questionnaire filled in for a person (often at an assessment visit):
-- the answers as JSON, ENCRYPTED. Every filling is kept, newest first on the profile.
CREATE TABLE IF NOT EXISTS canteen_assessments (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id          INT UNSIGNED NOT NULL,
  person_id       INT UNSIGNED NOT NULL,
  visit_id        INT UNSIGNED NULL,
  answers_sealed  MEDIUMTEXT   NOT NULL,
  created_by      INT UNSIGNED NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_canteen_assessments_person (person_id, created_at),
  CONSTRAINT fk_canteen_assessments_org FOREIGN KEY (org_id) REFERENCES canteen_orgs (id) ON DELETE CASCADE,
  CONSTRAINT fk_canteen_assessments_person FOREIGN KEY (person_id) REFERENCES canteen_people (id) ON DELETE CASCADE,
  CONSTRAINT fk_canteen_assessments_visit FOREIGN KEY (visit_id) REFERENCES canteen_visits (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0019_canteen_social_work');
