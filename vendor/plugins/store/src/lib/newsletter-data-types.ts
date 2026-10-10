// Newsletter types shared by the server and the editor (ADR 0058).

/** 'promo': on offer; 'new': newly available. */
export const NEWSLETTER_SECTIONS = ['promo', 'new'] as const;
export type NewsletterSection = (typeof NEWSLETTER_SECTIONS)[number];
