import type { Locale } from '@devquake/ui';

// The user manual (/help) in every language (ADR 0011). Inline markup: **bold**; {host} is a
// link to devquake.com. Every language has the same sections and blocks (checked by a test).

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
  /** {email} is the contact address. */
  questions: string;
  back: string;
}

const en: Manual = {
  metaTitle: 'User manual · Meal planner',
  metaDescription:
    'How to plan the week’s meals for your household: who eats, a suggested week from your cookbook, nutrition per day, one shopping list and reminders the evening before.',
  ogTitle: 'Meal planner: user manual',
  cta: 'Want to try it? The Meal planner is an app for DevQuake members. {link}, then subscribe to the app.',
  ctaLink: 'Create an account or sign in',
  kicker: 'Meal planner · User manual',
  title: 'How to plan the week’s meals',
  intro:
    'The Meal planner answers “what do we eat this week?” for a household. It works best with the Cookbook, which brings the recipes, their nutrition and ingredients. This manual walks you through it step by step.',
  contents: 'Contents',
  sections: [
    {
      id: 'start',
      title: '1. Getting started',
      blocks: [
        {
          steps: [
            'Sign in on {host} (or create an account and confirm your email).',
            'Open **Your account → Available projects** and **Subscribe** to “Meal planner” (and to “Cookbook” for recipes).',
            'Open the app and **create a household**, for example “Home”. You become its **planner**.',
            'Connect the **Cookbook** when the app offers it (once, on DevQuake).',
          ],
        },
      ],
    },
    {
      id: 'household',
      title: '2. The household',
      blocks: [
        {
          p: 'Under **Household**, add **who eats**: everyone at the table, with or without an account, each with a **portion** (a small child eats half, a big appetite one and a half). The portions decide how many servings are cooked.',
        },
        {
          list: [
            '**Diet for suggestions**: for example Mediterranean or vegetarian.',
            '**Allergens to avoid**: recipes with them never come up.',
            '**Dislikes**: words like “mushrooms”; suggestions leave out recipes with them in the name.',
            '**Targets** per person and day for energy and protein: a simple guide.',
          ],
        },
        {
          p: 'Invite people with a DevQuake account with an **invite link**. **Planners** change the household and suggest weeks; everyone can add, swap and tick meals.',
        },
      ],
    },
    {
      id: 'week',
      title: '3. Planning the week',
      blocks: [
        {
          list: [
            'Each day has **+ Add a meal**: choose breakfast, lunch, dinner or a snack, then **find a recipe** in your cookbook or **type a meal** (“pizza night”).',
            'The servings are filled in from who eats. Cook more on purpose and plan **leftovers** another day: leftovers need nothing to cook or buy.',
            'Tick a meal when it is **cooked**. Tap a recipe’s name to open it in the Cookbook, and come back with the bar at the top.',
            'Move between weeks with **Previous** and **Next**.',
          ],
        },
        {
          p: '**Suggest the week** (planners) fills the empty breakfasts, lunches or dinners with cookbook recipes that fit your diet, without your allergens and dislikes, none twice in the week.',
        },
        {
          p: 'A meal can have **several parts**: tap **+ part** to add another recipe (a soup and a main course) or a simple item with a quantity (bread, yogurt). From the Cookbook, **Plan this recipe** adds a recipe to the meal of that day, or starts one.',
        },
      ],
    },
    {
      id: 'nutrition',
      title: '4. Nutrition per day',
      blocks: [
        {
          p: 'Under each day: the energy and protein of one portion of each meal, against your targets. Typed-in meals have no nutrition.',
        },
        {
          tip: 'The numbers are approximate and the targets are simple guides, not medical advice.',
        },
      ],
    },
    {
      id: 'shopping',
      title: '5. One shopping list',
      blocks: [
        {
          p: 'With the shopping lists connected, **Week to a shopping list** adds everything the week needs in one step: every recipe’s ingredients for its meal’s servings, and the simple items as they are. The same ingredient is added up (two onions and one onion become three); leftovers are left out.',
        },
      ],
    },
    {
      id: 'saved',
      title: '6. Saved and public meals',
      blocks: [
        {
          p: 'Tap **Save this meal** on a planned meal to keep its parts as a **saved meal**, then add it to any day from **Add a meal → Saved meal** or from **Saved meals**.',
        },
        {
          list: [
            'Make a saved meal **public** to share it with everyone using the Meal planner. Its recipes must be public in your Cookbook or from its library, so others can open them.',
            'Others can **add it to their plan**, **recommend** it (like a “like”) and leave a **comment**; you get a notification and find the comment in your **messages** on DevQuake.',
            'Under **Saved meals → Community** you find everyone’s public meals, most recommended first.',
          ],
        },
      ],
    },
    {
      id: 'reminders',
      title: '7. Reminders',
      blocks: [
        {
          p: 'Give a meal a **reminder the evening before**, like “take the chicken out of the freezer”: everyone in the household gets it by email at 18:00 the day before, and as a notification.',
        },
      ],
    },
    {
      id: 'apps',
      title: '8. With your other apps',
      blocks: [
        {
          list: [
            '**Cookbook**: recipes, servings, nutrition and ingredients.',
            '**Shopping lists**: the week as one list.',
            '**Family planner**: connected, the planned meals show in the family calendar.',
          ],
        },
        {
          p: 'Connections are made once on DevQuake (**Works with** at the bottom of every page) and can be removed under **Account → Connected apps**.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '9. Your data',
      blocks: [
        {
          p: 'Only the household’s members see its plan. If you delete your account or unsubscribe, a household you created passes to another planner or member, or is deleted with its plan if you were alone.',
        },
      ],
    },
  ],
  questions: 'Questions or ideas? Write to {email}.',
  back: '← Back to the meal planner',
};

const de: Manual = {
  metaTitle: 'Benutzerhandbuch · Essensplaner',
  metaDescription:
    'So planst du die Mahlzeiten der Woche für deinen Haushalt: wer mitisst, eine vorgeschlagene Woche aus deinem Kochbuch, Nährwerte pro Tag, eine Einkaufsliste und Erinnerungen am Vorabend.',
  ogTitle: 'Essensplaner: Benutzerhandbuch',
  cta: 'Lust, es auszuprobieren? Der Essensplaner ist eine App für DevQuake-Mitglieder. {link} und abonniere dann die App.',
  ctaLink: 'Konto erstellen oder anmelden',
  kicker: 'Essensplaner · Benutzerhandbuch',
  title: 'So planst du die Mahlzeiten der Woche',
  intro:
    'Der Essensplaner beantwortet für einen Haushalt die Frage „Was essen wir diese Woche?“. Am besten mit dem Kochbuch, das Rezepte, Nährwerte und Zutaten mitbringt. Dieses Handbuch führt dich Schritt für Schritt durch die App.',
  contents: 'Inhalt',
  sections: [
    {
      id: 'start',
      title: '1. Erste Schritte',
      blocks: [
        {
          steps: [
            'Melde dich bei {host} an (oder erstelle ein Konto und bestätige deine E-Mail).',
            'Öffne **Dein Konto → Verfügbare Projekte** und **abonniere** „Essensplaner“ (und „Kochbuch“ für Rezepte).',
            'Öffne die App und **lege einen Haushalt an**, zum Beispiel „Zuhause“. Du wirst sein **Planer**.',
            'Verbinde das **Kochbuch**, wenn die App es anbietet (einmal, bei DevQuake).',
          ],
        },
      ],
    },
    {
      id: 'household',
      title: '2. Der Haushalt',
      blocks: [
        {
          p: 'Trage unter **Haushalt** ein, **wer mitisst**: alle am Tisch, mit oder ohne Konto, jeweils mit einer **Portion** (ein kleines Kind isst eine halbe, großer Hunger anderthalb). Die Portionen bestimmen, wie viele Portionen gekocht werden.',
        },
        {
          list: [
            '**Ernährung für Vorschläge**: zum Beispiel mediterran oder vegetarisch.',
            '**Allergene meiden**: Rezepte damit erscheinen nie.',
            '**Abneigungen**: Wörter wie „Pilze“; Vorschläge lassen Rezepte mit ihnen im Namen weg.',
            '**Ziele** pro Person und Tag für Energie und Eiweiß: ein einfacher Richtwert.',
          ],
        },
        {
          p: 'Lade Personen mit DevQuake-Konto mit einem **Einladungslink** ein. **Planer** ändern den Haushalt und schlagen Wochen vor; alle können Mahlzeiten hinzufügen, tauschen und abhaken.',
        },
      ],
    },
    {
      id: 'week',
      title: '3. Die Woche planen',
      blocks: [
        {
          list: [
            'Jeder Tag hat **+ Mahlzeit hinzufügen**: Frühstück, Mittag-, Abendessen oder Snack wählen, dann ein **Rezept im Kochbuch finden** oder eine **Mahlzeit eintippen** („Pizzaabend“).',
            'Die Portionen werden aus den Mitessenden berechnet. Koch absichtlich mehr und plane an einem anderen Tag **Reste**: Reste brauchen nichts zu kochen oder zu kaufen.',
            'Hake eine Mahlzeit ab, wenn sie **gekocht** ist. Tippe auf den Namen eines Rezepts, um es im Kochbuch zu öffnen, und komm mit der Leiste oben zurück.',
            'Wechsle die Woche mit **Vorige** und **Nächste**.',
          ],
        },
        {
          p: '**Woche vorschlagen** (Planer) füllt die leeren Frühstücke, Mittag- oder Abendessen mit Kochbuch-Rezepten passend zu eurer Ernährung, ohne eure Allergene und Abneigungen, keines doppelt in der Woche.',
        },
        {
          p: 'Eine Mahlzeit kann **mehrere Teile** haben: Tippe auf **+ Teil**, um ein weiteres Rezept (Suppe und Hauptgericht) oder einen einfachen Artikel mit Menge (Brot, Joghurt) hinzuzufügen. Im Kochbuch setzt **Dieses Rezept planen** ein Rezept in die Mahlzeit dieses Tages oder beginnt eine neue.',
        },
      ],
    },
    {
      id: 'nutrition',
      title: '4. Nährwerte pro Tag',
      blocks: [
        {
          p: 'Unter jedem Tag: Energie und Eiweiß einer Portion jeder Mahlzeit, verglichen mit euren Zielen. Eingetippte Mahlzeiten haben keine Nährwerte.',
        },
        {
          tip: 'Die Zahlen sind ungefähr und die Ziele einfache Richtwerte, keine medizinische Beratung.',
        },
      ],
    },
    {
      id: 'shopping',
      title: '5. Eine Einkaufsliste',
      blocks: [
        {
          p: 'Mit verbundenen Einkaufslisten setzt **Woche auf eine Einkaufsliste** mit einem Schritt alles auf eine Liste, was die Woche braucht: die Zutaten jedes Rezepts für die Portionen seiner Mahlzeit und die einfachen Artikel, wie sie sind. Gleiche Zutaten werden zusammengezählt (zwei Zwiebeln und eine Zwiebel werden drei); Reste bleiben weg.',
        },
      ],
    },
    {
      id: 'saved',
      title: '6. Gespeicherte und öffentliche Mahlzeiten',
      blocks: [
        {
          p: 'Tippe bei einer geplanten Mahlzeit auf **Diese Mahlzeit speichern**, um ihre Teile als **gespeicherte Mahlzeit** zu behalten, und füge sie über **Mahlzeit hinzufügen → Gespeicherte Mahlzeit** oder unter **Gespeicherte Mahlzeiten** zu jedem Tag hinzu.',
        },
        {
          list: [
            'Mach eine gespeicherte Mahlzeit **öffentlich**, um sie mit allen im Essensplaner zu teilen. Ihre Rezepte müssen in deinem Kochbuch öffentlich sein oder aus dessen Bibliothek stammen, damit andere sie öffnen können.',
            'Andere können sie **zu ihrem Plan hinzufügen**, **empfehlen** (wie ein „Gefällt mir“) und **kommentieren**; du bekommst eine Benachrichtigung und findest den Kommentar in deinen **Nachrichten** auf DevQuake.',
            'Unter **Gespeicherte Mahlzeiten → Community** findest du die öffentlichen Mahlzeiten aller, die meistempfohlenen zuerst.',
          ],
        },
      ],
    },
    {
      id: 'reminders',
      title: '7. Erinnerungen',
      blocks: [
        {
          p: 'Gib einer Mahlzeit eine **Erinnerung am Vorabend**, wie „Hähnchen aus dem Gefrierfach nehmen“: Alle im Haushalt bekommen sie am Vortag um 18:00 per E-Mail und als Benachrichtigung.',
        },
      ],
    },
    {
      id: 'apps',
      title: '8. Mit deinen anderen Apps',
      blocks: [
        {
          list: [
            '**Kochbuch**: Rezepte, Portionen, Nährwerte und Zutaten.',
            '**Einkaufslisten**: die Woche als eine Liste.',
            '**Familienplaner**: Verbunden erscheinen die geplanten Mahlzeiten im Familienkalender.',
          ],
        },
        {
          p: 'Verbindungen werden einmal bei DevQuake hergestellt (**Arbeitet mit** unten auf jeder Seite) und lassen sich unter **Konto → Verbundene Apps** wieder trennen.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '9. Deine Daten',
      blocks: [
        {
          p: 'Den Plan eines Haushalts sehen nur seine Mitglieder. Löschst du dein Konto oder kündigst du das Abo, geht ein von dir angelegter Haushalt an einen anderen Planer oder ein Mitglied über oder wird mit seinem Plan gelöscht, wenn du allein warst.',
        },
      ],
    },
  ],
  questions: 'Fragen oder Ideen? Schreib an {email}.',
  back: '← Zurück zum Essensplaner',
};

const ro: Manual = {
  metaTitle: 'Manual de utilizare · Planificator de mese',
  metaDescription:
    'Cum planifici mesele săptămânii pentru gospodăria ta: cine mănâncă, o săptămână sugerată din cartea de bucate, valori pe zi, o singură listă de cumpărături și mementouri cu o seară înainte.',
  ogTitle: 'Planificator de mese: manual de utilizare',
  cta: 'Vrei să-l încerci? Planificatorul de mese este o aplicație pentru membrii DevQuake. {link}, apoi abonează-te la aplicație.',
  ctaLink: 'Creează un cont sau conectează-te',
  kicker: 'Planificator de mese · Manual de utilizare',
  title: 'Cum planifici mesele săptămânii',
  intro:
    'Planificatorul de mese răspunde la întrebarea „ce mâncăm săptămâna asta?” pentru o gospodărie. Merge cel mai bine cu Cartea de bucate, care aduce rețetele, valorile nutritive și ingredientele. Acest manual te ghidează pas cu pas.',
  contents: 'Cuprins',
  sections: [
    {
      id: 'start',
      title: '1. Primii pași',
      blocks: [
        {
          steps: [
            'Conectează-te pe {host} (sau creează un cont și confirmă-ți e-mailul).',
            'Deschide **Contul tău → Proiecte disponibile** și **abonează-te** la „Planificator de mese” (și la „Carte de bucate” pentru rețete).',
            'Deschide aplicația și **creează o gospodărie**, de exemplu „Acasă”. Devii **planificatorul** ei.',
            'Conectează **Cartea de bucate** când aplicația ți-o propune (o singură dată, pe DevQuake).',
          ],
        },
      ],
    },
    {
      id: 'household',
      title: '2. Gospodăria',
      blocks: [
        {
          p: 'La **Gospodăria**, adaugă **cine mănâncă**: toți cei de la masă, cu sau fără cont, fiecare cu o **porție** (un copil mic mănâncă jumătate, o poftă mare una și jumătate). Porțiile decid câte porții se gătesc.',
        },
        {
          list: [
            '**Dieta pentru sugestii**: de exemplu mediteraneeană sau vegetariană.',
            '**Alergeni de evitat**: rețetele cu ei nu apar niciodată.',
            '**Ce nu vă place**: cuvinte ca „ciuperci”; sugestiile lasă deoparte rețetele care le au în nume.',
            '**Ținte** de persoană pe zi pentru energie și proteine: un reper simplu.',
          ],
        },
        {
          p: 'Invită persoane cu cont DevQuake printr-un **link de invitație**. **Planificatorii** schimbă gospodăria și sugerează săptămâni; toți pot adăuga, schimba și bifa mese.',
        },
      ],
    },
    {
      id: 'week',
      title: '3. Planificarea săptămânii',
      blocks: [
        {
          list: [
            'Fiecare zi are **+ Adaugă o masă**: alege mic dejun, prânz, cină sau gustare, apoi **caută o rețetă** în cartea de bucate sau **scrie o masă** („seară de pizza”).',
            'Porțiile se completează după cine mănâncă. Gătește intenționat mai mult și planifică **resturi** în altă zi: resturile nu cer nimic de gătit sau de cumpărat.',
            'Bifează o masă când e **gătită**. Apasă pe numele unei rețete ca s-o deschizi în Cartea de bucate și revino cu bara de sus.',
            'Treci de la o săptămână la alta cu **Anterioara** și **Următoarea**.',
          ],
        },
        {
          p: '**Sugerează săptămâna** (planificatorii) completează micul dejun, prânzul sau cina goale cu rețete potrivite dietei, fără alergenii și ce nu vă place, fără repetări în săptămână.',
        },
        {
          p: 'O masă poate avea **mai multe părți**: apasă **+ parte** ca să adaugi altă rețetă (o supă și un fel principal) sau un produs simplu cu cantitate (pâine, iaurt). Din Cartea de bucate, **Planifică această rețetă** pune o rețetă în masa din acea zi sau începe una nouă.',
        },
      ],
    },
    {
      id: 'nutrition',
      title: '4. Valori nutritive pe zi',
      blocks: [
        {
          p: 'Sub fiecare zi: energia și proteinele unei porții din fiecare masă, față de țintele voastre. Mesele scrise de mână nu au valori nutritive.',
        },
        {
          tip: 'Cifrele sunt aproximative, iar țintele sunt repere simple, nu sfaturi medicale.',
        },
      ],
    },
    {
      id: 'shopping',
      title: '5. O singură listă de cumpărături',
      blocks: [
        {
          p: 'Cu listele de cumpărături conectate, **Săptămâna pe o listă de cumpărături** pune dintr-un pas tot ce îi trebuie săptămânii: ingredientele fiecărei rețete pentru porțiile mesei ei și produsele simple așa cum sunt. Același ingredient se adună (două cepe și o ceapă devin trei); resturile rămân deoparte.',
        },
      ],
    },
    {
      id: 'saved',
      title: '6. Mese salvate și publice',
      blocks: [
        {
          p: 'Apasă **Salvează această masă** la o masă planificată ca să-i păstrezi părțile ca **masă salvată**, apoi adaug-o în orice zi din **Adaugă o masă → Masă salvată** sau din **Mese salvate**.',
        },
        {
          list: [
            'Fă o masă salvată **publică** ca s-o împarți cu toți cei din Planificatorul de mese. Rețetele ei trebuie să fie publice în Cartea ta de bucate sau din biblioteca ei, ca alții să le poată deschide.',
            'Ceilalți o pot **adăuga în planul lor**, **recomanda** (ca un „like”) și **comenta**; primești o notificare și găsești comentariul în **mesajele** tale pe DevQuake.',
            'La **Mese salvate → Comunitate** găsești mesele publice ale tuturor, cele mai recomandate primele.',
          ],
        },
      ],
    },
    {
      id: 'reminders',
      title: '7. Mementouri',
      blocks: [
        {
          p: 'Dă unei mese un **memento cu o seară înainte**, ca „scoate puiul din congelator”: toți din gospodărie îl primesc pe e-mail la 18:00 cu o zi înainte și ca notificare.',
        },
      ],
    },
    {
      id: 'apps',
      title: '8. Cu celelalte aplicații ale tale',
      blocks: [
        {
          list: [
            '**Carte de bucate**: rețete, porții, valori nutritive și ingrediente.',
            '**Liste de cumpărături**: săptămâna ca o singură listă.',
            '**Planificatorul de familie**: conectat, mesele planificate apar în calendarul familiei.',
          ],
        },
        {
          p: 'Conexiunile se fac o singură dată pe DevQuake (**Funcționează cu** în josul fiecărei pagini) și se pot elimina din **Cont → Aplicații conectate**.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '9. Datele tale',
      blocks: [
        {
          p: 'Planul unei gospodării îl văd doar membrii ei. Dacă îți ștergi contul sau renunți la abonament, o gospodărie creată de tine trece la alt planificator sau membru ori se șterge cu planul ei dacă erai singur.',
        },
      ],
    },
  ],
  questions: 'Întrebări sau idei? Scrie-ne la {email}.',
  back: '← Înapoi la planificatorul de mese',
};

const hu: Manual = {
  metaTitle: 'Felhasználói útmutató · Étkezéstervező',
  metaDescription:
    'Így tervezd meg a háztartás heti étkezéseit: kik esznek, javasolt hét a szakácskönyvből, napi tápérték, egyetlen bevásárlólista és emlékeztető előző este.',
  ogTitle: 'Étkezéstervező: felhasználói útmutató',
  cta: 'Kipróbálnád? Az Étkezéstervező a DevQuake-tagok alkalmazása. {link}, majd fizess elő az alkalmazásra.',
  ctaLink: 'Hozz létre fiókot vagy jelentkezz be',
  kicker: 'Étkezéstervező · Felhasználói útmutató',
  title: 'Így tervezd meg a hét étkezéseit',
  intro:
    'Az Étkezéstervező egy háztartás kérdésére felel: „mit eszünk a héten?”. A Szakácskönyvvel működik a legjobban, ami hozza a recepteket, a tápértéket és a hozzávalókat. Ez az útmutató lépésről lépésre végigvezet.',
  contents: 'Tartalom',
  sections: [
    {
      id: 'start',
      title: '1. Első lépések',
      blocks: [
        {
          steps: [
            'Jelentkezz be a {host} oldalon (vagy hozz létre fiókot, és erősítsd meg az e-mail-címed).',
            'Nyisd meg a **Fiókod → Elérhető projektek** részt, és **fizess elő** az „Étkezéstervező” (és a receptekhez a „Szakácskönyv”) alkalmazásra.',
            'Nyisd meg az alkalmazást, és **hozz létre egy háztartást**, például „Otthon”. Te leszel a **tervezője**.',
            'Kapcsold össze a **Szakácskönyvet**, amikor az alkalmazás felajánlja (egyszer, a DevQuake-en).',
          ],
        },
      ],
    },
    {
      id: 'household',
      title: '2. A háztartás',
      blocks: [
        {
          p: 'A **Háztartás** részben add meg, **kik esznek**: mindenki az asztalnál, fiókkal vagy anélkül, mindegyik egy **adaggal** (egy kisgyerek felet eszik, a nagy étvágyú másfelet). Az adagok döntik el, hány adag fő.',
        },
        {
          list: [
            '**Étrend a javaslatokhoz**: például mediterrán vagy vegetáriánus.',
            '**Kerülendő allergének**: az ilyen receptek soha nem jönnek elő.',
            '**Nem kedvelt ételek**: szavak, mint „gomba”; a javaslatok kihagyják a nevükben ezeket tartalmazó recepteket.',
            '**Célok** fejenként naponta energiára és fehérjére: egyszerű iránymutatás.',
          ],
        },
        {
          p: 'Hívd meg a DevQuake-fiókkal rendelkezőket egy **meghívó linkkel**. A **tervezők** módosítják a háztartást és heteket javasolnak; mindenki hozzáadhat, cserélhet és kipipálhat étkezéseket.',
        },
      ],
    },
    {
      id: 'week',
      title: '3. A hét megtervezése',
      blocks: [
        {
          list: [
            'Minden napnál ott a **+ Étkezés hozzáadása**: válassz reggelit, ebédet, vacsorát vagy nasit, majd **keress receptet** a szakácskönyvedben, vagy **írj be egy étkezést** („pizzaest”).',
            'Az adagok az evők alapján töltődnek ki. Főzz szándékosan többet, és tervezz **maradékot** egy másik napra: a maradékhoz nem kell főzni vagy vásárolni.',
            'Pipáld ki az étkezést, ha **megfőzted**. Koppints egy recept nevére, hogy megnyisd a Szakácskönyvben, és a felső sávval gyere vissza.',
            'Lapozz a hetek között az **Előző** és **Következő** gombbal.',
          ],
        },
        {
          p: 'A **Hét javaslata** (tervezőknek) kitölti az üres reggeliket, ebédeket vagy vacsorákat az étrendetekhez illő receptekkel, allergének és nem kedvelt ételek nélkül, a héten ismétlés nélkül.',
        },
        {
          p: 'Egy étkezésnek **több része** lehet: a **+ rész** gombbal újabb receptet (leves és főétel) vagy egyszerű tételt adhatsz hozzá mennyiséggel (kenyér, joghurt). A Szakácskönyvből a **Recept betervezése** az adott nap étkezéséhez adja a receptet, vagy újat kezd.',
        },
      ],
    },
    {
      id: 'nutrition',
      title: '4. Napi tápérték',
      blocks: [
        {
          p: 'Minden nap alatt: az étkezések egy-egy adagjának energiája és fehérjéje a céljaitokhoz mérve. A beírt étkezéseknek nincs tápértéke.',
        },
        {
          tip: 'A számok hozzávetőlegesek, a célok egyszerű iránymutatások, nem orvosi tanácsok.',
        },
      ],
    },
    {
      id: 'shopping',
      title: '5. Egyetlen bevásárlólista',
      blocks: [
        {
          p: 'Összekapcsolt bevásárlólistákkal **A hét bevásárlólistára** egy lépésben listára tesz mindent, ami a hétre kell: minden recept hozzávalóit az étkezése adagjaira, és az egyszerű tételeket úgy, ahogy vannak. Az azonos hozzávalók összeadódnak (két hagyma meg egy hagyma három lesz); a maradékok kimaradnak.',
        },
      ],
    },
    {
      id: 'saved',
      title: '6. Mentett és nyilvános étkezések',
      blocks: [
        {
          p: 'Egy megtervezett étkezésnél koppints az **Étkezés mentése** gombra, hogy a részeit **mentett étkezésként** megtartsd, majd az **Étkezés hozzáadása → Mentett étkezés** vagy a **Mentett étkezések** oldalról bármely napra beteheted.',
        },
        {
          list: [
            'Tedd **nyilvánossá** a mentett étkezést, hogy az Étkezéstervező minden használójával megoszd. A receptjeinek nyilvánosnak kell lenniük a Szakácskönyvedben, vagy a könyvtárából valónak, hogy mások megnyithassák.',
            'Mások **a tervükhöz adhatják**, **ajánlhatják** (mint egy „lájkot”) és **hozzászólhatnak**; értesítést kapsz, és a hozzászólást megtalálod az **üzeneteid** között a DevQuake-en.',
            'A **Mentett étkezések → Közösség** fülön találod mindenki nyilvános étkezéseit, a legtöbbet ajánlottak elöl.',
          ],
        },
      ],
    },
    {
      id: 'reminders',
      title: '7. Emlékeztetők',
      blocks: [
        {
          p: 'Adj egy étkezésnek **emlékeztetőt előző estére**, például „vedd ki a csirkét a fagyasztóból”: a háztartás minden tagja megkapja előző nap 18:00-kor e-mailben és értesítésként.',
        },
      ],
    },
    {
      id: 'apps',
      title: '8. A többi alkalmazásoddal',
      blocks: [
        {
          list: [
            '**Szakácskönyv**: receptek, adagok, tápérték és hozzávalók.',
            '**Bevásárlólisták**: a hét egyetlen listán.',
            '**Családi tervező**: összekapcsolva a megtervezett étkezések megjelennek a családi naptárban.',
          ],
        },
        {
          p: 'A kapcsolatot egyszer kell létrehozni a DevQuake-en (**Működik ezekkel** minden oldal alján), és a **Fiók → Kapcsolt alkalmazások** résznél bonthatod.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '9. Az adataid',
      blocks: [
        {
          p: 'Egy háztartás tervét csak a tagjai látják. Ha törlöd a fiókodat vagy lemondod az előfizetést, az általad létrehozott háztartás egy másik tervezőhöz vagy taghoz kerül, vagy a tervével együtt törlődik, ha egyedül voltál benne.',
        },
      ],
    },
  ],
  questions: 'Kérdésed vagy ötleted van? Írj nekünk: {email}.',
  back: '← Vissza az étkezéstervezőhöz',
};

export const MANUAL: Record<Locale, Manual> = { en, de, ro, hu };
