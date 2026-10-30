import type { PluginAbout } from '@devquake/plugin-sdk';

/**
 * The app's public front page and search engines (ADR 0032): what visitors who may not use it
 * yet see on its subdomain, in every language (at most 160 characters each).
 */
export const about: PluginAbout = {
  category: 'BusinessApplication',
  description: {
    en: 'Run a café, bistro or bar: a menu with allergens, staff with PINs on a shared tablet, and a menu your guests can read online.',
    de: 'Führe ein Café, Bistro oder eine Bar: Karte mit Allergenen, Personal mit PIN am gemeinsamen Tablet und eine Online-Karte für Gäste.',
    ro: 'Condu o cafenea, un bistro sau un bar: meniu cu alergeni, personal cu PIN pe o tabletă comună și un meniu online pentru clienți.',
    hu: 'Vezesd a kávézód, bisztród vagy bárod: étlap allergénekkel, személyzet PIN-nel a közös tableten és online étlap a vendégeknek.',
    it: 'Gestisci un caffè, bistrot o bar: menu con allergeni, personale con PIN su un tablet condiviso e un menu online per i clienti.',
    es: 'Gestiona una cafetería, bistró o bar: carta con alérgenos, personal con PIN en una tableta compartida y una carta online para clientes.',
  },
  features: {
    en: [
      'Hungary and Romania ready, any other country set up by hand',
      'A menu with prices, VAT rates and the 14 allergens',
      'Staff with PINs on a shared tablet, settings for the owner only',
      'A public menu for guests, for a QR code on the tables',
    ],
    de: [
      'Ungarn und Rumänien fertig eingerichtet, andere Länder von Hand',
      'Eine Karte mit Preisen, Mehrwertsteuersätzen und den 14 Allergenen',
      'Personal mit PIN am gemeinsamen Tablet, Einstellungen nur für den Inhaber',
      'Eine öffentliche Karte für Gäste, für einen QR-Code auf den Tischen',
    ],
    ro: [
      'Ungaria și România gata configurate, alte țări configurate manual',
      'Un meniu cu prețuri, cote de TVA și cei 14 alergeni',
      'Personal cu PIN pe o tabletă comună, setări doar pentru proprietar',
      'Un meniu public pentru clienți, pentru un cod QR pe mese',
    ],
    hu: [
      'Magyarország és Románia beállítva, más országok kézzel',
      'Étlap árakkal, áfakulcsokkal és a 14 allergénnel',
      'Személyzet PIN-nel a közös tableten, beállítások csak a tulajdonosnak',
      'Nyilvános étlap a vendégeknek, QR-kódhoz az asztalokon',
    ],
    it: [
      'Ungheria e Romania pronte, gli altri paesi configurati a mano',
      'Un menu con prezzi, aliquote IVA e i 14 allergeni',
      'Personale con PIN su un tablet condiviso, impostazioni solo per il titolare',
      'Un menu pubblico per i clienti, per un codice QR sui tavoli',
    ],
    es: [
      'Hungría y Rumanía listas, otros países configurados a mano',
      'Una carta con precios, tipos de IVA y los 14 alérgenos',
      'Personal con PIN en una tableta compartida, ajustes solo para el propietario',
      'Una carta pública para clientes, para un código QR en las mesas',
    ],
  },
};
