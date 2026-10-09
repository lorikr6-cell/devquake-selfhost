-- =============================================================================
-- cookbook 0004 — Pictures of ingredients
--
-- food_photos      pictures of a food. user_id set: a member's own picture (one per member and
--                  food), seen only by them and by DevQuake staff. user_id NULL: the copy staff
--                  chose to show everyone (it stays when the member deletes their account).
-- foods.photo_id   the picture everyone sees instead of the drawn thumbnail; NULL: the drawn
--                  thumbnail (it is always kept, never deleted).
-- Apply to the cookbook database (COOKBOOK_DB_*). SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS food_photos (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  food_id     VARCHAR(40)  CHARACTER SET ascii NOT NULL,
  user_id     INT UNSIGNED NULL,
  mime        VARCHAR(20)  NOT NULL,
  data        MEDIUMBLOB   NOT NULL,
  bytes       INT UNSIGNED NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_food_photos_member (food_id, user_id),
  KEY ix_food_photos_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'foods' AND COLUMN_NAME = 'photo_id') = 0,
  'ALTER TABLE foods ADD COLUMN photo_id INT UNSIGNED NULL AFTER icon',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0004_food_photos');
