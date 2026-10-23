import { describe, expect, it } from 'vitest';
import { CONTACT_EMAIL_PATTERN, isContactEmail, storedContactEmail } from './contact-email';

describe('the organisation contact email', () => {
  it('stays DevQuake’s address unless the organisers set a valid one', () => {
    expect(storedContactEmail('')).toBeNull();
    expect(storedContactEmail(' Contact@DevQuake.com ')).toBeNull();
    expect(storedContactEmail(' Office@Cantina-Speranta.ro ')).toBe('office@cantina-speranta.ro');
    expect(storedContactEmail('office@cantina')).toBeUndefined();
    expect(storedContactEmail('two words@x.ro')).toBeUndefined();
  });

  it('checks the same way in the browser and on the server', () => {
    const browser = new RegExp(`^(?:${CONTACT_EMAIL_PATTERN})$`);
    for (const v of ['a@b.ro', 'x.y@mail.example.com', 'bad@', '@b.ro', 'a@b']) {
      expect(browser.test(v), v).toBe(isContactEmail(v));
    }
  });
});
