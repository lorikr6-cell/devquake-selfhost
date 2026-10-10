import type { PluginAbout } from '@devquake/plugin-sdk';

/**
 * The app's public front page and search engines (ADR 0032), in every language (at most 160
 * characters each).
 */
export const about: PluginAbout = {
  category: 'BusinessApplication',
  description: {
    en: 'Your own small online shop: products with options and sales, card, PayPal, bank transfer or cash on delivery, and shipping by country.',
    de: 'Dein eigener kleiner Onlineshop: Produkte mit Varianten und Rabatten, Karte, PayPal, Überweisung oder Nachnahme und Versand nach Land.',
    ro: 'Propriul tău magazin online: produse cu variante și reduceri, card, PayPal, transfer bancar sau ramburs, și livrare pe țări.',
    hu: 'Saját kis webáruház: termékek változatokkal és akciókkal, kártya, PayPal, átutalás vagy utánvét, és szállítás országonként.',
  },
  features: {
    en: [
      'Products with options, photos, stock and sale prices with a start and an end',
      'Card payments with Stripe, PayPal, bank transfer and cash on delivery',
      'Shipping zones with flat rates and free shipping from an amount',
      'Shop and product pages search engines can index, with prices and availability',
      'Product types with their own fields, vendors, campaigns, vouchers and newsletters',
      'Reviews, product comparison, QR codes, buyer accounts and your shop’s own design',
    ],
    de: [
      'Produkte mit Varianten, Fotos, Lagerbestand und Rabattpreisen mit Beginn und Ende',
      'Kartenzahlung mit Stripe, PayPal, Überweisung und Nachnahme',
      'Versandzonen mit Pauschalpreisen und kostenlosem Versand ab einem Betrag',
      'Shop- und Produktseiten, die Suchmaschinen mit Preis und Verfügbarkeit erfassen',
      'Produkttypen mit eigenen Feldern, Lieferanten, Kampagnen, Gutscheine und Newsletter',
      'Bewertungen, Produktvergleich, QR-Codes, Käuferkonten und das eigene Design deines Shops',
    ],
    ro: [
      'Produse cu variante, fotografii, stoc și prețuri reduse cu început și sfârșit',
      'Plată cu cardul prin Stripe, PayPal, transfer bancar și ramburs',
      'Zone de livrare cu tarif fix și livrare gratuită peste o sumă',
      'Pagini de magazin și de produs indexate de motoarele de căutare, cu preț și disponibilitate',
      'Tipuri de produse cu câmpuri proprii, furnizori, campanii, vouchere și newslettere',
      'Recenzii, comparare de produse, coduri QR, conturi de cumpărători și designul propriu al magazinului',
    ],
    hu: [
      'Termékek változatokkal, fotókkal, készlettel és kezdő- és záródátumos akciós árral',
      'Kártyás fizetés Stripe-pal, PayPal, átutalás és utánvét',
      'Szállítási zónák átalánydíjjal és ingyenes szállítással egy összeg felett',
      'Keresőmotorok által indexelhető bolt- és termékoldalak árral és elérhetőséggel',
      'Terméktípusok saját mezőkkel, beszállítók, kampányok, kuponok és hírlevelek',
      'Értékelések, termék-összehasonlítás, QR-kódok, vásárlói fiókok és a boltod saját megjelenése',
    ],
  },
};
