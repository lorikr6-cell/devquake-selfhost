import type { MessagesOf } from '@devquake/ui';
import type { claimsEn } from './claims-en';

export const claimsHu: MessagesOf<typeof claimsEn> = {
  claims: {
    email: {
      subject: 'Valami neked a DevQuake-től: {title}',
      heading: 'Valamit beválthatsz',
      how: 'Nyisd meg az alábbi linket, jelentkezz be a DevQuake-be a saját fiókoddal, és írd be ezt a titkos kódot. Csak a tiéd: ne add tovább.',
      code: 'A titkos kódod: {code}',
      expires: '{days} napon belül válthatod be.',
      button: 'Beváltás',
    },
    page: {
      title: 'Váltsd be a jutalmadat',
      what: '{title}: {points} DevQuake NPS-pont',
      signIn:
        'Jelentkezz be a DevQuake-be annak a tagnak a fiókjával, akinek ez szól, majd nyisd meg újra ezt a linket.',
      signInButton: 'Bejelentkezés',
      notYours: 'Ez egy másik DevQuake-tagnak szól.',
      codeLabel: 'Titkos kód az e-mailből',
      submit: 'Beváltás',
      wrong: 'A kód nem jó. Hátralévő próbálkozások: {left}.',
      locked: 'Túl sok rossz kód: a beváltás zárolva. Írj a DevQuake-nek, hogy újranyissák.',
      expired: 'Ez a beváltás lejárt.',
      cancelled: 'Ezt a beváltást visszavonták.',
      claimed: 'Ezt már beváltották.',
      done: 'Kész: {points} NPS-pontot írtunk jóvá a DevQuake-fiókodon.',
      unknown: 'Ez a link nem érvényes.',
      failed: 'Most nem sikerült beváltani. Próbáld újra később.',
    },
    packages: {
      title: 'NPS-pontcsomagok',
      intro:
        'DevQuake NPS-pontokból álló csomagok, amelyeket a DevQuake díjként és jutalomként ad beváltással. Soha nem jelennek meg a boltban és nem eladók: NPS-pontot nem lehet vásárolni.',
      name: 'Név',
      points: 'Pontok',
      add: 'Csomag hozzáadása',
      archive: 'Eltávolítás',
      empty: 'Még nincs csomag.',
      errorName: 'Adj neki 2–120 karakteres nevet.',
      errorPoints: 'Válassz 1 és 100 pont között.',
      saved: 'Mentve.',
      failed: 'Nem sikerült menteni. Próbáld újra.',
    },
  },
  errors: {
    packageName: 'Adj neki 2–120 karakteres nevet.',
    packagePoints: 'Válassz 1 és 100 pont között.',
  },
  subNav: { packages: 'NPS-pontcsomagok' },
};
