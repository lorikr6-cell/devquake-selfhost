import type { PluginAbout } from '@devquake/plugin-sdk';

/** The app's public front page and search engines (ADR 0032), in every language. */
export const about: PluginAbout = {
  category: 'FinanceApplication',
  description: {
    en: "Share utility bills with your household: upload the provider's PDF, split by meter readings or equally, and see who has paid.",
    de: 'Teile Nebenkosten mit deinem Haushalt: Lade das PDF des Anbieters hoch, teile nach Zählerständen oder gleichmäßig und sieh, wer bezahlt hat.',
    ro: 'Împarte facturile la utilități cu cei din casă: încarcă PDF-ul furnizorului, împarte după indexuri sau egal și vezi cine a plătit.',
    hu: 'Oszd meg a rezsiszámlákat a háztartásoddal: töltsd fel a szolgáltató PDF-jét, oszd el mérőállás szerint vagy egyenlően, és lásd, ki fizetett.',
    it: 'Condividi le bollette con chi vive con te: carica il PDF del fornitore, dividi in base alle letture dei contatori o in parti uguali e vedi chi ha pagato.',
    es: 'Comparte las facturas de suministros con tu hogar: sube el PDF del proveedor, reparte según las lecturas de contador o a partes iguales y mira quién ha pagado.',
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
    it: [
      'Legge il totale, il consumo e la scadenza dal PDF della bolletta',
      'Letture dei contatori con foto, divisione in base al consumo',
      'Pagamenti ricevuti, con eccedenze e ammanchi riportati',
      'Un calendario delle scadenze e commenti su ogni bolletta',
    ],
    es: [
      'Lee el total, el consumo y la fecha de vencimiento del PDF de la factura',
      'Lecturas de contador con foto, reparto según el consumo',
      'Pagos recibidos, con lo pagado de más o de menos arrastrado',
      'Un calendario de vencimientos y comentarios en cada factura',
    ],
  },
};
