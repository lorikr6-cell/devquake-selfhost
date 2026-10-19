import { defineMessages } from './define';
import { growthDe } from './growth-de';
import { growthEn } from './growth-en';
import { growthHu } from './growth-hu';
import { growthIt } from './growth-it';
import { growthEs } from './growth-es';
import { growthRo } from './growth-ro';

/** The growth features' texts (ADR 0058), one file per language. */
export const growth = defineMessages(growthEn, {
  de: growthDe,
  ro: growthRo,
  hu: growthHu,
  it: growthIt,
  es: growthEs,
});
