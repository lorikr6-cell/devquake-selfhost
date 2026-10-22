import { describe, expect, it } from 'vitest';
import { licenceState, nameOnLicence, readLicence } from './licence';

// What OCR typically returns for a Romanian (EU) driving licence.
const LICENCE = `ROMÂNIA
PERMIS DE CONDUCERE
1. POPESCU
2. ȘTEFAN ION
3. 17.09.1957 CLUJ
4a. 12.03.2016 4c. SPCRPCIV CLUJ
4b. 11.03.2026
5. 123456789 CJ
9. AM/B1/B`;

describe('driving licences', () => {
  it('reads the numbered fields', () => {
    expect(readLicence(LICENCE)).toEqual({
      surname: 'POPESCU',
      givenNames: 'ȘTEFAN ION',
      expiresOn: '2026-03-11',
      number: '123456789CJ',
    });
  });

  it('takes a value from the next line and refuses impossible dates', () => {
    expect(readLicence('4b.\n30.06.2030').expiresOn).toBe('2030-06-30');
    expect(readLicence('4b. 31.02.2030').expiresOn).toBeNull();
    expect(readLicence('nothing here')).toEqual({
      surname: null,
      givenNames: null,
      expiresOn: null,
      number: null,
    });
  });

  it('finds the driver on the licence, whatever the accents and case', () => {
    expect(nameOnLicence('Ștefan Popescu', LICENCE)).toBe(true);
    expect(nameOnLicence('stefan popescu', LICENCE)).toBe(true);
    expect(nameOnLicence('Ion Ionescu', LICENCE)).toBe(false);
    expect(nameOnLicence('Pop', LICENCE)).toBe(false); // part of a word is not the name
    expect(nameOnLicence('', LICENCE)).toBe(false);
  });

  it('warns within three months and after the expiry', () => {
    expect(licenceState(null, '2026-10-22')).toEqual({ kind: 'missing' });
    expect(licenceState('2026-10-21', '2026-10-22')).toEqual({
      kind: 'expired',
      expiresOn: '2026-10-21',
    });
    expect(licenceState('2026-10-22', '2026-10-22')).toEqual({
      kind: 'soon',
      expiresOn: '2026-10-22',
      daysLeft: 0,
    });
    expect(licenceState('2027-01-20', '2026-10-22')).toMatchObject({ kind: 'soon', daysLeft: 90 });
    expect(licenceState('2027-01-21', '2026-10-22')).toEqual({
      kind: 'ok',
      expiresOn: '2027-01-21',
    });
  });
});
