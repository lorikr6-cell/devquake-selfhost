import type { PluginAbout } from '@devquake/plugin-sdk';

/** The app's public front page and search engines (ADR 0032), in every language. */
export const about: PluginAbout = {
  category: 'LifestyleApplication',
  description: {
    en: 'Plan the week’s meals for your household from your cookbook, see nutrition per day and get one shopping list.',
    de: 'Plane die Mahlzeiten der Woche für deinen Haushalt aus deinem Kochbuch, mit Nährwerten pro Tag und einer Einkaufsliste.',
    ro: 'Planifică mesele săptămânii pentru casa ta din cartea de bucate, cu valori pe zi și o singură listă de cumpărături.',
    hu: 'Tervezd meg a háztartás heti étkezéseit a szakácskönyvből, napi tápértékkel és egyetlen bevásárlólistával.',
  },
  features: {
    en: [
      'A week of breakfasts, lunches, dinners and snacks for the people eating',
      'Suggest a week for your diet, without your allergens and dislikes',
      'Nutrition per day against simple targets',
      'The whole week as one shopping list, and reminders the evening before',
    ],
    de: [
      'Eine Woche Frühstück, Mittag- und Abendessen und Snacks für alle, die mitessen',
      'Eine Woche passend zur Ernährung vorschlagen, ohne Allergene und Abneigungen',
      'Nährwerte pro Tag mit einfachen Zielen',
      'Die ganze Woche als eine Einkaufsliste und Erinnerungen am Vorabend',
    ],
    ro: [
      'O săptămână de mic dejun, prânz, cină și gustări pentru cei care mănâncă',
      'Sugerează o săptămână potrivită dietei, fără alergeni și ce nu vă place',
      'Valori nutritive pe zi față de ținte simple',
      'Toată săptămâna ca o singură listă de cumpărături și mementouri cu o seară înainte',
    ],
    hu: [
      'Egy hét reggeli, ebéd, vacsora és nasi azoknak, akik esznek',
      'Javasolt hét az étrendetekhez, allergének és nem kedvelt ételek nélkül',
      'Napi tápérték egyszerű célokhoz mérve',
      'Az egész hét egyetlen bevásárlólistán, és emlékeztető előző este',
    ],
  },
};
