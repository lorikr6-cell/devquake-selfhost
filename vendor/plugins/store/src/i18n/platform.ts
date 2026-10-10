import { defineMessages } from './define';
import { platformDe } from './platform-de';
import { platformEn } from './platform-en';
import { platformHu } from './platform-hu';
import { platformRo } from './platform-ro';

/** The shop on DevQuake: connecting a DevQuake account, saved details and the promotion. */
export const platform = defineMessages(platformEn, {
  de: platformDe,
  ro: platformRo,
  hu: platformHu,
});
