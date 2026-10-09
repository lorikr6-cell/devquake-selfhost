-- =============================================================================
-- utilities 0002 — The profile address in parts
--
-- profiles.address stays as the whole address on one line (composed by the app); the parts are
-- stored separately so they can be checked and suggested: country (ISO 3166-1 alpha-2 code),
-- state or county, city, street, house number and an optional apartment.
-- Profiles saved before this have the parts empty; the app asks those people to complete them.
--
-- Apply to the utilities database: pnpm db:migrate --plugin utilities, or phpMyAdmin → Import.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles' AND COLUMN_NAME = 'country_code') = 0,
  'ALTER TABLE profiles
     ADD COLUMN country_code CHAR(2) CHARACTER SET ascii NULL AFTER address,
     ADD COLUMN state VARCHAR(100) NULL AFTER country_code,
     ADD COLUMN city VARCHAR(100) NULL AFTER state,
     ADD COLUMN street VARCHAR(150) NULL AFTER city,
     ADD COLUMN house_number VARCHAR(20) NULL AFTER street,
     ADD COLUMN apartment VARCHAR(40) NULL AFTER house_number',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0002_profile_address');
