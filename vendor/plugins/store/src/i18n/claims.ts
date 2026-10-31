import { defineMessages } from './define';
import { claimsDe } from './claims-de';
import { claimsEn } from './claims-en';
import { claimsEs } from './claims-es';
import { claimsHu } from './claims-hu';
import { claimsIt } from './claims-it';
import { claimsRo } from './claims-ro';

/** Claims and NPS point packages (ADR 0079). */
export const claims = defineMessages(claimsEn, {
  de: claimsDe,
  ro: claimsRo,
  hu: claimsHu,
  it: claimsIt,
  es: claimsEs,
});
