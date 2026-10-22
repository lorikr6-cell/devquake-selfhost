-- =============================================================================
-- canteen 0001 — Social canteen: organisations, staff, people, documents, incidents
--
-- Apply to the canteen database (e.g. u962314563_canteen), NOT the platform database:
--   pnpm db:migrate --plugin canteen     (uses CANTEEN_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- Everything belongs to an organisation. Staff are platform users (user_id) with a role in it.
-- The people the organisation feeds are records of the organisation, not platform users.
-- Personal numbers (CNP, ID card number) and every document are stored ENCRYPTED with
-- CANTEEN_MASTER_KEY (AES-256-GCM, lib/crypto.ts); a database copy alone does not reveal them.
-- Times are UTC; birth dates are DATE (shown as stored, ADR 0010).
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(100) NOT NULL,
  applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A social service, NGO, parish or care home that feeds people.
CREATE TABLE IF NOT EXISTS canteen_orgs (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(120) NOT NULL,
  created_by  INT UNSIGNED NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The organisation's staff: platform users with one role each (lib/roles.ts).
CREATE TABLE IF NOT EXISTS canteen_staff (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id        INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  display_name  VARCHAR(80)  NOT NULL,
  role          ENUM('organiser','coordinator','kitchen','driver','medical') NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_canteen_staff_user (org_id, user_id),
  KEY ix_canteen_staff_user (user_id),
  CONSTRAINT fk_canteen_staff_org FOREIGN KEY (org_id) REFERENCES canteen_orgs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The people the organisation feeds: at home (delivery) or in its care home (resident).
-- cnp_sealed / id_number_sealed: encrypted text; id_series is the two letters on the card.
CREATE TABLE IF NOT EXISTS canteen_people (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id            INT UNSIGNED NOT NULL,
  first_name        VARCHAR(60)  NOT NULL,
  last_name         VARCHAR(60)  NOT NULL,
  birth_date        DATE         NULL,
  kind              ENUM('delivery','resident') NOT NULL DEFAULT 'delivery',
  status            ENUM('active','paused','ended') NOT NULL DEFAULT 'active',
  address           VARCHAR(255) NULL,
  phone             VARCHAR(40)  NULL,
  contact_name      VARCHAR(80)  NULL,
  contact_phone     VARCHAR(40)  NULL,
  diet              ENUM('normal','diabetic','low_salt','soft','pureed','vegetarian') NOT NULL DEFAULT 'normal',
  allergies         VARCHAR(255) NULL,
  observation       VARCHAR(500) NULL,
  id_series         VARCHAR(4)   NULL,
  id_number_sealed  VARCHAR(200) NULL,
  cnp_sealed        VARCHAR(200) NULL,
  created_by        INT UNSIGNED NOT NULL,
  created_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_canteen_people_org (org_id, status, last_name),
  CONSTRAINT fk_canteen_people_org FOREIGN KEY (org_id) REFERENCES canteen_orgs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A person's pictures: profile photo and ID card (required), up to two more (e.g. the pension
-- coupon). data and thumb are encrypted (lib/crypto.ts); mime is the type before encryption.
CREATE TABLE IF NOT EXISTS canteen_documents (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  person_id    INT UNSIGNED NOT NULL,
  kind         ENUM('photo','id_card','extra1','extra2') NOT NULL,
  mime         VARCHAR(40)  NOT NULL,
  data         MEDIUMBLOB   NOT NULL,
  thumb_mime   VARCHAR(40)  NULL,
  thumb        MEDIUMBLOB   NULL,
  uploaded_by  INT UNSIGNED NOT NULL,
  uploaded_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_canteen_documents_kind (person_id, kind),
  CONSTRAINT fk_canteen_documents_person FOREIGN KEY (person_id) REFERENCES canteen_people (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- What happened to a person, written by the organiser (not medical; that is the medical file).
CREATE TABLE IF NOT EXISTS canteen_incidents (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  person_id    INT UNSIGNED NOT NULL,
  occurred_at  DATETIME     NOT NULL,
  note         TEXT         NOT NULL,
  created_by   INT UNSIGNED NOT NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_canteen_incidents_person (person_id, occurred_at),
  CONSTRAINT fk_canteen_incidents_person FOREIGN KEY (person_id) REFERENCES canteen_people (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Who opened a person's personal numbers or documents, and when (shown to the organisers).
CREATE TABLE IF NOT EXISTS canteen_access_log (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  org_id     INT UNSIGNED NOT NULL,
  person_id  INT UNSIGNED NOT NULL,
  user_id    INT UNSIGNED NULL,
  action     VARCHAR(40)  NOT NULL,
  at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_canteen_access_person (person_id, at),
  CONSTRAINT fk_canteen_access_org FOREIGN KEY (org_id) REFERENCES canteen_orgs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0001_canteen');
