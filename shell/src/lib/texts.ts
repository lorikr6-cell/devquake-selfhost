import type { PluginLocale } from '@devquake/plugin-sdk';

// The shell's own words (setup, sign-in, members, footer) in DevQuake's four languages. The app
// itself brings its own catalogs.

const en = {
  setupTitle: 'Set up {app}',
  setupIntro:
    'This server runs {app} for you and the people you invite. Create the admin account to start: it manages the members of this instance.',
  setupDone: 'The admin account exists already. Sign in instead.',
  name: 'Your name',
  email: 'Email',
  password: 'Password',
  passwordHint: 'At least {min} characters.',
  passwordRepeat: 'Password again',
  createAdmin: 'Create the admin account',
  signInTitle: 'Sign in to {app}',
  signIn: 'Sign in',
  signOut: 'Sign out',
  wrongSignIn: 'The email or password is not right.',
  tooMany: 'Too many attempts. Wait a few minutes and try again.',
  invalidName: 'Enter a name (at most 80 characters).',
  invalidEmail: 'Enter a valid email address.',
  invalidPassword: 'The password needs at least {min} characters.',
  passwordsDiffer: 'The two passwords are not the same.',
  emailTaken: 'There is already an account with this email.',
  noAccount: 'No account? Ask the admin of this server for an invite link.',
  joinTitle: 'Join {app}',
  joinIntro: 'You were invited to use {app} on this server. Create your account.',
  joinButton: 'Create my account',
  inviteGone: 'This invite link was used already or has expired. Ask for a new one.',
  instanceTitle: 'This instance',
  members: 'Members',
  admin: 'Admin',
  you: 'you',
  lastSeen: 'Last active',
  never: 'never',
  remove: 'Remove',
  removeTitle: 'Remove {name}?',
  removeBody:
    'They can no longer sign in. What is theirs alone in {app} is deleted; what they added to things others still use is kept under a removed name.',
  removed: '{name} was removed.',
  cancel: 'Cancel',
  invite: 'Invite someone',
  inviteHint:
    'Send this link to the person you want to invite. It works once and for 7 days. It is shown only now: copy it.',
  newInvite: 'Make an invite link',
  copy: 'Copy',
  copied: 'Copied',
  configTitle: 'Configuration',
  configHint:
    'Everything about this server is set with environment variables (see .env.example): the address, email (SMTP) and the app’s settings. Restart the app after changing them.',
  address: 'Address',
  emailSending: 'Email',
  emailOn: 'on (SMTP)',
  emailOff: 'off: set SMTP_HOST to send reminders by email',
  version: 'Version',
  moreTitle: 'More from DevQuake',
  moreBody:
    'DevQuake has more free apps, hosted for you: workouts, recipes, family planning, shared shopping lists and more.',
  moreLink: 'See the apps on DevQuake',
  bugs: 'Report a problem',
  openApp: 'Open {app}',
  allApps: 'All apps of {app}',
  backTo: 'Back to {app}',
  homeTitle: '{app}',
  homeIntro: 'Your household’s apps, on your own server. Sign in once and open any of them.',
  homeSetupTitle: 'One more step: the addresses of the apps',
  homeSetupBody:
    'Each app has its own address. Set DOMAIN to your domain and point it and its subdomains ({names}) at this server, or set PUBLIC_IP to this server’s IP address to use free sslip.io addresses. Then restart.',
  homeSignIn: 'Sign in to open the apps',
  open: 'Open',
  poweredBy: 'Self-hosted {app} · powered by DevQuake',
  tryHosted: 'Try the hosted version',
  readyTitle: '{app} is ready',
  readyBody:
    'Invite the people who should use it from the instance page. Prefer not to run a server for the next one? Every DevQuake app is also free on devquake.com.',
  notReadyTitle: 'Not ready yet',
  noDatabase:
    'No database is set. Set DB_NAME, DB_USER and DB_PASSWORD (see .env.example) and restart.',
  databaseError:
    'The database could not be reached or prepared. Check the DB_* settings and the database container, then restart.',
};

export type ShellTexts = typeof en;

const de: ShellTexts = {
  setupTitle: '{app} einrichten',
  setupIntro:
    'Dieser Server betreibt {app} für dich und die Personen, die du einlädst. Lege zuerst das Admin-Konto an: Es verwaltet die Mitglieder dieser Instanz.',
  setupDone: 'Das Admin-Konto gibt es schon. Melde dich stattdessen an.',
  name: 'Dein Name',
  email: 'E-Mail',
  password: 'Passwort',
  passwordHint: 'Mindestens {min} Zeichen.',
  passwordRepeat: 'Passwort wiederholen',
  createAdmin: 'Admin-Konto anlegen',
  signInTitle: 'Bei {app} anmelden',
  signIn: 'Anmelden',
  signOut: 'Abmelden',
  wrongSignIn: 'E-Mail oder Passwort stimmen nicht.',
  tooMany: 'Zu viele Versuche. Warte ein paar Minuten und versuche es erneut.',
  invalidName: 'Gib einen Namen ein (höchstens 80 Zeichen).',
  invalidEmail: 'Gib eine gültige E-Mail-Adresse ein.',
  invalidPassword: 'Das Passwort braucht mindestens {min} Zeichen.',
  passwordsDiffer: 'Die beiden Passwörter sind nicht gleich.',
  emailTaken: 'Mit dieser E-Mail gibt es schon ein Konto.',
  noAccount: 'Kein Konto? Bitte den Admin dieses Servers um einen Einladungslink.',
  joinTitle: '{app} beitreten',
  joinIntro: 'Du wurdest eingeladen, {app} auf diesem Server zu nutzen. Lege dein Konto an.',
  joinButton: 'Mein Konto anlegen',
  inviteGone:
    'Dieser Einladungslink wurde schon benutzt oder ist abgelaufen. Bitte um einen neuen.',
  instanceTitle: 'Diese Instanz',
  members: 'Mitglieder',
  admin: 'Admin',
  you: 'du',
  lastSeen: 'Zuletzt aktiv',
  never: 'nie',
  remove: 'Entfernen',
  removeTitle: '{name} entfernen?',
  removeBody:
    'Die Person kann sich nicht mehr anmelden. Was in {app} nur ihr gehört, wird gelöscht; was sie zu Dingen anderer beigetragen hat, bleibt unter einem entfernten Namen erhalten.',
  removed: '{name} wurde entfernt.',
  cancel: 'Abbrechen',
  invite: 'Jemanden einladen',
  inviteHint:
    'Schick diesen Link an die Person, die du einladen möchtest. Er funktioniert einmal und 7 Tage lang. Er wird nur jetzt gezeigt: kopiere ihn.',
  newInvite: 'Einladungslink erstellen',
  copy: 'Kopieren',
  copied: 'Kopiert',
  configTitle: 'Konfiguration',
  configHint:
    'Alles an diesem Server wird mit Umgebungsvariablen eingestellt (siehe .env.example): die Adresse, E-Mail (SMTP) und die Einstellungen der App. Starte die App nach einer Änderung neu.',
  address: 'Adresse',
  emailSending: 'E-Mail',
  emailOn: 'an (SMTP)',
  emailOff: 'aus: setze SMTP_HOST, um Erinnerungen per E-Mail zu senden',
  version: 'Version',
  moreTitle: 'Mehr von DevQuake',
  moreBody:
    'DevQuake hat weitere kostenlose Apps, für dich gehostet: Training, Rezepte, Familienplanung, geteilte Einkaufslisten und mehr.',
  moreLink: 'Die Apps auf DevQuake ansehen',
  bugs: 'Ein Problem melden',
  openApp: '{app} öffnen',
  allApps: 'Alle Apps von {app}',
  backTo: 'Zurück zu {app}',
  homeTitle: '{app}',
  homeIntro:
    'Die Apps deines Haushalts, auf deinem eigenen Server. Einmal anmelden und jede öffnen.',
  homeSetupTitle: 'Noch ein Schritt: die Adressen der Apps',
  homeSetupBody:
    'Jede App hat ihre eigene Adresse. Setze DOMAIN auf deine Domain und richte sie und ihre Subdomains ({names}) auf diesen Server, oder setze PUBLIC_IP auf die IP-Adresse dieses Servers, um kostenlose sslip.io-Adressen zu nutzen. Dann neu starten.',
  homeSignIn: 'Melde dich an, um die Apps zu öffnen',
  open: 'Öffnen',
  poweredBy: '{app} selbst gehostet · bereitgestellt von DevQuake',
  tryHosted: 'Gehostete Version ausprobieren',
  readyTitle: '{app} ist bereit',
  readyBody:
    'Lade auf der Instanzseite die Personen ein, die es nutzen sollen. Beim nächsten Mal lieber keinen Server betreiben? Jede DevQuake-App gibt es auch kostenlos auf devquake.com.',
  notReadyTitle: 'Noch nicht bereit',
  noDatabase:
    'Es ist keine Datenbank eingestellt. Setze DB_NAME, DB_USER und DB_PASSWORD (siehe .env.example) und starte neu.',
  databaseError:
    'Die Datenbank war nicht erreichbar oder konnte nicht vorbereitet werden. Prüfe die DB_*-Einstellungen und den Datenbank-Container, dann starte neu.',
};

const ro: ShellTexts = {
  setupTitle: 'Configurează {app}',
  setupIntro:
    'Acest server rulează {app} pentru tine și pentru cei pe care îi inviți. Creează mai întâi contul de administrator: el gestionează membrii acestei instanțe.',
  setupDone: 'Contul de administrator există deja. Autentifică-te.',
  name: 'Numele tău',
  email: 'Email',
  password: 'Parolă',
  passwordHint: 'Cel puțin {min} caractere.',
  passwordRepeat: 'Parola din nou',
  createAdmin: 'Creează contul de administrator',
  signInTitle: 'Autentifică-te în {app}',
  signIn: 'Autentificare',
  signOut: 'Deconectare',
  wrongSignIn: 'Emailul sau parola nu sunt corecte.',
  tooMany: 'Prea multe încercări. Așteaptă câteva minute și încearcă din nou.',
  invalidName: 'Scrie un nume (cel mult 80 de caractere).',
  invalidEmail: 'Scrie o adresă de email validă.',
  invalidPassword: 'Parola are nevoie de cel puțin {min} caractere.',
  passwordsDiffer: 'Cele două parole nu sunt la fel.',
  emailTaken: 'Există deja un cont cu acest email.',
  noAccount: 'Nu ai cont? Cere administratorului acestui server un link de invitație.',
  joinTitle: 'Alătură-te la {app}',
  joinIntro: 'Ai fost invitat să folosești {app} pe acest server. Creează-ți contul.',
  joinButton: 'Creează-mi contul',
  inviteGone: 'Linkul de invitație a fost deja folosit sau a expirat. Cere unul nou.',
  instanceTitle: 'Această instanță',
  members: 'Membri',
  admin: 'Administrator',
  you: 'tu',
  lastSeen: 'Ultima activitate',
  never: 'niciodată',
  remove: 'Elimină',
  removeTitle: 'Elimini pe {name}?',
  removeBody:
    'Nu se mai poate autentifica. Ce îi aparține doar lui în {app} se șterge; ce a adăugat la lucrurile altora rămâne sub un nume eliminat.',
  removed: '{name} a fost eliminat.',
  cancel: 'Anulează',
  invite: 'Invită pe cineva',
  inviteHint:
    'Trimite acest link persoanei pe care vrei s-o inviți. Funcționează o singură dată și 7 zile. Apare doar acum: copiază-l.',
  newInvite: 'Creează un link de invitație',
  copy: 'Copiază',
  copied: 'Copiat',
  configTitle: 'Configurare',
  configHint:
    'Totul despre acest server se setează cu variabile de mediu (vezi .env.example): adresa, emailul (SMTP) și setările aplicației. Repornește aplicația după ce le schimbi.',
  address: 'Adresă',
  emailSending: 'Email',
  emailOn: 'pornit (SMTP)',
  emailOff: 'oprit: setează SMTP_HOST ca să trimiți mementouri pe email',
  version: 'Versiune',
  moreTitle: 'Mai mult de la DevQuake',
  moreBody:
    'DevQuake are și alte aplicații gratuite, găzduite pentru tine: antrenamente, rețete, planificare în familie, liste de cumpărături comune și altele.',
  moreLink: 'Vezi aplicațiile pe DevQuake',
  bugs: 'Raportează o problemă',
  openApp: 'Deschide {app}',
  allApps: 'Toate aplicațiile {app}',
  backTo: 'Înapoi la {app}',
  homeTitle: '{app}',
  homeIntro:
    'Aplicațiile gospodăriei tale, pe propriul tău server. Te autentifici o dată și le deschizi pe oricare.',
  homeSetupTitle: 'Încă un pas: adresele aplicațiilor',
  homeSetupBody:
    'Fiecare aplicație are propria adresă. Setează DOMAIN la domeniul tău și îndreaptă-l, împreună cu subdomeniile ({names}), spre acest server, sau setează PUBLIC_IP la adresa IP a serverului ca să folosești adrese sslip.io gratuite. Apoi repornește.',
  homeSignIn: 'Autentifică-te ca să deschizi aplicațiile',
  open: 'Deschide',
  poweredBy: '{app} găzduit de tine · realizat cu DevQuake',
  tryHosted: 'Încearcă versiunea găzduită',
  readyTitle: '{app} este gata',
  readyBody:
    'Invită de pe pagina instanței persoanele care trebuie să-l folosească. Nu vrei să rulezi un server data viitoare? Fiecare aplicație DevQuake e gratuită și pe devquake.com.',
  notReadyTitle: 'Încă nu e gata',
  noDatabase:
    'Nu este setată nicio bază de date. Setează DB_NAME, DB_USER și DB_PASSWORD (vezi .env.example) și repornește.',
  databaseError:
    'Baza de date nu a putut fi accesată sau pregătită. Verifică setările DB_* și containerul bazei de date, apoi repornește.',
};

const hu: ShellTexts = {
  setupTitle: '{app} beállítása',
  setupIntro:
    'Ez a szerver neked és a meghívottaidnak futtatja a(z) {app} alkalmazást. Először hozd létre az admin fiókot: ez kezeli a példány tagjait.',
  setupDone: 'Az admin fiók már létezik. Jelentkezz be.',
  name: 'A neved',
  email: 'E-mail',
  password: 'Jelszó',
  passwordHint: 'Legalább {min} karakter.',
  passwordRepeat: 'Jelszó még egyszer',
  createAdmin: 'Admin fiók létrehozása',
  signInTitle: 'Bejelentkezés: {app}',
  signIn: 'Bejelentkezés',
  signOut: 'Kijelentkezés',
  wrongSignIn: 'Az e-mail vagy a jelszó nem megfelelő.',
  tooMany: 'Túl sok próbálkozás. Várj néhány percet, és próbáld újra.',
  invalidName: 'Adj meg egy nevet (legfeljebb 80 karakter).',
  invalidEmail: 'Adj meg egy érvényes e-mail-címet.',
  invalidPassword: 'A jelszónak legalább {min} karakter hosszúnak kell lennie.',
  passwordsDiffer: 'A két jelszó nem egyezik.',
  emailTaken: 'Ezzel az e-maillel már van fiók.',
  noAccount: 'Nincs fiókod? Kérj meghívó linket a szerver adminjától.',
  joinTitle: 'Csatlakozás: {app}',
  joinIntro:
    'Meghívtak, hogy használd a(z) {app} alkalmazást ezen a szerveren. Hozd létre a fiókodat.',
  joinButton: 'Fiókom létrehozása',
  inviteGone: 'Ezt a meghívó linket már felhasználták, vagy lejárt. Kérj újat.',
  instanceTitle: 'Ez a példány',
  members: 'Tagok',
  admin: 'Admin',
  you: 'te',
  lastSeen: 'Utoljára aktív',
  never: 'soha',
  remove: 'Eltávolítás',
  removeTitle: 'Eltávolítod: {name}?',
  removeBody:
    'Többé nem tud bejelentkezni. Ami csak az övé a(z) {app} alkalmazásban, törlődik; amit mások dolgaihoz adott hozzá, eltávolított néven megmarad.',
  removed: '{name} eltávolítva.',
  cancel: 'Mégse',
  invite: 'Valaki meghívása',
  inviteHint:
    'Küldd el ezt a linket annak, akit meg szeretnél hívni. Egyszer és 7 napig működik. Csak most látható: másold ki.',
  newInvite: 'Meghívó link készítése',
  copy: 'Másolás',
  copied: 'Kimásolva',
  configTitle: 'Beállítások',
  configHint:
    'A szerver minden beállítása környezeti változókkal történik (lásd .env.example): a cím, az e-mail (SMTP) és az alkalmazás beállításai. Módosítás után indítsd újra az alkalmazást.',
  address: 'Cím',
  emailSending: 'E-mail',
  emailOn: 'be (SMTP)',
  emailOff: 'ki: állítsd be az SMTP_HOST-ot az e-mailes emlékeztetőkhöz',
  version: 'Verzió',
  moreTitle: 'Még több a DevQuake-től',
  moreBody:
    'A DevQuake-nek további ingyenes alkalmazásai vannak, általunk üzemeltetve: edzés, receptek, családi tervező, közös bevásárlólisták és még sok más.',
  moreLink: 'Az alkalmazások a DevQuake-en',
  bugs: 'Hiba jelentése',
  openApp: '{app} megnyitása',
  allApps: '{app}: minden alkalmazás',
  backTo: 'Vissza ide: {app}',
  homeTitle: '{app}',
  homeIntro:
    'A háztartásod alkalmazásai, a saját szervereden. Egyszer jelentkezz be, és bármelyiket megnyithatod.',
  homeSetupTitle: 'Még egy lépés: az alkalmazások címei',
  homeSetupBody:
    'Minden alkalmazásnak saját címe van. Állítsd a DOMAIN változót a domainedre, és irányítsd azt és az aldomainjeit ({names}) erre a szerverre, vagy állítsd a PUBLIC_IP változót a szerver IP-címére az ingyenes sslip.io-címekhez. Utána indítsd újra.',
  homeSignIn: 'Jelentkezz be az alkalmazások megnyitásához',
  open: 'Megnyitás',
  poweredBy: 'Saját üzemeltetésű {app} · DevQuake alapokon',
  tryHosted: 'Próbáld ki az üzemeltetett változatot',
  readyTitle: 'A(z) {app} kész',
  readyBody:
    'A példány oldalán hívd meg azokat, akik használni fogják. Legközelebb inkább nem futtatnál szervert? Minden DevQuake-alkalmazás ingyen elérhető a devquake.com-on is.',
  notReadyTitle: 'Még nem áll készen',
  noDatabase:
    'Nincs adatbázis beállítva. Állítsd be a DB_NAME, DB_USER és DB_PASSWORD változókat (lásd .env.example), majd indítsd újra.',
  databaseError:
    'Az adatbázis nem érhető el, vagy nem sikerült előkészíteni. Ellenőrizd a DB_* beállításokat és az adatbázis-konténert, majd indítsd újra.',
};

export const SHELL_TEXTS: Record<PluginLocale, ShellTexts> = { en, de, ro, hu };

export type ShellKey = keyof ShellTexts;

export function shellT(locale: PluginLocale) {
  const texts = SHELL_TEXTS[locale] ?? en;
  return (key: ShellKey, params: Record<string, string | number> = {}) =>
    texts[key].replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`));
}
