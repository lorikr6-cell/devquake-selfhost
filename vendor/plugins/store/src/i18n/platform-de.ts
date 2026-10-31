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
    devquakeTitle: 'Aus deinem DevQuake-Konto',
    devquakeName: 'Name',
    devquakeEmail: 'E-Mail',
    manageOnDevQuake: 'Auf DevQuake ändern',
    statFavorites: 'Favoriten',
    statPurchases: 'Einkäufe',
    statCart: 'Im Warenkorb',
    memberPrivacyNote:
      'Dein Name und deine E-Mail-Adresse kommen aus deinem DevQuake-Konto. Dieser Shop speichert deine Lieferangaben, deine Nachrichten und deine Bestellungen (wie es das Gesetz verlangt); wenn du das Konto hier löschst, wird alles außer den Bestellungen entfernt.',
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
  shop: {
    theme: { label: 'Design', adaptive: 'Automatisch', light: 'Hell', dark: 'Dunkel' },
    currency: 'Währung',
    newsletterToggle: 'Schick mir den Newsletter dieses Shops',
    newsletterToggleHint: 'An {email}. Haken entfernen, um ihn jederzeit abzubestellen.',
    newsletterOn: 'Newsletter eingeschaltet.',
    newsletterOff: 'Newsletter ausgeschaltet.',
    newsletterFailed:
      'Die Newsletter-Einstellung konnte nicht gespeichert werden. Bitte versuche es erneut.',
    fxNote:
      'Preise in {currency} sind ungefähr, zu den Kursen der Europäischen Zentralbank vom {date}. Du zahlst in {base}; deine Bank oder Karte rechnet um.',
  },
  artPromo: {
    logoText: '{art}galerie',
    logoArt: 'kunst',
    title: 'Kunst aus der DevQuake-Kunstgalerie',
    body: 'DevQuake-Mitglieder zeigen ihre digitale Kunst in der DevQuake-Kunstgalerie, jedes Werk mit der Idee dahinter. Mit der Zeit können einige der meistgeschätzten Werke auch hier erscheinen, als Motive für ausgewählte DevQuake-Produkte.',
    consent:
      'Nur mit Zustimmung der Künstlerin oder des Künstlers: Ein Werk kommt nur in Frage, wenn sie oder er zugestimmt hat, und DevQuake wählt unter den meistgeschätzten aus.',
    copyright:
      'Das Urheberrecht bleibt bei der Künstlerin oder dem Künstler. DevQuake erhält nur das Recht, das Motiv auf die betreffenden Produkte zu drucken, so lange wie vereinbart.',
    share:
      'Wer ein verkauftes Motiv geschaffen hat, kann einen Anteil am Erlös erhalten, zu vorab vereinbarten Bedingungen.',
    credit:
      'Jedes Produkt nennt seine Künstlerin oder seinen Künstler und trägt den Namen DevQuake.',
    visit: 'Zur Kunstgalerie',
    show: 'Zeige deine eigene Kunst',
    note: 'Motive auf Produkten und ein etwaiger Anteil am Erlös unterliegen gesonderten, mit jeder Künstlerin und jedem Künstler vereinbarten Bedingungen; sie sind kein Versprechen von Verkäufen oder Einnahmen.',
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
