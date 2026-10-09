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
  metaTitle: 'User manual · Cookbook',
  metaDescription:
    'How to use the Cookbook: scale recipes for any number of people, read nutrition and allergens, cook step by step with timers and a voice, and write and share your own recipes.',
  ogTitle: 'Cookbook: user manual',
  cta: 'Want to try it? The Cookbook is an app for DevQuake members. {link}, then subscribe to the app.',
  ctaLink: 'Create an account or sign in',
  kicker: 'Cookbook · User manual',
  title: 'How to cook with the Cookbook',
  intro:
    'The Cookbook has recipes that adapt to the people at the table: choose the servings and every quantity and the nutrition per portion follow. This manual walks you through it step by step.',
  contents: 'Contents',
  sections: [
    {
      id: 'start',
      title: '1. Getting started',
      blocks: [
        {
          steps: [
            'Sign in on {host} (or create an account and confirm your email).',
            'Open **Your account → Available projects** and **Subscribe** to “Cookbook”.',
            'Open the app: the **Library** has DevQuake’s starter recipes; **My recipes**, **Shared with me** and **Favourites** are yours.',
          ],
        },
        {
          p: 'Search by name, and filter by **diet** and **time** (for example vegetarian dishes ready in 30 minutes).',
        },
      ],
    },
    {
      id: 'servings',
      title: '2. Servings and units',
      blocks: [
        {
          p: 'On a recipe, tap **−** and **+** to choose the servings. Every quantity is recalculated with kitchen sense:',
        },
        {
          list: [
            '**Eggs, pieces and cans stay whole**: never half an egg.',
            '**Salt and spices grow less** than the rest, so a big pot is not over-seasoned.',
            'Some ingredients **stay the same** (one bay leaf, oil for the pan).',
            'Quantities are rounded: grams to 5 above 100, spoons to quarters.',
          ],
        },
        {
          p: 'Switch between **Metric** and **Imperial** (ounces, pounds, fluid ounces); the app remembers your choice.',
        },
      ],
    },
    {
      id: 'nutrition',
      title: '3. Nutrition, diets and allergens',
      blocks: [
        {
          p: 'The panel **Per portion** shows energy, protein, carbohydrates, fat, fibre and salt, worked out from the ingredients (approximate values from open food databases).',
        },
        {
          list: [
            '**Fits** shows the diets with the reason, for example “28 g protein per portion (at least 25 g)”. High protein, lower carb and quick are worked out from the numbers.',
            'Diets the author marked are shown only when the ingredients agree: a “vegetarian” dish with chicken loses the tag.',
            '**Allergens** lists the 14 EU allergens found in the ingredients.',
          ],
        },
        {
          tip: 'Diet tags are not medical advice. With an allergy or a medical condition, check every ingredient and the packaging.',
        },
      ],
    },
    {
      id: 'cook',
      title: '4. Cooking mode',
      blocks: [
        {
          p: 'Tap **Start cooking**: one step per screen in big text, and the screen stays on.',
        },
        {
          list: [
            'Steps with a time have a **timer**: start, pause, reset; it beeps and vibrates when the time is up.',
            'Tap **Read the steps aloud** and each step is read in your language when you move on.',
            'Use **Next** and **Back**, or the arrow keys on a keyboard.',
          ],
        },
      ],
    },
    {
      id: 'own',
      title: '5. Your own recipes',
      blocks: [
        {
          p: 'Writing a recipe takes four short steps, and the editor helps on each:',
        },
        {
          list: [
            '**Basics**: the name, for how many, preparation and cooking time, and the **equipment** (tap a suggestion such as pan or oven).',
            '**Ingredients**: quantity, unit and name, and **how to prepare it** (chopped, grated). The editor offers to link each one to the nutrition table.',
            '**Steps**: one action per step, with its **stage** (prepare, cook, serve). The ingredients a step uses are found in its text (tap to change), and a time in the text (“20 minutes”) offers a timer.',
            '**Check**: a checklist of what others need to cook it. The required items allow it to be made public; the rest are tips.',
          ],
        },
        {
          p: 'Your recipes are **private**. A **share link** shows one to people you choose; a **public** recipe is for everyone using the Cookbook.',
        },
        {
          p: 'A **public link** (on the recipe’s page) lets anyone open the recipe, also without a DevQuake account: share it on Facebook, WhatsApp, Pinterest and more. It shows the recipe, its photo and your name, search engines do not list it, and **Stop the public link** turns it off.',
        },
      ],
    },
    {
      id: 'community',
      title: '6. Public recipes, recommendations and comments',
      blocks: [
        {
          p: 'Make a recipe **public** on its page (or when saving it) once the required checklist items are done. It appears under **Community** for everyone using the Cookbook, most recommended first.',
        },
        {
          list: [
            '**Recommend** a recipe you liked, like a “like”; tap again to take it back. You cannot recommend your own.',
            'Leave a **comment** if you want. The author gets a notification and finds it in their **messages** on DevQuake (Account → Messages), with the recipe, the date and your words; they also see it under **Comments** in the app.',
            'Every **100 recommendations** of a public recipe earn its author **one NPS point**.',
          ],
        },
        {
          tip: '**Make private** hides the recipe again; its recommendations and comments are kept for when it is public again.',
        },
      ],
    },
    {
      id: 'apps',
      title: '7. With your other apps',
      blocks: [
        {
          list: [
            '**Shopping lists**: connected, tick what you already have and put the rest of the ingredients, for the servings you chose, on a shopping list in one step.',
            '**Meal planner**: it plans your week with recipes from your cookbook and turns them into one shopping list.',
          ],
        },
        {
          p: 'Connections are made once on DevQuake (**Works with** at the bottom of every page) and can be removed under **Account → Connected apps**.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '8. Your data',
      blocks: [
        {
          p: 'If you delete your account or unsubscribe, your recipes, photos, share links and favourites are deleted.',
        },
      ],
    },
  ],
  questions: 'Questions or ideas? Write to {email}.',
  back: '← Back to the recipes',
};

const de: Manual = {
  metaTitle: 'Benutzerhandbuch · Kochbuch',
  metaDescription:
    'So nutzt du das Kochbuch: Rezepte für beliebig viele Personen umrechnen, Nährwerte und Allergene lesen, Schritt für Schritt mit Timern und Stimme kochen und eigene Rezepte schreiben und teilen.',
  ogTitle: 'Kochbuch: Benutzerhandbuch',
  cta: 'Lust, es auszuprobieren? Das Kochbuch ist eine App für DevQuake-Mitglieder. {link} und abonniere dann die App.',
  ctaLink: 'Konto erstellen oder anmelden',
  kicker: 'Kochbuch · Benutzerhandbuch',
  title: 'So kochst du mit dem Kochbuch',
  intro:
    'Das Kochbuch hat Rezepte, die sich nach den Leuten am Tisch richten: Portionen wählen, und jede Menge und die Nährwerte pro Portion passen sich an. Dieses Handbuch führt dich Schritt für Schritt durch die App.',
  contents: 'Inhalt',
  sections: [
    {
      id: 'start',
      title: '1. Erste Schritte',
      blocks: [
        {
          steps: [
            'Melde dich bei {host} an (oder erstelle ein Konto und bestätige deine E-Mail).',
            'Öffne **Dein Konto → Verfügbare Projekte** und **abonniere** „Kochbuch“.',
            'Öffne die App: Die **Bibliothek** enthält die Startrezepte von DevQuake; **Meine Rezepte**, **Mit mir geteilt** und **Favoriten** gehören dir.',
          ],
        },
        {
          p: 'Suche nach Namen und filtere nach **Ernährung** und **Zeit** (zum Beispiel vegetarische Gerichte, die in 30 Minuten fertig sind).',
        },
      ],
    },
    {
      id: 'servings',
      title: '2. Portionen und Einheiten',
      blocks: [
        {
          p: 'Tippe bei einem Rezept auf **−** und **+**, um die Portionen zu wählen. Jede Menge wird mit Küchenverstand neu berechnet:',
        },
        {
          list: [
            '**Eier, Stücke und Dosen bleiben ganz**: nie ein halbes Ei.',
            '**Salz und Gewürze wachsen weniger** als der Rest, damit ein großer Topf nicht überwürzt ist.',
            'Manche Zutaten **bleiben gleich** (ein Lorbeerblatt, Öl für die Pfanne).',
            'Mengen werden gerundet: Gramm über 100 auf 5, Löffel auf Viertel.',
          ],
        },
        {
          p: 'Wechsle zwischen **Metrisch** und **Imperial** (Unzen, Pfund, Flüssigunzen); die App merkt sich deine Wahl.',
        },
      ],
    },
    {
      id: 'nutrition',
      title: '3. Nährwerte, Ernährung und Allergene',
      blocks: [
        {
          p: 'Das Feld **Pro Portion** zeigt Energie, Eiweiß, Kohlenhydrate, Fett, Ballaststoffe und Salz, berechnet aus den Zutaten (ungefähre Werte aus offenen Lebensmitteldatenbanken).',
        },
        {
          list: [
            '**Passt zu** zeigt die Ernährungsformen mit Begründung, zum Beispiel „28 g Eiweiß pro Portion (mindestens 25 g)“. Eiweißreich, kohlenhydratarm und schnell werden aus den Zahlen berechnet.',
            'Vom Autor markierte Ernährungsformen erscheinen nur, wenn die Zutaten passen: Ein „vegetarisches“ Gericht mit Hähnchen verliert die Markierung.',
            '**Allergene** listet die 14 EU-Allergene, die in den Zutaten stecken.',
          ],
        },
        {
          tip: 'Ernährungsformen sind keine medizinische Beratung. Bei einer Allergie oder Erkrankung prüfe jede Zutat und die Verpackung.',
        },
      ],
    },
    {
      id: 'cook',
      title: '4. Kochmodus',
      blocks: [
        {
          p: 'Tippe auf **Kochen starten**: ein Schritt pro Bildschirm in großer Schrift, und der Bildschirm bleibt an.',
        },
        {
          list: [
            'Schritte mit einer Zeit haben einen **Timer**: Start, Pause, Zurücksetzen; er piept und vibriert, wenn die Zeit um ist.',
            'Tippe auf **Schritte vorlesen**, und jeder Schritt wird beim Weiterblättern in deiner Sprache vorgelesen.',
            'Nutze **Weiter** und **Zurück** oder die Pfeiltasten einer Tastatur.',
          ],
        },
      ],
    },
    {
      id: 'own',
      title: '5. Eigene Rezepte',
      blocks: [
        {
          p: 'Ein Rezept zu schreiben geht in vier kurzen Schritten, und der Editor hilft bei jedem:',
        },
        {
          list: [
            '**Grunddaten**: Name, für wie viele, Vorbereitungs- und Kochzeit und die **Geräte** (tippe auf einen Vorschlag wie Pfanne oder Ofen).',
            '**Zutaten**: Menge, Einheit und Name und **wie man sie vorbereitet** (gehackt, gerieben). Der Editor schlägt vor, jede mit der Nährwerttabelle zu verknüpfen.',
            '**Schritte**: eine Handlung pro Schritt, mit ihrer **Phase** (vorbereiten, kochen, servieren). Die verwendeten Zutaten werden im Text erkannt (tippen zum Ändern), und eine Zeit im Text („20 Minuten“) bietet einen Timer an.',
            '**Prüfen**: eine Checkliste dessen, was andere zum Nachkochen brauchen. Die nötigen Punkte erlauben die Veröffentlichung; der Rest sind Tipps.',
          ],
        },
        {
          p: 'Deine Rezepte sind **privat**. Ein **Teilen-Link** zeigt eines ausgewählten Personen; ein **öffentliches** Rezept ist für alle im Kochbuch.',
        },
        {
          p: 'Ein **öffentlicher Link** (auf der Seite des Rezepts) lässt jeden das Rezept öffnen, auch ohne DevQuake-Konto: Teile es auf Facebook, WhatsApp, Pinterest und mehr. Er zeigt das Rezept, sein Foto und deinen Namen, Suchmaschinen listen ihn nicht, und **Öffentlichen Link abschalten** schaltet ihn ab.',
        },
      ],
    },
    {
      id: 'community',
      title: '6. Öffentliche Rezepte, Empfehlungen und Kommentare',
      blocks: [
        {
          p: 'Mach ein Rezept auf seiner Seite (oder beim Speichern) **öffentlich**, sobald die nötigen Punkte der Checkliste erledigt sind. Es erscheint unter **Community** für alle im Kochbuch, die meistempfohlenen zuerst.',
        },
        {
          list: [
            '**Empfiehl** ein Rezept, das dir gefallen hat, wie ein „Gefällt mir“; noch einmal tippen nimmt es zurück. Eigene Rezepte kannst du nicht empfehlen.',
            'Schreib, wenn du willst, einen **Kommentar**. Der Autor bekommt eine Benachrichtigung und findet ihn in seinen **Nachrichten** auf DevQuake (Konto → Nachrichten), mit Rezept, Datum und deinen Worten; in der App auch unter **Kommentare**.',
            'Alle **100 Empfehlungen** eines öffentlichen Rezepts bringen seinem Autor **einen NPS-Punkt**.',
          ],
        },
        {
          tip: '**Privat machen** verbirgt das Rezept wieder; Empfehlungen und Kommentare bleiben für die nächste Veröffentlichung erhalten.',
        },
      ],
    },
    {
      id: 'apps',
      title: '7. Mit deinen anderen Apps',
      blocks: [
        {
          list: [
            '**Einkaufslisten**: Verbunden hakst du ab, was du schon hast, und setzt die übrigen Zutaten für die gewählten Portionen mit einem Schritt auf eine Einkaufsliste.',
            '**Essensplaner**: Er plant deine Woche mit Rezepten aus deinem Kochbuch und macht daraus eine Einkaufsliste.',
          ],
        },
        {
          p: 'Verbindungen werden einmal bei DevQuake hergestellt (**Arbeitet mit** unten auf jeder Seite) und lassen sich unter **Konto → Verbundene Apps** wieder trennen.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '8. Deine Daten',
      blocks: [
        {
          p: 'Löschst du dein Konto oder kündigst du das Abo, werden deine Rezepte, Fotos, Teilen-Links und Favoriten gelöscht.',
        },
      ],
    },
  ],
  questions: 'Fragen oder Ideen? Schreib an {email}.',
  back: '← Zurück zu den Rezepten',
};

const ro: Manual = {
  metaTitle: 'Manual de utilizare · Carte de bucate',
  metaDescription:
    'Cum folosești Cartea de bucate: rețete pentru oricâte persoane, valori nutritive și alergeni, gătit pas cu pas cu cronometre și voce, și rețetele tale scrise și partajate.',
  ogTitle: 'Carte de bucate: manual de utilizare',
  cta: 'Vrei să o încerci? Cartea de bucate este o aplicație pentru membrii DevQuake. {link}, apoi abonează-te la aplicație.',
  ctaLink: 'Creează un cont sau conectează-te',
  kicker: 'Carte de bucate · Manual de utilizare',
  title: 'Cum gătești cu Cartea de bucate',
  intro:
    'Cartea de bucate are rețete care se adaptează celor de la masă: alegi porțiile, iar fiecare cantitate și valorile pe porție se potrivesc. Acest manual te ghidează pas cu pas.',
  contents: 'Cuprins',
  sections: [
    {
      id: 'start',
      title: '1. Primii pași',
      blocks: [
        {
          steps: [
            'Conectează-te pe {host} (sau creează un cont și confirmă-ți e-mailul).',
            'Deschide **Contul tău → Proiecte disponibile** și **abonează-te** la „Carte de bucate”.',
            'Deschide aplicația: **Biblioteca** are rețetele de început DevQuake; **Rețetele mele**, **Partajate cu mine** și **Favorite** sunt ale tale.',
          ],
        },
        {
          p: 'Caută după nume și filtrează după **dietă** și **timp** (de exemplu mâncăruri vegetariene gata în 30 de minute).',
        },
      ],
    },
    {
      id: 'servings',
      title: '2. Porții și unități',
      blocks: [
        {
          p: 'La o rețetă, apasă **−** și **+** ca să alegi porțiile. Fiecare cantitate se recalculează cu bun-simț de bucătar:',
        },
        {
          list: [
            '**Ouăle, bucățile și conservele rămân întregi**: niciodată jumătate de ou.',
            '**Sarea și condimentele cresc mai puțin** decât restul, ca o oală mare să nu fie prea condimentată.',
            'Unele ingrediente **rămân la fel** (o foaie de dafin, uleiul pentru tigaie).',
            'Cantitățile se rotunjesc: gramele peste 100 la 5, lingurile la sferturi.',
          ],
        },
        {
          p: 'Comută între **Metric** și **Imperial** (uncii, livre, uncii lichide); aplicația îți ține minte alegerea.',
        },
      ],
    },
    {
      id: 'nutrition',
      title: '3. Valori nutritive, diete și alergeni',
      blocks: [
        {
          p: 'Panoul **Pe porție** arată energia, proteinele, carbohidrații, grăsimile, fibrele și sarea, calculate din ingrediente (valori aproximative din baze de date deschise).',
        },
        {
          list: [
            '**Se potrivește** arată dietele cu motivul, de exemplu „28 g proteine pe porție (cel puțin 25 g)”. Bogată în proteine, săracă în carbohidrați și rapidă se calculează din cifre.',
            'Dietele marcate de autor apar doar dacă ingredientele se potrivesc: o mâncare „vegetariană” cu pui pierde eticheta.',
            '**Alergeni** arată cei 14 alergeni UE găsiți în ingrediente.',
          ],
        },
        {
          tip: 'Dietele nu sunt sfaturi medicale. Dacă ai o alergie sau o afecțiune, verifică fiecare ingredient și ambalajul.',
        },
      ],
    },
    {
      id: 'cook',
      title: '4. Modul de gătit',
      blocks: [
        {
          p: 'Apasă **Începe să gătești**: un pas pe ecran, cu litere mari, iar ecranul rămâne aprins.',
        },
        {
          list: [
            'Pașii cu un timp au un **cronometru**: pornește, pauză, resetează; sună și vibrează când expiră timpul.',
            'Apasă **Citește pașii cu voce tare** și fiecare pas e citit în limba ta când treci mai departe.',
            'Folosește **Următorul** și **Înapoi** sau săgețile tastaturii.',
          ],
        },
      ],
    },
    {
      id: 'own',
      title: '5. Rețetele tale',
      blocks: [
        {
          p: 'Scrierea unei rețete are patru pași scurți, iar editorul te ajută la fiecare:',
        },
        {
          list: [
            '**De bază**: numele, pentru câți, timpii de pregătire și gătire și **ustensilele** (apasă o sugestie ca tigaie sau cuptor).',
            '**Ingrediente**: cantitate, unitate și nume, și **cum se pregătește** (tocat, ras). Editorul îți propune să legi fiecare de tabelul nutrițional.',
            '**Pași**: o acțiune pe pas, cu **etapa** ei (pregătire, gătire, servire). Ingredientele folosite sunt găsite în text (apasă ca să schimbi), iar un timp din text („20 de minute”) îți propune un cronometru.',
            '**Verificare**: o listă cu ce le trebuie altora ca s-o gătească. Punctele necesare permit publicarea; restul sunt sfaturi.',
          ],
        },
        {
          p: 'Rețetele tale sunt **private**. Un **link de partajare** o arată cui alegi tu; o rețetă **publică** e pentru toți cei din Cartea de bucate.',
        },
        {
          p: 'Un **link public** (pe pagina rețetei) îi lasă pe toți să deschidă rețeta, și fără cont DevQuake: distribuie-o pe Facebook, WhatsApp, Pinterest și altele. Arată rețeta, fotografia ei și numele tău, motoarele de căutare nu îl listează, iar **Oprește linkul public** îl oprește.',
        },
      ],
    },
    {
      id: 'community',
      title: '6. Rețete publice, recomandări și comentarii',
      blocks: [
        {
          p: 'Fă o rețetă **publică** din pagina ei (sau la salvare) după ce ai completat punctele necesare din listă. Apare la **Comunitate** pentru toți cei din Cartea de bucate, cele mai recomandate primele.',
        },
        {
          list: [
            '**Recomandă** o rețetă care ți-a plăcut, ca un „like”; apasă din nou ca s-o retragi. Nu îți poți recomanda propriile rețete.',
            'Lasă un **comentariu** dacă vrei. Autorul primește o notificare și îl găsește în **mesajele** sale pe DevQuake (Cont → Mesaje), cu rețeta, data și cuvintele tale; îl vede și la **Comentarii** în aplicație.',
            'Fiecare **100 de recomandări** ale unei rețete publice aduc autorului **un punct NPS**.',
          ],
        },
        {
          tip: '**Fă-o privată** ascunde din nou rețeta; recomandările și comentariile rămân pentru când o publici iar.',
        },
      ],
    },
    {
      id: 'apps',
      title: '7. Cu celelalte aplicații ale tale',
      blocks: [
        {
          list: [
            '**Liste de cumpărături**: conectat, bifezi ce ai deja și pui restul ingredientelor, pentru porțiile alese, pe o listă dintr-un pas.',
            '**Planificatorul de mese**: îți planifică săptămâna cu rețete din cartea ta de bucate și le transformă într-o singură listă de cumpărături.',
          ],
        },
        {
          p: 'Conexiunile se fac o singură dată pe DevQuake (**Funcționează cu** în josul fiecărei pagini) și se pot elimina din **Cont → Aplicații conectate**.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '8. Datele tale',
      blocks: [
        {
          p: 'Dacă îți ștergi contul sau renunți la abonament, rețetele, fotografiile, linkurile de partajare și favoritele tale se șterg.',
        },
      ],
    },
  ],
  questions: 'Întrebări sau idei? Scrie-ne la {email}.',
  back: '← Înapoi la rețete',
};

const hu: Manual = {
  metaTitle: 'Felhasználói útmutató · Szakácskönyv',
  metaDescription:
    'Így használd a Szakácskönyvet: receptek bármennyi főre, tápérték és allergének, lépésenkénti főzés időzítővel és felolvasással, saját receptek írása és megosztása.',
  ogTitle: 'Szakácskönyv: felhasználói útmutató',
  cta: 'Kipróbálnád? A Szakácskönyv a DevQuake-tagok alkalmazása. {link}, majd fizess elő az alkalmazásra.',
  ctaLink: 'Hozz létre fiókot vagy jelentkezz be',
  kicker: 'Szakácskönyv · Felhasználói útmutató',
  title: 'Így főzz a Szakácskönyvvel',
  intro:
    'A Szakácskönyv receptjei az asztalnál ülőkhöz igazodnak: válaszd ki az adagokat, és minden mennyiség meg az adagonkénti tápérték követi. Ez az útmutató lépésről lépésre végigvezet.',
  contents: 'Tartalom',
  sections: [
    {
      id: 'start',
      title: '1. Első lépések',
      blocks: [
        {
          steps: [
            'Jelentkezz be a {host} oldalon (vagy hozz létre fiókot, és erősítsd meg az e-mail-címed).',
            'Nyisd meg a **Fiókod → Elérhető projektek** részt, és **fizess elő** a „Szakácskönyv” alkalmazásra.',
            'Nyisd meg az alkalmazást: a **Könyvtár** a DevQuake induló receptjeit tartalmazza; a **Saját receptek**, a **Velem megosztva** és a **Kedvencek** a tieid.',
          ],
        },
        {
          p: 'Keress név szerint, és szűrj **étrendre** és **időre** (például 30 perc alatt kész vegetáriánus ételekre).',
        },
      ],
    },
    {
      id: 'servings',
      title: '2. Adagok és mértékegységek',
      blocks: [
        {
          p: 'Egy recepten koppints a **−** és **+** gombra az adagok kiválasztásához. Minden mennyiség konyhai józan ésszel számolódik újra:',
        },
        {
          list: [
            '**A tojás, a darabok és a dobozok egészek maradnak**: soha nincs fél tojás.',
            '**A só és a fűszerek kevésbé nőnek**, mint a többi, hogy egy nagy fazék ne legyen túlfűszerezve.',
            'Néhány hozzávaló **nem változik** (egy babérlevél, olaj a serpenyőbe).',
            'A mennyiségek kerekítve: a 100 feletti grammok 5-re, a kanalak negyedekre.',
          ],
        },
        {
          p: 'Válts a **Metrikus** és az **Angolszász** (uncia, font, folyadékuncia) között; az alkalmazás megjegyzi a választásod.',
        },
      ],
    },
    {
      id: 'nutrition',
      title: '3. Tápérték, étrendek és allergének',
      blocks: [
        {
          p: 'Az **Adagonként** panel mutatja az energiát, a fehérjét, a szénhidrátot, a zsírt, a rostot és a sót, a hozzávalókból számolva (hozzávetőleges értékek nyílt adatbázisokból).',
        },
        {
          list: [
            'Az **Illik ide** mutatja az étrendeket indoklással, például „adagonként 28 g fehérje (legalább 25 g)”. A magas fehérje-, az alacsony szénhidráttartalom és a gyorsaság a számokból adódik.',
            'A szerző által jelölt étrend csak akkor látszik, ha a hozzávalók egyeznek vele: a csirkés „vegetáriánus” étel elveszíti a jelölést.',
            'Az **Allergének** a hozzávalókban talált 14 uniós allergént sorolja fel.',
          ],
        },
        {
          tip: 'Az étrendek nem orvosi tanácsok. Allergia vagy betegség esetén ellenőrizz minden hozzávalót és a csomagolást.',
        },
      ],
    },
    {
      id: 'cook',
      title: '4. Főzőmód',
      blocks: [
        {
          p: 'Koppints a **Főzés indítása** gombra: lépésenként egy képernyő nagy betűkkel, és a képernyő nem kapcsol ki.',
        },
        {
          list: [
            'Az időt igénylő lépéseknek **időzítője** van: indítás, szünet, visszaállítás; lejártakor csipog és rezeg.',
            'Koppints a **Lépések felolvasása** gombra, és továbblépéskor minden lépést felolvas a nyelveden.',
            'Használd a **Tovább** és **Vissza** gombot vagy a billentyűzet nyilait.',
          ],
        },
      ],
    },
    {
      id: 'own',
      title: '5. Saját receptek',
      blocks: [
        {
          p: 'Egy recept megírása négy rövid lépés, és a szerkesztő mindegyikben segít:',
        },
        {
          list: [
            '**Alapok**: a név, hány főre, az előkészítési és főzési idő és az **eszközök** (koppints egy javaslatra, például serpenyő vagy sütő).',
            '**Hozzávalók**: mennyiség, egység és név, és **az előkészítés** (aprítva, reszelve). A szerkesztő felajánlja, hogy mindegyiket a tápértéktáblához kösd.',
            '**Lépések**: lépésenként egy művelet a **szakaszával** (előkészítés, főzés, tálalás). A felhasznált hozzávalókat a szövegből ismeri fel (koppints a módosításhoz), a szövegben szereplő idő („20 perc”) pedig időzítőt kínál.',
            '**Ellenőrzés**: ellenőrzőlista arról, ami másnak kell az elkészítéshez. A kötelező pontok után teheted nyilvánossá; a többi tipp.',
          ],
        },
        {
          p: 'A receptjeid **privátak**. A **megosztási link** az általad választottaknak mutatja meg; a **nyilvános** recept a Szakácskönyv minden használójáé.',
        },
        {
          p: 'A **nyilvános link** (a recept oldalán) mindenkinek megnyitja a receptet, DevQuake-fiók nélkül is: oszd meg Facebookon, WhatsAppon, Pinteresten és máshol. A receptet, a fotóját és a nevedet mutatja, a keresők nem listázzák, és a **Nyilvános link kikapcsolása** kikapcsolja.',
        },
      ],
    },
    {
      id: 'community',
      title: '6. Nyilvános receptek, ajánlások és hozzászólások',
      blocks: [
        {
          p: 'Tedd **nyilvánossá** a receptet az oldalán (vagy mentéskor), ha az ellenőrzőlista kötelező pontjai megvannak. A **Közösség** fülön jelenik meg a Szakácskönyv minden használójának, a legtöbbet ajánlottak elöl.',
        },
        {
          list: [
            '**Ajánld** a receptet, ha tetszett, mint egy „lájkot”; újra koppintva visszavonod. A saját receptedet nem ajánlhatod.',
            'Ha szeretnél, írj **hozzászólást**. A szerző értesítést kap, és megtalálja az **üzenetei** között a DevQuake-en (Fiók → Üzenetek) a recepttel, a dátummal és a szövegeddel; az alkalmazásban a **Hozzászólások** oldalon is.',
            'Egy nyilvános recept minden **100 ajánlása** után a szerző **egy NPS-pontot** kap.',
          ],
        },
        {
          tip: 'A **Priváttá tesz** újra elrejti a receptet; az ajánlások és hozzászólások megmaradnak a következő közzétételig.',
        },
      ],
    },
    {
      id: 'apps',
      title: '7. A többi alkalmazásoddal',
      blocks: [
        {
          list: [
            '**Bevásárlólisták**: összekapcsolva kipipálod, ami már megvan, a többi hozzávalót pedig a választott adagra egy lépésben listára teszed.',
            '**Étkezéstervező**: a szakácskönyved receptjeivel tervezi meg a hetedet, és egyetlen bevásárlólistát készít belőlük.',
          ],
        },
        {
          p: 'A kapcsolatot egyszer kell létrehozni a DevQuake-en (**Működik ezekkel** minden oldal alján), és a **Fiók → Kapcsolt alkalmazások** résznél bonthatod.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '8. Az adataid',
      blocks: [
        {
          p: 'Ha törlöd a fiókodat vagy lemondod az előfizetést, a receptjeid, fotóid, megosztási linkjeid és kedvenceid törlődnek.',
        },
      ],
    },
  ],
  questions: 'Kérdésed vagy ötleted van? Írj nekünk: {email}.',
  back: '← Vissza a receptekhez',
};

export const MANUAL: Record<Locale, Manual> = { en, de, ro, hu };
