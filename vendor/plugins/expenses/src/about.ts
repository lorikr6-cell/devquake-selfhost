import type { PluginAbout } from '@devquake/plugin-sdk';

/**
 * The app's public front page and search engines (ADR 0032): what visitors who may not use it
 * yet see on its subdomain, in every language (at most 160 characters each).
 */
export const about: PluginAbout = {
  category: 'FinanceApplication',
  description: {
    en: 'Share costs on trips, in a flat or as a couple: who paid what, who owes whom, and the fewest transfers to settle up.',
    de: 'Kosten auf Reisen, in der WG oder als Paar teilen: wer was bezahlt hat, wer wem etwas schuldet und die wenigsten Überweisungen zum Ausgleich.',
    ro: 'Împarte costurile în excursii, în apartament sau în cuplu: cine ce a plătit, cine cui datorează și cele mai puține transferuri pentru decontare.',
    hu: 'Oszd meg a költségeket utazáson, albérletben vagy párként: ki mit fizetett, ki kinek tartozik, és a legkevesebb utalás az elszámoláshoz.',
  },
  features: {
    en: [
      'Groups for trips, flats, couples and events, joined by link or QR code',
      'Split equally, by shares, by percent or by exact amounts',
      'Balances and the fewest transfers to settle up',
      'Comments, an activity feed and statistics by category and month',
    ],
    de: [
      'Gruppen für Reisen, WGs, Paare und Events, Beitritt per Link oder QR-Code',
      'Gleich, nach Anteilen, in Prozent oder mit genauen Beträgen teilen',
      'Salden und die wenigsten Überweisungen zum Ausgleich',
      'Kommentare, ein Verlauf und Statistiken nach Kategorie und Monat',
    ],
    ro: [
      'Grupuri pentru excursii, apartamente, cupluri și evenimente, cu intrare prin link sau cod QR',
      'Împarte egal, pe părți, procentual sau pe sume exacte',
      'Solduri și cele mai puține transferuri pentru decontare',
      'Comentarii, un jurnal al activității și statistici pe categorii și luni',
    ],
    hu: [
      'Csoportok utazáshoz, albérlethez, pároknak és eseményekhez, csatlakozás linkkel vagy QR-kóddal',
      'Megosztás egyenlően, arányosan, százalékosan vagy pontos összegekkel',
      'Egyenlegek és a legkevesebb utalás az elszámoláshoz',
      'Hozzászólások, eseménynapló és statisztika kategória és hónap szerint',
    ],
  },
};
