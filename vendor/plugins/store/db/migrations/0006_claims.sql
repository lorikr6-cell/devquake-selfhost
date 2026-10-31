-- =============================================================================
-- 0006 — Claims and NPS point packages (ADR 0079)
--
-- The platform asks the store to make a claim for a DevQuake member, e.g. a challenge prize.
-- For now a claim gives an NPS point package: a shop's package is a name and 1–100 points,
-- claim-only (never listed or sold: NPS points cannot be bought). The claim link's token and the
-- secret code are stored only as SHA-256 hashes; five wrong codes lock a claim; it expires
-- (90 days by default). The host adds the points when the member claims (its claim_rewards).
-- Every DATETIME is UTC. SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS claim_packages (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  store_id    INT UNSIGNED  NOT NULL,
  name        VARCHAR(120)  NOT NULL,
  points      SMALLINT UNSIGNED NOT NULL,
  archived    TINYINT(1)    NOT NULL DEFAULT 0,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY ix_claim_packages_store (store_id, archived),
  CONSTRAINT fk_claim_packages_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS claims (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  -- The id the platform knows (random, never the row number).
  public_id        VARCHAR(16)   CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  store_id         INT UNSIGNED  NOT NULL,
  package_id       INT UNSIGNED  NULL,
  -- What it gives, kept even if the package changes later.
  points           SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  title            VARCHAR(160)  NOT NULL,
  user_id          INT UNSIGNED  NOT NULL,
  -- What it is for, in every language (JSON of PluginLocalizedText).
  reason           TEXT          NOT NULL,
  source           VARCHAR(40)   NOT NULL,
  ref              VARCHAR(80)   NOT NULL,
  token_hash       CHAR(64)      CHARACTER SET ascii NOT NULL,
  code_hash        CHAR(64)      CHARACTER SET ascii NOT NULL,
  failed_attempts  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status           ENUM('open','claimed','cancelled') NOT NULL DEFAULT 'open',
  expires_at       DATETIME      NOT NULL,
  claimed_at       DATETIME      NULL,
  cancelled_at     DATETIME      NULL,
  created_at       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_claims_public (public_id),
  UNIQUE KEY uq_claims_token (token_hash),
  UNIQUE KEY uq_claims_source (source, ref),
  KEY ix_claims_user (user_id),
  CONSTRAINT fk_claims_store FOREIGN KEY (store_id) REFERENCES stores (id) ON DELETE CASCADE,
  CONSTRAINT fk_claims_package FOREIGN KEY (package_id) REFERENCES claim_packages (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0006_claims');
