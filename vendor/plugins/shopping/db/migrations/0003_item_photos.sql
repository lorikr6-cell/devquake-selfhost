-- =============================================================================
-- shopping 0003 — Product photos
--
-- One optional photo per item, stored in the shopping database (like avatars on the platform).
-- The browser shrinks photos before uploading (max 1280 px, about 100-300 KB); the server
-- accepts JPEG, PNG or WebP up to 2 MB. Deleting an item or a list deletes its photo.
--
-- Apply to the shopping database: pnpm db:migrate --plugin shopping, or phpMyAdmin → Import.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS item_photos (
  item_id     INT UNSIGNED  NOT NULL,
  mime        VARCHAR(20)   NOT NULL,
  data        MEDIUMBLOB    NOT NULL,
  bytes       INT UNSIGNED  NOT NULL,
  uploaded_by INT UNSIGNED  NULL,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (item_id),
  CONSTRAINT fk_item_photos_item FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0003_item_photos');
