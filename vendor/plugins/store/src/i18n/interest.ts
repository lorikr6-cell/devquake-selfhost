import { defineMessages } from './define';
import { interestDe } from './interest-de';
import { interestEn } from './interest-en';
import { interestHu } from './interest-hu';
import { interestRo } from './interest-ro';

/** Interest votes before a product is sold (ADR 0060). */
export const interest = defineMessages(interestEn, {
  de: interestDe,
  ro: interestRo,
  hu: interestHu,
});
