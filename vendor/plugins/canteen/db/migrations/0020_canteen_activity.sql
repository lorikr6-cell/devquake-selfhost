-- Social canteen: activity reports. Every change a staff member makes is one row (what, when,
-- about whom), so organisers can report on one person or on a group (all drivers, all social
-- workers, the kitchen…). Kept two years; who did it is forgotten when the account is deleted.

CREATE TABLE IF NOT EXISTS canteen_activity (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id      INT UNSIGNED    NOT NULL,
  user_id     INT UNSIGNED    NULL,
  action      VARCHAR(40)     NOT NULL,
  person_id   INT UNSIGNED    NULL,
  created_at  DATETIME        NOT NULL,
  PRIMARY KEY (id),
  KEY ix_canteen_activity_org (org_id, created_at),
  KEY ix_canteen_activity_user (org_id, user_id, created_at),
  CONSTRAINT fk_canteen_activity_org FOREIGN KEY (org_id) REFERENCES canteen_orgs (id) ON DELETE CASCADE,
  CONSTRAINT fk_canteen_activity_person FOREIGN KEY (person_id) REFERENCES canteen_people (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0020_canteen_activity');
