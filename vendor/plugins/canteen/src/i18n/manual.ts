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
  metaTitle: 'User manual · Social canteen',
  metaDescription:
    'How to run a social canteen with the app: people and their papers, menus by diet, the kitchen sheet, delivery routes, the drivers’ phone view, the medical file, the waiting list and social work, reports and Excel.',
  ogTitle: 'Social canteen: user manual',
  cta: 'Want to try it? Social canteen is an app for DevQuake members. {link}, then open the app and make a demo organisation.',
  ctaLink: 'Create an account or sign in',
  kicker: 'Social canteen · User manual',
  title: 'How to run your canteen with Social canteen',
  intro:
    'Social canteen keeps everything an organisation that cares for older people needs in one place: the people you care for, menus and portions, delivery routes, the medical file, the waiting list and the work of the social workers. Each member of the team sees only what their role needs. This manual walks you through it, chapter by chapter.',
  contents: 'Contents',
  sections: [
    {
      id: 'start',
      title: '1. Getting started',
      blocks: [
        {
          steps: [
            'Sign in on {host} (or create an account and confirm your email).',
            'Open **Social canteen** from your apps. People invited by an organiser use the app free of charge.',
            'On the start page, **create an organisation**, or press **Try it with demo data** to explore a ready-made canteen first.',
          ],
        },
        {
          tip: 'In the demo you can switch your role with **View as** in the header and see the app as the kitchen, a driver or the medical staff would. Tips (💡 in the header) explain each page.',
        },
      ],
    },
    {
      id: 'organisation',
      title: '2. Your organisation',
      blocks: [
        { p: 'Organisers set up the organisation in the **Organisation** panel of its main page:' },
        {
          list: [
            '**Name, logo and description**: they appear on every printout and, if you want, on a public page of the organisation.',
            '**Contact email**: shown on the organisation’s banner and in invitation emails.',
            '**Header look**: font, background colour or picture, text colour and alignment of the header on your pages and every printout, report and PDF, with a live preview.',
            '**Kitchen address and minutes per stop**: the starting point and pace of the delivery routes.',
            '**Delete the organisation**: removes everything about it, after you type its name.',
          ],
        },
      ],
    },
    {
      id: 'staff',
      title: '3. Staff and roles',
      blocks: [
        {
          p: 'Every member of the team has one or more roles: **organiser** (everything, including staff and personal numbers), **coordinator** (people, menus, routes), **kitchen** (the kitchen sheet), **driver** (their own route) and **medical staff** (the medical file). Someone can hold several roles, even all of them; they see everything each role allows.',
        },
        {
          steps: [
            'Open **Staff** (from the Organisation panel) and choose the role of the new person under **Invite someone**.',
            'Send the link, show the **QR code** or send it by **email**. Each link works once, for seven days.',
            'Once they joined, tick their roles under **Roles of …**; ticking saves at once. Tick **Social worker** for those who do social work, also yourself (“I’m a social worker”).',
          ],
        },
        {
          tip: 'An organisation always keeps at least one organiser, and everyone keeps at least one role. “Invitations sent” lists the last six months with who accepted and when.',
        },
      ],
    },
    {
      id: 'people',
      title: '4. The people you care for',
      blocks: [
        {
          p: 'Under **People**, add each person as a **resident** (lives in your home) or **home delivery**, with address, phone, a contact in the family, diet, allergies, delivery days and the time window of the delivery.',
        },
        {
          list: [
            '**Photo and ID card**: upload pictures; the app reads the ID card on your device and proposes name, personal number, address and expiry date for you to check.',
            '**Personal numbers and documents** are stored encrypted and only organisers see them; every look is written in the access log at the bottom of the profile.',
            '**Incidents**: short notes of what happened (a fall, a missed delivery).',
            '**Birthdays** of the week show at the top; the calendar has all of them.',
            '**Status**: active, paused, waiting (on the waiting list) or ended.',
          ],
        },
        { tip: 'A profile marked “Photo or ID card missing” still needs that picture.' },
      ],
    },
    {
      id: 'meals',
      title: '5. Menus and the kitchen',
      blocks: [
        {
          p: 'Under **Menus**, set the residents’ **meal times** once, then write the menu of each day and meal, one dish per line. Add a **diet variant** where a diet eats something else.',
        },
        {
          list: [
            'The **kitchen sheet** counts the portions per meal and diet from who really eats that day (people in hospital are left out).',
            '**Copy** a day or a week to save typing.',
            'Connected to **Cookbook**, pick recipes as dishes: their ingredients are scaled to the portions. With **Shopping**, send the week’s purchasing as one list.',
          ],
        },
      ],
    },
    {
      id: 'routes',
      title: '6. Delivery routes',
      blocks: [
        {
          p: 'Under **Routes**, add your **drivers** with their weekdays, shift and driving licence (the app warns before it expires). Then plan the deliveries:',
        },
        {
          steps: [
            '**Driver areas**: let the app propose who delivers to whom, so routes do not cross; move people between drivers and save.',
            '**Build the routes** for a day, a week or a month from the areas: each driver gets the people of their area, nearest first.',
            'On a day, reorder stops by hand or press **Compute the order from the map**: every delivery stays in its time window.',
            '**Print** the route sheets of a day, a week or a month, for one driver or all.',
          ],
        },
        { tip: 'Ticks drivers already gave stay when you rebuild or reorder a route.' },
      ],
    },
    {
      id: 'drivers',
      title: '7. For drivers',
      blocks: [
        {
          p: 'A driver with an account opens the organisation on **My route**, on the phone’s browser or in the Android app:',
        },
        {
          list: [
            'The stops in order, with address, phone, time window and what is in each package.',
            'A **map** with numbered pins.',
            'A **tick** and a **note** for each delivery; organisers see the progress within seconds.',
          ],
        },
      ],
    },
    {
      id: 'medical',
      title: '8. The medical file',
      blocks: [
        {
          p: 'Only the **medical staff** role opens the medical file (a button on each profile and the **Medication** page). Everything in it is stored encrypted.',
        },
        {
          list: [
            '**Profile**: conditions, family doctor, blood type, notes.',
            '**Medications** with their times; on **Medication**, tick the doses given each day.',
            '**Notes** and **medical papers** (PDF or photo).',
            '**Hospital stays**: while someone is in hospital, the kitchen and the routes leave them out, and everyone else only sees “In hospital”.',
          ],
        },
      ],
    },
    {
      id: 'social',
      title: '9. Social work and the waiting list',
      blocks: [
        { p: 'The **Social work** page is for organisers and staff ticked as social workers.' },
        {
          steps: [
            'Under **Places**, organisers set the maximum number of **residents** and of **home deliveries** (empty: no limit).',
            'A **new applicant** goes on the **waiting list**, which shows how long each person has waited and their priority.',
            '**Plan a visit** (assessment, home visit, follow-up) for yourself or a colleague; afterwards press **Done** and write what happened.',
            'On the person’s profile, fill in the **social assessment questionnaire**: living situation, housing, income, mobility, help, needs and priority. Earlier answers stay in the history.',
            'When a place is free, press **Admit**. “Back to the waiting list” and “End the service” are on the profile.',
          ],
        },
        {
          list: [
            'Several social workers split the work: pick the **responsible social worker** next to each name.',
            '**Mine / Everyone** shows only your people and visits, or all of them.',
          ],
        },
      ],
    },
    {
      id: 'reports',
      title: '10. Reports',
      blocks: [
        {
          p: 'Organisers open **Reports** to see what the team did: pick the dates, then one person or a group (all drivers, the kitchen, all social workers, everyone) and, if you like, one area. The table counts the changes per person and area; the list below shows each change with its time.',
        },
        {
          tip: 'For the medical area, reports never name the person concerned. Activity is kept for two years.',
        },
      ],
    },
    {
      id: 'excel',
      title: '11. Excel in and out',
      blocks: [
        {
          p: 'In the **Organisation** panel, under **Excel**, download a workbook with people, menus, drivers, routes and staff. Change people, menus or drivers in Excel and upload the file again: it is checked in full first, and nothing is saved while one row is wrong (the message names the sheet and row).',
        },
        {
          tip: 'Rows without an id are added; nothing is deleted by an upload. The file holds personal numbers, so keep it safe.',
        },
      ],
    },
    {
      id: 'print',
      title: '12. Printing',
      blocks: [
        {
          p: 'Every page prints cleanly (Ctrl+P, or the **Print** buttons): the printout starts with the organisation’s logo, name and contact, and says who printed it and when.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '13. Privacy and safety',
      blocks: [
        {
          list: [
            'Each role sees only what it needs; people outside the organisation do not even see that it exists.',
            'Personal numbers, documents, the medical file, visit notes and questionnaires are stored encrypted.',
            'Opening personal numbers and papers is logged for organisers.',
            'The people you care for are not DevQuake users: they belong to your organisation and are deleted by its organisers.',
          ],
        },
      ],
    },
  ],
  questions: 'Questions or ideas? Write to {email}.',
  back: 'Back to Social canteen',
};

const de: Manual = {
  metaTitle: 'Anleitung · Sozialküche',
  metaDescription:
    'So führst du eine Sozialküche mit der App: Personen und ihre Dokumente, Speisepläne nach Kostform, der Küchenzettel, Lieferrouten, die Handyansicht der Fahrer, die medizinische Akte, Warteliste und Sozialarbeit, Berichte und Excel.',
  ogTitle: 'Sozialküche: Anleitung',
  cta: 'Neugierig? Die Sozialküche ist eine App für DevQuake-Mitglieder. {link}, dann öffne die App und erstelle eine Demo-Organisation.',
  ctaLink: 'Konto erstellen oder anmelden',
  kicker: 'Sozialküche · Anleitung',
  title: 'So führst du deine Küche mit der Sozialküche',
  intro:
    'Die Sozialküche hält alles, was eine Organisation zur Versorgung älterer Menschen braucht, an einem Ort: die Menschen, die ihr versorgt, Speisepläne und Portionen, Lieferrouten, die medizinische Akte, die Warteliste und die Arbeit der Sozialarbeit. Jedes Teammitglied sieht nur, was seine Rolle braucht. Diese Anleitung führt dich Kapitel für Kapitel hindurch.',
  contents: 'Inhalt',
  sections: [
    {
      id: 'start',
      title: '1. Erste Schritte',
      blocks: [
        {
          steps: [
            'Melde dich auf {host} an (oder erstelle ein Konto und bestätige deine E-Mail).',
            'Öffne die **Sozialküche** bei deinen Apps. Wer von einem Organisator eingeladen wird, nutzt die App kostenlos.',
            'Auf der Startseite **erstellst du eine Organisation** oder drückst **Mit Demodaten ausprobieren**, um zuerst eine fertige Küche zu erkunden.',
          ],
        },
        {
          tip: 'In der Demo wechselst du deine Rolle mit **Ansehen als** im Kopf und siehst die App so wie die Küche, ein Fahrer oder die Pflege. Tipps (💡 im Kopf) erklären jede Seite.',
        },
      ],
    },
    {
      id: 'organisation',
      title: '2. Deine Organisation',
      blocks: [
        {
          p: 'Organisatoren richten die Organisation im Feld **Organisation** auf ihrer Hauptseite ein:',
        },
        {
          list: [
            '**Name, Logo und Beschreibung**: Sie stehen auf jedem Ausdruck und, wenn du willst, auf einer öffentlichen Seite der Organisation.',
            '**Kontakt-E-Mail**: im Banner der Organisation und in Einladungs-E-Mails.',
            '**Aussehen des Kopfs**: Schrift, Hintergrundfarbe oder -bild, Textfarbe und Ausrichtung des Kopfs auf euren Seiten und auf jedem Ausdruck, Bericht und PDF, mit Vorschau.',
            '**Adresse der Küche und Minuten pro Stopp**: Startpunkt und Takt der Lieferrouten.',
            '**Organisation löschen**: entfernt alles, nachdem du ihren Namen eingetippt hast.',
          ],
        },
      ],
    },
    {
      id: 'staff',
      title: '3. Personal und Rollen',
      blocks: [
        {
          p: 'Jedes Teammitglied hat eine oder mehrere Rollen: **Organisation** (alles, auch Team und persönliche Nummern), **Koordination** (Personen, Speisepläne, Routen), **Küche** (der Küchenzettel), **Fahrer** (die eigene Route) und **Pflege/Medizin** (die medizinische Akte). Eine Person kann mehrere Rollen haben, auch alle; sie sieht alles, was jede Rolle erlaubt.',
        },
        {
          steps: [
            'Öffne **Personal** (über das Feld Organisation) und wähle unter **Jemanden einladen** die Rolle der neuen Person.',
            'Schick den Link, zeig den **QR-Code** oder schick ihn per **E-Mail**. Jeder Link gilt einmal, sieben Tage lang.',
            'Ist die Person beigetreten, hakst du unter **Rollen von …** ihre Rollen an; ein Häkchen speichert sofort. Hake **Sozialarbeit** bei denen an, die Sozialarbeit machen, auch bei dir selbst („Ich mache Sozialarbeit“).',
          ],
        },
        {
          tip: 'Eine Organisation behält immer mindestens einen Organisator, und jede Person behält mindestens eine Rolle. „Gesendete Einladungen“ zeigt die letzten sechs Monate mit wer wann angenommen hat.',
        },
      ],
    },
    {
      id: 'people',
      title: '4. Die Menschen, die ihr versorgt',
      blocks: [
        {
          p: 'Unter **Personen** legst du jede Person als **Bewohner/in** (lebt in eurem Heim) oder **Lieferung nach Hause** an, mit Adresse, Telefon, einer Kontaktperson aus der Familie, Kostform, Allergien, Liefertagen und dem Zeitfenster der Lieferung.',
        },
        {
          list: [
            '**Foto und Ausweis**: Lade Bilder hoch; die App liest den Ausweis auf deinem Gerät und schlägt Name, persönliche Nummer, Adresse und Ablaufdatum zur Prüfung vor.',
            '**Persönliche Nummern und Dokumente** werden verschlüsselt gespeichert und nur Organisatoren sehen sie; jeder Blick steht im Zugriffsprotokoll unten im Profil.',
            '**Vorfälle**: kurze Notizen, was passiert ist (ein Sturz, eine verpasste Lieferung).',
            '**Geburtstage** der Woche stehen oben; der Kalender hat alle.',
            '**Status**: aktiv, pausiert, wartend (auf der Warteliste) oder beendet.',
          ],
        },
        { tip: 'Bei einem Profil mit „Foto oder Ausweis fehlt“ fehlt noch dieses Bild.' },
      ],
    },
    {
      id: 'meals',
      title: '5. Speisepläne und Küche',
      blocks: [
        {
          p: 'Unter **Speisepläne** legst du einmal die **Essenszeiten** der Bewohner fest und schreibst dann den Speiseplan jedes Tages und jeder Mahlzeit, ein Gericht pro Zeile. Ergänze eine **Kostform-Variante**, wo eine Kostform etwas anderes isst.',
        },
        {
          list: [
            'Der **Küchenzettel** zählt die Portionen je Mahlzeit und Kostform danach, wer an dem Tag wirklich isst (wer im Krankenhaus ist, fehlt).',
            '**Kopiere** einen Tag oder eine Woche, um Tipparbeit zu sparen.',
            'Mit dem **Kochbuch** verbunden, wählst du Rezepte als Gerichte: Ihre Zutaten werden auf die Portionen umgerechnet. Mit der **Einkaufsliste** schickst du den Einkauf der Woche als eine Liste.',
          ],
        },
      ],
    },
    {
      id: 'routes',
      title: '6. Lieferrouten',
      blocks: [
        {
          p: 'Unter **Routen** legst du deine **Fahrer** mit Wochentagen, Schicht und Führerschein an (die App warnt vor dem Ablauf). Dann planst du die Lieferungen:',
        },
        {
          steps: [
            '**Fahrergebiete**: Lass die App vorschlagen, wer wen beliefert, damit sich Routen nicht kreuzen; verschiebe Personen zwischen Fahrern und speichere.',
            '**Routen erstellen** für einen Tag, eine Woche oder einen Monat aus den Gebieten: Jeder Fahrer bekommt die Personen seines Gebiets, die nächsten zuerst.',
            'An einem Tag ordnest du Stopps von Hand oder drückst **Reihenfolge per Karte berechnen**: Jede Lieferung bleibt in ihrem Zeitfenster.',
            '**Drucke** die Routenblätter eines Tages, einer Woche oder eines Monats, für einen Fahrer oder alle.',
          ],
        },
        {
          tip: 'Häkchen, die Fahrer schon gesetzt haben, bleiben, wenn du eine Route neu baust oder umsortierst.',
        },
      ],
    },
    {
      id: 'drivers',
      title: '7. Für Fahrer',
      blocks: [
        {
          p: 'Ein Fahrer mit Konto öffnet die Organisation auf **Meine Route**, im Browser des Handys oder in der Android-App:',
        },
        {
          list: [
            'Die Stopps der Reihe nach, mit Adresse, Telefon, Zeitfenster und Inhalt jedes Pakets.',
            'Eine **Karte** mit nummerierten Stecknadeln.',
            'Ein **Häkchen** und eine **Notiz** je Lieferung; die Organisatoren sehen den Fortschritt in Sekunden.',
          ],
        },
      ],
    },
    {
      id: 'medical',
      title: '8. Die medizinische Akte',
      blocks: [
        {
          p: 'Nur die Rolle **Pflege/Medizin** öffnet die medizinische Akte (ein Knopf in jedem Profil und die Seite **Medikamente**). Alles darin wird verschlüsselt gespeichert.',
        },
        {
          list: [
            '**Profil**: Erkrankungen, Hausarzt, Blutgruppe, Notizen.',
            '**Medikamente** mit ihren Zeiten; unter **Medikamente** hakst du die gegebenen Gaben jedes Tages ab.',
            '**Notizen** und **medizinische Dokumente** (PDF oder Foto).',
            '**Krankenhausaufenthalte**: Solange jemand im Krankenhaus ist, lassen Küche und Routen die Person aus, und alle anderen sehen nur „Im Krankenhaus“.',
          ],
        },
      ],
    },
    {
      id: 'social',
      title: '9. Sozialarbeit und Warteliste',
      blocks: [
        {
          p: 'Die Seite **Sozialarbeit** ist für Organisatoren und für Teammitglieder, die als Sozialarbeit markiert sind.',
        },
        {
          steps: [
            'Unter **Plätze** legen Organisatoren die Höchstzahl an **Bewohnern** und an **Lieferungen nach Hause** fest (leer: keine Grenze).',
            'Eine **neue Anfrage** kommt auf die **Warteliste**, die zeigt, wie lange jede Person wartet und wie dringend es ist.',
            '**Plane einen Besuch** (Abklärung, Hausbesuch, Nachbesuch) für dich oder eine Kollegin; danach drückst du **Erledigt** und schreibst, was war.',
            'Im Profil der Person füllst du den **Fragebogen zur sozialen Abklärung** aus: Lebenssituation, Wohnen, Einkommen, Beweglichkeit, Hilfe, Bedarf und Dringlichkeit. Frühere Antworten bleiben im Verlauf.',
            'Ist ein Platz frei, drückst du **Aufnehmen**. „Zurück auf die Warteliste“ und „Dienst beenden“ stehen im Profil.',
          ],
        },
        {
          list: [
            'Mehrere Sozialarbeiterinnen und Sozialarbeiter teilen sich die Arbeit: Wähle neben jedem Namen die **zuständige Person**.',
            '**Meine / Alle** zeigt nur deine Personen und Besuche oder alle.',
          ],
        },
      ],
    },
    {
      id: 'reports',
      title: '10. Berichte',
      blocks: [
        {
          p: 'Organisatoren öffnen **Berichte**, um zu sehen, was das Team getan hat: Wähle die Tage, dann eine Person oder eine Gruppe (alle Fahrer, die Küche, alle in der Sozialarbeit, alle) und, wenn du willst, einen Bereich. Die Tabelle zählt die Änderungen je Person und Bereich; die Liste darunter zeigt jede Änderung mit Uhrzeit.',
        },
        {
          tip: 'Im medizinischen Bereich nennen Berichte nie die betroffene Person. Die Aktivität wird zwei Jahre aufbewahrt.',
        },
      ],
    },
    {
      id: 'excel',
      title: '11. Excel hin und zurück',
      blocks: [
        {
          p: 'Im Feld **Organisation** lädst du unter **Excel** eine Arbeitsmappe mit Personen, Speiseplänen, Fahrern, Routen und Team herunter. Ändere Personen, Speisepläne oder Fahrer in Excel und lade die Datei wieder hoch: Sie wird zuerst vollständig geprüft, und solange eine Zeile falsch ist, wird nichts gespeichert (die Meldung nennt Blatt und Zeile).',
        },
        {
          tip: 'Zeilen ohne ID werden hinzugefügt; ein Hochladen löscht nie etwas. Die Datei enthält persönliche Nummern, bewahre sie sicher auf.',
        },
      ],
    },
    {
      id: 'print',
      title: '12. Drucken',
      blocks: [
        {
          p: 'Jede Seite druckt sauber (Strg+P oder die **Drucken**-Knöpfe): Der Ausdruck beginnt mit Logo, Name und Kontakt der Organisation und sagt, wer ihn wann gedruckt hat.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '13. Datenschutz und Sicherheit',
      blocks: [
        {
          list: [
            'Jede Rolle sieht nur, was sie braucht; Menschen außerhalb der Organisation sehen nicht einmal, dass es sie gibt.',
            'Persönliche Nummern, Dokumente, die medizinische Akte, Besuchsnotizen und Fragebögen werden verschlüsselt gespeichert.',
            'Das Öffnen persönlicher Nummern und Dokumente wird für die Organisatoren protokolliert.',
            'Die Menschen, die ihr versorgt, sind keine DevQuake-Nutzer: Sie gehören zu eurer Organisation und werden von ihren Organisatoren gelöscht.',
          ],
        },
      ],
    },
  ],
  questions: 'Fragen oder Ideen? Schreib an {email}.',
  back: 'Zurück zur Sozialküche',
};

const ro: Manual = {
  metaTitle: 'Manual de utilizare · Cantina socială',
  metaDescription:
    'Cum conduci o cantină socială cu aplicația: persoanele și actele lor, meniuri pe regimuri, fișa bucătăriei, trasee de livrare, telefonul șoferilor, dosarul medical, lista de așteptare și asistența socială, rapoarte și Excel.',
  ogTitle: 'Cantina socială: manual de utilizare',
  cta: 'Vrei să o încerci? Cantina socială este o aplicație pentru membrii DevQuake. {link}, apoi deschide aplicația și creează o organizație demonstrativă.',
  ctaLink: 'Creează un cont sau conectează-te',
  kicker: 'Cantina socială · Manual de utilizare',
  title: 'Cum îți conduci cantina cu Cantina socială',
  intro:
    'Cantina socială ține într-un singur loc tot ce îi trebuie unei organizații care are grijă de vârstnici: persoanele de care aveți grijă, meniurile și porțiile, traseele de livrare, dosarul medical, lista de așteptare și munca asistenților sociali. Fiecare membru al echipei vede doar ce îi trebuie rolului său. Manualul te poartă prin aplicație, capitol cu capitol.',
  contents: 'Cuprins',
  sections: [
    {
      id: 'start',
      title: '1. Primii pași',
      blocks: [
        {
          steps: [
            'Conectează-te pe {host} (sau creează un cont și confirmă-ți emailul).',
            'Deschide **Cantina socială** din aplicațiile tale. Cei invitați de un organizator folosesc aplicația gratuit.',
            'Pe pagina de start **creează o organizație** sau apasă **Încearcă cu date demo** ca să explorezi mai întâi o cantină gata făcută.',
          ],
        },
        {
          tip: 'În demonstrație îți poți schimba rolul cu **Vezi ca** din antet și vezi aplicația așa cum o vede bucătăria, un șofer sau personalul medical. Sfaturile (💡 din antet) explică fiecare pagină.',
        },
      ],
    },
    {
      id: 'organisation',
      title: '2. Organizația ta',
      blocks: [
        {
          p: 'Organizatorii configurează organizația în panoul **Organizația** de pe pagina ei principală:',
        },
        {
          list: [
            '**Nume, siglă și descriere**: apar pe fiecare tipăritură și, dacă vrei, pe o pagină publică a organizației.',
            '**Email de contact**: apare pe bannerul organizației și în emailurile de invitație.',
            '**Aspectul antetului**: fontul, culoarea sau imaginea de fundal, culoarea textului și alinierea antetului pe paginile voastre și pe fiecare tipăritură, raport și PDF, cu previzualizare.',
            '**Adresa bucătăriei și minutele pe oprire**: punctul de plecare și ritmul traseelor de livrare.',
            '**Ștergerea organizației**: elimină tot ce ține de ea, după ce îi scrii numele.',
          ],
        },
      ],
    },
    {
      id: 'staff',
      title: '3. Personal și roluri',
      blocks: [
        {
          p: 'Fiecare membru al echipei are unul sau mai multe roluri: **organizator** (tot, inclusiv personalul și datele de identificare), **coordonator** (persoane, meniuri, trasee), **bucătărie** (fișa bucătăriei), **șofer** (propriul traseu) și **personal medical** (dosarul medical). Cineva poate avea mai multe roluri, chiar pe toate; vede tot ce permite fiecare rol.',
        },
        {
          steps: [
            'Deschide **Personal** (din panoul Organizația) și alege rolul noii persoane la **Invită pe cineva**.',
            'Trimite linkul, arată **codul QR** sau trimite-l prin **email**. Fiecare link merge o singură dată, timp de șapte zile.',
            'După ce s-a alăturat, bifează-i rolurile la **Rolurile lui …**; bifa se salvează imediat. Bifează **Asistent social** la cei care fac asistență socială, inclusiv la tine („Sunt asistent social”).',
          ],
        },
        {
          tip: 'O organizație păstrează mereu cel puțin un organizator, iar fiecare persoană păstrează cel puțin un rol. „Invitații trimise” arată ultimele șase luni, cu cine a acceptat și când.',
        },
      ],
    },
    {
      id: 'people',
      title: '4. Persoanele de care aveți grijă',
      blocks: [
        {
          p: 'La **Persoane**, adaugă fiecare persoană ca **rezident** (locuiește în cămin) sau **livrare la domiciliu**, cu adresă, telefon, o persoană de contact din familie, regim, alergii, zilele de livrare și intervalul orar al livrării.',
        },
        {
          list: [
            '**Fotografia și buletinul**: încarcă pozele; aplicația citește buletinul pe dispozitivul tău și îți propune numele, CNP-ul, adresa și data expirării spre verificare.',
            '**Datele de identificare și documentele** sunt păstrate criptat și doar organizatorii le văd; fiecare consultare e scrisă în jurnalul de acces de la finalul profilului.',
            '**Incidente**: note scurte despre ce s-a întâmplat (o căzătură, o livrare ratată).',
            '**Zilele de naștere** ale săptămânii apar sus; calendarul le are pe toate.',
            '**Starea**: activ, suspendat, în așteptare (pe lista de așteptare) sau încheiat.',
          ],
        },
        { tip: 'Un profil cu „Lipsește fotografia sau buletinul” mai are nevoie de acea poză.' },
      ],
    },
    {
      id: 'meals',
      title: '5. Meniuri și bucătărie',
      blocks: [
        {
          p: 'La **Meniuri**, stabilește o dată **orele de masă** ale rezidenților, apoi scrie meniul fiecărei zile și mese, câte un fel pe rând. Adaugă o **variantă de regim** acolo unde un regim mănâncă altceva.',
        },
        {
          list: [
            'La **Bucătărie**, fișa numără porțiile pe masă și regim după cine mănâncă de fapt în ziua aceea (cei internați lipsesc).',
            '**Copiază** o zi sau o săptămână ca să scrii mai puțin.',
            'Legat de **Cartea de bucate**, alegi rețete ca feluri de mâncare: ingredientele lor se calculează pe porții. Cu **Cumpărăturile**, trimiți achizițiile săptămânii ca o singură listă.',
          ],
        },
      ],
    },
    {
      id: 'routes',
      title: '6. Trasee de livrare',
      blocks: [
        {
          p: 'La **Trasee**, adaugă **șoferii** cu zilele, tura și permisul de conducere (aplicația te avertizează înainte să expire). Apoi planifică livrările:',
        },
        {
          steps: [
            '**Zonele șoferilor**: lasă aplicația să propună cine livrează cui, ca traseele să nu se încrucișeze; mută persoane între șoferi și salvează.',
            '**Construiește traseele** pentru o zi, o săptămână sau o lună din zone: fiecare șofer primește persoanele din zona lui, cele mai apropiate întâi.',
            'Într-o zi, reordonează opririle de mână sau apasă **Calculează ordinea pe hartă**: fiecare livrare rămâne în intervalul ei.',
            '**Tipărește** foile de traseu pentru o zi, o săptămână sau o lună, pentru un șofer sau pentru toți.',
          ],
        },
        { tip: 'Bifele date deja de șoferi rămân când reconstruiești sau reordonezi un traseu.' },
      ],
    },
    {
      id: 'drivers',
      title: '7. Pentru șoferi',
      blocks: [
        {
          p: 'Un șofer cu cont deschide organizația la **Traseul meu**, în browserul telefonului sau în aplicația Android:',
        },
        {
          list: [
            'Opririle în ordine, cu adresă, telefon, interval orar și ce e în fiecare pachet.',
            'O **hartă** cu repere numerotate.',
            'O **bifă** și o **notă** pentru fiecare livrare; organizatorii văd progresul în câteva secunde.',
          ],
        },
      ],
    },
    {
      id: 'medical',
      title: '8. Dosarul medical',
      blocks: [
        {
          p: 'Doar rolul de **personal medical** deschide dosarul medical (un buton pe fiecare profil și pagina **Medicație**). Tot ce e în el se păstrează criptat.',
        },
        {
          list: [
            '**Profil**: afecțiuni, medicul de familie, grupa de sânge, note.',
            '**Medicamente** cu orele lor; la **Medicație** bifezi dozele date în fiecare zi.',
            '**Note** și **acte medicale** (PDF sau fotografie).',
            '**Internări**: cât timp cineva e internat, bucătăria și traseele îl lasă deoparte, iar ceilalți văd doar „Internat(ă)”.',
          ],
        },
      ],
    },
    {
      id: 'social',
      title: '9. Asistență socială și lista de așteptare',
      blocks: [
        {
          p: 'Pagina **Asistență socială** e pentru organizatori și pentru cei bifați ca asistenți sociali.',
        },
        {
          steps: [
            'La **Locuri**, organizatorii stabilesc numărul maxim de **rezidenți** și de **livrări la domiciliu** (gol: fără limită).',
            'Un **solicitant nou** ajunge pe **lista de așteptare**, care arată de cât timp așteaptă fiecare și ce prioritate are.',
            '**Planifică o vizită** (evaluare, vizită la domiciliu, vizită de urmărire) pentru tine sau un coleg; după aceea apasă **Efectuată** și scrie ce s-a întâmplat.',
            'Pe profilul persoanei, completează **chestionarul de evaluare socială**: cu cine locuiește, locuința, venitul, mobilitatea, ajutorul, nevoile și prioritatea. Răspunsurile anterioare rămân în istoric.',
            'Când se eliberează un loc, apasă **Primește**. „Înapoi pe lista de așteptare” și „Încheie serviciul” sunt pe profil.',
          ],
        },
        {
          list: [
            'Mai mulți asistenți sociali își împart munca: alege **asistentul social responsabil** lângă fiecare nume.',
            '**Ale mele / Toate** arată doar persoanele și vizitele tale, sau pe toate.',
          ],
        },
      ],
    },
    {
      id: 'reports',
      title: '10. Rapoarte',
      blocks: [
        {
          p: 'Organizatorii deschid **Rapoarte** ca să vadă ce a făcut echipa: alege zilele, apoi o persoană sau un grup (toți șoferii, bucătăria, toți asistenții sociali, toată lumea) și, dacă vrei, un domeniu. Tabelul numără modificările pe persoană și domeniu; lista de dedesubt arată fiecare modificare cu ora ei.',
        },
        {
          tip: 'Pentru domeniul medical, rapoartele nu numesc niciodată persoana în cauză. Activitatea se păstrează doi ani.',
        },
      ],
    },
    {
      id: 'excel',
      title: '11. Excel la dus și la întors',
      blocks: [
        {
          p: 'În panoul **Organizația**, la **Excel**, descarci un registru cu persoane, meniuri, șoferi, trasee și personal. Modifică persoane, meniuri sau șoferi în Excel și încarcă fișierul înapoi: e verificat întâi în întregime și nu se salvează nimic cât timp un rând e greșit (mesajul spune foaia și rândul).',
        },
        {
          tip: 'Rândurile fără id sunt adăugate; o încărcare nu șterge niciodată nimic. Fișierul conține date de identificare, așa că păstrează-l în siguranță.',
        },
      ],
    },
    {
      id: 'print',
      title: '12. Tipărire',
      blocks: [
        {
          p: 'Fiecare pagină se tipărește curat (Ctrl+P sau butoanele **Tipărește**): tipăritura începe cu sigla, numele și datele de contact ale organizației și spune cine a tipărit-o și când.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '13. Confidențialitate și siguranță',
      blocks: [
        {
          list: [
            'Fiecare rol vede doar ce îi trebuie; cei din afara organizației nici nu află că ea există.',
            'Datele de identificare, documentele, dosarul medical, notele vizitelor și chestionarele sunt păstrate criptat.',
            'Deschiderea datelor de identificare și a actelor e înregistrată pentru organizatori.',
            'Persoanele de care aveți grijă nu sunt utilizatori DevQuake: aparțin organizației voastre și sunt șterse de organizatorii ei.',
          ],
        },
      ],
    },
  ],
  questions: 'Întrebări sau idei? Scrie-ne la {email}.',
  back: 'Înapoi la Cantina socială',
};

const hu: Manual = {
  metaTitle: 'Felhasználói kézikönyv · Szociális konyha',
  metaDescription:
    'Hogyan vezess szociális konyhát az alkalmazással: személyek és irataik, diéták szerinti étlapok, a konyhai lap, kiszállítási útvonalak, a sofőrök telefonos nézete, az egészségügyi lap, várólista és szociális munka, jelentések és Excel.',
  ogTitle: 'Szociális konyha: felhasználói kézikönyv',
  cta: 'Kipróbálnád? A Szociális konyha a DevQuake-tagok alkalmazása. {link}, aztán nyisd meg az alkalmazást, és hozz létre egy bemutató szervezetet.',
  ctaLink: 'Hozz létre fiókot vagy jelentkezz be',
  kicker: 'Szociális konyha · Felhasználói kézikönyv',
  title: 'Így vezesd a konyhádat a Szociális konyhával',
  intro:
    'A Szociális konyha egy helyen tart mindent, amire egy időseket gondozó szervezetnek szüksége van: akikről gondoskodtok, étlapok és adagok, kiszállítási útvonalak, az egészségügyi lap, a várólista és a szociális munkások munkája. A csapat minden tagja csak azt látja, amire a szerepének szüksége van. Ez a kézikönyv fejezetről fejezetre végigvezet rajta.',
  contents: 'Tartalom',
  sections: [
    {
      id: 'start',
      title: '1. Első lépések',
      blocks: [
        {
          steps: [
            'Jelentkezz be a {host} oldalon (vagy hozz létre fiókot, és erősítsd meg az e-mail-címedet).',
            'Nyisd meg a **Szociális konyhát** az alkalmazásaid között. Akit egy szervező meghív, ingyen használja.',
            'A kezdőlapon **hozz létre egy szervezetet**, vagy nyomd meg a **Kipróbálás demóadatokkal** gombot, hogy előbb egy kész konyhát nézz meg.',
          ],
        },
        {
          tip: 'A bemutatóban a fejléc **Megtekintés mint** választójával szerepet válthatsz, és úgy láthatod az alkalmazást, ahogy a konyha, egy sofőr vagy az egészségügyi dolgozók. A tippek (💡 a fejlécben) minden oldalt elmagyaráznak.',
        },
      ],
    },
    {
      id: 'organisation',
      title: '2. A szervezeted',
      blocks: [
        { p: 'A szervezők a szervezet főoldalán, a **Szervezet** panelen állítják be:' },
        {
          list: [
            '**Név, logó és leírás**: minden nyomtatványon szerepelnek, és ha akarod, a szervezet nyilvános oldalán is.',
            '**Kapcsolattartási e-mail**: a szervezet sávjában és a meghívó e-mailekben látszik.',
            '**A fejléc kinézete**: a fejléc betűtípusa, háttérszíne vagy háttérképe, szövegszíne és igazítása az oldalaitokon és minden nyomtatványon, jelentésen és PDF-en, előnézettel.',
            '**A konyha címe és a megállónkénti percek**: a kiszállítási útvonalak kiindulópontja és üteme.',
            '**A szervezet törlése**: mindent eltávolít, miután beírtad a nevét.',
          ],
        },
      ],
    },
    {
      id: 'staff',
      title: '3. Munkatársak és szerepek',
      blocks: [
        {
          p: 'A csapat minden tagjának egy vagy több szerepe van: **szervező** (minden, a munkatársakat és a személyi azonosítókat is beleértve), **koordinátor** (személyek, étlapok, útvonalak), **konyha** (a konyhai lap), **sofőr** (a saját útvonala) és **egészségügyi dolgozó** (az egészségügyi lap). Valakinek több szerepe is lehet, akár az összes; mindent lát, amit bármelyik szerepe megenged.',
        },
        {
          steps: [
            'Nyisd meg a **Munkatársak** oldalt (a Szervezet panelről), és a **Meghívás** résznél válaszd ki az új személy szerepét.',
            'Küldd el a linket, mutasd meg a **QR-kódot**, vagy küldd el **e-mailben**. Minden link egyszer működik, hét napig.',
            'Miután csatlakozott, pipáld be a szerepeit a **… szerepei** résznél; a pipa azonnal ment. Pipáld be a **Szociális munkás** jelölőt azoknál, akik szociális munkát végeznek, magadnál is („Szociális munkás vagyok”).',
          ],
        },
        {
          tip: 'Egy szervezetnek mindig marad legalább egy szervezője, és mindenkinek marad legalább egy szerepe. Az „Elküldött meghívók” az utolsó hat hónapot mutatja, azzal, hogy ki és mikor fogadta el.',
        },
      ],
    },
    {
      id: 'people',
      title: '4. Akikről gondoskodtok',
      blocks: [
        {
          p: 'A **Személyek** oldalon vegyél fel mindenkit **lakóként** (az otthonban él) vagy **házhoz szállításként**, címmel, telefonnal, egy családi kapcsolattartóval, diétával, allergiákkal, kiszállítási napokkal és a kiszállítás időablakával.',
        },
        {
          list: [
            '**Fotó és személyi igazolvány**: töltsd fel a képeket; az alkalmazás a saját eszközödön olvassa be az igazolványt, és ellenőrzésre felajánlja a nevet, a személyi számot, a címet és a lejáratot.',
            '**A személyi azonosítók és iratok** titkosítva tárolódnak, és csak a szervezők látják őket; minden megtekintés bekerül a profil alján lévő hozzáférési naplóba.',
            '**Események**: rövid feljegyzések arról, mi történt (egy esés, egy elmaradt kiszállítás).',
            'A hét **születésnapjai** fent látszanak; a naptárban mind megvan.',
            '**Állapot**: aktív, szünetel, várakozik (a várólistán) vagy befejezve.',
          ],
        },
        {
          tip: 'Egy „Hiányzik a fotó vagy a személyi igazolvány” jelölésű profilhoz még kell az a kép.',
        },
      ],
    },
    {
      id: 'meals',
      title: '5. Étlapok és konyha',
      blocks: [
        {
          p: 'Az **Étlapok** oldalon egyszer állítsd be a lakók **étkezési idejét**, aztán írd meg minden nap és étkezés étlapját, soronként egy ételt. Adj hozzá **diétás változatot**, ahol egy diéta mást eszik.',
        },
        {
          list: [
            'A **Konyha** lapja étkezésenként és diétánként megszámolja az adagokat aszerint, hogy aznap ki eszik valóban (aki kórházban van, kimarad).',
            '**Másolj** le egy napot vagy egy hetet, hogy kevesebbet kelljen gépelni.',
            'A **Szakácskönyvhöz** kapcsolva recepteket választhatsz ételnek: a hozzávalóik az adagokra számolódnak. A **Bevásárlással** a hét beszerzését egyetlen listaként küldöd el.',
          ],
        },
      ],
    },
    {
      id: 'routes',
      title: '6. Kiszállítási útvonalak',
      blocks: [
        {
          p: 'Az **Útvonalak** oldalon vedd fel a **sofőröket** a napjaikkal, műszakjukkal és jogosítványukkal (az alkalmazás figyelmeztet a lejárat előtt). Aztán tervezd meg a kiszállítást:',
        },
        {
          steps: [
            '**Sofőrkörzetek**: hagyd, hogy az alkalmazás javasolja, ki kinek szállít, hogy az útvonalak ne keresztezzék egymást; helyezz át személyeket a sofőrök között, és ments.',
            '**Útvonalak elkészítése** egy napra, egy hétre vagy egy hónapra a körzetekből: minden sofőr a körzete személyeit kapja, a legközelebbit először.',
            'Egy napon kézzel rendezd a megállókat, vagy nyomd meg a **Sorrend kiszámítása térképpel** gombot: minden kiszállítás az időablakában marad.',
            '**Nyomtasd ki** egy nap, egy hét vagy egy hónap útvonallapjait egy sofőrnek vagy mindenkinek.',
          ],
        },
        {
          tip: 'A sofőrök által már megadott pipák megmaradnak, ha újraépíted vagy átrendezed az útvonalat.',
        },
      ],
    },
    {
      id: 'drivers',
      title: '7. Sofőröknek',
      blocks: [
        {
          p: 'A fiókkal rendelkező sofőr az **Útvonalam** oldalon nyitja meg a szervezetet, a telefon böngészőjében vagy az Android-alkalmazásban:',
        },
        {
          list: [
            'A megállók sorrendben, címmel, telefonnal, időablakkal és azzal, mi van az egyes csomagokban.',
            'Egy **térkép** számozott jelölőkkel.',
            'Egy **pipa** és egy **megjegyzés** minden kiszállításhoz; a szervezők másodpercek alatt látják a haladást.',
          ],
        },
      ],
    },
    {
      id: 'medical',
      title: '8. Az egészségügyi lap',
      blocks: [
        {
          p: 'Csak az **egészségügyi dolgozó** szerep nyitja meg az egészségügyi lapot (egy gomb minden profilon és a **Gyógyszerelés** oldal). Minden, ami benne van, titkosítva tárolódik.',
        },
        {
          list: [
            '**Profil**: betegségek, háziorvos, vércsoport, megjegyzések.',
            '**Gyógyszerek** az időpontjaikkal; a **Gyógyszerelés** oldalon naponta kipipálod a beadott adagokat.',
            '**Megjegyzések** és **orvosi iratok** (PDF vagy fotó).',
            '**Kórházi tartózkodás**: amíg valaki kórházban van, a konyha és az útvonalak kihagyják, a többiek pedig csak annyit látnak: „Kórházban”.',
          ],
        },
      ],
    },
    {
      id: 'social',
      title: '9. Szociális munka és várólista',
      blocks: [
        {
          p: 'A **Szociális munka** oldal a szervezőknek és a szociális munkásként megjelölt munkatársaknak szól.',
        },
        {
          steps: [
            'A **Helyek** résznél a szervezők megadják a **lakók** és a **házhoz szállítások** legnagyobb számát (üresen: nincs határ).',
            'Az **új jelentkező** a **várólistára** kerül, amely mutatja, ki mióta vár, és milyen sürgős.',
            '**Tervezz látogatást** (felmérés, családlátogatás, utánkövetés) magadnak vagy egy kollégának; utána nyomd meg a **Megtörtént** gombot, és írd le, mi történt.',
            'A személy profilján töltsd ki a **szociális felmérő kérdőívet**: kivel él, lakhatás, jövedelem, mozgás, segítség, szükségletek és sürgősség. A korábbi válaszok az előzményekben maradnak.',
            'Ha felszabadul egy hely, nyomd meg a **Felvétel** gombot. A „Vissza a várólistára” és a „Szolgáltatás befejezése” a profilon van.',
          ],
        },
        {
          list: [
            'Több szociális munkás megoszthatja a munkát: minden név mellett válaszd ki a **felelős szociális munkást**.',
            'Az **Az enyéim / Mindenki** csak a saját személyeidet és látogatásaidat mutatja, vagy mindet.',
          ],
        },
      ],
    },
    {
      id: 'reports',
      title: '10. Jelentések',
      blocks: [
        {
          p: 'A szervezők a **Jelentések** oldalon látják, mit végzett a csapat: válaszd ki a napokat, aztán egy személyt vagy egy csoportot (minden sofőr, a konyha, minden szociális munkás, mindenki), és ha akarod, egy területet. A táblázat személyenként és területenként számolja a változásokat; az alatta lévő lista minden változást időponttal mutat.',
        },
        {
          tip: 'Az egészségügyi területnél a jelentések soha nem nevezik meg az érintett személyt. A tevékenységet két évig őrizzük.',
        },
      ],
    },
    {
      id: 'excel',
      title: '11. Excel oda-vissza',
      blocks: [
        {
          p: 'A **Szervezet** panel **Excel** részénél letölthetsz egy munkafüzetet a személyekkel, étlapokkal, sofőrökkel, útvonalakkal és munkatársakkal. Módosítsd Excelben a személyeket, étlapokat vagy sofőröket, és töltsd vissza a fájlt: előbb teljes egészében ellenőrizzük, és amíg egy sor hibás, semmi sem mentődik (az üzenet megmondja a munkalapot és a sort).',
        },
        {
          tip: 'Az azonosító nélküli sorok bekerülnek; a feltöltés soha nem töröl semmit. A fájl személyi azonosítókat tartalmaz, ezért őrizd biztonságban.',
        },
      ],
    },
    {
      id: 'print',
      title: '12. Nyomtatás',
      blocks: [
        {
          p: 'Minden oldal tisztán nyomtatható (Ctrl+P vagy a **Nyomtatás** gombok): a nyomtatvány a szervezet logójával, nevével és elérhetőségével kezdődik, és megmondja, ki és mikor nyomtatta.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '13. Adatvédelem és biztonság',
      blocks: [
        {
          list: [
            'Minden szerep csak azt látja, amire szüksége van; a szervezeten kívüliek azt sem tudják meg, hogy létezik.',
            'A személyi azonosítók, az iratok, az egészségügyi lap, a látogatások jegyzetei és a kérdőívek titkosítva tárolódnak.',
            'A személyi azonosítók és iratok megnyitását naplózzuk a szervezők számára.',
            'Akikről gondoskodtok, nem DevQuake-felhasználók: a szervezetetekhez tartoznak, és a szervezői törlik őket.',
          ],
        },
      ],
    },
  ],
  questions: 'Kérdésed vagy ötleted van? Írj a {email} címre.',
  back: 'Vissza a Szociális konyhához',
};

const it: Manual = {
  metaTitle: 'Manuale d’uso · Mensa sociale',
  metaDescription:
    'Come gestire una mensa sociale con l’app: le persone e i loro documenti, menù per dieta, il foglio della cucina, i giri di consegna, il telefono degli autisti, la cartella medica, la lista d’attesa e il servizio sociale, rapporti ed Excel.',
  ogTitle: 'Mensa sociale: manuale d’uso',
  cta: 'Vuoi provarla? Mensa sociale è un’app per i membri di DevQuake. {link}, poi apri l’app e crea un’organizzazione demo.',
  ctaLink: 'Crea un account o accedi',
  kicker: 'Mensa sociale · Manuale d’uso',
  title: 'Come gestire la tua mensa con Mensa sociale',
  intro:
    'Mensa sociale tiene in un solo posto tutto ciò che serve a un’organizzazione che si prende cura degli anziani: le persone che assistete, menù e porzioni, i giri di consegna, la cartella medica, la lista d’attesa e il lavoro degli assistenti sociali. Ogni membro del personale vede solo ciò che serve al suo ruolo. Questo manuale ti accompagna capitolo per capitolo.',
  contents: 'Indice',
  sections: [
    {
      id: 'start',
      title: '1. Per iniziare',
      blocks: [
        {
          steps: [
            'Accedi su {host} (oppure crea un account e conferma la tua email).',
            'Apri **Mensa sociale** dalle tue app. Chi è invitato da un organizzatore la usa gratis.',
            'Nella pagina iniziale **crea un’organizzazione**, oppure premi **Prova con dati demo** per esplorare prima una mensa già pronta.',
          ],
        },
        {
          tip: 'Nella demo puoi cambiare ruolo con **Visualizza come** nell’intestazione e vedere l’app come la vedono la cucina, un autista o il personale sanitario. I suggerimenti (💡 nell’intestazione) spiegano ogni pagina.',
        },
      ],
    },
    {
      id: 'organisation',
      title: '2. La tua organizzazione',
      blocks: [
        {
          p: 'Gli organizzatori impostano l’organizzazione nel riquadro **Organizzazione** della sua pagina principale:',
        },
        {
          list: [
            '**Nome, logo e descrizione**: compaiono su ogni stampa e, se vuoi, su una pagina pubblica dell’organizzazione.',
            '**Email di contatto**: compare nel banner dell’organizzazione e nelle email di invito.',
            '**Aspetto dell’intestazione**: carattere, colore o immagine di sfondo, colore del testo e allineamento dell’intestazione sulle vostre pagine e su ogni stampa, rapporto e PDF, con anteprima.',
            '**Indirizzo della cucina e minuti per fermata**: il punto di partenza e il ritmo dei giri di consegna.',
            '**Elimina l’organizzazione**: rimuove tutto ciò che la riguarda, dopo che ne hai scritto il nome.',
          ],
        },
      ],
    },
    {
      id: 'staff',
      title: '3. Personale e ruoli',
      blocks: [
        {
          p: 'Ogni membro del personale ha uno o più ruoli: **organizzatore** (tutto, anche il personale e i dati personali), **coordinatore** (persone, menù, giri), **cucina** (il foglio della cucina), **autista** (il proprio giro) e **personale sanitario** (la cartella medica). Una persona può avere più ruoli, anche tutti; vede tutto ciò che ogni ruolo consente.',
        },
        {
          steps: [
            'Apri **Personale** (dal riquadro Organizzazione) e scegli il ruolo della nuova persona in **Invita qualcuno**.',
            'Invia il link, mostra il **codice QR** o mandalo per **email**. Ogni link vale una volta, per sette giorni.',
            'Quando si è unita, spunta i suoi ruoli in **Ruoli di …**; la spunta salva subito. Spunta **Assistente sociale** per chi fa servizio sociale, anche per te («Sono assistente sociale»).',
          ],
        },
        {
          tip: 'Un’organizzazione mantiene sempre almeno un organizzatore, e ognuno mantiene almeno un ruolo. «Inviti inviati» mostra gli ultimi sei mesi, con chi ha accettato e quando.',
        },
      ],
    },
    {
      id: 'people',
      title: '4. Le persone che assistete',
      blocks: [
        {
          p: 'In **Persone**, aggiungi ogni persona come **ospite residente** (vive nella vostra struttura) o **consegna a domicilio**, con indirizzo, telefono, un familiare di riferimento, dieta, allergie, giorni di consegna e fascia oraria della consegna.',
        },
        {
          list: [
            '**Foto e carta d’identità**: carica le immagini; l’app legge la carta sul tuo dispositivo e ti propone nome, codice personale, indirizzo e scadenza da controllare.',
            '**Dati personali e documenti** sono conservati cifrati e solo gli organizzatori li vedono; ogni consultazione finisce nel registro degli accessi in fondo al profilo.',
            '**Episodi**: brevi note su ciò che è successo (una caduta, una consegna saltata).',
            'I **compleanni** della settimana sono in alto; il calendario li ha tutti.',
            '**Stato**: attivo, in pausa, in attesa (in lista d’attesa) o concluso.',
          ],
        },
        {
          tip: 'A un profilo segnato «Manca la foto o la carta d’identità» serve ancora quell’immagine.',
        },
      ],
    },
    {
      id: 'meals',
      title: '5. Menù e cucina',
      blocks: [
        {
          p: 'In **Menù**, imposta una volta gli **orari dei pasti** degli ospiti, poi scrivi il menù di ogni giorno e pasto, un piatto per riga. Aggiungi una **variante per dieta** dove una dieta mangia altro.',
        },
        {
          list: [
            'In **Cucina**, il foglio conta le porzioni per pasto e dieta in base a chi mangia davvero quel giorno (chi è ricoverato è escluso).',
            '**Copia** un giorno o una settimana per scrivere meno.',
            'Collegata al **Ricettario**, scegli ricette come piatti: gli ingredienti vengono calcolati sulle porzioni. Con la **Spesa**, invii gli acquisti della settimana come un’unica lista.',
          ],
        },
      ],
    },
    {
      id: 'routes',
      title: '6. Giri di consegna',
      blocks: [
        {
          p: 'In **Giri**, aggiungi gli **autisti** con i loro giorni, il turno e la patente (l’app avvisa prima della scadenza). Poi pianifica le consegne:',
        },
        {
          steps: [
            '**Zone degli autisti**: lascia che l’app proponga chi consegna a chi, così i giri non si incrociano; sposta persone tra autisti e salva.',
            '**Crea i giri** per un giorno, una settimana o un mese dalle zone: ogni autista riceve le persone della sua zona, le più vicine per prime.',
            'In un giorno, riordina le fermate a mano o premi **Calcola l’ordine dalla mappa**: ogni consegna resta nella sua fascia oraria.',
            '**Stampa** i fogli di giro di un giorno, una settimana o un mese, per un autista o per tutti.',
          ],
        },
        { tip: 'Le spunte già date dagli autisti restano quando ricrei o riordini un giro.' },
      ],
    },
    {
      id: 'drivers',
      title: '7. Per gli autisti',
      blocks: [
        {
          p: 'Un autista con account apre l’organizzazione su **Il mio giro**, nel browser del telefono o nell’app Android:',
        },
        {
          list: [
            'Le fermate in ordine, con indirizzo, telefono, fascia oraria e il contenuto di ogni pacco.',
            'Una **mappa** con segnaposti numerati.',
            'Una **spunta** e una **nota** per ogni consegna; gli organizzatori vedono l’avanzamento in pochi secondi.',
          ],
        },
      ],
    },
    {
      id: 'medical',
      title: '8. La cartella medica',
      blocks: [
        {
          p: 'Solo il ruolo **personale sanitario** apre la cartella medica (un pulsante su ogni profilo e la pagina **Terapia**). Tutto ciò che contiene è conservato cifrato.',
        },
        {
          list: [
            '**Profilo**: patologie, medico di famiglia, gruppo sanguigno, note.',
            '**Farmaci** con i loro orari; in **Terapia** spunti le dosi date ogni giorno.',
            '**Note** e **documenti sanitari** (PDF o foto).',
            '**Ricoveri**: finché qualcuno è in ospedale, cucina e giri lo escludono, e gli altri vedono solo «Ricoverato/a».',
          ],
        },
      ],
    },
    {
      id: 'social',
      title: '9. Servizio sociale e lista d’attesa',
      blocks: [
        {
          p: 'La pagina **Servizio sociale** è per gli organizzatori e per il personale segnato come assistente sociale.',
        },
        {
          steps: [
            'In **Posti**, gli organizzatori fissano il numero massimo di **ospiti residenti** e di **consegne a domicilio** (vuoto: nessun limite).',
            'Una **nuova richiesta** va in **lista d’attesa**, che mostra da quanto aspetta ognuno e con quale priorità.',
            '**Pianifica una visita** (valutazione, visita a domicilio, controllo) per te o per un collega; dopo premi **Fatta** e scrivi com’è andata.',
            'Nel profilo della persona compila il **questionario di valutazione sociale**: con chi vive, abitazione, reddito, mobilità, aiuto, bisogni e priorità. Le risposte precedenti restano nella cronologia.',
            'Quando si libera un posto, premi **Ammetti**. «Di nuovo in lista d’attesa» e «Concludi il servizio» sono nel profilo.',
          ],
        },
        {
          list: [
            'Più assistenti sociali si dividono il lavoro: scegli l’**assistente sociale responsabile** accanto a ogni nome.',
            '**I miei / Tutti** mostra solo le tue persone e visite, o tutte.',
          ],
        },
      ],
    },
    {
      id: 'reports',
      title: '10. Rapporti',
      blocks: [
        {
          p: 'Gli organizzatori aprono **Rapporti** per vedere cosa ha fatto il personale: scegli i giorni, poi una persona o un gruppo (tutti gli autisti, la cucina, tutti gli assistenti sociali, tutti) e, se vuoi, un’area. La tabella conta le modifiche per persona e area; l’elenco sotto mostra ogni modifica con l’ora.',
        },
        {
          tip: 'Per l’area sanitaria i rapporti non indicano mai la persona interessata. L’attività è conservata per due anni.',
        },
      ],
    },
    {
      id: 'excel',
      title: '11. Excel in entrata e in uscita',
      blocks: [
        {
          p: 'Nel riquadro **Organizzazione**, in **Excel**, scarichi una cartella con persone, menù, autisti, giri e personale. Modifica persone, menù o autisti in Excel e ricarica il file: viene prima controllato per intero, e finché una riga è sbagliata non si salva nulla (il messaggio indica foglio e riga).',
        },
        {
          tip: 'Le righe senza id vengono aggiunte; un caricamento non elimina mai nulla. Il file contiene dati personali: conservalo al sicuro.',
        },
      ],
    },
    {
      id: 'print',
      title: '12. Stampa',
      blocks: [
        {
          p: 'Ogni pagina si stampa in modo pulito (Ctrl+P o i pulsanti **Stampa**): la stampa inizia con logo, nome e contatti dell’organizzazione e dice chi l’ha stampata e quando.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '13. Privacy e sicurezza',
      blocks: [
        {
          list: [
            'Ogni ruolo vede solo ciò che gli serve; chi è fuori dall’organizzazione non sa nemmeno che esiste.',
            'Dati personali, documenti, cartella medica, note delle visite e questionari sono conservati cifrati.',
            'L’apertura di dati personali e documenti viene registrata per gli organizzatori.',
            'Le persone che assistete non sono utenti DevQuake: appartengono alla vostra organizzazione e sono eliminate dai suoi organizzatori.',
          ],
        },
      ],
    },
  ],
  questions: 'Domande o idee? Scrivi a {email}.',
  back: 'Torna a Mensa sociale',
};

const es: Manual = {
  metaTitle: 'Manual de uso · Comedor social',
  metaDescription:
    'Cómo llevar un comedor social con la app: las personas y sus documentos, menús por dieta, la hoja de cocina, rutas de reparto, el móvil de los conductores, la ficha médica, la lista de espera y el trabajo social, informes y Excel.',
  ogTitle: 'Comedor social: manual de uso',
  cta: '¿Quieres probarla? Comedor social es una app para miembros de DevQuake. {link}, luego abre la app y crea una organización de demostración.',
  ctaLink: 'Crea una cuenta o inicia sesión',
  kicker: 'Comedor social · Manual de uso',
  title: 'Cómo llevar tu comedor con Comedor social',
  intro:
    'Comedor social reúne en un solo lugar todo lo que necesita una organización que cuida de personas mayores: las personas que atendéis, menús y raciones, rutas de reparto, la ficha médica, la lista de espera y el trabajo social. Cada miembro del equipo ve solo lo que necesita su rol. Este manual te guía capítulo a capítulo.',
  contents: 'Contenido',
  sections: [
    {
      id: 'start',
      title: '1. Primeros pasos',
      blocks: [
        {
          steps: [
            'Inicia sesión en {host} (o crea una cuenta y confirma tu correo).',
            'Abre **Comedor social** desde tus apps. Quien recibe una invitación de un organizador la usa gratis.',
            'En la página de inicio **crea una organización**, o pulsa **Probar con datos de demostración** para explorar primero un comedor ya preparado.',
          ],
        },
        {
          tip: 'En la demo puedes cambiar de rol con **Ver como** en la cabecera y ver la app como la ven la cocina, un conductor o el personal sanitario. Los consejos (💡 en la cabecera) explican cada página.',
        },
      ],
    },
    {
      id: 'organisation',
      title: '2. Tu organización',
      blocks: [
        {
          p: 'Los organizadores configuran la organización en el panel **Organización** de su página principal:',
        },
        {
          list: [
            '**Nombre, logotipo y descripción**: aparecen en cada impresión y, si quieres, en una página pública de la organización.',
            '**Correo de contacto**: aparece en el banner de la organización y en los correos de invitación.',
            '**Aspecto de la cabecera**: tipo de letra, color o imagen de fondo, color del texto y alineación de la cabecera en vuestras páginas y en cada impresión, informe y PDF, con vista previa.',
            '**Dirección de la cocina y minutos por parada**: el punto de partida y el ritmo de las rutas de reparto.',
            '**Eliminar la organización**: borra todo lo suyo, después de escribir su nombre.',
          ],
        },
      ],
    },
    {
      id: 'staff',
      title: '3. Personal y roles',
      blocks: [
        {
          p: 'Cada miembro del equipo tiene uno o varios roles: **organizador** (todo, también el personal y los datos personales), **coordinador** (personas, menús, rutas), **cocina** (la hoja de cocina), **conductor** (su propia ruta) y **personal sanitario** (la ficha médica). Una persona puede tener varios roles, incluso todos; ve todo lo que permite cada rol.',
        },
        {
          steps: [
            'Abre **Personal** (desde el panel Organización) y elige el rol de la nueva persona en **Invitar a alguien**.',
            'Envía el enlace, muestra el **código QR** o mándalo por **correo**. Cada enlace sirve una vez, durante siete días.',
            'Cuando se haya unido, marca sus roles en **Roles de …**; la marca se guarda al momento. Marca **Trabajo social** en quienes hacen trabajo social, también en ti («Soy trabajador/a social»).',
          ],
        },
        {
          tip: 'Una organización siempre conserva al menos un organizador, y cada persona conserva al menos un rol. «Invitaciones enviadas» muestra los últimos seis meses, con quién aceptó y cuándo.',
        },
      ],
    },
    {
      id: 'people',
      title: '4. Las personas que atendéis',
      blocks: [
        {
          p: 'En **Personas**, añade a cada persona como **residente** (vive en vuestra residencia) o **entrega a domicilio**, con dirección, teléfono, un familiar de contacto, dieta, alergias, días de reparto y franja horaria de la entrega.',
        },
        {
          list: [
            '**Foto y documento de identidad**: sube las imágenes; la app lee el documento en tu dispositivo y te propone nombre, número personal, dirección y caducidad para que los revises.',
            '**Los datos personales y documentos** se guardan cifrados y solo los organizadores los ven; cada consulta queda en el registro de accesos al final del perfil.',
            '**Incidencias**: notas breves de lo ocurrido (una caída, una entrega fallida).',
            'Los **cumpleaños** de la semana aparecen arriba; el calendario los tiene todos.',
            '**Estado**: activo, en pausa, en espera (en la lista de espera) o terminado.',
          ],
        },
        { tip: 'A un perfil marcado «Falta la foto o el DNI» todavía le falta esa imagen.' },
      ],
    },
    {
      id: 'meals',
      title: '5. Menús y cocina',
      blocks: [
        {
          p: 'En **Menús**, fija una vez los **horarios de comida** de los residentes y luego escribe el menú de cada día y comida, un plato por línea. Añade una **variante por dieta** donde una dieta come otra cosa.',
        },
        {
          list: [
            'En **Cocina**, la hoja cuenta las raciones por comida y dieta según quién come de verdad ese día (quien está ingresado no cuenta).',
            '**Copia** un día o una semana para escribir menos.',
            'Conectado al **Recetario**, eliges recetas como platos: sus ingredientes se calculan para las raciones. Con la **Compra**, envías las compras de la semana como una sola lista.',
          ],
        },
      ],
    },
    {
      id: 'routes',
      title: '6. Rutas de reparto',
      blocks: [
        {
          p: 'En **Rutas**, añade a los **conductores** con sus días, turno y permiso de conducir (la app avisa antes de que caduque). Después planifica los repartos:',
        },
        {
          steps: [
            '**Zonas de los conductores**: deja que la app proponga quién reparte a quién, para que las rutas no se crucen; mueve personas entre conductores y guarda.',
            '**Crear las rutas** de un día, una semana o un mes a partir de las zonas: cada conductor recibe a las personas de su zona, las más cercanas primero.',
            'En un día, reordena las paradas a mano o pulsa **Calcular el orden con el mapa**: cada entrega se queda dentro de su franja.',
            '**Imprime** las hojas de ruta de un día, una semana o un mes, para un conductor o para todos.',
          ],
        },
        {
          tip: 'Las marcas que los conductores ya pusieron se mantienen cuando vuelves a crear o reordenas una ruta.',
        },
      ],
    },
    {
      id: 'drivers',
      title: '7. Para los conductores',
      blocks: [
        {
          p: 'Un conductor con cuenta abre la organización en **Mi ruta**, en el navegador del móvil o en la app de Android:',
        },
        {
          list: [
            'Las paradas en orden, con dirección, teléfono, franja horaria y lo que lleva cada paquete.',
            'Un **mapa** con marcadores numerados.',
            'Una **marca** y una **nota** para cada entrega; los organizadores ven el avance en segundos.',
          ],
        },
      ],
    },
    {
      id: 'medical',
      title: '8. La ficha médica',
      blocks: [
        {
          p: 'Solo el rol de **personal sanitario** abre la ficha médica (un botón en cada perfil y la página **Medicación**). Todo lo que contiene se guarda cifrado.',
        },
        {
          list: [
            '**Perfil**: enfermedades, médico de cabecera, grupo sanguíneo, notas.',
            '**Medicamentos** con sus horas; en **Medicación** marcas las dosis dadas cada día.',
            '**Notas** y **documentos médicos** (PDF o foto).',
            '**Ingresos hospitalarios**: mientras alguien está ingresado, la cocina y las rutas lo saltan, y los demás solo ven «Ingresado/a».',
          ],
        },
      ],
    },
    {
      id: 'social',
      title: '9. Trabajo social y lista de espera',
      blocks: [
        {
          p: 'La página **Trabajo social** es para los organizadores y para el personal marcado como trabajo social.',
        },
        {
          steps: [
            'En **Plazas**, los organizadores fijan el número máximo de **residentes** y de **entregas a domicilio** (vacío: sin límite).',
            'Una **nueva solicitud** pasa a la **lista de espera**, que muestra cuánto lleva esperando cada persona y su prioridad.',
            '**Planifica una visita** (valoración, visita a domicilio, seguimiento) para ti o un compañero; después pulsa **Hecha** y escribe qué pasó.',
            'En el perfil de la persona, rellena el **cuestionario de valoración social**: con quién vive, vivienda, ingresos, movilidad, ayuda, necesidades y prioridad. Las respuestas anteriores quedan en el historial.',
            'Cuando quede una plaza libre, pulsa **Admitir**. «Volver a la lista de espera» y «Terminar el servicio» están en el perfil.',
          ],
        },
        {
          list: [
            'Varias personas de trabajo social se reparten el trabajo: elige al **responsable** junto a cada nombre.',
            '**Míos / Todos** muestra solo tus personas y visitas, o todas.',
          ],
        },
      ],
    },
    {
      id: 'reports',
      title: '10. Informes',
      blocks: [
        {
          p: 'Los organizadores abren **Informes** para ver lo que hizo el equipo: elige los días, luego una persona o un grupo (todos los conductores, la cocina, todo el trabajo social, todos) y, si quieres, un área. La tabla cuenta los cambios por persona y área; la lista de abajo muestra cada cambio con su hora.',
        },
        {
          tip: 'En el área sanitaria, los informes nunca nombran a la persona afectada. La actividad se guarda dos años.',
        },
      ],
    },
    {
      id: 'excel',
      title: '11. Excel de ida y vuelta',
      blocks: [
        {
          p: 'En el panel **Organización**, en **Excel**, descargas un libro con personas, menús, conductores, rutas y personal. Cambia personas, menús o conductores en Excel y vuelve a subir el archivo: primero se revisa entero y no se guarda nada mientras una fila esté mal (el mensaje indica la hoja y la fila).',
        },
        {
          tip: 'Las filas sin id se añaden; una subida nunca borra nada. El archivo contiene datos personales: guárdalo en un lugar seguro.',
        },
      ],
    },
    {
      id: 'print',
      title: '12. Imprimir',
      blocks: [
        {
          p: 'Cada página se imprime limpia (Ctrl+P o los botones **Imprimir**): la impresión empieza con el logotipo, el nombre y el contacto de la organización e indica quién la imprimió y cuándo.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '13. Privacidad y seguridad',
      blocks: [
        {
          list: [
            'Cada rol ve solo lo que necesita; quien está fuera de la organización ni siquiera sabe que existe.',
            'Los datos personales, los documentos, la ficha médica, las notas de las visitas y los cuestionarios se guardan cifrados.',
            'La consulta de datos personales y documentos queda registrada para los organizadores.',
            'Las personas que atendéis no son usuarios de DevQuake: pertenecen a vuestra organización y las borran sus organizadores.',
          ],
        },
      ],
    },
  ],
  questions: '¿Preguntas o ideas? Escribe a {email}.',
  back: 'Volver a Comedor social',
};

export const MANUAL: Record<Locale, Manual> = { en, de, ro, hu, it, es };
