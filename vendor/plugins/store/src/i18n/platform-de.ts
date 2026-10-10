import type { MessagesOf } from '@devquake/ui';
import type { platformEn } from './platform-en';

export const platformDe: MessagesOf<typeof platformEn> = {
  account: {
    connectTitle: 'Schon bei DevQuake?',
    connectBody:
      'Weiter als {name}: Dein Konto hier wird aus deinem DevQuake-Profil ausgefüllt (dein Name und deine E-Mail-Adresse; DevQuake fragt dich einmal). Bestellungen mit dieser Adresse erscheinen hier.',
    connect: 'Weiter mit DevQuake',
    orEmail: 'Oder mit einer beliebigen E-Mail-Adresse anmelden',
    linked: 'Mit deinem DevQuake-Konto verbunden.',
    deliveryTitle: 'Lieferangaben',
    deliveryHint: 'Gespeichert in deinem Konto hier, füllen sie die Kasse für dich aus.',
    phone: 'Telefon',
    addressLine: 'Straße und Hausnummer',
    city: 'Ort',
    postalCode: 'Postleitzahl',
    country: 'Land',
    noCountry: 'Nicht festgelegt',
    saveDetails: 'Angaben speichern',
    detailsSaved: 'Angaben gespeichert',
  },
  checkout: {
    remember: 'Diese Lieferangaben in meinem Konto speichern',
    filledIn: 'Aus deinem Konto ausgefüllt.',
  },
  promo: {
    title: 'Gemacht von DevQuake',
    body: 'Dieser Shop gehört zu DevQuake, einer Entwicklerwerkstatt mit Web-Apps für Alltagsprobleme. Ein kostenloses Konto meldet dich bei allen an, und bei diesem Shop.',
    apps: 'Apps für geteilte Ausgaben, den Haushalt, Lebensläufe, Dartclubs und mehr',
    ideas: 'Schlag die nächste App vor und stimme ab',
    selfHost: 'Mehrere Apps laufen auch auf deinem eigenen Server, Open Source',
    join: 'Kostenlos bei DevQuake mitmachen',
    explore: 'Die Apps ansehen',
  },
  errors: {
    shopsClosed: 'Nur die Administratoren der Seite können hier einen Shop eröffnen.',
  },
};
