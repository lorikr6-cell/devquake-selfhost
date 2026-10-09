-- =============================================================================
-- shopping 0008 — Small versions of pictures (ADR 0040)
--
-- item_photos: thumb_mime + thumb, the small version the browser sends with each new
-- picture (at most 480 px). Lists and previews load it (?size=thumb); the full picture opens on
-- tap. Pictures from before have none and are served in full.
-- Apply to the shopping database (SHOPPING_DB_*). SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'item_photos' AND COLUMN_NAME = 'thumb') = 0,
  'ALTER TABLE item_photos ADD COLUMN thumb_mime VARCHAR(20) NULL AFTER bytes, ADD COLUMN thumb MEDIUMBLOB NULL AFTER thumb_mime',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0008_photo_thumbs');
