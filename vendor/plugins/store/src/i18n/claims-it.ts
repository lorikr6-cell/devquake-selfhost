import type { MessagesOf } from '@devquake/ui';
import type { claimsEn } from './claims-en';

export const claimsIt: MessagesOf<typeof claimsEn> = {
  claims: {
    email: {
      subject: 'Qualcosa per te da DevQuake: {title}',
      heading: 'Hai qualcosa da riscattare',
      how: 'Apri il link qui sotto, accedi a DevQuake con il tuo account e scrivi questo codice segreto. È solo tuo: non condividerlo.',
      code: 'Il tuo codice segreto: {code}',
      expires: 'Puoi riscattarlo entro {days} giorni.',
      button: 'Riscatta',
    },
    page: {
      title: 'Riscatta la tua ricompensa',
      what: '{title}: {points} punti NPS DevQuake',
      signIn:
        'Accedi a DevQuake con l’account del membro a cui è destinato, poi riapri questo link.',
      signInButton: 'Accedi',
      notYours: 'È destinato a un altro membro di DevQuake.',
      codeLabel: 'Codice segreto dall’e-mail',
      submit: 'Riscatta',
      wrong: 'Il codice non è giusto. Tentativi rimasti: {left}.',
      locked:
        'Troppi codici sbagliati: il riscatto è bloccato. Scrivi a DevQuake per farlo riaprire.',
      expired: 'Questo riscatto è scaduto.',
      cancelled: 'Questo riscatto è stato ritirato.',
      claimed: 'È già stato riscattato.',
      done: 'Fatto: {points} punti NPS sono stati aggiunti al tuo account DevQuake.',
      unknown: 'Questo link non è valido.',
      failed: 'Al momento non è stato possibile riscattarlo. Riprova più tardi.',
    },
    packages: {
      title: 'Pacchetti di punti NPS',
      intro:
        'Pacchetti di punti NPS DevQuake che DevQuake assegna come premi e ricompense tramite riscatti. Non compaiono mai nel negozio e non si vendono: i punti NPS non si possono comprare.',
      name: 'Nome',
      points: 'Punti',
      add: 'Aggiungi il pacchetto',
      archive: 'Rimuovi',
      empty: 'Nessun pacchetto per ora.',
      errorName: 'Dagli un nome di 2–120 caratteri.',
      errorPoints: 'Scegli da 1 a 100 punti.',
      saved: 'Salvato.',
      failed: 'Non salvato. Riprova.',
    },
  },
  errors: {
    packageName: 'Dagli un nome di 2–120 caratteri.',
    packagePoints: 'Scegli da 1 a 100 punti.',
  },
  subNav: { packages: 'Pacchetti di punti NPS' },
};
