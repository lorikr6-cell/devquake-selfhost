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
  metaTitle: 'User manual · Utility bills',
  metaDescription:
    'How to share utility bills: add the provider’s PDF, collect meter readings with photos, split the bill fairly, record payments with carry-over and follow your consumption and costs.',
  ogTitle: 'Utility bills: user manual',
  cta: 'Want to try it? Utility bills is an app for DevQuake members. {link}, then subscribe to the app.',
  ctaLink: 'Create an account or sign in',
  kicker: 'Utility bills · User manual',
  title: 'How to share utility bills',
  intro:
    'Share utility bills with the people you live with: add the provider’s bill, collect everyone’s meter readings, see who owes what, and follow your consumption and costs. This manual walks you through it step by step.',
  contents: 'Contents',
  sections: [
    {
      id: 'start',
      title: '1. Getting started',
      blocks: [
        {
          p: 'Utility bills is an app of DevQuake and uses your DevQuake account, so there is no separate sign-up.',
        },
        {
          steps: [
            'Sign in on {host} (or create an account and confirm your email).',
            'Open **Your account → Available projects** and **Subscribe** to “Utility bills”.',
            'Open the app. The first time, give your **full name** and **address**: country, state or county, city, street, number and (optionally) apartment. While you type, suggestions from OpenStreetMap help you fill it in. Only the people you share a utility with see them, so a meter can be checked if needed. You can change them any time under **Profile**.',
          ],
        },
        {
          p: 'The toolbar shows the app’s name (tap it to come back to the start), full screen and the DevQuake mark. The manual and the version notes are at the bottom of every page; your language and theme are set in **Your account → Profile** on DevQuake.',
        },
      ],
    },
    {
      id: 'utilities',
      title: '2. Utilities',
      blocks: [
        {
          p: 'A utility is something that sends you a bill regularly. Add it in the **New** tab: choose its **category**, give it a name, the provider, the **unit** its consumption is measured in (kWh, m³…) and the **currency**.',
        },
        {
          list: [
            '**Categories**: electricity, gas, water, heating, phone, cable TV, internet, online hosting, Xbox, Microsoft, Apple, Steam, or **Other** for anything else.',
            'Tick **Individual meter required** when several homes share one connection and each has its own meter: then everyone sends a photo of their meter for every bill, and the bill is split by consumption.',
            'Without it (subscriptions, internet…) the bill is split equally.',
          ],
        },
        {
          p: 'The **Bills** tab lists your utilities by category, with the state of the last bill and what is still owed.',
        },
        {
          p: 'Faster: **Search for available utility services** (in the **New** tab) shares your location once, or uses your profile address, and lists the usual services for your country and county or state with the likely provider: electricity, gas, water and internet are ticked. Change a provider or untick what you do not have, then press **Add**. Suggestions exist for Romania, Germany and Hungary so far; your location is not saved.',
        },
      ],
    },
    {
      id: 'sharing',
      title: '3. Sharing a utility',
      blocks: [
        {
          steps: [
            'Open the utility and choose **Share and members**.',
            'Send the **invite link**, the **code** or let them scan the **QR code**; or add people from your **DevQuake referrals** with one click.',
            'They open the link and choose **Join**. They share the bills from the month they join on.',
          ],
        },
        {
          tip: 'Nobody else can see your utilities or bills: only the people on a utility. **New link** makes the old link and code stop working.',
        },
        {
          p: 'For a family member who should only see the bills: tick **View only** next to them on **Share and members**. They see every bill and its details, but have no share and pay nothing.',
        },
      ],
    },
    {
      id: 'bills',
      title: '4. Adding a bill',
      blocks: [
        {
          steps: [
            'When the provider’s bill arrives, open the utility and choose **Add bill**.',
            'Pick the provider’s **PDF**. The app tries to read the **total**, the **consumption**, the **unit price** and the **due date** from it.',
            'Check what it found; whatever it could not read, type into the same form.',
            'Tick **I have paid the provider** once you have paid it.',
          ],
        },
        {
          tip: 'Without a unit price on the bill, the app uses total ÷ consumption. Scanned PDFs have no text to read: type the values in.',
        },
        {
          p: 'Only the person who manages the utility (who created it and pays the provider) can add, change or delete its bills.',
        },
      ],
    },
    {
      id: 'readings',
      title: '5. Meter readings',
      blocks: [
        {
          steps: [
            'Open the bill and find **Your meter reading**.',
            'Take a clear, close **photo of the meter**. The app tries to read the index from it on your device.',
            'Check the **current index** (or type it in). The **previous index** comes from your last reading; the consumption is the difference.',
            'Choose **Save reading**.',
          ],
        },
        {
          tip: 'Everyone on the utility can open the meter photos, so readings can be checked. The manager can also enter a reading for someone.',
        },
        {
          p: 'Use **Take photo** for the camera, or **Choose from library** for a photo you already took.',
        },
      ],
    },
    {
      id: 'split',
      title: '6. How a bill is split',
      blocks: [
        {
          list: [
            'With individual meters, everyone pays **their consumption × the unit price**.',
            'When all readings are in and they do not cover the whole bill (common areas, losses, fixed fees), **the rest is split equally** between everyone, the manager included. If the readings add up to more than the bill, the difference is taken off equally.',
            'Without meters, the bill is **split equally**.',
            'Cents that do not divide evenly go to the manager, so the shares always add up to the bill exactly.',
          ],
        },
      ],
    },
    {
      id: 'payments',
      title: '7. Payments and carry-over',
      blocks: [
        {
          tip: 'Keep your shared costs in one place: with **Shared expenses** connected, the owner can **Add the bill** to an expense group with everyone’s exact share, paid by them. Adding it twice changes nothing.',
        },
        {
          p: 'The app does not move money: people pay the manager in cash, by card or any other way, and the manager records the **amount received** on the bill.',
        },
        {
          list: [
            'Paid **more** than asked: the extra is taken off the next bill of the same utility.',
            'Paid **less**: the missing sum is added to the next bill.',
            '✔ **Green check**: the provider is paid and everyone has paid their part.',
            '⚠ **Warning**: the payments do not cover the bill yet. ⏳ **Hourglass**: meter readings are still missing.',
          ],
        },
        {
          p: 'Everyone on the bill can **comment** on it. The manager can delete a bill or the whole utility.',
        },
        {
          tip: 'When the manager confirms a payment it is locked (only a DevQuake administrator can change it), and the person who paid gets an email with the whole bill, their consumption and share, and a link to the bill, where the provider’s PDF can be opened.',
        },
      ],
    },
    {
      id: 'overview',
      title: '8. Calendar and statistics',
      blocks: [
        {
          list: [
            'The **Calendar** shows your own part month by month or for a whole year: your consumption, your share and what you paid, for every bill.',
            '**Statistics** show, per category, your consumption, your share and the unit price month by month, with yearly totals and the average price. Every chart can also be shown as a table.',
          ],
        },
      ],
    },
    {
      id: 'privacy',
      title: '9. Your data',
      blocks: [
        {
          p: 'Your name, address, readings, meter photos and bills are shown only to the people you share a utility with. For the address suggestions, what you type in the state, city and street fields is sent through DevQuake to Photon (komoot), a search service for OpenStreetMap; nothing else about you. When you delete your DevQuake account or unsubscribe from the app, everything of yours is deleted: your profile, readings, photos, payments and comments, and the utilities you manage with all their bills and PDFs.',
        },
      ],
    },
  ],
  questions: 'Questions or ideas? Write to {email}.',
  back: '← Back to your bills',
};

const de: Manual = {
  metaTitle: 'Anleitung · Nebenkosten',
  metaDescription:
    'So teilst du Nebenkosten: PDF des Anbieters hinzufügen, Zählerstände mit Fotos sammeln, die Rechnung fair aufteilen, Zahlungen mit Übertrag erfassen und Verbrauch und Kosten verfolgen.',
  ogTitle: 'Nebenkosten: Anleitung',
  cta: 'Möchtest du es ausprobieren? Die Nebenkosten sind eine App für DevQuake-Mitglieder. {link} und abonniere dann die App.',
  ctaLink: 'Erstelle ein Konto oder melde dich an',
  kicker: 'Nebenkosten · Anleitung',
  title: 'So teilst du Nebenkosten',
  intro:
    'Teile Nebenkosten mit den Menschen, mit denen du wohnst: Füge die Rechnung des Anbieters hinzu, sammle die Zählerstände aller, sieh, wer was schuldet, und verfolge Verbrauch und Kosten. Diese Anleitung führt dich Schritt für Schritt.',
  contents: 'Inhalt',
  sections: [
    {
      id: 'start',
      title: '1. Erste Schritte',
      blocks: [
        {
          p: 'Die Nebenkosten sind eine App von DevQuake und nutzen dein DevQuake-Konto; eine eigene Anmeldung gibt es nicht.',
        },
        {
          steps: [
            'Melde dich auf {host} an (oder erstelle ein Konto und bestätige deine E-Mail-Adresse).',
            'Öffne **Dein Konto → Verfügbare Projekte** und **abonniere** „Nebenkosten“.',
            'Öffne die App. Beim ersten Mal gibst du deinen **vollständigen Namen** und deine **Adresse** an: Land, Bundesland oder Kreis, Ort, Straße, Hausnummer und (optional) Wohnung. Beim Tippen helfen Vorschläge aus OpenStreetMap beim Ausfüllen. Nur die Personen, mit denen du einen Versorger teilst, sehen sie, damit ein Zähler bei Bedarf geprüft werden kann. Unter **Profil** kannst du sie jederzeit ändern.',
          ],
        },
        {
          p: 'Die Werkzeugleiste zeigt den Namen der App (antippen führt zurück zum Start), Vollbild und das DevQuake-Zeichen. Anleitung und Versionshinweise stehen unten auf jeder Seite; Sprache und Design stellst du auf DevQuake unter **Dein Konto → Profil** ein.',
        },
      ],
    },
    {
      id: 'utilities',
      title: '2. Versorger',
      blocks: [
        {
          p: 'Ein Versorger schickt dir regelmäßig eine Rechnung. Füge ihn im Tab **Neu** hinzu: Wähle die **Kategorie**, gib einen Namen, den Anbieter, die **Einheit** des Verbrauchs (kWh, m³…) und die **Währung** an.',
        },
        {
          list: [
            '**Kategorien**: Strom, Gas, Wasser, Heizung, Telefon, Kabelfernsehen, Internet, Online-Hosting, Xbox, Microsoft, Apple, Steam oder **Sonstiges** für alles andere.',
            'Aktiviere **Eigener Zähler erforderlich**, wenn sich mehrere Wohnungen einen Anschluss teilen und jede ihren eigenen Zähler hat: Dann sendet jede Person zu jeder Rechnung ein Foto ihres Zählers, und die Rechnung wird nach Verbrauch aufgeteilt.',
            'Ohne diese Option (Abos, Internet…) wird die Rechnung gleichmäßig geteilt.',
          ],
        },
        {
          p: 'Der Tab **Rechnungen** zeigt deine Versorger nach Kategorie, mit dem Status der letzten Rechnung und dem, was noch offen ist.',
        },
        {
          p: 'Schneller: **Verfügbare Versorger suchen** (im Tab **Neu**) teilt einmal deinen Standort oder nutzt deine Profiladresse und listet die üblichen Versorger für dein Land und dein Bundesland oder deinen Kreis mit dem wahrscheinlichen Anbieter auf: Strom, Gas, Wasser und Internet sind angehakt. Ändere einen Anbieter oder entferne, was du nicht hast, dann tippe auf **Hinzufügen**. Vorschläge gibt es bisher für Rumänien, Deutschland und Ungarn; dein Standort wird nicht gespeichert.',
        },
      ],
    },
    {
      id: 'sharing',
      title: '3. Einen Versorger teilen',
      blocks: [
        {
          steps: [
            'Öffne den Versorger und wähle **Teilen und Mitglieder**.',
            'Schicke den **Einladungslink** oder den **Code**, lass den **QR-Code** scannen, oder füge Personen aus deinen **DevQuake-Empfehlungen** mit einem Klick hinzu.',
            'Sie öffnen den Link und wählen **Beitreten**. Ab dem Beitrittsmonat teilen sie die Rechnungen.',
          ],
        },
        {
          tip: 'Niemand sonst sieht deine Versorger oder Rechnungen, nur die Mitglieder eines Versorgers. **Neuer Link** macht den alten Link und Code ungültig.',
        },
        {
          p: 'Für ein Familienmitglied, das die Rechnungen nur sehen soll: Aktiviere bei **Teilen und Mitglieder** neben der Person **Nur ansehen**. Sie sieht jede Rechnung mit allen Details, hat aber keinen Anteil und zahlt nichts.',
        },
      ],
    },
    {
      id: 'bills',
      title: '4. Eine Rechnung hinzufügen',
      blocks: [
        {
          steps: [
            'Wenn die Rechnung des Anbieters kommt, öffne den Versorger und wähle **Rechnung hinzufügen**.',
            'Wähle das **PDF** des Anbieters. Die App versucht, **Gesamtbetrag**, **Verbrauch**, **Preis pro Einheit** und **Fälligkeitsdatum** daraus zu lesen.',
            'Prüfe, was sie gefunden hat; was sie nicht lesen konnte, tippst du im selben Formular ein.',
            'Aktiviere **Ich habe den Anbieter bezahlt**, sobald du bezahlt hast.',
          ],
        },
        {
          tip: 'Steht kein Preis pro Einheit auf der Rechnung, verwendet die App Gesamtbetrag ÷ Verbrauch. Gescannte PDFs enthalten keinen lesbaren Text: Tippe die Werte ein.',
        },
        {
          p: 'Nur die Person, die den Versorger verwaltet (ihn erstellt hat und den Anbieter bezahlt), kann Rechnungen hinzufügen, ändern oder löschen.',
        },
      ],
    },
    {
      id: 'readings',
      title: '5. Zählerstände',
      blocks: [
        {
          steps: [
            'Öffne die Rechnung und suche **Dein Zählerstand**.',
            'Mach ein deutliches **Foto des Zählers** aus der Nähe. Die App versucht, den Zählerstand auf deinem Gerät daraus zu lesen.',
            'Prüfe den **aktuellen Zählerstand** (oder tippe ihn ein). Der **vorherige Zählerstand** stammt aus deiner letzten Ablesung; der Verbrauch ist die Differenz.',
            'Wähle **Zählerstand speichern**.',
          ],
        },
        {
          tip: 'Alle Mitglieder können die Zählerfotos öffnen, damit die Zählerstände geprüft werden können. Die verwaltende Person kann auch für jemanden einen Zählerstand eintragen.',
        },
        {
          p: 'Nutze **Foto aufnehmen** für die Kamera oder **Aus der Mediathek wählen** für ein Foto, das du schon gemacht hast.',
        },
      ],
    },
    {
      id: 'split',
      title: '6. Wie eine Rechnung aufgeteilt wird',
      blocks: [
        {
          list: [
            'Mit eigenen Zählern zahlen alle **ihren Verbrauch × den Preis pro Einheit**.',
            'Sind alle Zählerstände da und decken sie nicht die ganze Rechnung ab (Gemeinschaftsflächen, Verluste, Grundgebühren), wird **der Rest gleichmäßig** auf alle verteilt, die verwaltende Person eingeschlossen. Ergeben die Zählerstände mehr als die Rechnung, wird die Differenz gleichmäßig abgezogen.',
            'Ohne Zähler wird die Rechnung **gleichmäßig geteilt**.',
            'Cent-Beträge, die nicht aufgehen, übernimmt die verwaltende Person, sodass die Anteile immer genau die Rechnung ergeben.',
          ],
        },
      ],
    },
    {
      id: 'payments',
      title: '7. Zahlungen und Übertrag',
      blocks: [
        {
          tip: 'Alle geteilten Kosten an einem Ort: Ist **Geteilte Ausgaben** verbunden, kann der Verwalter die **Rechnung hinzufügen**, in eine Ausgabengruppe mit dem genauen Anteil aller, bezahlt von ihm. Zweimal hinzufügen ändert nichts.',
        },
        {
          p: 'Die App bewegt kein Geld: Alle zahlen der verwaltenden Person bar, mit Karte oder auf andere Weise, und diese trägt den **erhaltenen Betrag** bei der Rechnung ein.',
        },
        {
          list: [
            '**Mehr** bezahlt als verlangt: Das Plus wird bei der nächsten Rechnung desselben Versorgers abgezogen.',
            '**Weniger** bezahlt: Die fehlende Summe kommt zur nächsten Rechnung hinzu.',
            '✔ **Grünes Häkchen**: Der Anbieter ist bezahlt und alle haben ihren Teil bezahlt.',
            '⚠ **Warnung**: Die Zahlungen decken die Rechnung noch nicht. ⏳ **Sanduhr**: Es fehlen noch Zählerstände.',
          ],
        },
        {
          p: 'Alle auf der Rechnung können sie **kommentieren**. Die verwaltende Person kann eine Rechnung oder den ganzen Versorger löschen.',
        },
        {
          tip: 'Wenn die verwaltende Person eine Zahlung bestätigt, ist sie gesperrt (nur ein DevQuake-Administrator kann sie ändern), und wer bezahlt hat, bekommt eine E-Mail mit der ganzen Rechnung, dem eigenen Verbrauch und Anteil und einem Link zur Rechnung, wo das PDF des Anbieters geöffnet werden kann.',
        },
      ],
    },
    {
      id: 'overview',
      title: '8. Kalender und Statistik',
      blocks: [
        {
          list: [
            'Der **Kalender** zeigt deinen eigenen Teil Monat für Monat oder für ein ganzes Jahr: deinen Verbrauch, deinen Anteil und was du bezahlt hast, für jede Rechnung.',
            'Die **Statistik** zeigt pro Kategorie deinen Verbrauch, deinen Anteil und den Preis pro Einheit Monat für Monat, mit Jahressummen und dem Durchschnittspreis. Jedes Diagramm lässt sich auch als Tabelle anzeigen.',
          ],
        },
      ],
    },
    {
      id: 'privacy',
      title: '9. Deine Daten',
      blocks: [
        {
          p: 'Dein Name, deine Adresse, Zählerstände, Zählerfotos und Rechnungen werden nur den Personen gezeigt, mit denen du einen Versorger teilst. Für die Adressvorschläge wird, was du in die Felder Bundesland, Ort und Straße tippst, über DevQuake an Photon (komoot) geschickt, einen Suchdienst für OpenStreetMap; sonst nichts über dich. Wenn du dein DevQuake-Konto löschst oder die App abbestellst, wird alles von dir gelöscht: dein Profil, deine Zählerstände, Fotos, Zahlungen und Kommentare sowie die Versorger, die du verwaltest, mit allen Rechnungen und PDFs.',
        },
      ],
    },
  ],
  questions: 'Fragen oder Ideen? Schreib an {email}.',
  back: '← Zurück zu deinen Rechnungen',
};

const ro: Manual = {
  metaTitle: 'Manual de utilizare · Facturi utilități',
  metaDescription:
    'Cum împarți facturile de utilități: adaugi PDF-ul furnizorului, strângi indexurile cu fotografii, împarți corect factura, înregistrezi plățile cu report și îți urmărești consumul și costurile.',
  ogTitle: 'Facturi utilități: manual de utilizare',
  cta: 'Vrei să încerci? Facturi utilități este o aplicație pentru membrii DevQuake. {link}, apoi abonează-te la aplicație.',
  ctaLink: 'Creează un cont sau autentifică-te',
  kicker: 'Facturi utilități · Manual de utilizare',
  title: 'Cum împarți facturile de utilități',
  intro:
    'Împarte facturile de utilități cu cei cu care locuiești: adaugă factura furnizorului, strânge indexurile tuturor, vezi cine cât datorează și urmărește-ți consumul și costurile. Acest manual te ghidează pas cu pas.',
  contents: 'Cuprins',
  sections: [
    {
      id: 'start',
      title: '1. Primii pași',
      blocks: [
        {
          p: 'Facturi utilități este o aplicație DevQuake și folosește contul tău DevQuake, deci nu există o înscriere separată.',
        },
        {
          steps: [
            'Autentifică-te pe {host} (sau creează un cont și confirmă-ți adresa de e-mail).',
            'Deschide **Contul tău → Proiecte disponibile** și **abonează-te** la „Facturi utilități”.',
            'Deschide aplicația. Prima dată îți completezi **numele complet** și **adresa**: țara, județul sau regiunea, localitatea, strada, numărul și (opțional) apartamentul. În timp ce scrii, sugestiile din OpenStreetMap te ajută s-o completezi. Doar persoanele cu care împarți o utilitate le văd, pentru ca un contor să poată fi verificat la nevoie. Le poți schimba oricând la **Profil**.',
          ],
        },
        {
          p: 'Bara de sus arată numele aplicației (atinge-l ca să revii la început), ecranul complet și semnul DevQuake. Manualul și notele de versiune sunt jos pe fiecare pagină; limba și tema le setezi pe DevQuake la **Contul tău → Profil**.',
        },
      ],
    },
    {
      id: 'utilities',
      title: '2. Utilități',
      blocks: [
        {
          p: 'O utilitate este ceva ce îți trimite regulat o factură. Adaug-o în fila **Nou**: alege **categoria**, dă-i un nume, furnizorul, **unitatea** în care se măsoară consumul (kWh, m³…) și **moneda**.',
        },
        {
          list: [
            '**Categorii**: curent, gaz, apă, încălzire, telefon, televiziune prin cablu, internet, găzduire online, Xbox, Microsoft, Apple, Steam sau **Altele** pentru orice altceva.',
            'Bifează **Contor individual obligatoriu** când mai multe locuințe au un singur branșament și fiecare are propriul contor: atunci fiecare trimite la fiecare factură o fotografie a contorului, iar factura se împarte după consum.',
            'Fără această opțiune (abonamente, internet…) factura se împarte în mod egal.',
          ],
        },
        {
          p: 'Fila **Facturi** îți arată utilitățile pe categorii, cu starea ultimei facturi și ce mai este de plată.',
        },
        {
          p: 'Mai repede: **Caută serviciile de utilități disponibile** (în fila **Nou**) îți partajează o dată locația sau folosește adresa din profil și listează utilitățile obișnuite pentru țara și județul tău, cu furnizorul probabil: electricitate, gaz, apă și internet sunt bifate. Schimbă un furnizor sau debifează ce nu ai, apoi apasă **Adaugă**. Deocamdată există sugestii pentru România, Germania și Ungaria; locația ta nu este salvată.',
        },
      ],
    },
    {
      id: 'sharing',
      title: '3. Partajarea unei utilități',
      blocks: [
        {
          steps: [
            'Deschide utilitatea și alege **Partajare și membri**.',
            'Trimite **linkul de invitație** sau **codul**, lasă-i să scaneze **codul QR** ori adaugă cu un clic persoane din **recomandările tale DevQuake**.',
            'Ei deschid linkul și aleg **Alătură-te**. Împart facturile începând cu luna în care s-au alăturat.',
          ],
        },
        {
          tip: 'Nimeni altcineva nu îți vede utilitățile sau facturile, doar membrii unei utilități. **Link nou** face ca linkul și codul vechi să nu mai funcționeze.',
        },
        {
          p: 'Pentru un membru al familiei care doar trebuie să vadă facturile: bifează **Doar vizualizare** lângă el la **Partajare și membri**. Vede fiecare factură cu detaliile ei, dar nu are parte și nu plătește nimic.',
        },
      ],
    },
    {
      id: 'bills',
      title: '4. Adăugarea unei facturi',
      blocks: [
        {
          steps: [
            'Când sosește factura furnizorului, deschide utilitatea și alege **Adaugă factură**.',
            'Alege **PDF-ul** furnizorului. Aplicația încearcă să citească din el **totalul**, **consumul**, **prețul unitar** și **data scadenței**.',
            'Verifică ce a găsit; ce nu a putut citi, introduci în același formular.',
            'Bifează **Am plătit furnizorul** după ce ai plătit.',
          ],
        },
        {
          tip: 'Dacă factura nu arată un preț unitar, aplicația folosește total ÷ consum. PDF-urile scanate nu au text de citit: introdu valorile.',
        },
        {
          p: 'Doar persoana care administrează utilitatea (care a creat-o și plătește furnizorul) poate adăuga, modifica sau șterge facturile ei.',
        },
      ],
    },
    {
      id: 'readings',
      title: '5. Indexuri',
      blocks: [
        {
          steps: [
            'Deschide factura și găsește **Indexul tău**.',
            'Fă o **fotografie** clară, de aproape, **a contorului**. Aplicația încearcă să citească indexul din ea pe dispozitivul tău.',
            'Verifică **indexul actual** (sau introdu-l). **Indexul anterior** vine din ultima ta citire; consumul este diferența.',
            'Alege **Salvează indexul**.',
          ],
        },
        {
          tip: 'Toți membrii utilității pot deschide fotografiile contoarelor, ca indexurile să poată fi verificate. Administratorul poate introduce și indexul cuiva.',
        },
        {
          p: 'Folosește **Fă o fotografie** pentru cameră sau **Alege din galerie** pentru o fotografie pe care ai făcut-o deja.',
        },
      ],
    },
    {
      id: 'split',
      title: '6. Cum se împarte o factură',
      blocks: [
        {
          list: [
            'Cu contoare individuale, fiecare plătește **consumul său × prețul unitar**.',
            'Când toate indexurile sunt trimise și nu acoperă întreaga factură (spații comune, pierderi, taxe fixe), **restul se împarte egal** între toți, inclusiv administratorul. Dacă indexurile însumează mai mult decât factura, diferența se scade în mod egal.',
            'Fără contoare, factura se **împarte în mod egal**.',
            'Banii care nu se împart exact îi preia administratorul, astfel încât părțile dau mereu exact factura.',
          ],
        },
      ],
    },
    {
      id: 'payments',
      title: '7. Plăți și report',
      blocks: [
        {
          tip: 'Toate costurile comune într-un loc: cu **Cheltuieli comune** conectată, administratorul poate **adăuga factura** într-un grup de cheltuieli, cu partea exactă a fiecăruia, plătită de el. Dacă o adaugi de două ori, nu se schimbă nimic.',
        },
        {
          p: 'Aplicația nu transferă bani: fiecare îi plătește administratorului în numerar, cu cardul sau altfel, iar administratorul înregistrează **suma primită** la factură.',
        },
        {
          list: [
            'A plătit **mai mult** decât i s-a cerut: diferența se scade din următoarea factură a aceleiași utilități.',
            'A plătit **mai puțin**: suma lipsă se adaugă la următoarea factură.',
            '✔ **Bifă verde**: furnizorul este plătit și toți și-au plătit partea.',
            '⚠ **Avertisment**: plățile nu acoperă încă factura. ⏳ **Clepsidră**: mai lipsesc indexuri.',
          ],
        },
        {
          p: 'Toți cei de pe factură o pot **comenta**. Administratorul poate șterge o factură sau întreaga utilitate.',
        },
        {
          tip: 'Când administratorul confirmă o plată, aceasta este blocată (doar un administrator DevQuake o poate modifica), iar cel care a plătit primește un e-mail cu întreaga factură, consumul și partea sa și un link spre factură, unde se poate deschide PDF-ul furnizorului.',
        },
      ],
    },
    {
      id: 'overview',
      title: '8. Calendar și statistici',
      blocks: [
        {
          list: [
            '**Calendarul** îți arată partea ta lună de lună sau pe un an întreg: consumul, partea ta și cât ai plătit, pentru fiecare factură.',
            '**Statisticile** arată pe fiecare categorie consumul tău, partea ta și prețul unitar lună de lună, cu totaluri anuale și prețul mediu. Fiecare grafic poate fi afișat și ca tabel.',
          ],
        },
      ],
    },
    {
      id: 'privacy',
      title: '9. Datele tale',
      blocks: [
        {
          p: 'Numele, adresa, indexurile, fotografiile contoarelor și facturile tale sunt afișate doar persoanelor cu care împarți o utilitate. Pentru sugestiile de adresă, ce scrii în câmpurile județ, localitate și stradă este trimis prin DevQuake către Photon (komoot), un serviciu de căutare pentru OpenStreetMap; nimic altceva despre tine. Când îți ștergi contul DevQuake sau te dezabonezi de la aplicație, se șterge tot ce îți aparține: profilul, indexurile, fotografiile, plățile și comentariile, precum și utilitățile pe care le administrezi, cu toate facturile și PDF-urile lor.',
        },
      ],
    },
  ],
  questions: 'Întrebări sau idei? Scrie-ne la {email}.',
  back: '← Înapoi la facturile tale',
};

const hu: Manual = {
  metaTitle: 'Útmutató · Közműszámlák',
  metaDescription:
    'Így osztod meg a közműszámlákat: add hozzá a szolgáltató PDF-jét, gyűjtsd a mérőállásokat fényképpel, oszd el igazságosan a számlát, rögzítsd a fizetéseket átvitellel, és kövesd a fogyasztást és a költségeket.',
  ogTitle: 'Közműszámlák: útmutató',
  cta: 'Kipróbálnád? A Közműszámlák a DevQuake tagjainak szóló alkalmazás. {link}, majd iratkozz fel az alkalmazásra.',
  ctaLink: 'Hozz létre fiókot vagy jelentkezz be',
  kicker: 'Közműszámlák · Útmutató',
  title: 'Így oszd meg a közműszámlákat',
  intro:
    'Oszd meg a közműszámlákat azokkal, akikkel együtt laksz: add hozzá a szolgáltató számláját, gyűjtsd össze mindenki mérőállását, lásd, ki mennyivel tartozik, és kövesd a fogyasztásodat és a költségeidet. Ez az útmutató lépésről lépésre végigvezet.',
  contents: 'Tartalom',
  sections: [
    {
      id: 'start',
      title: '1. Első lépések',
      blocks: [
        {
          p: 'A Közműszámlák a DevQuake alkalmazása, és a DevQuake-fiókodat használja, így nincs külön regisztráció.',
        },
        {
          steps: [
            'Jelentkezz be a {host} oldalon (vagy hozz létre fiókot, és erősítsd meg az e-mail-címed).',
            'Nyisd meg a **Fiókod → Elérhető projektek** részt, és **iratkozz fel** a „Közműszámlák” alkalmazásra.',
            'Nyisd meg az alkalmazást. Első alkalommal add meg a **teljes neved** és a **címed**: ország, megye vagy tartomány, település, utca, házszám és (nem kötelezően) lakás. Gépelés közben az OpenStreetMap javaslatai segítenek a kitöltésben. Csak azok látják, akikkel közművet osztasz meg, hogy szükség esetén ellenőrizni lehessen a mérőórát. A **Profil** menüpontban bármikor módosíthatod.',
          ],
        },
        {
          p: 'Az eszköztáron az alkalmazás neve (koppints rá a kezdőlaphoz), a teljes képernyő és a DevQuake jele látható. Az útmutató és a verziójegyzetek minden oldal alján vannak; a nyelvet és a témát a DevQuake-en a **Fiókod → Profil** részben állítod be.',
        },
      ],
    },
    {
      id: 'utilities',
      title: '2. Közművek',
      blocks: [
        {
          p: 'Közmű minden, ami rendszeresen számlát küld. Az **Új** fülön add hozzá: válaszd ki a **kategóriát**, adj neki nevet, add meg a szolgáltatót, a fogyasztás **mértékegységét** (kWh, m³…) és a **pénznemet**.',
        },
        {
          list: [
            '**Kategóriák**: villany, gáz, víz, fűtés, telefon, kábeltévé, internet, online tárhely, Xbox, Microsoft, Apple, Steam vagy **Egyéb** bármi másra.',
            'Jelöld be az **Egyéni mérőóra kötelező** lehetőséget, ha több lakás osztozik egy bekötésen, és mindegyiknek saját mérőórája van: ekkor mindenki minden számlához fényképet küld a mérőórájáról, és a számlát fogyasztás szerint osztjuk el.',
            'Enélkül (előfizetések, internet…) a számlát egyenlően osztjuk el.',
          ],
        },
        {
          p: 'A **Számlák** fül kategóriánként mutatja a közműveidet, az utolsó számla állapotával és a még fennálló tartozással.',
        },
        {
          p: 'Gyorsabban: az **Elérhető közműszolgáltatások keresése** (az **Új** fülön) egyszer megosztja a helyzetedet, vagy a profilod címét használja, és felsorolja az országodban és megyédben szokásos közműveket a valószínű szolgáltatóval: az áram, a gáz, a víz és az internet be van pipálva. Módosíts szolgáltatót, vagy vedd ki, ami nincs, majd koppints a **Hozzáadás** gombra. Javaslatok egyelőre Romániához, Németországhoz és Magyarországhoz vannak; a helyzetedet nem mentjük el.',
        },
      ],
    },
    {
      id: 'sharing',
      title: '3. Közmű megosztása',
      blocks: [
        {
          steps: [
            'Nyisd meg a közművet, és válaszd a **Megosztás és tagok** lehetőséget.',
            'Küldd el a **meghívó linket** vagy a **kódot**, olvastasd be a **QR-kódot**, vagy egy kattintással adj hozzá embereket a **DevQuake-ajánlásaid** közül.',
            'Megnyitják a linket, és a **Csatlakozás** gombot választják. A csatlakozás hónapjától osztoznak a számlákon.',
          ],
        },
        {
          tip: 'Más nem látja a közműveidet és számláidat, csak a közmű tagjai. Az **Új link** után a régi link és kód nem működik.',
        },
        {
          p: 'Olyan családtagnak, akinek csak látnia kell a számlákat: a **Megosztás és tagok** oldalon jelöld be mellette a **Csak megtekintés** lehetőséget. Minden számlát és annak részleteit látja, de nincs része, és nem fizet semmit.',
        },
      ],
    },
    {
      id: 'bills',
      title: '4. Számla hozzáadása',
      blocks: [
        {
          steps: [
            'Ha megjön a szolgáltató számlája, nyisd meg a közművet, és válaszd a **Számla hozzáadása** lehetőséget.',
            'Válaszd ki a szolgáltató **PDF-jét**. Az alkalmazás megpróbálja kiolvasni belőle a **végösszeget**, a **fogyasztást**, az **egységárat** és a **fizetési határidőt**.',
            'Ellenőrizd, mit talált; amit nem tudott kiolvasni, azt ugyanabban az űrlapban írd be.',
            'Jelöld be a **Kifizettem a szolgáltatót** lehetőséget, ha fizettél.',
          ],
        },
        {
          tip: 'Ha a számlán nincs egységár, az alkalmazás a végösszeg ÷ fogyasztás értéket használja. A beszkennelt PDF-ekben nincs olvasható szöveg: írd be az értékeket.',
        },
        {
          p: 'A számlákat csak a közmű kezelője (aki létrehozta és fizeti a szolgáltatót) adhatja hozzá, módosíthatja vagy törölheti.',
        },
      ],
    },
    {
      id: 'readings',
      title: '5. Mérőállások',
      blocks: [
        {
          steps: [
            'Nyisd meg a számlát, és keresd meg **A mérőállásod** részt.',
            'Készíts közelről éles **fényképet a mérőóráról**. Az alkalmazás a készülékeden megpróbálja kiolvasni belőle a mérőállást.',
            'Ellenőrizd a **jelenlegi mérőállást** (vagy írd be). Az **előző mérőállás** a legutóbbi leolvasásodból jön; a fogyasztás a kettő különbsége.',
            'Válaszd a **Mérőállás mentése** gombot.',
          ],
        },
        {
          tip: 'A közmű minden tagja megnyithatja a mérőóra-fényképeket, hogy a mérőállások ellenőrizhetők legyenek. A kezelő valaki helyett is beírhatja a mérőállást.',
        },
        {
          p: 'A kamerához használd a **Fénykép készítése**, egy már elkészült fotóhoz a **Választás a galériából** gombot.',
        },
      ],
    },
    {
      id: 'split',
      title: '6. Hogyan oszlik el a számla',
      blocks: [
        {
          list: [
            'Egyéni mérőórákkal mindenki **a saját fogyasztása × egységárat** fizeti.',
            'Ha minden mérőállás megvan, és nem fedik le a teljes számlát (közös területek, veszteségek, alapdíjak), **a maradékot egyenlően osztjuk el** mindenki között, a kezelőt is beleértve. Ha a mérőállások összege több a számlánál, a különbözetet egyenlően vonjuk le.',
            'Mérőórák nélkül a számlát **egyenlően osztjuk el**.',
            'A nem osztható filléreket a kezelő viseli, így a részek mindig pontosan kiadják a számlát.',
          ],
        },
      ],
    },
    {
      id: 'payments',
      title: '7. Fizetések és átvitel',
      blocks: [
        {
          tip: 'Minden közös költség egy helyen: ha a **Közös kiadások** össze van kapcsolva, a kezelő a **számla hozzáadásával** egy kiadáscsoportba teheti, mindenki pontos részével, általa fizetve. A kétszeri hozzáadás nem változtat semmit.',
        },
        {
          p: 'Az alkalmazás nem mozgat pénzt: mindenki készpénzzel, kártyával vagy más módon fizet a kezelőnek, aki a **kapott összeget** rögzíti a számlánál.',
        },
        {
          list: [
            '**Többet** fizetett a kértnél: a többletet levonjuk ugyanannak a közműnek a következő számlájából.',
            '**Kevesebbet** fizetett: a hiányzó összeget hozzáadjuk a következő számlához.',
            '✔ **Zöld pipa**: a szolgáltató ki van fizetve, és mindenki kifizette a részét.',
            '⚠ **Figyelmeztetés**: a fizetések még nem fedezik a számlát. ⏳ **Homokóra**: még hiányoznak mérőállások.',
          ],
        },
        {
          p: 'A számlához mindenki **hozzászólhat**, aki osztozik rajta. A kezelő törölhet egy számlát vagy az egész közművet.',
        },
        {
          tip: 'Amikor a kezelő visszaigazol egy fizetést, az zárolva lesz (csak a DevQuake adminisztrátora módosíthatja), a fizető pedig e-mailt kap a teljes számláról, a saját fogyasztásáról és részéről, valamint egy linket a számlához, ahol a szolgáltató PDF-je megnyitható.',
        },
      ],
    },
    {
      id: 'overview',
      title: '8. Naptár és statisztika',
      blocks: [
        {
          list: [
            'A **Naptár** a saját részedet mutatja hónapról hónapra vagy egy egész évre: a fogyasztásodat, a részedet és amit kifizettél, minden számlánál.',
            'A **Statisztika** kategóriánként mutatja a fogyasztásodat, a részedet és az egységárat hónapról hónapra, éves összesítéssel és átlagárral. Minden grafikon táblázatként is megjeleníthető.',
          ],
        },
      ],
    },
    {
      id: 'privacy',
      title: '9. Az adataid',
      blocks: [
        {
          p: 'A neved, címed, mérőállásaid, mérőóra-fényképeid és számláid csak azok látják, akikkel közművet osztasz meg. A címjavaslatokhoz, amit a megye, település és utca mezőbe gépelsz, a DevQuake továbbítja a Photonnak (komoot), az OpenStreetMap keresőszolgáltatásának; rólad semmi mást nem. Ha törlöd a DevQuake-fiókodat, vagy leiratkozol az alkalmazásról, minden adatod törlődik: a profilod, mérőállásaid, fényképeid, fizetéseid és megjegyzéseid, valamint az általad kezelt közművek az összes számlájukkal és PDF-jükkel együtt.',
        },
      ],
    },
  ],
  questions: 'Kérdésed vagy ötleted van? Írj ide: {email}.',
  back: '← Vissza a számláidhoz',
};

export const MANUAL: Record<Locale, Manual> = { en, de, ro, hu };
