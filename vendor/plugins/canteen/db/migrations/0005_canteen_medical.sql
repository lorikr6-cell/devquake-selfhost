-- =============================================================================
-- canteen 0005 — The medical file: profile, medications and their administration, medical
-- notes, hospital stays
--
-- Apply to the canteen database (pnpm db:migrate --plugin canteen, or phpMyAdmin with that
-- database selected), NOT the platform database. SAFE TO RE-RUN.
-- Health data (GDPR art. 9): every free text below is stored ENCRYPTED (columns ending in
-- _sealed, lib/crypto.ts with CANTEEN_MASTER_KEY). Only medical staff read them.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS canteen_medical_profiles (
  person_id              INT UNSIGNED NOT NULL,
  conditions_sealed      TEXT         NULL,
  allergies_sealed       TEXT         NULL,
  family_doctor_sealed   TEXT         NULL,
  blood_type_sealed      VARCHAR(200) NULL,
  notes_sealed           TEXT         NULL,
  updated_by             INT UNSIGNED NOT NULL,
  updated_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (person_id),
  CONSTRAINT fk_canteen_medical_profiles_person FOREIGN KEY (person_id) REFERENCES canteen_people (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A medicine and when it is given: times of day as minutes after midnight ("480,1200"), on every
-- day from starts_on until ends_on (NULL: no end).
CREATE TABLE IF NOT EXISTS canteen_medications (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  person_id        INT UNSIGNED NOT NULL,
  name_sealed      TEXT         NOT NULL,
  dose_sealed      TEXT         NOT NULL,
  notes_sealed     TEXT         NULL,
  times            VARCHAR(60)  NOT NULL,
  starts_on        DATE         NOT NULL,
  ends_on          DATE         NULL,
  created_by       INT UNSIGNED NOT NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_canteen_medications_person (person_id),
  CONSTRAINT fk_canteen_medications_person FOREIGN KEY (person_id) REFERENCES canteen_people (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Each scheduled dose that was given, refused or missed: who recorded it and when.
CREATE TABLE IF NOT EXISTS canteen_med_doses (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  medication_id  INT UNSIGNED NOT NULL,
  day            DATE         NOT NULL,
  time_min       SMALLINT UNSIGNED NOT NULL,
  status         ENUM('given','refused','missed') NOT NULL,
  note_sealed    TEXT         NULL,
  recorded_by    INT UNSIGNED NOT NULL,
  recorded_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_canteen_med_doses_slot (medication_id, day, time_min),
  CONSTRAINT fk_canteen_med_doses_medication FOREIGN KEY (medication_id) REFERENCES canteen_medications (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- What the medical staff noted: what happened, what was done, who was told.
CREATE TABLE IF NOT EXISTS canteen_med_notes (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  person_id     INT UNSIGNED NOT NULL,
  occurred_at   DATETIME     NOT NULL,
  note_sealed   TEXT         NOT NULL,
  created_by    INT UNSIGNED NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_canteen_med_notes_person (person_id, occurred_at),
  CONSTRAINT fk_canteen_med_notes_person FOREIGN KEY (person_id) REFERENCES canteen_people (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A stay in hospital. While returned_on is NULL the person gets no meals or deliveries; the
-- organisers see only that they are in hospital, never why.
CREATE TABLE IF NOT EXISTS canteen_hospital_stays (
  id                       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  person_id                INT UNSIGNED NOT NULL,
  left_on                  DATE         NOT NULL,
  returned_on              DATE         NULL,
  hospital_sealed          TEXT         NULL,
  cause_sealed             TEXT         NOT NULL,
  verdict_sealed           TEXT         NULL,
  recommendations_sealed   TEXT         NULL,
  recommendations_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_by               INT UNSIGNED NOT NULL,
  created_at               DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_canteen_hospital_stays_person (person_id, returned_on),
  CONSTRAINT fk_canteen_hospital_stays_person FOREIGN KEY (person_id) REFERENCES canteen_people (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0005_canteen_medical');
