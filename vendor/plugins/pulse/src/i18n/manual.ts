import type { Locale } from '@devquake/ui';

// The user manual (/help) in every language (ADR 0011). Inline markup: **bold**, `code`;
// {host} is a link to devquake.com, {contact} to the contact form. Every language has the same
// sections and blocks (checked by a test). The code examples come after the sections.

export type ManualBlock =
  { p: string } | { steps: string[] } | { list: string[] } | { tip: string };

export interface Manual {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  /** For visitors who are not signed in; {link} is the sign-in link. */
  cta: string;
  ctaLink: string;
  kicker: string;
  title: string;
  intro: string;
  contents: string;
  sections: Array<{ id: string; title: string; blocks: ManualBlock[] }>;
  /** Text of the {contact} link. */
  contactLink: string;
  codeTitle: string;
  codeIntro: string;
  codeBrowser: string;
  codeServer: string;
  codeToken: string;
  codeReceived: string;
  /** {email} is the contact address. */
  questions: string;
  back: string;
}

const en: Manual = {
  metaTitle: 'User manual · Pulse realtime events API',
  metaDescription:
    'Send events from your website or server and receive them live in every browser: keys, verified websites, your own data structure, a live test and the API.',
  ogTitle: 'Pulse: user manual',
  cta: 'Want to try it? Pulse is an app for DevQuake members. {link}, then try it free for 24 hours or subscribe.',
  ctaLink: 'Create an account or sign in',
  kicker: 'Pulse · User manual',
  title: 'Realtime events for your app',
  intro:
    'Pulse passes events from one place to many: your server (or a visitor’s browser) sends an event, and every page that listens receives it within a second. You decide what an event carries; Pulse keeps it secure and fair.',
  contents: 'Contents',
  sections: [
    {
      id: 'start',
      title: '1. Getting started',
      blocks: [
        {
          steps: [
            'Sign in on {host} and open **Pulse** from your account (try it free for 24 hours, or subscribe).',
            'Create an **API service**. Copy the **secret key** straight away: it is shown only once.',
            'Under **Your websites**, add your site and its DNS record (or turn on **Allow localhost** to test on your computer).',
            'Open the **Live test** and send your first event.',
          ],
        },
      ],
    },
    {
      id: 'uses',
      title: '2. What people use it for',
      blocks: [
        {
          p: 'Anything where a page should change the moment something happens elsewhere, without reloading:',
        },
        {
          list: [
            '**Notifications**: “Your order has shipped”, “New message”, a badge that counts up.',
            '**Live dashboards**: sales, sign-ups, sensor readings or server status as they happen.',
            '**Chat and comments**: messages that appear for everyone in the room.',
            '**Scores and games**: live results, turns, a scoreboard on a TV and phones at once.',
            '**Collaboration**: a shared list or board where everyone sees the others’ changes.',
            '**Status of a job**: “processing… done” for uploads, payments or exports.',
            '**Presence**: who is online or typing right now.',
          ],
        },
      ],
    },
    {
      id: 'format',
      title: '3. The event format',
      blocks: [
        {
          p: 'Every event has the same fixed frame, and inside it **your own data** as keys and values:',
        },
        {
          list: [
            '`channel`: where it goes, e.g. `orders` or `room-42`. Listeners pick the channels they want.',
            '`event`: what happened, e.g. `order.created`.',
            '`data`: your keys and values, e.g. `orderId: "A-17"`, `total: 42.5`, `paid: true`. Values are text, numbers, yes/no (true/false) or empty (null).',
            'Pulse adds `id`, `app` (your public key), `source` (server, web page, client token or live test), `sender` (from a client token) and `at` (the time, UTC).',
          ],
        },
        {
          tip: 'Channels whose name starts with `private-` can only be used with a client token or the secret key, never with the public key alone.',
        },
      ],
    },
    {
      id: 'security',
      title: '4. Keys and security',
      blocks: [
        {
          list: [
            '**Public key** (`pk_…`): goes into your web pages. It only works from your **verified websites**, can only listen to public channels and, if you allow it, send to them.',
            '**Secret key** (`sk_…`): stays on your server. It may send to any channel and make client tokens. Pulse refuses it when it comes from a web page, because a secret in a browser is no longer secret.',
            '**Client tokens**: your server makes one for each of your users, valid for up to an hour, listing the channels that user may use and whether they may send. This is the secure way for private channels and for logged-in users.',
            '**Only you**: an API service belongs to your DevQuake account alone. It cannot be shared with other members.',
            '**Server addresses**: optionally allow the secret key only from your servers’ IP addresses.',
            '**Watching for leaks**: Pulse counts the addresses your secret key is used from and logs refused calls. If the key shows up in too many places, you are warned: make a new one (the old one keeps working for 24 hours).',
          ],
        },
        {
          tip: 'Why a copied key does not help anyone: the public key only works on websites that proved with DNS that they are yours; the secret key is refused in web pages and can be tied to your servers; and every service has limits, so even a stolen key cannot do more than your plan allows.',
        },
      ],
    },
    {
      id: 'websites',
      title: '5. Verifying your website',
      blocks: [
        {
          steps: [
            'Under **Your websites**, enter the address, e.g. `https://shop.example.com`.',
            'Pulse shows a **TXT record**: a name like `_devquake-pulse.shop.example.com` and a value like `devquake-pulse=…`.',
            'Add it where you manage your domain’s DNS (your hosting or domain provider).',
            'Press **Check now**. After a few minutes (sometimes an hour) the website shows **Verified** and works.',
          ],
        },
        {
          tip: 'To test on your own computer, turn on **Allow localhost**: pages on `http://localhost` then work without a DNS record. Turn it off when you go live.',
        },
      ],
    },
    {
      id: 'structure',
      title: '6. Your own data structure',
      blocks: [
        {
          p: 'Under **Your data structure** you describe each event you use: its keys, their type (text, number or yes/no) and which are required. For example `order.created` with `orderId` (text, required), `total` (number) and `paid` (yes/no).',
        },
        {
          list: [
            'Described events are checked: a missing required key or a wrong type is refused with a clear error.',
            'Events you did not describe are still accepted, unless you turn on **Only described events**.',
            'With **Only described events** on, unknown events and unknown keys are refused too: recommended for production.',
          ],
        },
        {
          tip: 'Keys start with a letter or `_` and contain letters, digits and `_`. At most 20 keys per event; text values up to 500 characters.',
        },
      ],
    },
    {
      id: 'test',
      title: '7. Live test scenario (5 minutes)',
      blocks: [
        {
          p: 'You need: your API service, a computer with a terminal, and a phone (or a second browser window). You do not need a website yet.',
        },
        {
          steps: [
            'Open your API service and press **Live test**. Keep the channel `demo` and press **Connect**: the dot turns green, **Live**.',
            'Open the same page on your phone (signed in to DevQuake) and press **Connect** there too.',
            'On the computer, under **Send**, keep the event `hello` with the key `text` = `Hello`, and press **Send event**. The phone shows it within a second, with how long it took.',
            'Send from the phone: the computer receives it. Both are listening to `demo`.',
            'In a terminal, run the `curl` example from the page with your secret key instead of `$PULSE_SECRET_KEY`. Both pages receive an event from a server.',
            'Try the rules: add a described event under **Your data structure**, turn on **Only described events** and send one with a wrong type: it is refused with the reason.',
            'Try private channels: disconnect, turn on **Use a client token**, set the channels to `private-demo`, connect on both devices and send again.',
          ],
        },
        {
          tip: 'During the free trial events arrive 3 seconds late and connections are shorter: that is on purpose. If a page shows “Connected (polling)”, live connections are blocked on that network; events still arrive, every few seconds.',
        },
      ],
    },
    {
      id: 'api',
      title: '8. The API in short',
      blocks: [
        {
          list: [
            '`POST /api/v1/events`: send one event. Body: `{ "channel", "event", "data" }`. Authentication: `Authorization: Bearer sk_…` (server), `Authorization: Bearer <client token>`, or `X-Pulse-Key: pk_…` (web page on a verified website). Answers `202 { id, at }`.',
            '`GET /api/v1/stream?key=pk_…&channels=a,b`: live events (Server-Sent Events). Use `token=` instead of `key=` for a client token. Reconnecting clients catch up from their last event (`Last-Event-ID`).',
            '`GET /api/v1/poll?key=…&channels=…&after=<id>`: the same events by asking every few seconds, for places where live connections do not work. Answers `{ events, next, retryAfterMs }`.',
            '`GET /api/v1/client`: a small browser library that connects, reconnects, refreshes tokens and falls back to polling by itself.',
            'Errors come as `{ "error": { "code", "message" } }` with the HTTP status (401 key, 403 not allowed, 402 no subscription, 429 too many, with `Retry-After`).',
          ],
        },
      ],
    },
    {
      id: 'limits',
      title: '9. Trial, subscription and full access',
      blocks: [
        {
          p: 'Pulse runs next to all other DevQuake apps, so every account has fair limits. Your current plan and its numbers are shown on the start page of the app.',
        },
        {
          list: [
            '**Free trial (24 hours)**: 1 API service, 3 live connections, 300 events a day, small events, and events arrive 3 seconds late.',
            '**Subscribed**: 3 API services, 25 live connections and 10,000 events a day each, events at once.',
            '**Full access**: much higher limits for production use. {contact} and tell us what you are building.',
          ],
        },
        {
          tip: 'When your subscription ends, your API services stop answering (your apps get “subscription required”). When you unsubscribe or delete your account, they are deleted with all their data.',
        },
      ],
    },
    {
      id: 'data',
      title: '10. Your data',
      blocks: [
        {
          p: 'Events are kept only as long as needed for reconnecting clients to catch up (at most a day, a week with full access), usage figures for 35 days and the security log for 30 days. Secret keys are never stored, and addresses only as anonymous hashes. Deleting an API service, unsubscribing or deleting your DevQuake account removes everything.',
        },
      ],
    },
    {
      id: 'demo',
      title: '11. Check it live',
      blocks: [
        {
          p: 'Want to see Pulse work before writing any code? The **Check it live** demo (on the start page of the app) sends events between two of your browsers through the real API.',
        },
        {
          steps: [
            'Open **Check it live** and press **Copy the link**.',
            'Open the link in a second browser (another browser, a private window or your phone) and sign in to the same DevQuake account.',
            'Choose **A message** and type something, or **Your own JSON** and paste a flat object such as `{ "order": 42, "paid": true }`.',
            'Press **Send to my other browser**. The other browser shows what arrived and how long it took: sender to server, server to browser and end to end, with the average, fastest and slowest.',
          ],
        },
        {
          tip: 'The frame of the event (channel, event name and the `demo_from` and `demo_sent_at` stamps) is fixed; your content goes into `data`. The demo uses a private channel of your own, is free on every plan, does not count towards your limits, allows 30 events a minute and deletes demo events after an hour.',
        },
      ],
    },
  ],
  contactLink: 'Contact us',
  codeTitle: 'Code examples',
  codeIntro:
    'Replace the example key with your own public key (your API service shows these examples with your key filled in).',
  codeBrowser: 'Web page: listen (and send)',
  codeServer: 'Your server: send an event',
  codeToken: 'Your server: a client token for private channels',
  codeReceived: 'What every listener receives',
  questions: 'Questions or ideas? Write to {email}.',
  back: '← Back to Pulse',
};

const de: Manual = {
  metaTitle: 'Anleitung · Pulse Echtzeit-Events-API',
  metaDescription:
    'Sende Events von deiner Website oder deinem Server und empfange sie live in jedem Browser: Schlüssel, bestätigte Websites, eigene Datenstruktur, Live-Test und API.',
  ogTitle: 'Pulse: Anleitung',
  cta: 'Neugierig? Pulse ist eine App für DevQuake-Mitglieder. {link}, dann teste es 24 Stunden kostenlos oder abonniere es.',
  ctaLink: 'Konto anlegen oder anmelden',
  kicker: 'Pulse · Anleitung',
  title: 'Echtzeit-Events für deine App',
  intro:
    'Pulse gibt Events von einer Stelle an viele weiter: Dein Server (oder der Browser eines Besuchers) sendet ein Event, und jede Seite, die zuhört, bekommt es innerhalb einer Sekunde. Du bestimmst, was ein Event enthält; Pulse hält es sicher und fair.',
  contents: 'Inhalt',
  sections: [
    {
      id: 'start',
      title: '1. Erste Schritte',
      blocks: [
        {
          steps: [
            'Melde dich auf {host} an und öffne **Pulse** aus deinem Konto (24 Stunden kostenlos testen oder abonnieren).',
            'Lege einen **API-Dienst** an. Kopiere den **geheimen Schlüssel** sofort: Er wird nur einmal angezeigt.',
            'Füge unter **Deine Websites** deine Seite und ihren DNS-Eintrag hinzu (oder schalte **localhost erlauben** ein, um auf deinem Computer zu testen).',
            'Öffne den **Live-Test** und sende dein erstes Event.',
          ],
        },
      ],
    },
    {
      id: 'uses',
      title: '2. Wofür man es nutzt',
      blocks: [
        {
          p: 'Für alles, bei dem sich eine Seite sofort ändern soll, wenn anderswo etwas passiert, ohne neu zu laden:',
        },
        {
          list: [
            '**Benachrichtigungen**: „Deine Bestellung ist unterwegs“, „Neue Nachricht“, ein Zähler, der hochzählt.',
            '**Live-Dashboards**: Verkäufe, Anmeldungen, Sensorwerte oder Serverstatus in dem Moment, in dem sie passieren.',
            '**Chat und Kommentare**: Nachrichten, die bei allen im Raum erscheinen.',
            '**Spielstände und Spiele**: Live-Ergebnisse, Züge, eine Anzeigetafel auf dem Fernseher und den Handys zugleich.',
            '**Zusammenarbeit**: eine gemeinsame Liste oder Tafel, auf der alle die Änderungen der anderen sehen.',
            '**Status eines Vorgangs**: „wird verarbeitet … fertig“ bei Uploads, Zahlungen oder Exporten.',
            '**Anwesenheit**: wer gerade online ist oder tippt.',
          ],
        },
      ],
    },
    {
      id: 'format',
      title: '3. Das Event-Format',
      blocks: [
        {
          p: 'Jedes Event hat denselben festen Rahmen und darin **deine eigenen Daten** als Schlüssel und Werte:',
        },
        {
          list: [
            '`channel`: wohin es geht, z. B. `orders` oder `room-42`. Empfänger wählen die Kanäle, die sie wollen.',
            '`event`: was passiert ist, z. B. `order.created`.',
            '`data`: deine Schlüssel und Werte, z. B. `orderId: "A-17"`, `total: 42.5`, `paid: true`. Werte sind Text, Zahlen, Ja/Nein (true/false) oder leer (null).',
            'Pulse ergänzt `id`, `app` (deinen öffentlichen Schlüssel), `source` (Server, Webseite, Client-Token oder Live-Test), `sender` (aus einem Client-Token) und `at` (die Zeit, UTC).',
          ],
        },
        {
          tip: 'Kanäle, deren Name mit `private-` beginnt, lassen sich nur mit einem Client-Token oder dem geheimen Schlüssel nutzen, nie mit dem öffentlichen Schlüssel allein.',
        },
      ],
    },
    {
      id: 'security',
      title: '4. Schlüssel und Sicherheit',
      blocks: [
        {
          list: [
            '**Öffentlicher Schlüssel** (`pk_…`): kommt in deine Webseiten. Er funktioniert nur auf deinen **bestätigten Websites**, kann nur öffentliche Kanäle empfangen und, wenn du es erlaubst, an sie senden.',
            '**Geheimer Schlüssel** (`sk_…`): bleibt auf deinem Server. Er darf an jeden Kanal senden und Client-Tokens erstellen. Pulse lehnt ihn ab, wenn er aus einer Webseite kommt, denn ein Geheimnis im Browser ist keines mehr.',
            '**Client-Tokens**: Dein Server erstellt eines für jeden deiner Nutzer, höchstens eine Stunde gültig, mit den Kanälen, die dieser Nutzer verwenden darf, und ob er senden darf. So nutzt du private Kanäle und angemeldete Nutzer sicher.',
            '**Nur du**: Ein API-Dienst gehört allein deinem DevQuake-Konto. Er lässt sich nicht mit anderen Mitgliedern teilen.',
            '**Serveradressen**: Erlaube den geheimen Schlüssel optional nur von den IP-Adressen deiner Server.',
            '**Lecks erkennen**: Pulse zählt die Adressen, von denen dein geheimer Schlüssel benutzt wird, und protokolliert abgelehnte Aufrufe. Taucht der Schlüssel an zu vielen Orten auf, wirst du gewarnt: Erstelle einen neuen (der alte funktioniert noch 24 Stunden).',
          ],
        },
        {
          tip: 'Warum ein kopierter Schlüssel niemandem hilft: Der öffentliche Schlüssel funktioniert nur auf Websites, die per DNS bewiesen haben, dass sie dir gehören; der geheime Schlüssel wird in Webseiten abgelehnt und kann an deine Server gebunden werden; und jeder Dienst hat Grenzen, sodass selbst ein gestohlener Schlüssel nicht mehr kann, als dein Tarif erlaubt.',
        },
      ],
    },
    {
      id: 'websites',
      title: '5. Deine Website bestätigen',
      blocks: [
        {
          steps: [
            'Gib unter **Deine Websites** die Adresse ein, z. B. `https://shop.example.com`.',
            'Pulse zeigt einen **TXT-Eintrag**: einen Namen wie `_devquake-pulse.shop.example.com` und einen Wert wie `devquake-pulse=…`.',
            'Lege ihn dort an, wo du das DNS deiner Domain verwaltest (bei deinem Hosting- oder Domainanbieter).',
            'Tippe auf **Jetzt prüfen**. Nach einigen Minuten (manchmal einer Stunde) zeigt die Website **Bestätigt** und funktioniert.',
          ],
        },
        {
          tip: 'Zum Testen auf deinem eigenen Computer schalte **localhost erlauben** ein: Seiten auf `http://localhost` funktionieren dann ohne DNS-Eintrag. Schalte es ab, wenn du live gehst.',
        },
      ],
    },
    {
      id: 'structure',
      title: '6. Deine eigene Datenstruktur',
      blocks: [
        {
          p: 'Unter **Deine Datenstruktur** beschreibst du jedes Event, das du nutzt: seine Schlüssel, ihren Typ (Text, Zahl oder Ja/Nein) und welche Pflicht sind. Zum Beispiel `order.created` mit `orderId` (Text, Pflicht), `total` (Zahl) und `paid` (Ja/Nein).',
        },
        {
          list: [
            'Beschriebene Events werden geprüft: Ein fehlender Pflichtschlüssel oder ein falscher Typ wird mit einer klaren Fehlermeldung abgelehnt.',
            'Nicht beschriebene Events werden weiter angenommen, es sei denn, du schaltest **Nur beschriebene Events** ein.',
            'Mit **Nur beschriebene Events** werden auch unbekannte Events und Schlüssel abgelehnt: empfohlen für den Produktivbetrieb.',
          ],
        },
        {
          tip: 'Schlüssel beginnen mit einem Buchstaben oder `_` und enthalten Buchstaben, Ziffern und `_`. Höchstens 20 Schlüssel pro Event; Textwerte bis 500 Zeichen.',
        },
      ],
    },
    {
      id: 'test',
      title: '7. Live-Test-Szenario (5 Minuten)',
      blocks: [
        {
          p: 'Du brauchst: deinen API-Dienst, einen Computer mit Terminal und ein Handy (oder ein zweites Browserfenster). Eine Website brauchst du noch nicht.',
        },
        {
          steps: [
            'Öffne deinen API-Dienst und tippe auf **Live-Test**. Behalte den Kanal `demo` und tippe auf **Verbinden**: Der Punkt wird grün, **Live**.',
            'Öffne dieselbe Seite auf deinem Handy (bei DevQuake angemeldet) und tippe auch dort auf **Verbinden**.',
            'Behalte am Computer unter **Senden** das Event `hello` mit dem Schlüssel `text` = `Hello` und tippe auf **Event senden**. Das Handy zeigt es innerhalb einer Sekunde, mit der benötigten Zeit.',
            'Sende vom Handy: Der Computer empfängt es. Beide hören auf `demo`.',
            'Führe in einem Terminal das `curl`-Beispiel der Seite aus, mit deinem geheimen Schlüssel statt `$PULSE_SECRET_KEY`. Beide Seiten empfangen ein Event von einem Server.',
            'Teste die Regeln: Beschreibe unter **Deine Datenstruktur** ein Event, schalte **Nur beschriebene Events** ein und sende eines mit falschem Typ: Es wird mit Begründung abgelehnt.',
            'Teste private Kanäle: Trenne die Verbindung, schalte **Ein Client-Token nutzen** ein, setze die Kanäle auf `private-demo`, verbinde beide Geräte und sende erneut.',
          ],
        },
        {
          tip: 'Im kostenlosen Test kommen Events 3 Sekunden später an, und Verbindungen sind kürzer: Das ist Absicht. Zeigt eine Seite „Verbunden (Abfragen)“, sind Live-Verbindungen in diesem Netz blockiert; Events kommen trotzdem an, alle paar Sekunden.',
        },
      ],
    },
    {
      id: 'api',
      title: '8. Die API in Kürze',
      blocks: [
        {
          list: [
            '`POST /api/v1/events`: ein Event senden. Inhalt: `{ "channel", "event", "data" }`. Anmeldung: `Authorization: Bearer sk_…` (Server), `Authorization: Bearer <Client-Token>` oder `X-Pulse-Key: pk_…` (Webseite auf einer bestätigten Website). Antwort `202 { id, at }`.',
            '`GET /api/v1/stream?key=pk_…&channels=a,b`: Live-Events (Server-Sent Events). Nutze `token=` statt `key=` für ein Client-Token. Neu verbundene Clients holen ab ihrem letzten Event nach (`Last-Event-ID`).',
            '`GET /api/v1/poll?key=…&channels=…&after=<id>`: dieselben Events durch Nachfragen alle paar Sekunden, für Orte, an denen Live-Verbindungen nicht funktionieren. Antwort `{ events, next, retryAfterMs }`.',
            '`GET /api/v1/client`: eine kleine Browser-Bibliothek, die sich verbindet, neu verbindet, Tokens erneuert und von selbst auf Abfragen ausweicht.',
            'Fehler kommen als `{ "error": { "code", "message" } }` mit dem HTTP-Status (401 Schlüssel, 403 nicht erlaubt, 402 kein Abo, 429 zu viele, mit `Retry-After`).',
          ],
        },
      ],
    },
    {
      id: 'limits',
      title: '9. Test, Abo und voller Zugang',
      blocks: [
        {
          p: 'Pulse läuft neben allen anderen DevQuake-Apps, daher hat jedes Konto faire Grenzen. Dein aktueller Tarif und seine Zahlen stehen auf der Startseite der App.',
        },
        {
          list: [
            '**Kostenloser Test (24 Stunden)**: 1 API-Dienst, 3 Live-Verbindungen, 300 Events pro Tag, kleine Events, und Events kommen 3 Sekunden später an.',
            '**Abonniert**: 3 API-Dienste mit je 25 Live-Verbindungen und 10.000 Events pro Tag, Events sofort.',
            '**Voller Zugang**: viel höhere Grenzen für den Produktivbetrieb. {contact} und erzähl uns, was du baust.',
          ],
        },
        {
          tip: 'Endet dein Abo, antworten deine API-Dienste nicht mehr (deine Apps bekommen „Abo erforderlich“). Kündigst du oder löschst du dein Konto, werden sie mit allen Daten gelöscht.',
        },
      ],
    },
    {
      id: 'data',
      title: '10. Deine Daten',
      blocks: [
        {
          p: 'Events werden nur so lange aufbewahrt, wie neu verbundene Clients zum Nachholen brauchen (höchstens einen Tag, mit vollem Zugang eine Woche), Nutzungszahlen 35 Tage und das Sicherheitsprotokoll 30 Tage. Geheime Schlüssel werden nie gespeichert, Adressen nur als anonyme Hashes. Das Löschen eines API-Dienstes, eine Kündigung oder das Löschen deines DevQuake-Kontos entfernt alles.',
        },
      ],
    },
    {
      id: 'demo',
      title: '11. Live ausprobieren',
      blocks: [
        {
          p: 'Du willst Pulse in Aktion sehen, bevor du Code schreibst? Die Demo **Live ausprobieren** (auf der Startseite der App) sendet Events zwischen zwei deiner Browser über die echte API.',
        },
        {
          steps: [
            'Öffne **Live ausprobieren** und drücke **Link kopieren**.',
            'Öffne den Link in einem zweiten Browser (ein anderer Browser, ein privates Fenster oder dein Handy) und melde dich mit demselben DevQuake-Konto an.',
            'Wähle **Eine Nachricht** und tippe etwas, oder **Dein eigenes JSON** und füge ein flaches Objekt ein, etwa `{ "order": 42, "paid": true }`.',
            'Drücke **An meinen anderen Browser senden**. Der andere Browser zeigt, was angekommen ist und wie lange es gedauert hat: Absender bis Server, Server bis Browser und insgesamt, mit Durchschnitt, schnellstem und langsamstem Wert.',
          ],
        },
        {
          tip: 'Der Rahmen des Events (Kanal, Event-Name und die Stempel `demo_from` und `demo_sent_at`) ist fest; dein Inhalt kommt in `data`. Die Demo nutzt einen eigenen privaten Kanal, ist in jedem Tarif kostenlos, zählt nicht zu deinen Limits, erlaubt 30 Events pro Minute und löscht Demo-Events nach einer Stunde.',
        },
      ],
    },
  ],
  contactLink: 'Schreib uns',
  codeTitle: 'Code-Beispiele',
  codeIntro:
    'Ersetze den Beispielschlüssel durch deinen öffentlichen Schlüssel (dein API-Dienst zeigt diese Beispiele mit deinem Schlüssel).',
  codeBrowser: 'Webseite: empfangen (und senden)',
  codeServer: 'Dein Server: ein Event senden',
  codeToken: 'Dein Server: ein Client-Token für private Kanäle',
  codeReceived: 'Was jeder Empfänger bekommt',
  questions: 'Fragen oder Ideen? Schreib an {email}.',
  back: '← Zurück zu Pulse',
};

const ro: Manual = {
  metaTitle: 'Manual · Pulse, API de evenimente în timp real',
  metaDescription:
    'Trimite evenimente de pe site-ul sau serverul tău și primește-le live în orice browser: chei, site-uri verificate, propria structură de date, test live și API.',
  ogTitle: 'Pulse: manual de utilizare',
  cta: 'Vrei să-l încerci? Pulse este o aplicație pentru membrii DevQuake. {link}, apoi încearcă-l gratuit 24 de ore sau abonează-te.',
  ctaLink: 'Creează un cont sau autentifică-te',
  kicker: 'Pulse · Manual de utilizare',
  title: 'Evenimente în timp real pentru aplicația ta',
  intro:
    'Pulse duce evenimentele dintr-un loc către multe: serverul tău (sau browserul unui vizitator) trimite un eveniment și fiecare pagină care ascultă îl primește într-o secundă. Tu decizi ce conține un eveniment; Pulse îl păstrează sigur și corect.',
  contents: 'Cuprins',
  sections: [
    {
      id: 'start',
      title: '1. Primii pași',
      blocks: [
        {
          steps: [
            'Autentifică-te pe {host} și deschide **Pulse** din contul tău (încearcă-l gratuit 24 de ore sau abonează-te).',
            'Creează un **serviciu API**. Copiază imediat **cheia secretă**: este afișată o singură dată.',
            'La **Site-urile tale**, adaugă site-ul și înregistrarea lui DNS (sau pornește **Permite localhost** ca să testezi pe calculator).',
            'Deschide **Testul live** și trimite primul eveniment.',
          ],
        },
      ],
    },
    {
      id: 'uses',
      title: '2. La ce se folosește',
      blocks: [
        {
          p: 'Pentru orice situație în care o pagină trebuie să se schimbe imediat ce se întâmplă ceva în altă parte, fără reîncărcare:',
        },
        {
          list: [
            '**Notificări**: „Comanda ta a fost expediată”, „Mesaj nou”, un contor care crește.',
            '**Panouri live**: vânzări, înscrieri, citiri de senzori sau starea serverelor pe loc.',
            '**Chat și comentarii**: mesaje care apar pentru toți cei din cameră.',
            '**Scoruri și jocuri**: rezultate live, ture, un tabel de scor pe televizor și pe telefoane deodată.',
            '**Colaborare**: o listă sau o tablă comună unde fiecare vede modificările celorlalți.',
            '**Starea unei operațiuni**: „se procesează… gata” pentru încărcări, plăți sau exporturi.',
            '**Prezență**: cine e online sau scrie acum.',
          ],
        },
      ],
    },
    {
      id: 'format',
      title: '3. Formatul evenimentului',
      blocks: [
        {
          p: 'Fiecare eveniment are același cadru fix și, în interior, **propriile tale date** ca chei și valori:',
        },
        {
          list: [
            '`channel`: unde merge, de ex. `orders` sau `room-42`. Ascultătorii aleg canalele dorite.',
            '`event`: ce s-a întâmplat, de ex. `order.created`.',
            '`data`: cheile și valorile tale, de ex. `orderId: "A-17"`, `total: 42.5`, `paid: true`. Valorile sunt text, numere, da/nu (true/false) sau goale (null).',
            'Pulse adaugă `id`, `app` (cheia ta publică), `source` (server, pagină web, token de client sau test live), `sender` (dintr-un token de client) și `at` (ora, UTC).',
          ],
        },
        {
          tip: 'Canalele al căror nume începe cu `private-` pot fi folosite doar cu un token de client sau cu cheia secretă, niciodată doar cu cheia publică.',
        },
      ],
    },
    {
      id: 'security',
      title: '4. Chei și securitate',
      blocks: [
        {
          list: [
            '**Cheia publică** (`pk_…`): intră în paginile tale web. Funcționează doar pe **site-urile tale verificate**, poate asculta doar canale publice și, dacă permiți, poate trimite pe ele.',
            '**Cheia secretă** (`sk_…`): rămâne pe serverul tău. Poate trimite pe orice canal și poate crea tokenuri de client. Pulse o refuză când vine dintr-o pagină web, pentru că un secret în browser nu mai e secret.',
            '**Tokenuri de client**: serverul tău creează câte unul pentru fiecare utilizator, valabil cel mult o oră, cu canalele pe care le poate folosi și dacă poate trimite. Acesta e modul sigur pentru canale private și utilizatori autentificați.',
            '**Doar tu**: un serviciu API aparține doar contului tău DevQuake. Nu poate fi partajat cu alți membri.',
            '**Adresele serverului**: opțional, permite cheia secretă doar de pe adresele IP ale serverelor tale.',
            '**Detectarea scurgerilor**: Pulse numără adresele de pe care e folosită cheia secretă și înregistrează apelurile refuzate. Dacă cheia apare în prea multe locuri, ești avertizat: creează una nouă (cea veche mai merge 24 de ore).',
          ],
        },
        {
          tip: 'De ce o cheie copiată nu ajută pe nimeni: cheia publică funcționează doar pe site-uri care au dovedit prin DNS că sunt ale tale; cheia secretă e refuzată în pagini web și poate fi legată de serverele tale; iar fiecare serviciu are limite, deci nici o cheie furată nu poate face mai mult decât permite planul tău.',
        },
      ],
    },
    {
      id: 'websites',
      title: '5. Verificarea site-ului tău',
      blocks: [
        {
          steps: [
            'La **Site-urile tale**, introdu adresa, de ex. `https://shop.example.com`.',
            'Pulse afișează o **înregistrare TXT**: un nume ca `_devquake-pulse.shop.example.com` și o valoare ca `devquake-pulse=…`.',
            'Adaug-o acolo unde gestionezi DNS-ul domeniului (la furnizorul de găzduire sau de domeniu).',
            'Apasă **Verifică acum**. După câteva minute (uneori o oră), site-ul apare ca **Verificat** și funcționează.',
          ],
        },
        {
          tip: 'Ca să testezi pe propriul calculator, pornește **Permite localhost**: paginile de pe `http://localhost` funcționează atunci fără înregistrare DNS. Oprește opțiunea când treci în producție.',
        },
      ],
    },
    {
      id: 'structure',
      title: '6. Propria structură de date',
      blocks: [
        {
          p: 'La **Structura datelor tale** descrii fiecare eveniment folosit: cheile, tipul lor (text, număr sau da/nu) și care sunt obligatorii. De exemplu `order.created` cu `orderId` (text, obligatoriu), `total` (număr) și `paid` (da/nu).',
        },
        {
          list: [
            'Evenimentele descrise sunt verificate: o cheie obligatorie lipsă sau un tip greșit sunt refuzate cu o eroare clară.',
            'Evenimentele nedescrise sunt acceptate în continuare, dacă nu pornești **Doar evenimente descrise**.',
            'Cu **Doar evenimente descrise** pornit, sunt refuzate și evenimentele și cheile necunoscute: recomandat în producție.',
          ],
        },
        {
          tip: 'Cheile încep cu o literă sau `_` și conțin litere, cifre și `_`. Cel mult 20 de chei per eveniment; valori text de până la 500 de caractere.',
        },
      ],
    },
    {
      id: 'test',
      title: '7. Scenariu de test live (5 minute)',
      blocks: [
        {
          p: 'Ai nevoie de: serviciul tău API, un calculator cu terminal și un telefon (sau o a doua fereastră de browser). Încă nu ai nevoie de un site.',
        },
        {
          steps: [
            'Deschide serviciul API și apasă **Test live**. Păstrează canalul `demo` și apasă **Conectează**: punctul devine verde, **Live**.',
            'Deschide aceeași pagină pe telefon (autentificat în DevQuake) și apasă și acolo **Conectează**.',
            'Pe calculator, la **Trimite**, păstrează evenimentul `hello` cu cheia `text` = `Hello` și apasă **Trimite evenimentul**. Telefonul îl afișează într-o secundă, cu timpul necesar.',
            'Trimite de pe telefon: calculatorul îl primește. Ambele ascultă `demo`.',
            'Într-un terminal, rulează exemplul `curl` din pagină cu cheia ta secretă în locul lui `$PULSE_SECRET_KEY`. Ambele pagini primesc un eveniment de la un server.',
            'Testează regulile: descrie un eveniment la **Structura datelor tale**, pornește **Doar evenimente descrise** și trimite unul cu tip greșit: e refuzat cu motivul.',
            'Testează canalele private: deconectează-te, pornește **Folosește un token de client**, setează canalele la `private-demo`, conectează ambele dispozitive și trimite din nou.',
          ],
        },
        {
          tip: 'În perioada de probă, evenimentele ajung cu 3 secunde întârziere și conexiunile sunt mai scurte: e intenționat. Dacă o pagină arată „Conectat (interogare)”, conexiunile live sunt blocate în acea rețea; evenimentele ajung totuși, la câteva secunde.',
        },
      ],
    },
    {
      id: 'api',
      title: '8. API-ul pe scurt',
      blocks: [
        {
          list: [
            '`POST /api/v1/events`: trimite un eveniment. Conținut: `{ "channel", "event", "data" }`. Autentificare: `Authorization: Bearer sk_…` (server), `Authorization: Bearer <token de client>` sau `X-Pulse-Key: pk_…` (pagină pe un site verificat). Răspuns `202 { id, at }`.',
            '`GET /api/v1/stream?key=pk_…&channels=a,b`: evenimente live (Server-Sent Events). Folosește `token=` în loc de `key=` pentru un token de client. Clienții reconectați recuperează de la ultimul eveniment (`Last-Event-ID`).',
            '`GET /api/v1/poll?key=…&channels=…&after=<id>`: aceleași evenimente prin interogări la câteva secunde, unde conexiunile live nu funcționează. Răspuns `{ events, next, retryAfterMs }`.',
            '`GET /api/v1/client`: o mică bibliotecă pentru browser care se conectează, se reconectează, reînnoiește tokenurile și trece singură la interogări.',
            'Erorile vin ca `{ "error": { "code", "message" } }` cu statusul HTTP (401 cheie, 403 nepermis, 402 fără abonament, 429 prea multe, cu `Retry-After`).',
          ],
        },
      ],
    },
    {
      id: 'limits',
      title: '9. Probă, abonament și acces complet',
      blocks: [
        {
          p: 'Pulse rulează alături de toate celelalte aplicații DevQuake, așa că fiecare cont are limite corecte. Planul tău actual și cifrele lui apar pe pagina de start a aplicației.',
        },
        {
          list: [
            '**Probă gratuită (24 de ore)**: 1 serviciu API, 3 conexiuni live, 300 de evenimente pe zi, evenimente mici, care ajung cu 3 secunde întârziere.',
            '**Abonat**: 3 servicii API, fiecare cu 25 de conexiuni live și 10.000 de evenimente pe zi, evenimente imediat.',
            '**Acces complet**: limite mult mai mari pentru producție. {contact} și spune-ne ce construiești.',
          ],
        },
        {
          tip: 'Când se termină abonamentul, serviciile tale API nu mai răspund (aplicațiile tale primesc „abonament necesar”). Când te dezabonezi sau îți ștergi contul, ele sunt șterse cu toate datele.',
        },
      ],
    },
    {
      id: 'data',
      title: '10. Datele tale',
      blocks: [
        {
          p: 'Evenimentele se păstrează doar cât e nevoie ca clienții reconectați să recupereze (cel mult o zi, o săptămână cu acces complet), cifrele de utilizare 35 de zile și jurnalul de securitate 30 de zile. Cheile secrete nu sunt stocate niciodată, iar adresele doar ca hash-uri anonime. Ștergerea unui serviciu API, dezabonarea sau ștergerea contului DevQuake elimină totul.',
        },
      ],
    },
    {
      id: 'demo',
      title: '11. Încearcă live',
      blocks: [
        {
          p: 'Vrei să vezi Pulse în acțiune înainte să scrii cod? Demo-ul **Încearcă live** (pe pagina de start a aplicației) trimite evenimente între două dintre browserele tale prin API-ul real.',
        },
        {
          steps: [
            'Deschide **Încearcă live** și apasă **Copiază linkul**.',
            'Deschide linkul într-un al doilea browser (alt browser, o fereastră privată sau telefonul) și autentifică-te cu același cont DevQuake.',
            'Alege **Un mesaj** și scrie ceva, sau **Propriul JSON** și lipește un obiect plat, de exemplu `{ "order": 42, "paid": true }`.',
            'Apasă **Trimite la celălalt browser**. Celălalt browser arată ce a sosit și cât a durat: de la expeditor la server, de la server la browser și în total, cu media, cel mai rapid și cel mai lent.',
          ],
        },
        {
          tip: 'Cadrul evenimentului (canalul, numele evenimentului și ștampilele `demo_from` și `demo_sent_at`) este fix; conținutul tău intră în `data`. Demo-ul folosește un canal privat doar al tău, este gratuit în orice plan, nu se socotește în limitele tale, permite 30 de evenimente pe minut și șterge evenimentele demo după o oră.',
        },
      ],
    },
  ],
  contactLink: 'Scrie-ne',
  codeTitle: 'Exemple de cod',
  codeIntro:
    'Înlocuiește cheia de exemplu cu cheia ta publică (serviciul tău API arată aceste exemple cu cheia ta completată).',
  codeBrowser: 'Pagină web: ascultă (și trimite)',
  codeServer: 'Serverul tău: trimite un eveniment',
  codeToken: 'Serverul tău: un token de client pentru canale private',
  codeReceived: 'Ce primește fiecare ascultător',
  questions: 'Întrebări sau idei? Scrie la {email}.',
  back: '← Înapoi la Pulse',
};

const hu: Manual = {
  metaTitle: 'Útmutató · Pulse valós idejű esemény-API',
  metaDescription:
    'Küldj eseményeket a weboldaladról vagy a szerveredről, és fogadd őket élőben bármely böngészőben: kulcsok, igazolt weboldalak, saját adatszerkezet, élő teszt és API.',
  ogTitle: 'Pulse: útmutató',
  cta: 'Kipróbálnád? A Pulse a DevQuake-tagok alkalmazása. {link}, majd próbáld ki 24 órán át ingyen, vagy fizess elő.',
  ctaLink: 'Hozz létre fiókot vagy jelentkezz be',
  kicker: 'Pulse · Útmutató',
  title: 'Valós idejű események az alkalmazásodhoz',
  intro:
    'A Pulse egy helyről sok helyre juttatja el az eseményeket: a szervered (vagy egy látogató böngészője) küld egy eseményt, és minden figyelő oldal egy másodpercen belül megkapja. Te döntöd el, mit tartalmaz egy esemény; a Pulse biztonságosan és igazságosan kezeli.',
  contents: 'Tartalom',
  sections: [
    {
      id: 'start',
      title: '1. Első lépések',
      blocks: [
        {
          steps: [
            'Jelentkezz be a(z) {host} oldalon, és nyisd meg a **Pulse**-t a fiókodból (próbáld ki 24 órán át ingyen, vagy fizess elő).',
            'Hozz létre egy **API-szolgáltatást**. Azonnal másold ki a **titkos kulcsot**: csak egyszer látható.',
            'A **Weboldalaid** alatt add hozzá az oldaladat és a DNS-rekordját (vagy kapcsold be a **localhost engedélyezése** beállítást a gépeden való teszteléshez).',
            'Nyisd meg az **Élő tesztet**, és küldd el az első eseményedet.',
          ],
        },
      ],
    },
    {
      id: 'uses',
      title: '2. Mire használják',
      blocks: [
        {
          p: 'Mindenre, ahol egy oldalnak azonnal változnia kell, amikor máshol történik valami, újratöltés nélkül:',
        },
        {
          list: [
            '**Értesítések**: „A rendelésed úton van”, „Új üzenet”, egy felfelé számláló jelvény.',
            '**Élő irányítópultok**: eladások, regisztrációk, szenzoradatok vagy a szerverek állapota abban a pillanatban.',
            '**Cset és hozzászólások**: üzenetek, amelyek a szobában mindenkinél megjelennek.',
            '**Eredmények és játékok**: élő eredmények, körök, eredményjelző egyszerre a tévén és a telefonokon.',
            '**Együttműködés**: közös lista vagy tábla, ahol mindenki látja a többiek változtatásait.',
            '**Folyamatok állapota**: „feldolgozás… kész” feltöltéseknél, fizetéseknél vagy exportoknál.',
            '**Jelenlét**: ki van éppen online vagy ki gépel.',
          ],
        },
      ],
    },
    {
      id: 'format',
      title: '3. Az esemény formátuma',
      blocks: [
        {
          p: 'Minden eseménynek ugyanaz a rögzített kerete, benne pedig **a saját adataid** kulcsok és értékek formájában:',
        },
        {
          list: [
            '`channel`: hová megy, pl. `orders` vagy `room-42`. A fogadók kiválasztják a kívánt csatornákat.',
            '`event`: mi történt, pl. `order.created`.',
            '`data`: a kulcsaid és értékeid, pl. `orderId: "A-17"`, `total: 42.5`, `paid: true`. Az értékek szövegek, számok, igen/nem (true/false) vagy üresek (null).',
            'A Pulse hozzáadja: `id`, `app` (a nyilvános kulcsod), `source` (szerver, weboldal, kliens-token vagy élő teszt), `sender` (kliens-tokenből) és `at` (az idő, UTC).',
          ],
        },
        {
          tip: 'A `private-` kezdetű csatornák csak kliens-tokennel vagy a titkos kulccsal használhatók, a nyilvános kulccsal önmagában soha.',
        },
      ],
    },
    {
      id: 'security',
      title: '4. Kulcsok és biztonság',
      blocks: [
        {
          list: [
            '**Nyilvános kulcs** (`pk_…`): a weboldalaidba kerül. Csak az **igazolt weboldalaidon** működik, csak nyilvános csatornákat fogadhat, és ha engeded, küldhet is rájuk.',
            '**Titkos kulcs** (`sk_…`): a szervereden marad. Bármely csatornára küldhet, és kliens-tokeneket készíthet. A Pulse elutasítja, ha weboldalról érkezik, mert a böngészőben lévő titok már nem titok.',
            '**Kliens-tokenek**: a szervered minden felhasználódnak készít egyet, legfeljebb egy óráig érvényeset, benne azokkal a csatornákkal, amelyeket használhat, és hogy küldhet-e. Ez a biztonságos út a privát csatornákhoz és a bejelentkezett felhasználókhoz.',
            '**Csak te**: egy API-szolgáltatás kizárólag a DevQuake-fiókodhoz tartozik. Nem osztható meg más tagokkal.',
            '**Szervercímek**: ha szeretnéd, a titkos kulcsot csak a szervereid IP-címeiről engedélyezheted.',
            '**Szivárgás figyelése**: a Pulse számolja, hány címről használják a titkos kulcsodat, és naplózza az elutasított hívásokat. Ha a kulcs túl sok helyen bukkan fel, figyelmeztetünk: készíts újat (a régi még 24 óráig működik).',
          ],
        },
        {
          tip: 'Miért nem segít senkinek egy lemásolt kulcs: a nyilvános kulcs csak olyan weboldalakon működik, amelyek DNS-sel igazolták, hogy a tieid; a titkos kulcsot weboldalakban elutasítjuk, és a szervereidhez köthető; és minden szolgáltatásnak kerete van, így még egy ellopott kulcs sem tud többet, mint amit a csomagod enged.',
        },
      ],
    },
    {
      id: 'websites',
      title: '5. A weboldalad igazolása',
      blocks: [
        {
          steps: [
            'A **Weboldalaid** alatt add meg a címet, pl. `https://shop.example.com`.',
            'A Pulse megmutat egy **TXT-rekordot**: egy nevet, például `_devquake-pulse.shop.example.com`, és egy értéket, például `devquake-pulse=…`.',
            'Add hozzá ott, ahol a domained DNS-ét kezeled (a tárhely- vagy domainszolgáltatódnál).',
            'Nyomd meg az **Ellenőrzés most** gombot. Néhány perc (néha egy óra) után a weboldal **Igazolva** állapotú lesz, és működik.',
          ],
        },
        {
          tip: 'A saját gépeden való teszteléshez kapcsold be a **localhost engedélyezése** beállítást: a `http://localhost` oldalak így DNS-rekord nélkül is működnek. Kapcsold ki, amikor élesbe mész.',
        },
      ],
    },
    {
      id: 'structure',
      title: '6. Saját adatszerkezet',
      blocks: [
        {
          p: 'A **Saját adatszerkezeted** alatt leírod az általad használt eseményeket: a kulcsaikat, a típusukat (szöveg, szám vagy igen/nem), és hogy melyik kötelező. Például `order.created` ezekkel: `orderId` (szöveg, kötelező), `total` (szám) és `paid` (igen/nem).',
        },
        {
          list: [
            'A leírt eseményeket ellenőrizzük: a hiányzó kötelező kulcsot vagy a rossz típust világos hibaüzenettel elutasítjuk.',
            'A nem leírt eseményeket továbbra is elfogadjuk, hacsak be nem kapcsolod a **Csak leírt események** beállítást.',
            'Bekapcsolt **Csak leírt események** mellett az ismeretlen eseményeket és kulcsokat is elutasítjuk: éles használatra ajánlott.',
          ],
        },
        {
          tip: 'A kulcsok betűvel vagy `_` jellel kezdődnek, és betűket, számjegyeket és `_` jelet tartalmaznak. Eseményenként legfeljebb 20 kulcs; a szöveges értékek legfeljebb 500 karakteresek.',
        },
      ],
    },
    {
      id: 'test',
      title: '7. Élő teszt forgatókönyv (5 perc)',
      blocks: [
        {
          p: 'Amire szükséged van: az API-szolgáltatásod, egy gép terminállal és egy telefon (vagy egy második böngészőablak). Weboldal még nem kell.',
        },
        {
          steps: [
            'Nyisd meg az API-szolgáltatásodat, és nyomd meg az **Élő teszt** gombot. Hagyd a `demo` csatornát, és nyomd meg a **Csatlakozás** gombot: a pont zöld lesz, **Élő**.',
            'Nyisd meg ugyanezt az oldalt a telefonodon (DevQuake-be bejelentkezve), és ott is nyomd meg a **Csatlakozás** gombot.',
            'A gépen a **Küldés** alatt hagyd a `hello` eseményt a `text` = `Hello` kulccsal, és nyomd meg az **Esemény küldése** gombot. A telefon egy másodpercen belül megjeleníti, az eltelt idővel.',
            'Küldj a telefonról: a gép megkapja. Mindkettő a `demo` csatornát figyeli.',
            'Egy terminálban futtasd az oldal `curl` példáját, a `$PULSE_SECRET_KEY` helyett a titkos kulcsoddal. Mindkét oldal megkapja a szerverről jövő eseményt.',
            'Próbáld ki a szabályokat: írj le egy eseményt a **Saját adatszerkezeted** alatt, kapcsold be a **Csak leírt események** beállítást, és küldj egyet rossz típussal: indoklással elutasítjuk.',
            'Próbáld ki a privát csatornákat: válaszd le, kapcsold be a **Kliens-token használata** beállítást, állítsd a csatornát `private-demo`-ra, csatlakoztasd mindkét eszközt, és küldj újra.',
          ],
        },
        {
          tip: 'Az ingyenes próba alatt az események 3 másodperc késéssel érkeznek, és a kapcsolatok rövidebbek: ez szándékos. Ha egy oldal „Csatlakozva (lekérdezés)” állapotot mutat, azon a hálózaton az élő kapcsolatok tiltottak; az események így is megérkeznek, néhány másodpercenként.',
        },
      ],
    },
    {
      id: 'api',
      title: '8. Az API röviden',
      blocks: [
        {
          list: [
            '`POST /api/v1/events`: egy esemény küldése. Tartalom: `{ "channel", "event", "data" }`. Hitelesítés: `Authorization: Bearer sk_…` (szerver), `Authorization: Bearer <kliens-token>` vagy `X-Pulse-Key: pk_…` (weboldal egy igazolt oldalon). Válasz: `202 { id, at }`.',
            '`GET /api/v1/stream?key=pk_…&channels=a,b`: élő események (Server-Sent Events). Kliens-tokenhez `key=` helyett `token=`. Az újracsatlakozó kliensek az utolsó eseményüktől pótolnak (`Last-Event-ID`).',
            '`GET /api/v1/poll?key=…&channels=…&after=<id>`: ugyanazok az események néhány másodpercenkénti lekérdezéssel, ahol az élő kapcsolat nem működik. Válasz: `{ events, next, retryAfterMs }`.',
            '`GET /api/v1/client`: kis böngészős könyvtár, amely csatlakozik, újracsatlakozik, megújítja a tokeneket, és magától lekérdezésre vált.',
            'A hibák `{ "error": { "code", "message" } }` formában érkeznek a HTTP-státusszal (401 kulcs, 403 nem engedélyezett, 402 nincs előfizetés, 429 túl sok, `Retry-After` fejléccel).',
          ],
        },
      ],
    },
    {
      id: 'limits',
      title: '9. Próba, előfizetés és teljes hozzáférés',
      blocks: [
        {
          p: 'A Pulse az összes többi DevQuake-alkalmazás mellett fut, ezért minden fióknak igazságos keretei vannak. Az aktuális csomagod és a számai az alkalmazás kezdőlapján láthatók.',
        },
        {
          list: [
            '**Ingyenes próba (24 óra)**: 1 API-szolgáltatás, 3 élő kapcsolat, napi 300 esemény, kis események, 3 másodperc késéssel.',
            '**Előfizetve**: 3 API-szolgáltatás, mindegyik 25 élő kapcsolattal és napi 10 000 eseménnyel, azonnali kézbesítéssel.',
            '**Teljes hozzáférés**: sokkal magasabb keretek éles használatra. {contact}, és mondd el, mit építesz.',
          ],
        },
        {
          tip: 'Ha lejár az előfizetésed, az API-szolgáltatásaid nem válaszolnak (az alkalmazásaid „előfizetés szükséges” választ kapnak). Ha leiratkozol vagy törlöd a fiókodat, minden adatukkal együtt törlődnek.',
        },
      ],
    },
    {
      id: 'data',
      title: '10. Az adataid',
      blocks: [
        {
          p: 'Az eseményeket csak addig őrizzük, amíg az újracsatlakozó klienseknek pótolniuk kell (legfeljebb egy napig, teljes hozzáféréssel egy hétig), a használati adatokat 35 napig, a biztonsági naplót 30 napig. A titkos kulcsokat soha nem tároljuk, a címeket csak névtelen hash-ként. Egy API-szolgáltatás törlése, a leiratkozás vagy a DevQuake-fiók törlése mindent eltávolít.',
        },
      ],
    },
    {
      id: 'demo',
      title: '11. Próbáld ki élőben',
      blocks: [
        {
          p: 'Szeretnéd működés közben látni a Pulse-t, mielőtt kódot írsz? A **Próbáld ki élőben** demó (az alkalmazás kezdőlapján) két böngésződ között küld eseményeket a valódi API-n keresztül.',
        },
        {
          steps: [
            'Nyisd meg a **Próbáld ki élőben** oldalt, és nyomd meg a **Link másolása** gombot.',
            'Nyisd meg a linket egy második böngészőben (másik böngésző, privát ablak vagy a telefonod), és jelentkezz be ugyanazzal a DevQuake-fiókkal.',
            'Válaszd az **Üzenet** lehetőséget és írj valamit, vagy a **Saját JSON** lehetőséget és illessz be egy lapos objektumot, például `{ "order": 42, "paid": true }`.',
            'Nyomd meg a **Küldés a másik böngészőmbe** gombot. A másik böngésző mutatja, mi érkezett és mennyi ideig tartott: küldőtől a szerverig, szervertől a böngészőig és összesen, átlaggal, a leggyorsabbal és a leglassabbal.',
          ],
        },
        {
          tip: 'Az esemény kerete (csatorna, eseménynév, valamint a `demo_from` és `demo_sent_at` bélyeg) rögzített; a tartalmad a `data` részbe kerül. A demó egy csak a tiéd privát csatornát használ, minden csomagban ingyenes, nem számít bele a korlátaidba, percenként 30 eseményt enged, és egy óra után törli a demóeseményeket.',
        },
      ],
    },
  ],
  contactLink: 'Írj nekünk',
  codeTitle: 'Kódpéldák',
  codeIntro:
    'Cseréld a példakulcsot a saját nyilvános kulcsodra (az API-szolgáltatásod ezeket a példákat a kulcsoddal kitöltve mutatja).',
  codeBrowser: 'Weboldal: fogadás (és küldés)',
  codeServer: 'A szervered: esemény küldése',
  codeToken: 'A szervered: kliens-token privát csatornákhoz',
  codeReceived: 'Amit minden fogadó megkap',
  questions: 'Kérdésed vagy ötleted van? Írj a(z) {email} címre.',
  back: '← Vissza a Pulse-hoz',
};

export const MANUAL: Record<Locale, Manual> = { en, de, ro, hu };
