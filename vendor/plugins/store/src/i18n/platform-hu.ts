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
  artPromo: {
    logoText: '{art} galéria',
    logoArt: 'művészeti',
    title: 'Művészet a DevQuake művészeti galériából',
    body: 'A DevQuake-tagok a DevQuake művészeti galériában mutatják be digitális alkotásaikat, minden művet a mögötte álló ötlettel. Idővel a legnagyobb elismerést kapott művek közül néhány itt is megjelenhet, kiválasztott DevQuake-termékek mintájaként.',
    consent:
      'Csak az alkotó beleegyezésével: egy mű csak akkor jöhet szóba, ha alkotója hozzájárult, és a DevQuake a legnagyobb elismerést kapott művek közül választ.',
    copyright:
      'A szerzői jog az alkotónál marad. A DevQuake csak arra kap jogot, hogy a mintát az érintett termékekre nyomtassa, a megállapodás szerinti ideig.',
    share:
      'Azok az alkotók, akiknek a mintáival termék kel el, részesedést kaphatnak a bevételből, az előre velük egyeztetett feltételek szerint.',
    credit: 'Minden termék feltünteti az alkotóját, és viseli a DevQuake nevet.',
    visit: 'A művészeti galéria megtekintése',
    show: 'Mutasd meg a saját alkotásaidat',
    note: 'A termékeken megjelenő minták és a bevételből járó esetleges részesedés minden alkotóval külön egyeztetett feltételek szerint alakul; ezek nem jelentenek ígéretet eladásra vagy bevételre.',
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
