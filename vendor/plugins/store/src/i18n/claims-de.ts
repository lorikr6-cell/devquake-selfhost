import type { MessagesOf } from '@devquake/ui';
import type { claimsEn } from './claims-en';

export const claimsDe: MessagesOf<typeof claimsEn> = {
  claims: {
    email: {
      subject: 'Etwas für dich von DevQuake: {title}',
      heading: 'Du kannst etwas einlösen',
      how: 'Öffne den Link unten, melde dich als du selbst bei DevQuake an und gib diesen geheimen Code ein. Er gehört nur dir: Gib ihn nicht weiter.',
      code: 'Dein geheimer Code: {code}',
      expires: 'Du kannst es innerhalb von {days} Tagen einlösen.',
      button: 'Jetzt einlösen',
    },
    page: {
      title: 'Deine Belohnung einlösen',
      what: '{title}: {points} DevQuake-NPS-Punkte',
      signIn:
        'Melde dich bei DevQuake als das Mitglied an, für das dies bestimmt ist, und öffne diesen Link dann erneut.',
      signInButton: 'Anmelden',
      notYours: 'Dies ist für ein anderes DevQuake-Mitglied bestimmt.',
      codeLabel: 'Geheimer Code aus der E-Mail',
      submit: 'Einlösen',
      wrong: 'Der Code stimmt nicht. Verbleibende Versuche: {left}.',
      locked:
        'Zu viele falsche Codes: Die Einlösung ist gesperrt. Schreib DevQuake, damit sie wieder geöffnet wird.',
      expired: 'Diese Einlösung ist abgelaufen.',
      cancelled: 'Diese Einlösung wurde zurückgezogen.',
      claimed: 'Dies wurde bereits eingelöst.',
      done: 'Erledigt: {points} NPS-Punkte wurden deinem DevQuake-Konto gutgeschrieben.',
      unknown: 'Dieser Link ist nicht gültig.',
      failed: 'Das Einlösen hat gerade nicht geklappt. Bitte versuche es später noch einmal.',
    },
    packages: {
      title: 'NPS-Punktepakete',
      intro:
        'Pakete mit DevQuake-NPS-Punkten, die DevQuake als Preise und Belohnungen über Einlösungen vergibt. Sie erscheinen nie im Shop und werden nie verkauft: NPS-Punkte kann man nicht kaufen.',
      name: 'Name',
      points: 'Punkte',
      add: 'Paket hinzufügen',
      archive: 'Entfernen',
      empty: 'Noch keine Pakete.',
      errorName: 'Gib ihm einen Namen mit 2 bis 120 Zeichen.',
      errorPoints: 'Wähle 1 bis 100 Punkte.',
      saved: 'Gespeichert.',
      failed: 'Nicht gespeichert. Bitte versuche es noch einmal.',
    },
  },
  errors: {
    packageName: 'Gib ihm einen Namen mit 2 bis 120 Zeichen.',
    packagePoints: 'Wähle 1 bis 100 Punkte.',
  },
  subNav: { packages: 'NPS-Punktepakete' },
};
