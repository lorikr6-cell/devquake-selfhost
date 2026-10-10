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
