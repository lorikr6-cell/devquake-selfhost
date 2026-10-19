import { defineMessages } from './define';
import { screensDe } from './screens-de';
import { screensEn } from './screens-en';
import { screensHu } from './screens-hu';
import { screensIt } from './screens-it';
import { screensEs } from './screens-es';
import { screensRo } from './screens-ro';

/** Everything shown on the app's pages (ADR 0011), one file per language. */
export const screens = defineMessages(screensEn, {
  de: screensDe,
  ro: screensRo,
  hu: screensHu,
  it: screensIt,
  es: screensEs,
});
