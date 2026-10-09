-- =============================================================================
-- shopping 0009 — Store logos (ADR 0052)
--
-- brand_logos  one row per store name ("lidl", "kaufland"), shared by every list: the logo found
--              on Wikidata / Wikimedia Commons or the store's website (data, a raster image of at
--              most 200 kB), or found = 0 when there is none (asked again after 30 days).
--              Not about any member: nothing to remove when one leaves.
-- Apply to the shopping database (SHOPPING_DB_*). SAFE TO RE-RUN.
-- =============================================================================

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS brand_logos (
  name_key      VARCHAR(80)   CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  found         TINYINT(1)    NOT NULL DEFAULT 0,
  data          MEDIUMBLOB    NULL,
  content_type  VARCHAR(40)   CHARACTER SET ascii NULL,
  source        VARCHAR(12)   CHARACTER SET ascii NULL,
  checked_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (name_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0009_brand_logos');
