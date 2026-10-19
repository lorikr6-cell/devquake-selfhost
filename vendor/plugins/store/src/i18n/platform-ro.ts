import type { MessagesOf } from '@devquake/ui';
import type { platformEn } from './platform-en';

export const platformRo: MessagesOf<typeof platformEn> = {
  account: {
    connectTitle: 'Ești deja pe DevQuake?',
    connectBody:
      'Continuă ca {name}: contul tău de aici se completează din profilul DevQuake (numele și adresa ta de e-mail; DevQuake te întreabă o singură dată). Comenzile făcute cu această adresă apar aici.',
    connect: 'Continuă cu DevQuake',
    orEmail: 'Sau intră cu orice adresă de e-mail',
    linked: 'Conectat cu contul tău DevQuake.',
    devquakeTitle: 'Din contul tău DevQuake',
    devquakeName: 'Nume',
    devquakeEmail: 'E-mail',
    manageOnDevQuake: 'Schimbă pe DevQuake',
    statFavorites: 'Favorite',
    statPurchases: 'Cumpărături',
    statCart: 'În coș',
    memberPrivacyNote:
      'Numele și adresa ta de e-mail vin din contul tău DevQuake. Acest magazin păstrează datele tale de livrare, mesajele și comenzile (cum cere legea); ștergerea contului aici elimină totul în afară de comenzi.',
    deliveryTitle: 'Date de livrare',
    deliveryHint: 'Salvate în contul tău de aici, completează pentru tine finalizarea comenzii.',
    phone: 'Telefon',
    addressLine: 'Strada și numărul',
    city: 'Localitatea',
    postalCode: 'Cod poștal',
    country: 'Țara',
    noCountry: 'Nesetată',
    saveDetails: 'Salvează datele',
    detailsSaved: 'Datele au fost salvate',
  },
  checkout: {
    remember: 'Salvează aceste date de livrare în contul meu',
    filledIn: 'Completat din contul tău.',
  },
  shop: {
    theme: { label: 'Temă', adaptive: 'Automată', light: 'Luminoasă', dark: 'Întunecată' },
    currency: 'Moneda',
    newsletterToggle: 'Trimite-mi newsletterul acestui magazin',
    newsletterToggleHint: 'La {email}. Debifează oricând ca să-l oprești.',
    newsletterOn: 'Newsletter activat.',
    newsletterOff: 'Newsletter dezactivat.',
    newsletterFailed: 'Setarea newsletterului nu a putut fi salvată. Încearcă din nou.',
    fxNote:
      'Prețurile în {currency} sunt aproximative, la cursurile Băncii Centrale Europene din {date}. Plătești în {base}; banca sau cardul tău face conversia.',
  },
  promo: {
    title: 'Realizat de DevQuake',
    body: 'Acest magazin aparține DevQuake, un atelier de dezvoltator cu aplicații web pentru problemele de zi cu zi. Un singur cont gratuit te conectează la toate, și la acest magazin.',
    apps: 'Aplicații pentru cheltuieli comune, gospodărie, CV-uri, cluburi de darts și altele',
    ideas: 'Propune și votează următoarea aplicație',
    selfHost: 'Mai multe aplicații rulează și pe serverul tău, open source',
    join: 'Intră gratuit în DevQuake',
    explore: 'Vezi aplicațiile',
  },
  errors: {
    shopsClosed: 'Doar administratorii site-ului pot deschide un magazin aici.',
  },
};
