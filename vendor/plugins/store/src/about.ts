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
    it: 'Il tuo piccolo negozio online: prodotti con varianti e saldi, carta, PayPal, bonifico o contrassegno, e spedizione per paese.',
    es: 'Tu propia tienda online pequeña: productos con variantes y rebajas, tarjeta, PayPal, transferencia o contra reembolso, y envío por país.',
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
    it: [
      'Prodotti con varianti, foto, magazzino e prezzi scontati con inizio e fine',
      'Pagamenti con carta tramite Stripe, PayPal, bonifico e contrassegno',
      'Zone di spedizione con tariffe fisse e spedizione gratuita da un importo',
      'Pagine del negozio e dei prodotti indicizzabili dai motori di ricerca, con prezzi e disponibilità',
      'Tipi di prodotto con campi propri, fornitori, campagne, buoni sconto e newsletter',
      'Recensioni, confronto prodotti, codici QR, account acquirente e il design del tuo negozio',
    ],
    es: [
      'Productos con variantes, fotos, stock y precios rebajados con inicio y fin',
      'Pagos con tarjeta mediante Stripe, PayPal, transferencia bancaria y contra reembolso',
      'Zonas de envío con tarifa fija y envío gratis a partir de un importe',
      'Páginas de tienda y de producto que los buscadores pueden indexar, con precio y disponibilidad',
      'Tipos de producto con campos propios, proveedores, campañas, cupones y newsletters',
      'Reseñas, comparación de productos, códigos QR, cuentas de comprador y el diseño propio de tu tienda',
    ],
  },
};
