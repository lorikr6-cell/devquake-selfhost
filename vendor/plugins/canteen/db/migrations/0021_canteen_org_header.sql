-- Social canteen: the organisation's own header look (font, background colour or picture, text
-- colour, alignment), used on its pages, its public page and the top of every printout. The
-- picture is kept here like the logo (a redeploy replaces the app's folder), shrunk in the
-- browser first.

ALTER TABLE canteen_orgs
  ADD COLUMN header_font VARCHAR(16) NULL AFTER logo_updated_at,
  ADD COLUMN header_bg CHAR(7) NULL AFTER header_font,
  ADD COLUMN header_text ENUM('auto','dark','light') NOT NULL DEFAULT 'auto' AFTER header_bg,
  ADD COLUMN header_align ENUM('left','center') NOT NULL DEFAULT 'left' AFTER header_text,
  ADD COLUMN header_image_mime VARCHAR(20) NULL AFTER header_align,
  ADD COLUMN header_image MEDIUMBLOB NULL AFTER header_image_mime,
  ADD COLUMN header_image_updated_at DATETIME NULL AFTER header_image;

INSERT IGNORE INTO schema_migrations (version) VALUES ('0021_canteen_org_header');
