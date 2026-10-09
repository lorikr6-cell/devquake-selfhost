import type { PluginAbout } from '@devquake/plugin-sdk';

/** The app's public front page and search engines (ADR 0032), in every language. */
export const about: PluginAbout = {
  category: 'FinanceApplication',
  description: {
    en: "Share utility bills with your household: upload the provider's PDF, split by meter readings or equally, and see who has paid.",
    de: 'Teile Nebenkosten mit deinem Haushalt: Lade das PDF des Anbieters hoch, teile nach Zählerständen oder gleichmäßig und sieh, wer bezahlt hat.',
    ro: 'Împarte facturile la utilități cu cei din casă: încarcă PDF-ul furnizorului, împarte după indexuri sau egal și vezi cine a plătit.',
    hu: 'Oszd meg a rezsiszámlákat a háztartásoddal: töltsd fel a szolgáltató PDF-jét, oszd el mérőállás szerint vagy egyenlően, és lásd, ki fizetett.',
  },
  features: {
    en: [
      "Reads the total, consumption and due date from the bill's PDF",
      'Meter readings with a photo, split by consumption',
      'Payments received, with over- and underpayments carried over',
      'A calendar of due dates and comments on every bill',
    ],
    de: [
      'Liest Summe, Verbrauch und Fälligkeit aus dem PDF der Rechnung',
      'Zählerstände mit Foto, Aufteilung nach Verbrauch',
      'Erhaltene Zahlungen, Über- und Unterzahlungen werden übertragen',
      'Ein Kalender der Fälligkeiten und Kommentare zu jeder Rechnung',
    ],
    ro: [
      'Citește totalul, consumul și scadența din PDF-ul facturii',
      'Indexuri cu fotografie, împărțire după consum',
      'Plăți primite, cu diferențele reportate pe factura următoare',
      'Calendar cu scadențe și comentarii la fiecare factură',
    ],
    hu: [
      'Kiolvassa a végösszeget, a fogyasztást és a határidőt a számla PDF-jéből',
      'Mérőállások fotóval, elosztás fogyasztás szerint',
      'Beérkezett fizetések, a túl- és alulfizetés átvitelével',
      'Határidő-naptár és megjegyzések minden számlához',
    ],
  },
};
