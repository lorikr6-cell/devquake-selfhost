-- =============================================================================
-- utilities 0003 — View-only members and confirmed (locked) payments
--
-- utility_members.view_only: the member sees the utility and all its bills but does not share
--   them (a family member): they are not a participant of its bills, have no share and pay
--   nothing.
-- payments.confirmed_by: who confirmed the payment (the manager). A confirmed payment is locked:
--   only a DevQuake administrator can change or delete it.
-- payments.email_sent_at: when the person who paid got the confirmation email (sent by the
--   app's scheduled job; NULL = still to send). Payments recorded before this migration are
--   marked as sent, so nobody gets emails about old payments.
--
-- Apply to the utilities database: pnpm db:migrate --plugin utilities, or phpMyAdmin → Import.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'utility_members' AND COLUMN_NAME = 'view_only') = 0,
  'ALTER TABLE utility_members ADD COLUMN view_only TINYINT(1) NOT NULL DEFAULT 0 AFTER role',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

SET @dq_sql := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'email_sent_at') = 0,
  'ALTER TABLE payments
     ADD COLUMN confirmed_by INT UNSIGNED NULL AFTER received_on,
     ADD COLUMN email_sent_at DATETIME NULL AFTER confirmed_by,
     ADD KEY ix_payments_email (email_sent_at)',
  'DO 0');
PREPARE dq_stmt FROM @dq_sql;
EXECUTE dq_stmt;
DEALLOCATE PREPARE dq_stmt;

-- Only once (the column was just added, so every row is NULL): old payments send no email.
UPDATE payments SET email_sent_at = updated_at
 WHERE email_sent_at IS NULL
   AND NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '0003_view_only_and_locked_payments');

INSERT IGNORE INTO schema_migrations (version) VALUES ('0003_view_only_and_locked_payments');
