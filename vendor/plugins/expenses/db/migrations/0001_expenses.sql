-- =============================================================================
-- expenses 0001 — Shared expenses (the plugin's OWN database, ADR 0007 and ADR 0055)
--
-- Apply to the expenses database (e.g. u962314563_expenses), NOT the platform database:
--   pnpm db:migrate --plugin expenses     (uses EXPENSES_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- Members are group records (group_members.id); expenses, shares, payments and comments point at
-- them, never at platform user ids, so a member who leaves or deletes their account keeps the
-- others' balances intact (ADR 0055). user ids are the platform's, stored as plain numbers.
-- Money is DECIMAL(12,2) in the group's currency; days are DATE (shown as stored, ADR 0010).
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(100) NOT NULL,
  applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A trip, a flat, a couple, an event: people who share costs in one currency.
CREATE TABLE IF NOT EXISTS expense_groups (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id  INT UNSIGNED NOT NULL,
  name           VARCHAR(80)  NOT NULL,
  kind           ENUM('trip','flat','couple','event','other') NOT NULL DEFAULT 'other',
  currency       CHAR(3)      NOT NULL DEFAULT 'EUR',
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_expense_groups_owner (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Everyone in a group: with an account (user_id) or without one (a name the owner typed).
-- user_id becomes NULL when they leave or delete their account; left_at marks a former member,
-- who stays in old expenses and the balances. invited_by: who brought them in (free access for
-- invitees, ADR 0043).
CREATE TABLE IF NOT EXISTS group_members (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  group_id      INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NULL,
  display_name  VARCHAR(80)  NOT NULL,
  role          ENUM('owner','member') NOT NULL DEFAULT 'member',
  invited_by    INT UNSIGNED NULL,
  joined_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  left_at       DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_group_members_user (group_id, user_id),
  KEY ix_group_members_user (user_id),
  CONSTRAINT fk_group_members_group FOREIGN KEY (group_id) REFERENCES expense_groups (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS group_invites (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  group_id    INT UNSIGNED NOT NULL,
  code        CHAR(8) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  created_by  INT UNSIGNED NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at  DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_group_invites_code (code),
  KEY ix_group_invites_group (group_id),
  CONSTRAINT fk_group_invites_group FOREIGN KEY (group_id) REFERENCES expense_groups (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Something one member paid for the group. split_mode says how the shares were typed; the shares
-- themselves are stored in cents-exact amounts (expense_shares.amount).
CREATE TABLE IF NOT EXISTS expenses (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  group_id      INT UNSIGNED  NOT NULL,
  title         VARCHAR(120)  NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  paid_by       INT UNSIGNED  NOT NULL,
  split_mode    ENUM('equal','shares','percent','exact') NOT NULL DEFAULT 'equal',
  category      VARCHAR(20)   NOT NULL DEFAULT 'other',
  spent_on      DATE          NOT NULL,
  note          VARCHAR(500)  NULL,
  created_by    INT UNSIGNED  NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_expenses_group (group_id, spent_on),
  KEY ix_expenses_paid_by (paid_by),
  CONSTRAINT fk_expenses_group FOREIGN KEY (group_id) REFERENCES expense_groups (id) ON DELETE CASCADE,
  CONSTRAINT fk_expenses_paid_by FOREIGN KEY (paid_by) REFERENCES group_members (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Each participant's part of an expense: `amount` in money (the parts add up to the expense);
-- `input` is what was typed for shares, percent or exact splits (NULL for equal splits).
CREATE TABLE IF NOT EXISTS expense_shares (
  expense_id  INT UNSIGNED  NOT NULL,
  member_id   INT UNSIGNED  NOT NULL,
  amount      DECIMAL(12,2) NOT NULL,
  input       DECIMAL(12,4) NULL,
  PRIMARY KEY (expense_id, member_id),
  KEY ix_expense_shares_member (member_id),
  CONSTRAINT fk_expense_shares_expense FOREIGN KEY (expense_id) REFERENCES expenses (id) ON DELETE CASCADE,
  CONSTRAINT fk_expense_shares_member FOREIGN KEY (member_id) REFERENCES group_members (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Money one member gave another to settle up.
CREATE TABLE IF NOT EXISTS payments (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  group_id     INT UNSIGNED  NOT NULL,
  from_member  INT UNSIGNED  NOT NULL,
  to_member    INT UNSIGNED  NOT NULL,
  amount       DECIMAL(12,2) NOT NULL,
  paid_on      DATE          NOT NULL,
  note         VARCHAR(255)  NULL,
  created_by   INT UNSIGNED  NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_payments_group (group_id, paid_on),
  CONSTRAINT fk_payments_group FOREIGN KEY (group_id) REFERENCES expense_groups (id) ON DELETE CASCADE,
  CONSTRAINT fk_payments_from FOREIGN KEY (from_member) REFERENCES group_members (id),
  CONSTRAINT fk_payments_to FOREIGN KEY (to_member) REFERENCES group_members (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS expense_comments (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  expense_id  INT UNSIGNED  NOT NULL,
  member_id   INT UNSIGNED  NOT NULL,
  body        VARCHAR(1000) NOT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_expense_comments_expense (expense_id, created_at),
  CONSTRAINT fk_expense_comments_expense FOREIGN KEY (expense_id) REFERENCES expenses (id) ON DELETE CASCADE,
  CONSTRAINT fk_expense_comments_member FOREIGN KEY (member_id) REFERENCES group_members (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The group's feed: one line per change, with a snapshot of the title and amount so it survives
-- the expense being deleted. kind: expense_added, expense_edited, expense_deleted, payment_added,
-- payment_deleted, member_joined, member_left, comment_added.
CREATE TABLE IF NOT EXISTS group_activity (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  group_id    INT UNSIGNED  NOT NULL,
  member_id   INT UNSIGNED  NULL,
  kind        VARCHAR(20)   NOT NULL,
  expense_id  INT UNSIGNED  NULL,
  title       VARCHAR(120)  NULL,
  amount      DECIMAL(12,2) NULL,
  other_id    INT UNSIGNED  NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_group_activity_group (group_id, created_at),
  CONSTRAINT fk_group_activity_group FOREIGN KEY (group_id) REFERENCES expense_groups (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0001_expenses');
