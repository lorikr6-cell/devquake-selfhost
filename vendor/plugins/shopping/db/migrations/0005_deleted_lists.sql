-- =============================================================================
-- shopping 0005 — Deleting a list keeps its statistics
--
-- The owner deletes a list: it disappears for everyone (memberships, invites, notifications
-- and product photos are removed), but the list row with its items and stores stays, marked
-- with lists.deleted_at, so the spending statistics of everyone who was on it stay the same.
--
-- deleted_list_members: who was on a deleted list, used ONLY by the statistics. It gives no
-- access to the list. A person's rows go when they delete their DevQuake account or
-- unsubscribe; a deleted list with nobody left in it is then removed for good.
--
-- Apply to the shopping database: pnpm db:migrate --plugin shopping, or phpMyAdmin → Import.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'lists' AND COLUMN_NAME = 'deleted_at') = 0,
  'ALTER TABLE lists ADD COLUMN deleted_at DATETIME NULL AFTER version',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

CREATE TABLE IF NOT EXISTS deleted_list_members (
  list_id       INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  role          ENUM('owner','member') NOT NULL DEFAULT 'member',
  display_name  VARCHAR(100) NOT NULL,
  joined_at     DATETIME     NOT NULL,
  PRIMARY KEY (list_id, user_id),
  KEY ix_deleted_list_members_user (user_id),
  CONSTRAINT fk_deleted_list_members_list FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0005_deleted_lists');
