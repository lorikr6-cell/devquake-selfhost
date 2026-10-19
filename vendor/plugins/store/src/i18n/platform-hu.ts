import type { MessagesOf } from '@devquake/ui';
import type { platformEn } from './platform-en';

export const platformHu: MessagesOf<typeof platformEn> = {
  account: {
    connectTitle: 'Már DevQuake-tag vagy?',
    connectBody:
      'Folytasd {name} néven: az itteni fiókodat a DevQuake-profilodból töltjük ki (a neved és az e-mail-címed; a DevQuake egyszer megkérdez). Az ezzel a címmel leadott rendelések itt jelennek meg.',
    connect: 'Folytatás DevQuake-kel',
    orEmail: 'Vagy lépj be bármilyen e-mail-címmel',
    linked: 'Összekapcsolva a DevQuake-fiókoddal.',
    devquakeTitle: 'A DevQuake-fiókodból',
    devquakeName: 'Név',
    devquakeEmail: 'E-mail',
    manageOnDevQuake: 'Módosítás a DevQuake-en',
    statFavorites: 'Kedvencek',
    statPurchases: 'Vásárlások',
    statCart: 'A kosárban',
    memberPrivacyNote:
      'A neved és az e-mail-címed a DevQuake-fiókodból származik. Ez a bolt megőrzi a szállítási adataidat, az üzeneteidet és a rendeléseidet (a törvény szerint); ha itt törlöd a fiókot, a rendelések kivételével minden törlődik.',
    deliveryTitle: 'Szállítási adatok',
    deliveryHint: 'Az itteni fiókodban tárolva kitöltik helyetted a pénztárat.',
    phone: 'Telefon',
    addressLine: 'Utca és házszám',
    city: 'Település',
    postalCode: 'Irányítószám',
    country: 'Ország',
    noCountry: 'Nincs megadva',
    saveDetails: 'Adatok mentése',
    detailsSaved: 'Adatok elmentve',
  },
  checkout: {
    remember: 'A szállítási adatok mentése a fiókomba',
    filledIn: 'A fiókodból kitöltve.',
  },
  shop: {
    theme: { label: 'Téma', adaptive: 'Automatikus', light: 'Világos', dark: 'Sötét' },
    currency: 'Pénznem',
    newsletterToggle: 'Kérem a bolt hírlevelét',
    newsletterToggleHint: 'Ide: {email}. Bármikor leiratkozhatsz, ha kiveszed a pipát.',
    newsletterOn: 'Hírlevél bekapcsolva.',
    newsletterOff: 'Hírlevél kikapcsolva.',
    newsletterFailed: 'A hírlevél-beállítást nem sikerült menteni. Próbáld újra.',
    fxNote:
      'A(z) {currency} árak hozzávetőlegesek, az Európai Központi Bank {date} árfolyamán. {base} pénznemben fizetsz; a bankod vagy a kártyád váltja át.',
  },
  promo: {
    title: 'A DevQuake készítette',
    body: 'Ez a bolt a DevQuake-é, egy fejlesztői műhelyé, amely webes alkalmazásokat készít a mindennapi gondokra. Egyetlen ingyenes fiókkal mindegyikbe belépsz, és ebbe a boltba is.',
    apps: 'Alkalmazások közös kiadásokra, a háztartásra, önéletrajzokra, darts kluboknak és még sok másra',
    ideas: 'Javasold és szavazd meg a következő alkalmazást',
    selfHost: 'Több alkalmazás a saját szervereden is fut, nyílt forráskóddal',
    join: 'Csatlakozz ingyen a DevQuake-hez',
    explore: 'Nézd meg az alkalmazásokat',
  },
  errors: {
    shopsClosed: 'Ezen az oldalon csak az adminisztrátorok nyithatnak boltot.',
  },
};
