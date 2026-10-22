-- =============================================================================
-- canteen 0007 — Medical papers: discharge letters, test results, prescriptions (PDF or photo)
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- Health data: the title and the file are stored ENCRYPTED (lib/crypto.ts); only medical staff
-- open them, and every opening is logged.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS canteen_med_papers (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  person_id     INT UNSIGNED NOT NULL,
  title_sealed  TEXT         NOT NULL,
  mime          VARCHAR(40)  NOT NULL,
  bytes         INT UNSIGNED NOT NULL,
  data          MEDIUMBLOB   NOT NULL,
  uploaded_by   INT UNSIGNED NOT NULL,
  uploaded_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_canteen_med_papers_person (person_id, uploaded_at),
  CONSTRAINT fk_canteen_med_papers_person FOREIGN KEY (person_id) REFERENCES canteen_people (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0007_canteen_med_papers');
