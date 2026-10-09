-- =============================================================================
-- darts 0001 — Darts: profiles, games, tournaments and drills (the plugin's OWN database,
-- ADR 0027)
--
-- Apply to the darts database (e.g. u962314563_darts), NOT the platform database:
--   pnpm db:migrate --plugin darts     (uses DARTS_DB_*)
--   or import this file in phpMyAdmin with that database selected.
--
-- A game's state is never stored: it is replayed from its players and visits (three darts
-- each) by the rules in src/lib/engine. Times are UTC (ADR 0010). user_id is the DevQuake
-- account id (no cross-database foreign keys): deleteUserData (src/platform.ts) deletes what a
-- person owns and removes their name and id from other people's games and tournaments.
-- SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version     VARCHAR(100) NOT NULL,
  applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The player's profile (set up before the first game).
CREATE TABLE IF NOT EXISTS profiles (
  user_id          INT UNSIGNED     NOT NULL,
  nickname         VARCHAR(40)      NOT NULL,
  hand             VARCHAR(5)       NOT NULL DEFAULT 'right',     -- right | left
  level            VARCHAR(12)      NOT NULL DEFAULT 'beginner',  -- beginner | intermediate | advanced
  entry_mode       VARCHAR(8)       NOT NULL DEFAULT 'board',     -- board | keypad
  favorite_double  TINYINT UNSIGNED NULL,                         -- 1–20 or 25 (the bull)
  created_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A tournament: a knock-out on the organiser's boards. Rounds are drawn one at a time.
CREATE TABLE IF NOT EXISTS tournaments (
  id                  INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  owner_user_id       INT UNSIGNED      NOT NULL,
  owner_name          VARCHAR(100)      NOT NULL,
  name                VARCHAR(80)       NOT NULL,
  game_type           VARCHAR(12)       NOT NULL,
  options             TEXT              NOT NULL,   -- JSON, see src/lib/engine/games.ts
  fee_cents           INT UNSIGNED      NOT NULL DEFAULT 0,
  currency            CHAR(3)           NOT NULL DEFAULT 'EUR',
  organizer_pct       TINYINT UNSIGNED  NOT NULL DEFAULT 0,
  status              VARCHAR(12)       NOT NULL DEFAULT 'registration', -- registration | running | finished
  join_code           CHAR(8) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  round               TINYINT UNSIGNED  NOT NULL DEFAULT 0,             -- current round (0 = not started)
  champion_player_id  INT UNSIGNED      NULL,                           -- tournament_players.id
  version             INT UNSIGNED      NOT NULL DEFAULT 0,             -- bumped on every change (polling)
  created_at          DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at          DATETIME          NULL,
  finished_at         DATETIME          NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tournaments_code (join_code),
  KEY ix_tournaments_owner (owner_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The organiser's dart boards; each has its own code (QR) that players scan.
CREATE TABLE IF NOT EXISTS boards (
  id             INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  tournament_id  INT UNSIGNED      NOT NULL,
  name           VARCHAR(40)       NOT NULL,
  code           CHAR(8) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  position       SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_boards_code (code),
  KEY ix_boards_tournament (tournament_id, position),
  CONSTRAINT fk_boards_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Players of a tournament. user_id is NULL once the account was deleted (name blanked too).
CREATE TABLE IF NOT EXISTS tournament_players (
  id                INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  tournament_id     INT UNSIGNED      NOT NULL,
  user_id           INT UNSIGNED      NULL,
  display_name      VARCHAR(100)      NOT NULL,
  board_id          INT UNSIGNED      NULL,
  rating            DECIMAL(5,1)      NOT NULL DEFAULT 0,
  paid              TINYINT(1)        NOT NULL DEFAULT 0,
  bye_round         TINYINT UNSIGNED  NULL,   -- the round they went through without playing
  eliminated_round  TINYINT UNSIGNED  NULL,   -- the round they lost
  joined_at         DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tournament_players (tournament_id, user_id),
  KEY ix_tournament_players_user (user_id),
  CONSTRAINT fk_tplayers_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
  CONSTRAINT fk_tplayers_board FOREIGN KEY (board_id) REFERENCES boards (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Practice drills made for a player from their statistics (only they see them).
CREATE TABLE IF NOT EXISTS drills (
  id              INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED      NOT NULL,
  reason          VARCHAR(20)       NOT NULL,   -- a skill, or 'starter'
  game_type       VARCHAR(12)       NOT NULL,
  options         TEXT              NOT NULL,   -- JSON
  params          TEXT              NOT NULL,   -- JSON: values for the translated title
  played          SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at      DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_played_at  DATETIME          NULL,
  PRIMARY KEY (id),
  KEY ix_drills_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- A game (a match): practice (alone), casual (with invited players) or a tournament match.
CREATE TABLE IF NOT EXISTS games (
  id                INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  mode              VARCHAR(12)       NOT NULL,   -- practice | casual | tournament
  game_type         VARCHAR(12)       NOT NULL,
  options           TEXT              NOT NULL,   -- JSON
  owner_user_id     INT UNSIGNED      NULL,       -- NULL for tournament matches
  status            VARCHAR(10)       NOT NULL DEFAULT 'waiting', -- waiting | playing | finished
  join_code         CHAR(8) CHARACTER SET ascii COLLATE ascii_bin NULL,  -- casual: players join
  watch_code        CHAR(8) CHARACTER SET ascii COLLATE ascii_bin NOT NULL, -- anyone watches
  tournament_id     INT UNSIGNED      NULL,
  round             TINYINT UNSIGNED  NULL,
  board_id          INT UNSIGNED      NULL,
  drill_id          INT UNSIGNED      NULL,
  winner_player_id  INT UNSIGNED      NULL,       -- game_players.id
  version           INT UNSIGNED      NOT NULL DEFAULT 0,  -- bumped on every change (polling)
  created_at        DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at        DATETIME          NULL,
  finished_at       DATETIME          NULL,
  updated_at        DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_games_join (join_code),
  UNIQUE KEY uq_games_watch (watch_code),
  KEY ix_games_owner (owner_user_id, status),
  KEY ix_games_tournament (tournament_id, round),
  KEY ix_games_status (status, updated_at),
  CONSTRAINT fk_games_tournament FOREIGN KEY (tournament_id) REFERENCES tournaments (id) ON DELETE CASCADE,
  CONSTRAINT fk_games_board FOREIGN KEY (board_id) REFERENCES boards (id) ON DELETE SET NULL,
  CONSTRAINT fk_games_drill FOREIGN KEY (drill_id) REFERENCES drills (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The players of a game, in the order they throw. user_id NULL: a deleted account.
CREATE TABLE IF NOT EXISTS game_players (
  id                    INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  game_id               INT UNSIGNED      NOT NULL,
  user_id               INT UNSIGNED      NULL,
  display_name          VARCHAR(100)      NOT NULL,
  seat                  TINYINT UNSIGNED  NOT NULL,
  number                TINYINT UNSIGNED  NULL,   -- Killer: drawn at the start
  tournament_player_id  INT UNSIGNED      NULL,
  joined_at             DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_game_players (game_id, user_id),
  KEY ix_game_players_user (user_id),
  CONSTRAINT fk_game_players_game FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Every visit (up to three darts) in the order thrown. darts: "T20,1,D20" (see engine/darts.ts).
-- (game_id, seq) is unique, so two devices can never both add the same visit.
CREATE TABLE IF NOT EXISTS visits (
  id          BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  game_id     INT UNSIGNED      NOT NULL,
  player_id   INT UNSIGNED      NOT NULL,
  seq         SMALLINT UNSIGNED NOT NULL,
  darts       VARCHAR(40)       NOT NULL,
  created_at  DATETIME          NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_visits_seq (game_id, seq),
  CONSTRAINT fk_visits_game FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE,
  CONSTRAINT fk_visits_player FOREIGN KEY (player_id) REFERENCES game_players (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0001_darts');
