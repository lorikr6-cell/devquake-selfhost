import type { Locale } from '@devquake/ui';

// The user manual (/help) in every language (ADR 0011). Inline markup: **bold**; {host} is a
// link to devquake.com. Every language has the same sections and blocks (checked by a test).

export type ManualBlock =
  | { p: string }
  | { steps: string[] }
  | { list: string[] }
  | { tip: string }
  | { h3: string }
  /** The store types, grouped by category (from the catalogue). */
  | { storeTypes: true };

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
  /** {email} is the contact address. */
  questions: string;
  back: string;
}

const en: Manual = {
  metaTitle: 'User manual · Shared shopping lists',
  metaDescription:
    'How to plan shared shopping lists by date, add stores, products, photos and prices, shop together with friends and read your shopping statistics.',
  ogTitle: 'Shared shopping lists: user manual',
  cta: 'Want to try it? Shared shopping lists is free for DevQuake members. {link}, then subscribe to the app.',
  ctaLink: 'Create an account or sign in',
  kicker: 'Shopping lists · User manual',
  title: 'How to use shared shopping lists',
  intro:
    'Plan what to buy, in which store and on which day, see what it costs, and shop together with family and friends. This manual walks you through it step by step.',
  contents: 'Contents',
  sections: [
    {
      id: 'start',
      title: '1. Getting started',
      blocks: [
        {
          p: 'Shopping lists is an app of DevQuake and uses your DevQuake account, so there is no separate sign-up.',
        },
        {
          steps: [
            'Sign in on {host} (or create an account and confirm your email).',
            'Open **Your account → Available projects** and **Subscribe** to “Shared shopping lists”.',
            'Click **Open Shared shopping lists**. You arrive here already signed in. If you open the app address directly while signed out, sign in once and you come right back.',
          ],
        },
      ],
    },
    {
      id: 'screens',
      title: '2. The main screen',
      blocks: [
        {
          p: 'The main screen has four tabs. On a phone or tablet, swipe left and right between them.',
        },
        {
          list: [
            '**Today** (opens first): every list planned for today, with its products, prices and totals per store. Tap **Open list** to work on it.',
            '**Calendar**: all your lists by date, past and future, as a week, month or year.',
            '**New list**: plan a new list, or join someone else’s with their invite code.',
            '**Statistics**: what you bought, where, at which prices, and who shopped with you.',
          ],
        },
        {
          p: 'The toolbar at the top always has **Lists** (back to this screen), **Manual** (this page) and the language picker.',
        },
        {
          p: 'The toolbar shows the app’s name (tap it to come back to the start), full screen, the notification bell and the DevQuake mark. The manual and the version notes are at the bottom of every page; your language and theme are set in **Your account → Profile** on DevQuake.',
        },
      ],
    },
    {
      id: 'create',
      title: '3. Plan a list',
      blocks: [
        {
          steps: [
            'Go to the **New list** tab.',
            'Give the list a **name**, for example “Weekly groceries” or “Barbecue on Saturday”.',
            'Pick the **shopping date** with the date picker. It is today unless you choose another day; plan as many days ahead as you like.',
            'Choose the **currency** (RON by default) and press **Create list**. The list opens and you are its owner.',
          ],
        },
        {
          tip: 'One list per trip works best: a list for Saturday’s groceries and another for next week’s hardware store run keeps the calendar and the totals clear.',
        },
        {
          p: '**Copy lists to other days** (in the **New list** tab): repeat one list on another day, on every day of a week or of a month; copy all lists of a week to the other weeks of its month; or all lists of a month to the other months of its year. Copies have the same products, prices and stores, nothing ticked off; a list already there with the same name and day is not copied twice.',
        },
      ],
    },
    {
      id: 'stores',
      title: '4. Add stores',
      blocks: [
        {
          p: 'Stores tell everyone where to buy each product. A store has a name, a type, a location and a description, and belongs to the list.',
        },
        {
          steps: [
            'In the **Add to the cart** form, open the **Store** menu and choose **+ New store…**.',
            'Type the store’s name. Well-known chains are suggested, and their **type fills in automatically** (Kaufland → Grocery store, Dedeman → Hardware and DIY, Altex → Consumer electronics, Catena → Pharmacy). You can always pick another type.',
            'Add the **location** (address, mall or area) and a **description** if it helps (opening hours, parking, which entrance).',
          ],
        },
        {
          p: 'Faster: **Search for nearby stores** (under the form) asks your browser for your location once and lists the shops within 2 km from OpenStreetMap, all ticked. Untick the ones you do not need and press **Add**. Your location is not saved.',
        },
        { p: 'The store types are grouped like this:' },
        { storeTypes: true },
        {
          p: 'To change or remove a store, press **Edit** next to its name on the list. Removing a store keeps its products; they move to “Any store”.',
        },
      ],
    },
    {
      id: 'items',
      title: '5. Add products (with suggestions and photos)',
      blocks: [
        { p: 'Each product needs a name and a unit; everything else is optional.' },
        {
          list: [
            '**Item** (required): the product, e.g. “Milk”.',
            '**Unit** (required): how it is sold, e.g. l, kg, pcs, pack, bottle.',
            '**Quantity** (optional): how many units. Leave it empty when the product itself says it all (“Milk, 1 l”); it then counts once.',
            '**Price / unit** (optional): can be filled in now or later by whoever is in the shop. The line total is price × quantity.',
            '**Store** and **Description** (brand, size, “lactose-free”).',
          ],
        },
        {
          p: 'After **Add item** the form keeps the chosen store, so you can add several products for the same shop quickly. Press **Edit** on a product to change it or delete it.',
        },
        { h3: 'Suggestions from your usual shopping' },
        {
          list: [
            'Start typing a product name: products from your earlier lists appear, most frequent first, with their unit, last price and store. Accents do not matter (“paine” finds “Pâine”). Pick one with a tap, or with the arrow keys and Enter.',
            'With **Fill in the whole row from last time** switched on, picking a product fills in the unit, quantity, last known price, description, store (added to the list if needed) and its photo. Switch it off to fill in only the name and unit. The app remembers your choice on this device.',
            '**Usual products** above the form lists what you buy most often and is not on the list yet: one tap adds it with everything from last time.',
          ],
        },
        { h3: 'Photos' },
        {
          list: [
            'Use **Add a photo** in the form, or **Edit → Add a photo** on a product. On a phone you can take the picture right away.',
            'Photos are shrunk on your device before uploading, so it is quick even on mobile data. Only people on the list can see them. Tap a photo to see it large.',
            'A product picked from the suggestions brings its last photo along.',
          ],
        },
      ],
    },
    {
      id: 'shopping',
      title: '6. Go shopping (and “not needed”)',
      blocks: [
        {
          tip: 'Shared the shopping? With **Shared expenses** connected, **Add what was bought** under the list: the ticked items with a price become an expense paid by you, split equally between everyone on the list.',
        },
        {
          steps: [
            'Open the list (from **Today** or the calendar) and press **Go shopping**: bigger tick boxes, no editing clutter.',
            'Tick each product as it goes into the cart. It moves to the bottom of its store.',
            'Missing a price? Leave shopping mode, press **Edit** on the product and enter what it costs in the shop.',
            'Watch the totals: **Still to buy**, **Whole list**, and the total per store. Products without a price are counted separately.',
            'Afterwards, **Clear … finished** removes the ticked products, or keep them for your statistics.',
          ],
        },
        { h3: 'Not needed any more' },
        {
          p: 'Press **Not needed** on a product to strike it out: it moves to the bottom of its store and no longer counts towards **Still to buy** or the list’s total. **Needed again** brings it back.',
        },
        {
          p: 'If the product had already been bought, the money is spent anyway: it stays in the totals and gets a darker background with a 🙃 (“bought, but not needed after all”). The Statistics tab counts these, with the money spent on them, so you can spot what you tend to buy for nothing.',
        },
        {
          p: 'In shopping mode, **Add a product** (folded at the top) adds something you remember in the store. **Correct price** under a product saves the price on the shelf: the planned price is kept next to it, and both go into your price history.',
        },
      ],
    },
    {
      id: 'alone',
      title: '7. Using it on your own',
      blocks: [
        {
          p: 'Your lists are private: only you and the people on a list (who joined with its invite or whom its owner added) can see it. Today, the calendar, the statistics and the suggestions only ever use lists you are on.',
        },
        { p: 'You do not need anyone else: a list with only you on it works the same way.' },
        {
          steps: [
            'Plan lists for the days you shop.',
            'Each day, open the app: the Today tab shows exactly what to buy.',
            'Tick products off and enter prices; the Statistics tab builds up your price history.',
          ],
        },
      ],
    },
    {
      id: 'friends',
      title: '8. Shopping with friends',
      blocks: [
        {
          p: 'Everyone on a list can add products and stores, enter prices and tick things off. Only the owner can invite, remove people, change the settings or delete the list.',
        },
        { h3: 'Invite someone' },
        {
          steps: [
            'Open the list and press **Share & settings**.',
            '**Your friends on DevQuake**: people you invited to DevQuake (and the person who invited you) can be added with one press on **Add to list**.',
            'Anyone else: send the **invite link**, read out the **8-character code**, or let them scan the **QR code**. They need a DevQuake account and a subscription to this app.',
            '**New link** makes a fresh link and code; the old ones stop working.',
          ],
        },
        { h3: 'Join someone’s list' },
        {
          steps: [
            'Open their link or scan their QR code, or type the code in **New list → Join a list**.',
            'Check the list name and owner, then press **Join this list**.',
          ],
        },
        { h3: 'Shopping together' },
        {
          p: 'Changes show up for everyone within a few seconds, without reloading: on an open list, and on the Today, Calendar and Statistics tabs. Split up by store: each person ticks off what they picked up, and the list shows who added and who picked up each product.',
        },
      ],
    },
    {
      id: 'calendar',
      title: '9. Calendar',
      blocks: [
        {
          list: [
            '**Week**: the seven days with each list, what is still to buy and its total.',
            '**Month**: a month grid; each day shows its lists. Finished lists are crossed out.',
            '**Year**: twelve small months with the shopping days marked; press a month to open it.',
          ],
        },
        {
          p: 'Use ‹ and › to move, and **Today** to jump back. Press a list to open it. A list only appears in the calendar of people who are on it.',
        },
      ],
    },
    {
      id: 'stats',
      title: '10. Statistics',
      blocks: [
        {
          list: [
            '**Totals**: lists, products, and what was bought compared with what was planned, per currency.',
            '**Friends on your lists**: for each person, on how many of your lists they were, a row of dots for your most recent lists (filled when they were on it), how many products they added and picked up, and when they last joined.',
            '**Stores**: where you shop most and how much you spent there.',
            '**Spending per month** by shopping date.',
            '**Most bought products** with average, lowest, highest and last price per unit, handy to spot a good deal.',
          ],
        },
        {
          p: '**Prices over time** compares the first and the latest price of each product you bought on different days (your own inflation), and how far the planned prices were from the prices paid.',
        },
      ],
    },
    {
      id: 'manage',
      title: '11. Change, leave or delete a list',
      blocks: [
        {
          list: [
            '**Change the name, date or currency**: Share & settings → Settings (owner).',
            '**Remove someone**: Share & settings → Members → Remove (owner).',
            '**Leave a list**: Members → Leave list (members).',
            '**Delete a list** (owner): Share & settings → Delete list. The list disappears for everyone on it, together with its invite links, notifications and product photos. The prices and products stay in the **Statistics** of everyone who was on it, so your spending history does not change.',
          ],
        },
      ],
    },
    {
      id: 'notifications',
      title: '12. Notifications',
      blocks: [
        {
          list: [
            'The **bell** in the toolbar shows what your friends did on lists you are on (“Ana picked up Milk”, “Bob struck out Chips”). A number shows how many are new; tap an entry to open that list.',
            'While the app is open, new changes also pop up briefly in the corner.',
            'In the bell, tick **Notify me even when this tab is in the background** and allow notifications: your device then shows them while the app is open in another tab or in the background.',
            'When the app is closed, nothing is sent. Open it and the bell shows what you missed (up to 30 days).',
          ],
        },
        {
          p: '**Clear all** empties the bell; **✕** next to a notification removes only that one. Both apply on all your devices.',
        },
      ],
    },
    {
      id: 'tips',
      title: '13. Tips and questions',
      blocks: [
        {
          list: [
            '**Prices differ per store?** Put the product on the list once per store; the statistics then compare the prices.',
            '**Nothing on Today?** The tab shows the next planned list; plan one for today in **New list**.',
            '**A friend cannot open the list?** They must be subscribed to Shared shopping lists on DevQuake; the Share page tells you when that is the case.',
            '**Deleting your DevQuake account** passes your lists to the member who joined first (or deletes them when you were alone) and removes your name from products.',
          ],
        },
      ],
    },
  ],
  questions: 'Questions or ideas? Write to {email}.',
  back: '← Back to your lists',
};

const de: Manual = {
  metaTitle: 'Anleitung · Gemeinsame Einkaufslisten',
  metaDescription:
    'So planst du gemeinsame Einkaufslisten nach Datum, fügst Geschäfte, Produkte, Fotos und Preise hinzu, kaufst mit Freunden ein und liest deine Einkaufsstatistik.',
  ogTitle: 'Gemeinsame Einkaufslisten: Anleitung',
  cta: 'Möchtest du es ausprobieren? Gemeinsame Einkaufslisten sind für DevQuake-Mitglieder kostenlos. {link} und abonniere dann die App.',
  ctaLink: 'Erstelle ein Konto oder melde dich an',
  kicker: 'Einkaufslisten · Anleitung',
  title: 'So nutzt du gemeinsame Einkaufslisten',
  intro:
    'Plane, was du in welchem Geschäft und an welchem Tag kaufst, sieh, was es kostet, und kaufe gemeinsam mit Familie und Freunden ein. Diese Anleitung führt dich Schritt für Schritt durch.',
  contents: 'Inhalt',
  sections: [
    {
      id: 'start',
      title: '1. Erste Schritte',
      blocks: [
        {
          p: 'Die Einkaufslisten sind eine App von DevQuake und nutzen dein DevQuake-Konto, du musst dich also nicht extra registrieren.',
        },
        {
          steps: [
            'Melde dich bei {host} an (oder erstelle ein Konto und bestätige deine E-Mail-Adresse).',
            'Öffne **Dein Konto → Verfügbare Projekte** und **abonniere** „Gemeinsame Einkaufslisten“.',
            'Klicke auf **Gemeinsame Einkaufslisten öffnen**. Du kommst hier schon angemeldet an. Wenn du die Adresse der App abgemeldet direkt öffnest, meldest du dich einmal an und kommst gleich zurück.',
          ],
        },
      ],
    },
    {
      id: 'screens',
      title: '2. Der Hauptbildschirm',
      blocks: [
        {
          p: 'Der Hauptbildschirm hat vier Tabs. Auf Handy oder Tablet wischst du nach links und rechts zwischen ihnen.',
        },
        {
          list: [
            '**Heute** (öffnet zuerst): alle für heute geplanten Listen mit Produkten, Preisen und Summen pro Geschäft. Tippe auf **Liste öffnen**, um daran zu arbeiten.',
            '**Kalender**: alle deine Listen nach Datum, vergangene und künftige, als Woche, Monat oder Jahr.',
            '**Neue Liste**: plane eine neue Liste oder tritt mit einem Einladungscode der Liste eines anderen bei.',
            '**Statistik**: was du gekauft hast, wo, zu welchen Preisen und wer mit dir eingekauft hat.',
          ],
        },
        {
          p: 'Die Leiste oben hat immer **Listen** (zurück zu diesem Bildschirm), **Anleitung** (diese Seite) und die Sprachauswahl.',
        },
        {
          p: 'Die Werkzeugleiste zeigt den Namen der App (antippen führt zurück zum Start), Vollbild, die Glocke für Benachrichtigungen und das DevQuake-Zeichen. Anleitung und Versionshinweise stehen unten auf jeder Seite; Sprache und Design stellst du auf DevQuake unter **Dein Konto → Profil** ein.',
        },
      ],
    },
    {
      id: 'create',
      title: '3. Eine Liste planen',
      blocks: [
        {
          steps: [
            'Gehe zum Tab **Neue Liste**.',
            'Gib der Liste einen **Namen**, zum Beispiel „Wocheneinkauf“ oder „Grillen am Samstag“.',
            'Wähle das **Einkaufsdatum** mit der Datumsauswahl. Es ist heute, außer du wählst einen anderen Tag; plane so viele Tage im Voraus, wie du möchtest.',
            'Wähle die **Währung** (standardmäßig RON) und tippe auf **Liste erstellen**. Die Liste öffnet sich, und du bist ihr Inhaber.',
          ],
        },
        {
          tip: 'Eine Liste pro Einkauf funktioniert am besten: eine Liste für den Einkauf am Samstag und eine andere für den Baumarkt nächste Woche halten Kalender und Summen übersichtlich.',
        },
        {
          p: '**Listen auf andere Tage kopieren** (im Tab **Neue Liste**): Wiederhole eine Liste an einem anderen Tag, an jedem Tag einer Woche oder eines Monats; kopiere alle Listen einer Woche in die anderen Wochen ihres Monats oder alle Listen eines Monats in die anderen Monate seines Jahres. Kopien haben dieselben Produkte, Preise und Geschäfte, nichts ist abgehakt; eine Liste mit gleichem Namen am gleichen Tag wird nicht doppelt angelegt.',
        },
      ],
    },
    {
      id: 'stores',
      title: '4. Geschäfte hinzufügen',
      blocks: [
        {
          p: 'Geschäfte sagen allen, wo jedes Produkt gekauft wird. Ein Geschäft hat einen Namen, eine Art, einen Ort und eine Beschreibung und gehört zur Liste.',
        },
        {
          steps: [
            'Öffne im Formular **In den Einkaufswagen** das Menü **Geschäft** und wähle **+ Neues Geschäft…**.',
            'Tippe den Namen des Geschäfts. Bekannte Ketten werden vorgeschlagen, und ihre **Art wird automatisch ausgefüllt** (Kaufland → Lebensmittelgeschäft, Dedeman → Baumarkt, Altex → Unterhaltungselektronik, Catena → Apotheke). Du kannst jederzeit eine andere Art wählen.',
            'Füge den **Ort** (Adresse, Einkaufszentrum oder Gegend) und eine **Beschreibung** hinzu, wenn es hilft (Öffnungszeiten, Parken, welcher Eingang).',
          ],
        },
        {
          p: 'Schneller: **Geschäfte in der Nähe suchen** (unter dem Formular) fragt deinen Browser einmal nach deinem Standort und listet die Geschäfte im Umkreis von 2 km aus OpenStreetMap auf, alle angehakt. Entferne das Häkchen bei denen, die du nicht brauchst, und tippe auf **Hinzufügen**. Dein Standort wird nicht gespeichert.',
        },
        { p: 'Die Arten von Geschäften sind so gruppiert:' },
        { storeTypes: true },
        {
          p: 'Um ein Geschäft zu ändern oder zu entfernen, tippe auf der Liste neben seinem Namen auf **Bearbeiten**. Beim Entfernen bleiben die Produkte erhalten; sie wandern zu „Beliebiges Geschäft“.',
        },
      ],
    },
    {
      id: 'items',
      title: '5. Produkte hinzufügen (mit Vorschlägen und Fotos)',
      blocks: [
        { p: 'Jedes Produkt braucht einen Namen und eine Einheit; alles andere ist optional.' },
        {
          list: [
            '**Produkt** (erforderlich): das Produkt, z. B. „Milch“.',
            '**Einheit** (erforderlich): wie es verkauft wird, z. B. l, kg, Stk, Pck, Flasche.',
            '**Menge** (optional): wie viele Einheiten. Lass sie leer, wenn das Produkt alles sagt („Milch, 1 l“); es zählt dann einmal.',
            '**Preis / Einheit** (optional): kann jetzt oder später von der Person im Geschäft eingetragen werden. Die Zeilensumme ist Preis × Menge.',
            '**Geschäft** und **Beschreibung** (Marke, Größe, „laktosefrei“).',
          ],
        },
        {
          p: 'Nach **Produkt hinzufügen** behält das Formular das gewählte Geschäft, so kannst du schnell mehrere Produkte für dasselbe Geschäft hinzufügen. Tippe bei einem Produkt auf **Bearbeiten**, um es zu ändern oder zu löschen.',
        },
        { h3: 'Vorschläge aus deinen üblichen Einkäufen' },
        {
          list: [
            'Beginne, einen Produktnamen zu tippen: Produkte aus deinen früheren Listen erscheinen, die häufigsten zuerst, mit Einheit, letztem Preis und Geschäft. Akzente spielen keine Rolle („paine“ findet „Pâine“). Wähle eines durch Antippen oder mit den Pfeiltasten und Enter.',
            'Mit **Die ganze Zeile vom letzten Mal ausfüllen** füllt die Auswahl eines Produkts Einheit, Menge, letzten bekannten Preis, Beschreibung, Geschäft (bei Bedarf zur Liste hinzugefügt) und Foto aus. Schalte es aus, um nur Name und Einheit auszufüllen. Die App merkt sich deine Wahl auf diesem Gerät.',
            '**Übliche Produkte** über dem Formular zeigt, was du am häufigsten kaufst und noch nicht auf der Liste ist: Ein Tippen fügt es mit allem vom letzten Mal hinzu.',
          ],
        },
        { h3: 'Fotos' },
        {
          list: [
            'Nutze **Foto hinzufügen** im Formular oder **Bearbeiten → Foto hinzufügen** bei einem Produkt. Auf dem Handy kannst du das Foto sofort aufnehmen.',
            'Fotos werden vor dem Hochladen auf deinem Gerät verkleinert, das geht auch mit mobilen Daten schnell. Nur Personen auf der Liste sehen sie. Tippe auf ein Foto, um es groß zu sehen.',
            'Ein aus den Vorschlägen gewähltes Produkt bringt sein letztes Foto mit.',
          ],
        },
      ],
    },
    {
      id: 'shopping',
      title: '6. Einkaufen (und „nicht gebraucht“)',
      blocks: [
        {
          tip: 'Gemeinsam eingekauft? Ist **Geteilte Ausgaben** verbunden, tippe unter der Liste auf **Gekauftes hinzufügen**: Die abgehakten Artikel mit Preis werden eine Ausgabe, bezahlt von dir, gleich geteilt unter allen auf der Liste.',
        },
        {
          steps: [
            'Öffne die Liste (über **Heute** oder den Kalender) und tippe auf **Einkaufen**: größere Kästchen zum Abhaken, keine Bearbeitungsfelder.',
            'Hake jedes Produkt ab, sobald es im Wagen liegt. Es rutscht ans Ende seines Geschäfts.',
            'Fehlt ein Preis? Verlasse den Einkaufsmodus, tippe beim Produkt auf **Bearbeiten** und trage ein, was es im Geschäft kostet.',
            'Behalte die Summen im Blick: **Noch zu kaufen**, **Ganze Liste** und die Summe pro Geschäft. Produkte ohne Preis werden getrennt gezählt.',
            'Danach entfernt **… erledigte entfernen** die abgehakten Produkte, oder du behältst sie für deine Statistik.',
          ],
        },
        { h3: 'Nicht mehr gebraucht' },
        {
          p: 'Tippe bei einem Produkt auf **Nicht gebraucht**, um es zu streichen: Es rutscht ans Ende seines Geschäfts und zählt nicht mehr zu **Noch zu kaufen** oder zur Summe der Liste. **Wieder gebraucht** holt es zurück.',
        },
        {
          p: 'War das Produkt schon gekauft, ist das Geld trotzdem ausgegeben: Es bleibt in den Summen und bekommt einen dunkleren Hintergrund mit einem 🙃 („gekauft, aber doch nicht gebraucht“). Die Statistik zählt diese Produkte mit dem dafür ausgegebenen Geld, damit du erkennst, was du oft umsonst kaufst.',
        },
        {
          p: 'Im Einkaufsmodus fügt **Produkt hinzufügen** (oben eingeklappt) etwas hinzu, das dir im Geschäft einfällt. **Preis korrigieren** unter einem Produkt speichert den Preis am Regal: Der geplante Preis bleibt daneben stehen, und beide kommen in deinen Preisverlauf.',
        },
      ],
    },
    {
      id: 'alone',
      title: '7. Allein nutzen',
      blocks: [
        {
          p: 'Deine Listen sind privat: Nur du und die Personen auf einer Liste (die mit ihrer Einladung beigetreten sind oder die ihr Inhaber hinzugefügt hat) sehen sie. Heute, Kalender, Statistik und Vorschläge nutzen immer nur Listen, auf denen du bist.',
        },
        { p: 'Du brauchst niemanden sonst: Eine Liste nur mit dir funktioniert genauso.' },
        {
          steps: [
            'Plane Listen für die Tage, an denen du einkaufst.',
            'Öffne jeden Tag die App: Der Tab Heute zeigt genau, was zu kaufen ist.',
            'Hake Produkte ab und trage Preise ein; die Statistik baut deinen Preisverlauf auf.',
          ],
        },
      ],
    },
    {
      id: 'friends',
      title: '8. Mit Freunden einkaufen',
      blocks: [
        {
          p: 'Alle auf einer Liste können Produkte und Geschäfte hinzufügen, Preise eintragen und abhaken. Nur der Inhaber kann einladen, Personen entfernen, die Einstellungen ändern oder die Liste löschen.',
        },
        { h3: 'Jemanden einladen' },
        {
          steps: [
            'Öffne die Liste und tippe auf **Teilen & Einstellungen**.',
            '**Deine Freunde auf DevQuake**: Personen, die du zu DevQuake eingeladen hast (und die Person, die dich eingeladen hat), fügst du mit einem Tippen auf **Zur Liste hinzufügen** hinzu.',
            'Alle anderen: Schicke den **Einladungslink**, lies den **8-stelligen Code** vor oder lass den **QR-Code** scannen. Sie brauchen ein DevQuake-Konto und ein Abo dieser App.',
            '**Neuer Link** erstellt einen neuen Link und Code; die alten funktionieren dann nicht mehr.',
          ],
        },
        { h3: 'Der Liste eines anderen beitreten' },
        {
          steps: [
            'Öffne den Link, scanne den QR-Code oder tippe den Code unter **Neue Liste → Einer Liste beitreten** ein.',
            'Prüfe den Namen der Liste und den Inhaber und tippe dann auf **Dieser Liste beitreten**.',
          ],
        },
        { h3: 'Gemeinsam einkaufen' },
        {
          p: 'Änderungen erscheinen für alle innerhalb weniger Sekunden, ohne Neuladen: auf einer geöffneten Liste und in den Tabs Heute, Kalender und Statistik. Teilt euch nach Geschäften auf: Jede Person hakt ab, was sie besorgt hat, und die Liste zeigt, wer jedes Produkt hinzugefügt und wer es besorgt hat.',
        },
      ],
    },
    {
      id: 'calendar',
      title: '9. Kalender',
      blocks: [
        {
          list: [
            '**Woche**: die sieben Tage mit jeder Liste, dem, was noch zu kaufen ist, und der Summe.',
            '**Monat**: ein Monatsraster; jeder Tag zeigt seine Listen. Erledigte Listen sind durchgestrichen.',
            '**Jahr**: zwölf kleine Monate mit markierten Einkaufstagen; tippe auf einen Monat, um ihn zu öffnen.',
          ],
        },
        {
          p: 'Mit ‹ und › blätterst du, mit **Heute** springst du zurück. Tippe auf eine Liste, um sie zu öffnen. Eine Liste erscheint nur im Kalender der Personen, die auf ihr sind.',
        },
      ],
    },
    {
      id: 'stats',
      title: '10. Statistik',
      blocks: [
        {
          list: [
            '**Summen**: Listen, Produkte und was gekauft wurde im Vergleich zum Geplanten, pro Währung.',
            '**Freunde auf deinen Listen**: für jede Person, auf wie vielen deiner Listen sie war, eine Reihe Punkte für deine letzten Listen (ausgefüllt, wenn sie dabei war), wie viele Produkte sie hinzugefügt und besorgt hat und wann sie zuletzt dabei war.',
            '**Geschäfte**: wo du am meisten einkaufst und wie viel du dort ausgegeben hast.',
            '**Ausgaben pro Monat** nach Einkaufsdatum.',
            '**Am häufigsten gekaufte Produkte** mit durchschnittlichem, niedrigstem, höchstem und letztem Preis pro Einheit, praktisch, um ein gutes Angebot zu erkennen.',
          ],
        },
        {
          p: '**Preise im Zeitverlauf** vergleicht den ersten und den letzten Preis jedes Produkts, das du an verschiedenen Tagen gekauft hast (deine eigene Inflation), und wie weit die geplanten Preise von den bezahlten entfernt waren.',
        },
      ],
    },
    {
      id: 'manage',
      title: '11. Eine Liste ändern, verlassen oder löschen',
      blocks: [
        {
          list: [
            '**Name, Datum oder Währung ändern**: Teilen & Einstellungen → Einstellungen (Inhaber).',
            '**Jemanden entfernen**: Teilen & Einstellungen → Mitglieder → Entfernen (Inhaber).',
            '**Eine Liste verlassen**: Mitglieder → Liste verlassen (Mitglieder).',
            '**Eine Liste löschen** (Inhaber): Teilen & Einstellungen → Liste löschen. Die Liste verschwindet für alle auf ihr, zusammen mit ihren Einladungslinks, Benachrichtigungen und Produktfotos. Preise und Produkte bleiben in der **Statistik** aller, die auf ihr waren, dein Ausgabenverlauf ändert sich also nicht.',
          ],
        },
      ],
    },
    {
      id: 'notifications',
      title: '12. Benachrichtigungen',
      blocks: [
        {
          list: [
            'Die **Glocke** in der Leiste zeigt, was deine Freunde auf Listen gemacht haben, auf denen du bist („Ana hat Milch besorgt“, „Bob hat Chips gestrichen“). Eine Zahl zeigt, wie viele neu sind; tippe auf einen Eintrag, um die Liste zu öffnen.',
            'Solange die App geöffnet ist, erscheinen neue Änderungen auch kurz in der Ecke.',
            'Setze in der Glocke das Häkchen bei **Auch benachrichtigen, wenn dieser Tab im Hintergrund ist** und erlaube Benachrichtigungen: Dein Gerät zeigt sie dann, solange die App in einem anderen Tab oder im Hintergrund geöffnet ist.',
            'Ist die App geschlossen, wird nichts gesendet. Öffne sie, und die Glocke zeigt, was du verpasst hast (bis zu 30 Tage).',
          ],
        },
        {
          p: '**Alle löschen** leert die Glocke; **✕** neben einer Benachrichtigung entfernt nur diese. Beides gilt auf all deinen Geräten.',
        },
      ],
    },
    {
      id: 'tips',
      title: '13. Tipps und Fragen',
      blocks: [
        {
          list: [
            '**Die Preise unterscheiden sich je Geschäft?** Setze das Produkt einmal pro Geschäft auf die Liste; die Statistik vergleicht dann die Preise.',
            '**Nichts unter Heute?** Der Tab zeigt die nächste geplante Liste; plane eine für heute unter **Neue Liste**.',
            '**Ein Freund kann die Liste nicht öffnen?** Er muss Gemeinsame Einkaufslisten auf DevQuake abonniert haben; die Seite zum Teilen sagt dir, wenn das der Fall ist.',
            '**Wenn du dein DevQuake-Konto löschst**, gehen deine Listen an das Mitglied, das zuerst beigetreten ist (oder sie werden gelöscht, wenn du allein warst), und dein Name wird von den Produkten entfernt.',
          ],
        },
      ],
    },
  ],
  questions: 'Fragen oder Ideen? Schreib an {email}.',
  back: '← Zurück zu deinen Listen',
};

const ro: Manual = {
  metaTitle: 'Manual de utilizare · Liste de cumpărături comune',
  metaDescription:
    'Cum planifici liste de cumpărături comune pe date, adaugi magazine, produse, poze și prețuri, faci cumpărături împreună cu prietenii și citești statisticile cumpărăturilor.',
  ogTitle: 'Liste de cumpărături comune: manual de utilizare',
  cta: 'Vrei să încerci? Listele de cumpărături comune sunt gratuite pentru membrii DevQuake. {link}, apoi abonează-te la aplicație.',
  ctaLink: 'Creează un cont sau autentifică-te',
  kicker: 'Liste de cumpărături · Manual de utilizare',
  title: 'Cum folosești listele de cumpărături comune',
  intro:
    'Planifică ce cumperi, din ce magazin și în ce zi, vezi cât costă și fă cumpărături împreună cu familia și prietenii. Acest manual te ghidează pas cu pas.',
  contents: 'Cuprins',
  sections: [
    {
      id: 'start',
      title: '1. Primii pași',
      blocks: [
        {
          p: 'Listele de cumpărături sunt o aplicație DevQuake și folosesc contul tău DevQuake, deci nu ai nevoie de o înregistrare separată.',
        },
        {
          steps: [
            'Autentifică-te pe {host} (sau creează un cont și confirmă-ți e-mailul).',
            'Deschide **Contul tău → Proiecte disponibile** și **abonează-te** la „Liste de cumpărături comune”.',
            'Apasă **Deschide Liste de cumpărături comune**. Ajungi aici deja autentificat. Dacă deschizi direct adresa aplicației fără să fii autentificat, te autentifici o dată și revii imediat.',
          ],
        },
      ],
    },
    {
      id: 'screens',
      title: '2. Ecranul principal',
      blocks: [
        {
          p: 'Ecranul principal are patru file. Pe telefon sau tabletă glisează la stânga și la dreapta între ele.',
        },
        {
          list: [
            '**Azi** (se deschide prima): toate listele planificate pentru azi, cu produsele, prețurile și totalurile pe magazin. Apasă **Deschide lista** ca să lucrezi pe ea.',
            '**Calendar**: toate listele tale pe date, trecute și viitoare, pe săptămână, lună sau an.',
            '**Listă nouă**: planifică o listă nouă sau alătură-te listei altcuiva cu codul de invitație.',
            '**Statistici**: ce ai cumpărat, de unde, la ce prețuri și cine a făcut cumpărături cu tine.',
          ],
        },
        {
          p: 'Bara de sus are mereu **Liste** (înapoi la acest ecran), **Manual** (această pagină) și alegerea limbii.',
        },
        {
          p: 'Bara de sus arată numele aplicației (atinge-l ca să revii la început), ecranul complet, clopoțelul de notificări și semnul DevQuake. Manualul și notele de versiune sunt jos pe fiecare pagină; limba și tema le setezi pe DevQuake la **Contul tău → Profil**.',
        },
      ],
    },
    {
      id: 'create',
      title: '3. Planifică o listă',
      blocks: [
        {
          steps: [
            'Mergi la fila **Listă nouă**.',
            'Dă-i listei un **nume**, de exemplu „Cumpărăturile săptămânii” sau „Grătar sâmbătă”.',
            'Alege **data cumpărăturilor** din selectorul de dată. Este azi, dacă nu alegi altă zi; poți planifica oricâte zile înainte.',
            'Alege **moneda** (implicit RON) și apasă **Creează lista**. Lista se deschide, iar tu ești proprietarul ei.',
          ],
        },
        {
          tip: 'O listă pentru fiecare drum funcționează cel mai bine: o listă pentru cumpărăturile de sâmbătă și alta pentru drumul la bricolaj de săptămâna viitoare păstrează calendarul și totalurile clare.',
        },
        {
          p: '**Copiază liste în alte zile** (în fila **Listă nouă**): repetă o listă într-o altă zi, în fiecare zi a unei săptămâni sau a unei luni; copiază toate listele unei săptămâni în celelalte săptămâni ale lunii sau toate listele unei luni în celelalte luni ale anului. Copiile au aceleași produse, prețuri și magazine, nimic bifat; o listă cu același nume în aceeași zi nu este copiată de două ori.',
        },
      ],
    },
    {
      id: 'stores',
      title: '4. Adaugă magazine',
      blocks: [
        {
          p: 'Magazinele le arată tuturor de unde se cumpără fiecare produs. Un magazin are un nume, un tip, o locație și o descriere și aparține listei.',
        },
        {
          steps: [
            'În formularul **Adaugă în coș**, deschide meniul **Magazin** și alege **+ Magazin nou…**.',
            'Scrie numele magazinului. Lanțurile cunoscute sunt sugerate, iar **tipul lor se completează automat** (Kaufland → Magazin alimentar, Dedeman → Bricolaj, Altex → Electronice, Catena → Farmacie). Poți alege oricând alt tip.',
            'Adaugă **locația** (adresă, mall sau zonă) și o **descriere** dacă ajută (program, parcare, pe ce intrare).',
          ],
        },
        {
          p: 'Mai repede: **Caută magazine din apropiere** (sub formular) îți cere o dată locația în browser și listează magazinele pe o rază de 2 km din OpenStreetMap, toate bifate. Debifează-le pe cele de care nu ai nevoie și apasă **Adaugă**. Locația ta nu este salvată.',
        },
        { p: 'Tipurile de magazine sunt grupate astfel:' },
        { storeTypes: true },
        {
          p: 'Ca să modifici sau să elimini un magazin, apasă **Editează** lângă numele lui pe listă. Eliminarea unui magazin păstrează produsele; ele trec la „Orice magazin”.',
        },
      ],
    },
    {
      id: 'items',
      title: '5. Adaugă produse (cu sugestii și poze)',
      blocks: [
        { p: 'Fiecare produs are nevoie de un nume și o unitate; restul este opțional.' },
        {
          list: [
            '**Produs** (obligatoriu): produsul, de ex. „Lapte”.',
            '**Unitate** (obligatorie): cum se vinde, de ex. l, kg, buc, pachet, sticlă.',
            '**Cantitate** (opțional): câte unități. Las-o goală când produsul spune totul („Lapte, 1 l”); atunci se numără o dată.',
            '**Preț / unitate** (opțional): se poate completa acum sau mai târziu de cine e în magazin. Totalul rândului este preț × cantitate.',
            '**Magazin** și **Descriere** (marcă, mărime, „fără lactoză”).',
          ],
        },
        {
          p: 'După **Adaugă produsul**, formularul păstrează magazinul ales, ca să poți adăuga repede mai multe produse pentru același magazin. Apasă **Editează** la un produs ca să îl modifici sau să îl ștergi.',
        },
        { h3: 'Sugestii din cumpărăturile tale obișnuite' },
        {
          list: [
            'Începe să scrii numele unui produs: apar produse din listele tale anterioare, cele mai frecvente primele, cu unitatea, ultimul preț și magazinul. Diacriticele nu contează („paine” găsește „Pâine”). Alege unul atingându-l sau cu săgețile și Enter.',
            'Cu **Completează tot rândul ca data trecută** activat, alegerea unui produs completează unitatea, cantitatea, ultimul preț cunoscut, descrierea, magazinul (adăugat pe listă dacă e nevoie) și poza. Dezactivează-l ca să completezi doar numele și unitatea. Aplicația ține minte alegerea ta pe acest dispozitiv.',
            '**Produse obișnuite**, deasupra formularului, arată ce cumperi cel mai des și nu e încă pe listă: o atingere îl adaugă cu tot ce avea data trecută.',
          ],
        },
        { h3: 'Poze' },
        {
          list: [
            'Folosește **Adaugă o poză** în formular sau **Editează → Adaugă o poză** la un produs. Pe telefon poți face poza pe loc.',
            'Pozele sunt micșorate pe dispozitivul tău înainte de încărcare, așa că merge repede și pe date mobile. Doar persoanele de pe listă le pot vedea. Atinge o poză ca să o vezi mare.',
            'Un produs ales din sugestii își aduce și ultima poză.',
          ],
        },
      ],
    },
    {
      id: 'shopping',
      title: '6. La cumpărături (și „nu mai trebuie”)',
      blocks: [
        {
          tip: 'Ați făcut cumpărăturile împreună? Cu **Cheltuieli comune** conectată, apasă sub listă **Adaugă ce s-a cumpărat**: produsele bifate, cu preț, devin o cheltuială plătită de tine, împărțită egal între toți cei de pe listă.',
        },
        {
          steps: [
            'Deschide lista (din **Azi** sau din calendar) și apasă **La cumpărături**: căsuțe de bifat mai mari, fără câmpuri de editare.',
            'Bifează fiecare produs când ajunge în coș. Coboară la finalul magazinului său.',
            'Lipsește un preț? Ieși din modul cumpărături, apasă **Editează** la produs și introdu cât costă în magazin.',
            'Urmărește totalurile: **Rămas de cumpărat**, **Toată lista** și totalul pe magazin. Produsele fără preț sunt numărate separat.',
            'La final, **Elimină … terminate** șterge produsele bifate, sau le păstrezi pentru statistici.',
          ],
        },
        { h3: 'Nu mai trebuie' },
        {
          p: 'Apasă **Nu mai trebuie** la un produs ca să îl tai: coboară la finalul magazinului său și nu mai contează la **Rămas de cumpărat** sau la totalul listei. **Trebuie din nou** îl aduce înapoi.',
        },
        {
          p: 'Dacă produsul fusese deja cumpărat, banii sunt oricum cheltuiți: rămâne în totaluri și primește un fundal mai închis cu un 🙃 („cumpărat, dar nu mai trebuia până la urmă”). Fila Statistici le numără, cu banii cheltuiți pe ele, ca să vezi ce ai tendința să cumperi degeaba.',
        },
        {
          p: 'În modul cumpărături, **Adaugă un produs** (restrâns sus) adaugă ceva ce îți amintești în magazin. **Corectează prețul** sub un produs salvează prețul de pe raft: prețul planificat rămâne alături, iar amândouă intră în istoricul prețurilor.',
        },
      ],
    },
    {
      id: 'alone',
      title: '7. Folosire de unul singur',
      blocks: [
        {
          p: 'Listele tale sunt private: doar tu și persoanele de pe o listă (care s-au alăturat prin invitație sau pe care le-a adăugat proprietarul) o pot vedea. Azi, calendarul, statisticile și sugestiile folosesc doar liste pe care ești.',
        },
        { p: 'Nu ai nevoie de altcineva: o listă doar cu tine funcționează la fel.' },
        {
          steps: [
            'Planifică liste pentru zilele în care faci cumpărături.',
            'În fiecare zi deschide aplicația: fila Azi arată exact ce ai de cumpărat.',
            'Bifează produsele și introdu prețurile; fila Statistici îți construiește istoricul prețurilor.',
          ],
        },
      ],
    },
    {
      id: 'friends',
      title: '8. Cumpărături cu prietenii',
      blocks: [
        {
          p: 'Oricine de pe o listă poate adăuga produse și magazine, introduce prețuri și bifa. Doar proprietarul poate invita, elimina persoane, schimba setările sau șterge lista.',
        },
        { h3: 'Invită pe cineva' },
        {
          steps: [
            'Deschide lista și apasă **Distribuire și setări**.',
            '**Prietenii tăi pe DevQuake**: persoanele pe care le-ai invitat pe DevQuake (și cea care te-a invitat) pot fi adăugate cu o apăsare pe **Adaugă pe listă**.',
            'Oricine altcineva: trimite **linkul de invitație**, citește **codul de 8 caractere** sau lasă-i să scaneze **codul QR**. Au nevoie de un cont DevQuake și de un abonament la această aplicație.',
            '**Link nou** face un link și un cod noi; cele vechi nu mai funcționează.',
          ],
        },
        { h3: 'Alătură-te listei cuiva' },
        {
          steps: [
            'Deschide linkul, scanează codul QR sau scrie codul în **Listă nouă → Alătură-te unei liste**.',
            'Verifică numele listei și proprietarul, apoi apasă **Alătură-te acestei liste**.',
          ],
        },
        { h3: 'Cumpărături împreună' },
        {
          p: 'Modificările apar la toți în câteva secunde, fără reîncărcare: pe o listă deschisă și în filele Azi, Calendar și Statistici. Împărțiți-vă pe magazine: fiecare bifează ce a luat, iar lista arată cine a adăugat și cine a luat fiecare produs.',
        },
      ],
    },
    {
      id: 'calendar',
      title: '9. Calendar',
      blocks: [
        {
          list: [
            '**Săptămână**: cele șapte zile cu fiecare listă, ce mai e de cumpărat și totalul ei.',
            '**Lună**: o grilă a lunii; fiecare zi își arată listele. Listele terminate sunt tăiate.',
            '**An**: douăsprezece luni mici cu zilele de cumpărături marcate; apasă o lună ca să o deschizi.',
          ],
        },
        {
          p: 'Folosește ‹ și › ca să te deplasezi și **Azi** ca să revii. Apasă o listă ca să o deschizi. O listă apare doar în calendarul celor care sunt pe ea.',
        },
      ],
    },
    {
      id: 'stats',
      title: '10. Statistici',
      blocks: [
        {
          list: [
            '**Totaluri**: liste, produse și ce s-a cumpărat față de ce s-a planificat, pe monedă.',
            '**Prieteni pe listele tale**: pentru fiecare persoană, pe câte dintre listele tale a fost, un rând de puncte pentru cele mai recente liste (pline când a fost pe ele), câte produse a adăugat și a luat și când a fost ultima dată.',
            '**Magazine**: de unde cumperi cel mai des și cât ai cheltuit acolo.',
            '**Cheltuieli pe lună**, după data cumpărăturilor.',
            '**Cele mai cumpărate produse**, cu prețul mediu, cel mai mic, cel mai mare și ultimul preț pe unitate, util ca să prinzi o ofertă bună.',
          ],
        },
        {
          p: '**Prețurile în timp** compară primul și ultimul preț al fiecărui produs cumpărat în zile diferite (inflația ta) și cât de departe au fost prețurile planificate de cele plătite.',
        },
      ],
    },
    {
      id: 'manage',
      title: '11. Modifică, părăsește sau șterge o listă',
      blocks: [
        {
          list: [
            '**Schimbă numele, data sau moneda**: Distribuire și setări → Setări (proprietar).',
            '**Elimină pe cineva**: Distribuire și setări → Membri → Elimină (proprietar).',
            '**Părăsește o listă**: Membri → Părăsește lista (membri).',
            '**Șterge o listă** (proprietar): Distribuire și setări → Șterge lista. Lista dispare pentru toți cei de pe ea, împreună cu linkurile de invitație, notificările și pozele produselor. Prețurile și produsele rămân în **Statisticile** tuturor celor care au fost pe ea, deci istoricul cheltuielilor nu se schimbă.',
          ],
        },
      ],
    },
    {
      id: 'notifications',
      title: '12. Notificări',
      blocks: [
        {
          list: [
            '**Clopoțelul** din bară arată ce au făcut prietenii tăi pe listele pe care ești („Ana a luat Lapte”, „Bob a tăiat Chipsuri”). Un număr arată câte sunt noi; atinge o intrare ca să deschizi lista.',
            'Cât timp aplicația e deschisă, modificările noi apar și pentru scurt timp în colț.',
            'În clopoțel, bifează **Anunță-mă și când această filă este în fundal** și permite notificările: dispozitivul le arată cât timp aplicația e deschisă în altă filă sau în fundal.',
            'Când aplicația e închisă, nu se trimite nimic. Deschide-o și clopoțelul arată ce ai ratat (până la 30 de zile).',
          ],
        },
        {
          p: '**Șterge tot** golește clopoțelul; **✕** lângă o notificare o elimină doar pe aceea. Amândouă se aplică pe toate dispozitivele tale.',
        },
      ],
    },
    {
      id: 'tips',
      title: '13. Sfaturi și întrebări',
      blocks: [
        {
          list: [
            '**Prețurile diferă de la un magazin la altul?** Pune produsul pe listă o dată pentru fiecare magazin; statisticile compară apoi prețurile.',
            '**Nimic la Azi?** Fila arată următoarea listă planificată; planifică una pentru azi în **Listă nouă**.',
            '**Un prieten nu poate deschide lista?** Trebuie să fie abonat la Liste de cumpărături comune pe DevQuake; pagina de distribuire îți spune când e cazul.',
            '**Ștergerea contului DevQuake** îți trece listele la membrul care s-a alăturat primul (sau le șterge dacă erai singur) și îți scoate numele de pe produse.',
          ],
        },
      ],
    },
  ],
  questions: 'Întrebări sau idei? Scrie-ne la {email}.',
  back: '← Înapoi la listele tale',
};

const hu: Manual = {
  metaTitle: 'Útmutató · Közös bevásárlólisták',
  metaDescription:
    'Hogyan tervezz közös bevásárlólistákat dátum szerint, adj hozzá üzleteket, termékeket, fotókat és árakat, vásárolj együtt a barátaiddal, és olvasd a vásárlási statisztikáidat.',
  ogTitle: 'Közös bevásárlólisták: útmutató',
  cta: 'Kipróbálnád? A közös bevásárlólisták ingyenesek a DevQuake-tagoknak. {link}, majd iratkozz fel az alkalmazásra.',
  ctaLink: 'Hozz létre fiókot, vagy jelentkezz be',
  kicker: 'Bevásárlólisták · Útmutató',
  title: 'Hogyan használd a közös bevásárlólistákat',
  intro:
    'Tervezd meg, mit veszel, melyik üzletben és melyik napon, lásd, mennyibe kerül, és vásárolj együtt a családdal és a barátokkal. Ez az útmutató lépésről lépésre végigvezet.',
  contents: 'Tartalom',
  sections: [
    {
      id: 'start',
      title: '1. Első lépések',
      blocks: [
        {
          p: 'A bevásárlólisták a DevQuake alkalmazása, és a DevQuake-fiókodat használja, így nincs külön regisztráció.',
        },
        {
          steps: [
            'Jelentkezz be itt: {host} (vagy hozz létre fiókot, és erősítsd meg az e-mail-címedet).',
            'Nyisd meg a **Fiókod → Elérhető projektek** részt, és **iratkozz fel** a „Közös bevásárlólisták” alkalmazásra.',
            'Kattints a **Közös bevásárlólisták megnyitása** gombra. Már bejelentkezve érkezel ide. Ha kijelentkezve nyitod meg közvetlenül az alkalmazás címét, egyszer bejelentkezel, és rögtön visszajutsz.',
          ],
        },
      ],
    },
    {
      id: 'screens',
      title: '2. A főképernyő',
      blocks: [
        {
          p: 'A főképernyőnek négy füle van. Telefonon vagy táblagépen balra és jobbra húzva válthatsz közöttük.',
        },
        {
          list: [
            '**Ma** (ez nyílik meg először): minden mára tervezett lista a termékeivel, áraival és üzletenkénti összegeivel. Koppints a **Lista megnyitása** gombra, hogy dolgozz rajta.',
            '**Naptár**: minden listád dátum szerint, múltbeliek és jövőbeliek, heti, havi vagy éves nézetben.',
            '**Új lista**: tervezz új listát, vagy csatlakozz valaki más listájához a meghívókódjával.',
            '**Statisztika**: mit vettél, hol, milyen áron, és ki vásárolt veled.',
          ],
        },
        {
          p: 'A felső sávon mindig ott van a **Listák** (vissza erre a képernyőre), az **Útmutató** (ez az oldal) és a nyelvválasztó.',
        },
        {
          p: 'Az eszköztáron az alkalmazás neve (koppints rá a kezdőlaphoz), a teljes képernyő, az értesítések csengője és a DevQuake jele látható. Az útmutató és a verziójegyzetek minden oldal alján vannak; a nyelvet és a témát a DevQuake-en a **Fiókod → Profil** részben állítod be.',
        },
      ],
    },
    {
      id: 'create',
      title: '3. Lista tervezése',
      blocks: [
        {
          steps: [
            'Menj az **Új lista** fülre.',
            'Adj a listának **nevet**, például „Heti bevásárlás” vagy „Szombati grillezés”.',
            'Válaszd ki a **bevásárlás napját** a dátumválasztóval. Ez a mai nap, hacsak nem választasz mást; annyi nappal előre tervezhetsz, amennyivel szeretnél.',
            'Válaszd ki a **pénznemet** (alapból RON), és nyomd meg a **Lista létrehozása** gombot. A lista megnyílik, és te vagy a tulajdonosa.',
          ],
        },
        {
          tip: 'Minden bevásárlásra egy lista működik a legjobban: egy lista a szombati élelmiszer-vásárlásra, egy másik a jövő heti barkácsáruházas útra áttekinthetően tartja a naptárat és az összegeket.',
        },
        {
          p: '**Listák másolása más napokra** (az **Új lista** fülön): ismételj meg egy listát egy másik napon, egy hét vagy egy hónap minden napján; másold egy hét összes listáját a hónap többi hetére, vagy egy hónap összes listáját az év többi hónapjára. A másolatokban ugyanazok a termékek, árak és üzletek vannak, semmi sincs kipipálva; az azonos nevű és napú lista nem jön létre kétszer.',
        },
      ],
    },
    {
      id: 'stores',
      title: '4. Üzletek hozzáadása',
      blocks: [
        {
          p: 'Az üzletek megmutatják mindenkinek, hol kell megvenni az egyes termékeket. Egy üzletnek van neve, típusa, helye és leírása, és a listához tartozik.',
        },
        {
          steps: [
            'A **Kosárba** űrlapon nyisd meg az **Üzlet** menüt, és válaszd az **+ Új üzlet…** lehetőséget.',
            'Írd be az üzlet nevét. Az ismert láncokat felajánljuk, és a **típusuk automatikusan kitöltődik** (Kaufland → Élelmiszerbolt, Dedeman → Barkácsáruház, Altex → Szórakoztató elektronika, Catena → Gyógyszertár). Bármikor választhatsz más típust.',
            'Add meg a **helyet** (cím, bevásárlóközpont vagy környék) és egy **leírást**, ha segít (nyitvatartás, parkolás, melyik bejárat).',
          ],
        },
        {
          p: 'Gyorsabban: a **Közeli üzletek keresése** (az űrlap alatt) egyszer elkéri a böngészőtől a helyzetedet, és felsorolja a 2 km-en belüli üzleteket az OpenStreetMapről, mind bepipálva. Vedd ki a pipát azokból, amelyekre nincs szükséged, és koppints a **Hozzáadás** gombra. A helyzetedet nem mentjük el.',
        },
        { p: 'Az üzlettípusok így vannak csoportosítva:' },
        { storeTypes: true },
        {
          p: 'Egy üzlet módosításához vagy eltávolításához nyomd meg a neve melletti **Szerkesztés** gombot a listán. Eltávolításkor a termékei megmaradnak; a „Bármely üzlet” alá kerülnek.',
        },
      ],
    },
    {
      id: 'items',
      title: '5. Termékek hozzáadása (javaslatokkal és fotókkal)',
      blocks: [
        { p: 'Minden terméknek kell egy név és egy egység; minden más nem kötelező.' },
        {
          list: [
            '**Termék** (kötelező): a termék, pl. „Tej”.',
            '**Egység** (kötelező): hogyan árulják, pl. l, kg, db, csomag, üveg.',
            '**Mennyiség** (nem kötelező): hány egység. Hagyd üresen, ha a termék mindent elmond („Tej, 1 l”); ilyenkor egyszer számít.',
            '**Egységár** (nem kötelező): most vagy később is kitöltheti, aki épp az üzletben van. A sor összege ár × mennyiség.',
            '**Üzlet** és **Leírás** (márka, méret, „laktózmentes”).',
          ],
        },
        {
          p: 'A **Termék hozzáadása** után az űrlap megtartja a választott üzletet, így gyorsan hozzáadhatsz több terméket ugyanahhoz az üzlethez. Egy termék **Szerkesztés** gombjával módosíthatod vagy törölheted.',
        },
        { h3: 'Javaslatok a szokásos vásárlásaidból' },
        {
          list: [
            'Kezdd el beírni egy termék nevét: megjelennek a korábbi listáid termékei, a leggyakoribbak elöl, egységgel, utolsó árral és üzlettel. Az ékezetek nem számítanak („paine” megtalálja a „Pâine”-t). Válassz egyet koppintással, vagy a nyilakkal és Enterrel.',
            'Ha be van kapcsolva **Az egész sor kitöltése a legutóbbi alapján**, egy termék kiválasztása kitölti az egységet, a mennyiséget, az utolsó ismert árat, a leírást, az üzletet (szükség esetén hozzáadja a listához) és a fotóját. Kapcsold ki, ha csak a nevet és az egységet akarod kitölteni. Az alkalmazás ezen az eszközön megjegyzi a döntésedet.',
            'Az űrlap feletti **Szokásos termékek** azt mutatja, amit a leggyakrabban veszel, és még nincs a listán: egy koppintás mindennel együtt hozzáadja, ami legutóbb volt.',
          ],
        },
        { h3: 'Fotók' },
        {
          list: [
            'Használd az űrlapon a **Fotó hozzáadása**, vagy egy terméknél a **Szerkesztés → Fotó hozzáadása** lehetőséget. Telefonon azonnal készíthetsz képet.',
            'A fotókat feltöltés előtt az eszközödön kicsinyítjük, így mobilneten is gyors. Csak a listán lévők láthatják őket. Koppints egy fotóra, hogy nagyban lásd.',
            'A javaslatok közül választott termék magával hozza a legutóbbi fotóját.',
          ],
        },
      ],
    },
    {
      id: 'shopping',
      title: '6. Bevásárlás (és „nem kell”)',
      blocks: [
        {
          tip: 'Közösen vásároltatok? Ha a **Közös kiadások** össze van kapcsolva, a lista alatt koppints **A vásárlás hozzáadása** gombra: a kipipált, áras tételekből általad fizetett kiadás lesz, a listán szereplők között egyenlően elosztva.',
        },
        {
          steps: [
            'Nyisd meg a listát (a **Ma** fülről vagy a naptárból), és nyomd meg a **Bevásárlás** gombot: nagyobb jelölőnégyzetek, szerkesztőmezők nélkül.',
            'Pipáld ki a termékeket, ahogy a kosárba kerülnek. A termék az üzlete aljára kerül.',
            'Hiányzik egy ár? Lépj ki a bevásárló módból, nyomd meg a termék **Szerkesztés** gombját, és add meg, mennyibe kerül az üzletben.',
            'Figyeld az összegeket: **Még megvenni**, **Teljes lista** és az üzletenkénti összeg. Az ár nélküli termékeket külön számoljuk.',
            'Utána a **… kész törlése** eltávolítja a kipipált termékeket, vagy megtarthatod őket a statisztikához.',
          ],
        },
        { h3: 'Már nem kell' },
        {
          p: 'Nyomd meg egy terméknél a **Nem kell** gombot a kihúzáshoz: az üzlete aljára kerül, és már nem számít bele a **Még megvenni** vagy a lista összegébe. Az **Újra kell** visszahozza.',
        },
        {
          p: 'Ha a terméket már megvették, a pénz így is elment: az összegekben marad, és sötétebb hátteret kap egy 🙃 jellel („megvéve, de végül nem kellett”). A Statisztika fül számolja ezeket a rájuk költött pénzzel együtt, hogy lásd, mit veszel gyakran feleslegesen.',
        },
        {
          p: 'Bevásárlás közben a **Termék hozzáadása** (felül összecsukva) hozzáad valamit, ami az üzletben jut eszedbe. A termék alatti **Ár javítása** elmenti a polcon látott árat: a tervezett ár mellette marad, és mindkettő bekerül az árelőzményeidbe.',
        },
      ],
    },
    {
      id: 'alone',
      title: '7. Egyedül használva',
      blocks: [
        {
          p: 'A listáid privátak: csak te és a lista tagjai (akik a meghívóval csatlakoztak, vagy akiket a tulajdonos hozzáadott) láthatják. A Ma, a naptár, a statisztika és a javaslatok mindig csak azokat a listákat használják, amelyeken rajta vagy.',
        },
        { p: 'Nincs szükséged senki másra: egy csak veled lévő lista ugyanígy működik.' },
        {
          steps: [
            'Tervezz listákat azokra a napokra, amikor vásárolsz.',
            'Minden nap nyisd meg az alkalmazást: a Ma fül pontosan megmutatja, mit kell venni.',
            'Pipáld ki a termékeket, és add meg az árakat; a Statisztika fül felépíti az áraid történetét.',
          ],
        },
      ],
    },
    {
      id: 'friends',
      title: '8. Vásárlás a barátokkal',
      blocks: [
        {
          p: 'A listán mindenki hozzáadhat termékeket és üzleteket, megadhat árakat és kipipálhat. Csak a tulajdonos hívhat meg, távolíthat el embereket, módosíthatja a beállításokat vagy törölheti a listát.',
        },
        { h3: 'Valaki meghívása' },
        {
          steps: [
            'Nyisd meg a listát, és nyomd meg a **Megosztás és beállítások** gombot.',
            '**Barátaid a DevQuake-en**: akiket meghívtál a DevQuake-re (és aki téged meghívott), egy koppintással hozzáadhatók a **Hozzáadás a listához** gombbal.',
            'Bárki más: küldd el a **meghívó linket**, olvasd fel a **8 karakteres kódot**, vagy olvastasd be a **QR-kódot**. DevQuake-fiók és erre az alkalmazásra szóló feliratkozás kell nekik.',
            'Az **Új link** új linket és kódot készít; a régiek nem működnek tovább.',
          ],
        },
        { h3: 'Csatlakozás valaki listájához' },
        {
          steps: [
            'Nyisd meg a linkjét, olvasd be a QR-kódját, vagy írd be a kódot itt: **Új lista → Csatlakozás egy listához**.',
            'Ellenőrizd a lista nevét és a tulajdonost, majd nyomd meg a **Csatlakozom a listához** gombot.',
          ],
        },
        { h3: 'Közös vásárlás' },
        {
          p: 'A változások néhány másodpercen belül mindenkinél megjelennek, újratöltés nélkül: egy megnyitott listán, valamint a Ma, a Naptár és a Statisztika fülön. Osszátok fel üzletenként: mindenki kipipálja, amit megvett, és a lista mutatja, ki adta hozzá és ki vette meg az egyes termékeket.',
        },
      ],
    },
    {
      id: 'calendar',
      title: '9. Naptár',
      blocks: [
        {
          list: [
            '**Hét**: a hét nap minden listával, azzal, amit még meg kell venni, és az összeggel.',
            '**Hónap**: havi rács; minden nap mutatja a listáit. A kész listák át vannak húzva.',
            '**Év**: tizenkét kis hónap a bevásárlónapok jelölésével; koppints egy hónapra a megnyitásához.',
          ],
        },
        {
          p: 'A ‹ és › gombokkal lapozhatsz, a **Ma** gombbal visszaugorhatsz. Koppints egy listára a megnyitásához. Egy lista csak azok naptárában jelenik meg, akik rajta vannak.',
        },
      ],
    },
    {
      id: 'stats',
      title: '10. Statisztika',
      blocks: [
        {
          list: [
            '**Összesítések**: listák, termékek, és a megvett összeg a tervezetthez képest, pénznemenként.',
            '**Barátok a listáidon**: minden személynél, hány listádon volt rajta, egy sor pötty a legutóbbi listáidhoz (teli, ha rajta volt), hány terméket adott hozzá és vett meg, és mikor volt utoljára.',
            '**Üzletek**: hol vásárolsz a legtöbbet, és mennyit költöttél ott.',
            '**Havi költés** a bevásárlás dátuma szerint.',
            '**Leggyakrabban vett termékek** átlagos, legalacsonyabb, legmagasabb és utolsó egységárral, hasznos egy jó ajánlat felismeréséhez.',
          ],
        },
        {
          p: 'Az **Árak az idő múlásával** összeveti minden, különböző napokon vásárolt terméked első és legutóbbi árát (a saját inflációd), és hogy mennyire tértek el a tervezett árak a kifizetettektől.',
        },
      ],
    },
    {
      id: 'manage',
      title: '11. Lista módosítása, elhagyása vagy törlése',
      blocks: [
        {
          list: [
            '**A név, a dátum vagy a pénznem módosítása**: Megosztás és beállítások → Beállítások (tulajdonos).',
            '**Valaki eltávolítása**: Megosztás és beállítások → Tagok → Eltávolítás (tulajdonos).',
            '**Kilépés egy listából**: Tagok → Kilépés a listából (tagok).',
            '**Lista törlése** (tulajdonos): Megosztás és beállítások → Lista törlése. A lista mindenkinél eltűnik, a meghívó linkjeivel, értesítéseivel és termékfotóival együtt. Az árak és termékek megmaradnak mindenki **Statisztikájában**, aki rajta volt, így a költéseid története nem változik.',
          ],
        },
      ],
    },
    {
      id: 'notifications',
      title: '12. Értesítések',
      blocks: [
        {
          list: [
            'A sávban lévő **csengő** megmutatja, mit csináltak a barátaid azokon a listákon, amelyeken rajta vagy („Ana megvette: Tej”, „Bob kihúzta: Chips”). Egy szám jelzi, hány új; koppints egy bejegyzésre a lista megnyitásához.',
            'Amíg az alkalmazás nyitva van, az új változások röviden a sarokban is felugranak.',
            'A csengőben pipáld be az **Akkor is értesíts, ha ez a lap a háttérben van** lehetőséget, és engedélyezd az értesítéseket: az eszközöd akkor is megmutatja őket, amíg az alkalmazás egy másik lapon vagy a háttérben nyitva van.',
            'Ha az alkalmazás be van zárva, semmit sem küldünk. Nyisd meg, és a csengő megmutatja, mit hagytál ki (legfeljebb 30 napra visszamenőleg).',
          ],
        },
        {
          p: 'Az **Összes törlése** kiüríti a csengőt; az értesítés melletti **✕** csak azt az egyet távolítja el. Mindkettő minden eszközödön érvényes.',
        },
      ],
    },
    {
      id: 'tips',
      title: '13. Tippek és kérdések',
      blocks: [
        {
          list: [
            '**Üzletenként eltérnek az árak?** Tedd fel a terméket üzletenként egyszer a listára; a statisztika ezután összehasonlítja az árakat.',
            '**Semmi sincs a Ma fülön?** A fül a következő tervezett listát mutatja; tervezz egyet mára az **Új lista** fülön.',
            '**Egy barátod nem tudja megnyitni a listát?** Fel kell iratkoznia a Közös bevásárlólistákra a DevQuake-en; a megosztás oldala jelzi, ha ez a helyzet.',
            '**A DevQuake-fiókod törlésekor** a listáid ahhoz a taghoz kerülnek, aki elsőként csatlakozott (vagy törlődnek, ha egyedül voltál), és a neved lekerül a termékekről.',
          ],
        },
      ],
    },
  ],
  questions: 'Kérdésed vagy ötleted van? Írj ide: {email}.',
  back: '← Vissza a listáidhoz',
};

export const MANUAL: Record<Locale, Manual> = { en, de, ro, hu };
