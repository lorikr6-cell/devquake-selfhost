import type { PluginAbout } from '@devquake/plugin-sdk';

/** The app's public front page and search engines (ADR 0032), in every language. */
export const about: PluginAbout = {
  category: 'SportsApplication',
  description: {
    en: 'Score darts games, practise with drills built from your own statistics, and run casual games or knock-out tournaments on your boards.',
    de: 'Zähle Darts-Spiele, trainiere mit Übungen aus deinen Statistiken und spiele lockere Partien oder K.-o.-Turniere an deinen Boards.',
    ro: 'Ține scorul la darts, antrenează-te cu exerciții create din statisticile tale și organizează jocuri sau turnee eliminatorii la panourile tale.',
    hu: 'Vezesd a darts játszmák pontjait, gyakorolj a statisztikáidból készült feladatokkal, és rendezz játékokat vagy kieséses tornákat a tábláidon.',
  },
  features: {
    en: [
      'Practice alone, with drills made from your statistics',
      'Casual games: friends join with a code or QR',
      'Knock-out tournaments across several boards',
      'Statistics for every visit, game and checkout',
    ],
    de: [
      'Training allein, mit Übungen aus deinen Statistiken',
      'Lockere Spiele: Freunde treten per Code oder QR bei',
      'K.-o.-Turniere auf mehreren Boards',
      'Statistiken zu jeder Aufnahme, jedem Spiel und Checkout',
    ],
    ro: [
      'Antrenament singur, cu exerciții din statisticile tale',
      'Jocuri cu prietenii: intră cu un cod sau QR',
      'Turnee eliminatorii pe mai multe panouri',
      'Statistici pentru fiecare vizită, joc și checkout',
    ],
    hu: [
      'Gyakorlás egyedül, a statisztikáidból készült feladatokkal',
      'Baráti játékok: kóddal vagy QR-rel lehet csatlakozni',
      'Kieséses tornák több táblán',
      'Statisztika minden körről, játékról és kiszállóról',
    ],
  },
};
