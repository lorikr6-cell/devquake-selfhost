import type { PluginEmail, PluginLocale } from '@devquake/plugin-sdk';
import { LOCALE_TAGS, localizePath } from '@devquake/ui';
import { translator } from '../i18n';
import { formatDayLong, mondayOf } from './dates';
import type { Slot } from './plan';

export interface MealReminder {
  householdId: number;
  household: string;
  day: string;
  slot: Slot;
  title: string;
  remind: string;
}

/**
 * The evening-before reminder: what to do (the planner's note), for which meal and day, with a
 * button to the week. Plain text: the host escapes it and puts it into the DevQuake layout
 * (ADR 0014).
 */
export function mealReminderEmail(
  m: MealReminder,
  locale: PluginLocale,
  baseUrl: string,
): PluginEmail {
  const t = translator(locale, 'reminderEmail');
  const when = formatDayLong(m.day, LOCALE_TAGS[locale]);
  const slot = translator(locale, 'slots')(m.slot);
  return {
    subject: t('subject', { remind: m.remind }),
    preheader: `${slot} · ${m.title} · ${when}`,
    heading: m.remind,
    paragraphs: [t('intro', { slot, title: m.title })],
    rows: [
      [t('meal'), `${slot} · ${m.title}`],
      [t('when'), when],
      [t('household'), m.household],
    ],
    button: {
      label: t('button'),
      url: `${baseUrl}${localizePath(`/h/${m.householdId}?week=${mondayOf(m.day)}`, locale)}`,
    },
    footer: t('footer'),
  };
}
