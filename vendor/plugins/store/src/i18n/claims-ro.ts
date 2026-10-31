import type { MessagesOf } from '@devquake/ui';
import type { claimsEn } from './claims-en';

export const claimsRo: MessagesOf<typeof claimsEn> = {
  claims: {
    email: {
      subject: 'Ceva pentru tine de la DevQuake: {title}',
      heading: 'Ai ceva de revendicat',
      how: 'Deschide linkul de mai jos, conectează-te la DevQuake cu contul tău și scrie acest cod secret. Este doar al tău: nu-l da nimănui.',
      code: 'Codul tău secret: {code}',
      expires: 'Îl poți revendica în {days} zile.',
      button: 'Revendică',
    },
    page: {
      title: 'Revendică-ți recompensa',
      what: '{title}: {points} puncte NPS DevQuake',
      signIn:
        'Conectează-te la DevQuake cu contul membrului pentru care a fost făcut, apoi deschide din nou acest link.',
      signInButton: 'Conectează-te',
      notYours: 'Acesta a fost făcut pentru alt membru DevQuake.',
      codeLabel: 'Codul secret din e-mail',
      submit: 'Revendică',
      wrong: 'Codul nu este corect. Încercări rămase: {left}.',
      locked:
        'Prea multe coduri greșite: revendicarea este blocată. Scrie-i lui DevQuake ca s-o redeschidă.',
      expired: 'Această revendicare a expirat.',
      cancelled: 'Această revendicare a fost retrasă.',
      claimed: 'A fost deja revendicat.',
      done: 'Gata: {points} puncte NPS au fost adăugate în contul tău DevQuake.',
      unknown: 'Acest link nu este valid.',
      failed: 'Nu s-a putut revendica acum. Te rugăm să încerci din nou mai târziu.',
    },
    packages: {
      title: 'Pachete de puncte NPS',
      intro:
        'Pachete de puncte NPS DevQuake pe care DevQuake le dă ca premii și recompense prin revendicări. Nu apar niciodată în magazin și nu se vând: punctele NPS nu se pot cumpăra.',
      name: 'Nume',
      points: 'Puncte',
      add: 'Adaugă pachetul',
      archive: 'Elimină',
      empty: 'Niciun pachet deocamdată.',
      errorName: 'Dă-i un nume de 2–120 de caractere.',
      errorPoints: 'Alege între 1 și 100 de puncte.',
      saved: 'Salvat.',
      failed: 'Nu s-a salvat. Te rugăm să încerci din nou.',
    },
  },
  errors: {
    packageName: 'Dă-i un nume de 2–120 de caractere.',
    packagePoints: 'Alege între 1 și 100 de puncte.',
  },
  subNav: { packages: 'Pachete de puncte NPS' },
};
