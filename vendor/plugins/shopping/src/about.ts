import type { PluginAbout } from '@devquake/plugin-sdk';

/** The app's public front page and search engines (ADR 0032), in every language. */
export const about: PluginAbout = {
  category: 'ShoppingApplication',
  description: {
    en: 'Plan shared shopping lists by day, group products by store, and shop together with family and friends.',
    de: 'Plane gemeinsame Einkaufslisten nach Tagen, ordne Produkte nach Geschäften und kaufe zusammen mit Familie und Freunden ein.',
    ro: 'Planifică liste de cumpărături comune pe zile, grupează produsele pe magazine și faceți cumpărăturile împreună cu familia și prietenii.',
    hu: 'Tervezz közös bevásárlólistákat napokra bontva, csoportosítsd a termékeket boltok szerint, és vásárolj együtt a családdal és barátokkal.',
    it: 'Pianifica liste della spesa condivise giorno per giorno, raggruppa i prodotti per negozio e fai la spesa insieme a famiglia e amici.',
    es: 'Planifica listas de la compra compartidas por días, agrupa los productos por tienda y haz la compra junto con tu familia y tus amigos.',
  },
  features: {
    en: [
      'A list for each shopping day, on a week, month or year calendar',
      'Products with quantity, unit price and store',
      'Invite people with a link, code or QR',
      'Spending statistics',
    ],
    de: [
      'Eine Liste pro Einkaufstag, im Wochen-, Monats- oder Jahreskalender',
      'Produkte mit Menge, Stückpreis und Geschäft',
      'Lade Leute per Link, Code oder QR ein',
      'Ausgabenstatistik',
    ],
    ro: [
      'O listă pentru fiecare zi de cumpărături, în calendar săptămânal, lunar sau anual',
      'Produse cu cantitate, preț pe unitate și magazin',
      'Invită oameni cu un link, cod sau QR',
      'Statistici de cheltuieli',
    ],
    hu: [
      'Lista minden bevásárlónapra, heti, havi vagy éves naptárban',
      'Termékek mennyiséggel, egységárral és bolttal',
      'Hívj meg másokat linkkel, kóddal vagy QR-rel',
      'Költési statisztikák',
    ],
    it: [
      'Una lista per ogni giorno di spesa, in un calendario settimanale, mensile o annuale',
      'Prodotti con quantità, prezzo unitario e negozio',
      'Invita persone con un link, un codice o un QR',
      'Statistiche delle spese',
    ],
    es: [
      'Una lista para cada día de compra, en un calendario semanal, mensual o anual',
      'Productos con cantidad, precio por unidad y tienda',
      'Invita a otras personas con un enlace, un código o un QR',
      'Estadísticas de gastos',
    ],
  },
};
