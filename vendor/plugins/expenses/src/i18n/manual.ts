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
  metaTitle: 'User manual · Shared expenses',
  metaDescription:
    'How to share costs on a trip, in a flat or as a couple: make a group, invite the others, add expenses split your way, and settle up with the fewest transfers.',
  ogTitle: 'Shared expenses: user manual',
  cta: 'Want to try it? Shared expenses is an app for DevQuake members. {link}, then subscribe to the app.',
  ctaLink: 'Create an account or sign in',
  kicker: 'Shared expenses · User manual',
  title: 'How to share expenses and settle up',
  intro:
    'Shared expenses keeps track of who paid what in a group, who owes whom, and how to settle up with as few transfers as possible. This manual walks you through it step by step.',
  contents: 'Contents',
  sections: [
    {
      id: 'start',
      title: '1. Getting started',
      blocks: [
        {
          steps: [
            'Sign in on {host} (or create an account and confirm your email).',
            'Open **Your account → Available projects** and **Subscribe** to “Shared expenses”.',
            'Open the app and make a **New group**: a name, the kind (trip, flat, couple, event) and the currency.',
          ],
        },
        {
          p: 'The start page lists your groups with how much was spent and **your balance** in each: green when you are owed money, red when you owe.',
        },
      ],
    },
    {
      id: 'invite',
      title: '2. Inviting people',
      blocks: [
        {
          p: 'On the group’s **Members** tab, send the **invite link** or let people scan its **QR code**. Signed in to DevQuake, they join at once and get the app **free**: they do not need to subscribe.',
        },
        {
          list: [
            'The owner can also add **someone without an account** by name, for a friend who does not use DevQuake, and enter their expenses for them.',
            'People who joined DevQuake through you (or invited you) can be added with one tap.',
            'A **New link** makes the old link and code stop working; people already in the group stay.',
          ],
        },
      ],
    },
    {
      id: 'expenses',
      title: '3. Adding expenses',
      blocks: [
        {
          tip: 'Bills and shopping come in by themselves: connect **Utility bills** and **Shopping lists** and add a bill or what was bought straight from there. The expense says where it came from and opens the bill or list.',
        },
        {
          p: 'Tap **Add an expense**: what it was for, the amount, who paid, the day and a category. Tick everyone who shares it.',
        },
        {
          list: [
            '**Equally**: the same for everyone ticked; cents that do not divide go to whoever paid.',
            '**By shares**: 2 for a couple and 1 for a single, for example.',
            '**By percent**: the percentages must add up to 100.',
            '**Exact amounts**: the amounts must add up to the expense.',
          ],
        },
        {
          p: 'Each person’s part is shown as you type and saved exactly to the cent. Open an expense to see who pays what, **comment** on it, **correct** it or **delete** it.',
        },
      ],
    },
    {
      id: 'balances',
      title: '4. Balances and settling up',
      blocks: [
        {
          p: 'The **Balances** tab shows what everyone is owed or owes. **Settling up** lists the fewest transfers that make everyone even.',
        },
        {
          steps: [
            'Pay the person outside the app (cash, bank transfer…).',
            'Tap **Mark as paid** next to the transfer, or **Record a payment** for any other amount.',
            'The balances update at once; a wrong payment can be deleted from the list.',
          ],
        },
        {
          tip: 'Shared expenses does not move money: it only keeps the account of who owes whom.',
        },
      ],
    },
    {
      id: 'activity',
      title: '5. Activity and statistics',
      blocks: [
        {
          p: 'The **Activity** tab shows every expense, change, payment, comment and member joining or leaving, with who did it and when.',
        },
        {
          p: 'The **Statistics** tab shows where the money went: by category, by month, and what each person paid and what their share came to.',
        },
      ],
    },
    {
      id: 'leaving',
      title: '6. Leaving a group and your data',
      blocks: [
        {
          list: [
            'You can **leave** a group, and the owner can **remove** someone, once their balance is settled. They stay in the expenses they shared, as a former member, so everyone else’s balances stay right.',
            'The owner can change the group’s name and kind; the currency only until the first expense.',
            'The owner can **delete the group** with all its expenses, payments and comments.',
            'When you unsubscribe or delete your DevQuake account, groups only you use are deleted. In shared groups your name is removed and you show as “Former member”.',
          ],
        },
      ],
    },
  ],
  questions: 'Questions or ideas? Write to {email}.',
  back: 'Back to your groups',
};

const de: Manual = {
  metaTitle: 'Benutzerhandbuch · Geteilte Ausgaben',
  metaDescription:
    'So teilst du Kosten auf Reisen, in der WG oder als Paar: Gruppe anlegen, die anderen einladen, Ausgaben nach deiner Art teilen und mit den wenigsten Überweisungen ausgleichen.',
  ogTitle: 'Geteilte Ausgaben: Benutzerhandbuch',
  cta: 'Möchtest du es ausprobieren? Geteilte Ausgaben ist eine App für DevQuake-Mitglieder. {link}, dann abonniere die App.',
  ctaLink: 'Erstelle ein Konto oder melde dich an',
  kicker: 'Geteilte Ausgaben · Benutzerhandbuch',
  title: 'So teilst du Ausgaben und gleichst aus',
  intro:
    'Geteilte Ausgaben hält fest, wer in einer Gruppe was bezahlt hat, wer wem etwas schuldet und wie ihr mit möglichst wenigen Überweisungen ausgleicht. Dieses Handbuch führt dich Schritt für Schritt hindurch.',
  contents: 'Inhalt',
  sections: [
    {
      id: 'start',
      title: '1. Erste Schritte',
      blocks: [
        {
          steps: [
            'Melde dich auf {host} an (oder erstelle ein Konto und bestätige deine E-Mail).',
            'Öffne **Dein Konto → Verfügbare Projekte** und **abonniere** „Geteilte Ausgaben“.',
            'Öffne die App und lege eine **Neue Gruppe** an: einen Namen, die Art (Reise, WG, Paar, Event) und die Währung.',
          ],
        },
        {
          p: 'Die Startseite zeigt deine Gruppen mit dem, was ausgegeben wurde, und **deinem Saldo** in jeder: grün, wenn du Geld bekommst, rot, wenn du etwas schuldest.',
        },
      ],
    },
    {
      id: 'invite',
      title: '2. Leute einladen',
      blocks: [
        {
          p: 'Schick auf dem Reiter **Mitglieder** der Gruppe den **Einladungslink** oder lass den **QR-Code** scannen. Bei DevQuake angemeldet, treten die Leute sofort bei und bekommen die App **kostenlos**: Sie müssen sie nicht abonnieren.',
        },
        {
          list: [
            'Der Inhaber kann auch **jemanden ohne Konto** mit Namen hinzufügen, für jemanden, der DevQuake nicht nutzt, und dessen Ausgaben eintragen.',
            'Leute, die über dich zu DevQuake gekommen sind (oder dich eingeladen haben), fügst du mit einem Tipp hinzu.',
            'Ein **Neuer Link** lässt den alten Link und Code nicht mehr funktionieren; wer schon in der Gruppe ist, bleibt.',
          ],
        },
      ],
    },
    {
      id: 'expenses',
      title: '3. Ausgaben eintragen',
      blocks: [
        {
          tip: 'Rechnungen und Einkäufe kommen von selbst: Verbinde **Nebenkosten** und **Einkaufslisten** und füge eine Rechnung oder das Gekaufte direkt von dort hinzu. Die Ausgabe zeigt, woher sie kommt, und öffnet die Rechnung oder Liste.',
        },
        {
          p: 'Tippe auf **Ausgabe hinzufügen**: wofür, der Betrag, wer bezahlt hat, der Tag und eine Kategorie. Hake alle an, die sie teilen.',
        },
        {
          list: [
            '**Gleich**: gleich viel für alle, die angehakt sind; Cents, die nicht aufgehen, übernimmt, wer bezahlt hat.',
            '**Nach Anteilen**: zum Beispiel 2 für ein Paar und 1 für eine Einzelperson.',
            '**In Prozent**: Die Prozente müssen zusammen 100 ergeben.',
            '**Genaue Beträge**: Die Beträge müssen zusammen die Ausgabe ergeben.',
          ],
        },
        {
          p: 'Der Anteil jeder Person wird beim Tippen gezeigt und auf den Cent genau gespeichert. Öffne eine Ausgabe, um zu sehen, wer was zahlt, sie zu **kommentieren**, zu **korrigieren** oder zu **löschen**.',
        },
      ],
    },
    {
      id: 'balances',
      title: '4. Salden und Ausgleich',
      blocks: [
        {
          p: 'Der Reiter **Salden** zeigt, was alle bekommen oder schulden. **Ausgleichen** listet die wenigsten Überweisungen, mit denen alle quitt sind.',
        },
        {
          steps: [
            'Bezahle die Person außerhalb der App (bar, per Überweisung …).',
            'Tippe neben der Überweisung auf **Als bezahlt markieren** oder auf **Zahlung eintragen** für einen anderen Betrag.',
            'Die Salden ändern sich sofort; eine falsche Zahlung lässt sich in der Liste löschen.',
          ],
        },
        {
          tip: 'Geteilte Ausgaben bewegt kein Geld: Die App führt nur Buch darüber, wer wem etwas schuldet.',
        },
      ],
    },
    {
      id: 'activity',
      title: '5. Verlauf und Statistik',
      blocks: [
        {
          p: 'Der Reiter **Verlauf** zeigt jede Ausgabe, Änderung, Zahlung, jeden Kommentar und jedes Kommen und Gehen von Mitgliedern, mit wer und wann.',
        },
        {
          p: 'Der Reiter **Statistik** zeigt, wohin das Geld ging: nach Kategorie, nach Monat und was jede Person bezahlt hat und wie hoch ihr Anteil war.',
        },
      ],
    },
    {
      id: 'leaving',
      title: '6. Eine Gruppe verlassen und deine Daten',
      blocks: [
        {
          list: [
            'Du kannst eine Gruppe **verlassen**, und der Inhaber kann jemanden **entfernen**, sobald der Saldo ausgeglichen ist. Die Person bleibt als ehemaliges Mitglied in den geteilten Ausgaben, damit die Salden der anderen stimmen.',
            'Der Inhaber kann Name und Art der Gruppe ändern; die Währung nur bis zur ersten Ausgabe.',
            'Der Inhaber kann die **Gruppe löschen**, mit allen Ausgaben, Zahlungen und Kommentaren.',
            'Wenn du das Abo beendest oder dein DevQuake-Konto löschst, werden Gruppen gelöscht, die nur du nutzt. In geteilten Gruppen wird dein Name entfernt und du erscheinst als „Ehemaliges Mitglied“.',
          ],
        },
      ],
    },
  ],
  questions: 'Fragen oder Ideen? Schreib an {email}.',
  back: 'Zurück zu deinen Gruppen',
};

const ro: Manual = {
  metaTitle: 'Manual de utilizare · Cheltuieli comune',
  metaDescription:
    'Cum împarți costurile într-o excursie, în apartament sau în cuplu: creezi un grup, îi inviți pe ceilalți, adaugi cheltuieli împărțite cum vrei și decontați cu cele mai puține transferuri.',
  ogTitle: 'Cheltuieli comune: manual de utilizare',
  cta: 'Vrei s-o încerci? Cheltuieli comune este o aplicație pentru membrii DevQuake. {link}, apoi abonează-te la aplicație.',
  ctaLink: 'Creează un cont sau autentifică-te',
  kicker: 'Cheltuieli comune · Manual de utilizare',
  title: 'Cum împarți cheltuielile și decontați',
  intro:
    'Cheltuieli comune ține evidența a cine ce a plătit într-un grup, cine cui datorează și cum decontați cu cât mai puține transferuri. Acest manual te ghidează pas cu pas.',
  contents: 'Cuprins',
  sections: [
    {
      id: 'start',
      title: '1. Primii pași',
      blocks: [
        {
          steps: [
            'Autentifică-te pe {host} (sau creează un cont și confirmă-ți emailul).',
            'Deschide **Contul tău → Proiecte disponibile** și **abonează-te** la „Cheltuieli comune”.',
            'Deschide aplicația și creează un **Grup nou**: un nume, tipul (excursie, apartament, cuplu, eveniment) și moneda.',
          ],
        },
        {
          p: 'Pagina de start îți arată grupurile, cât s-a cheltuit și **soldul tău** în fiecare: verde când ți se datorează bani, roșu când datorezi.',
        },
      ],
    },
    {
      id: 'invite',
      title: '2. Invitarea oamenilor',
      blocks: [
        {
          p: 'În fila **Membri** a grupului, trimite **linkul de invitație** sau lasă-i să scaneze **codul QR**. Autentificați pe DevQuake, intră imediat și primesc aplicația **gratuit**: nu trebuie să se aboneze.',
        },
        {
          list: [
            'Proprietarul poate adăuga și **pe cineva fără cont**, după nume, pentru un prieten care nu folosește DevQuake, și îi introduce cheltuielile.',
            'Oamenii care au venit pe DevQuake prin tine (sau care te-au invitat) se adaugă cu o atingere.',
            'Un **Link nou** face ca vechiul link și cod să nu mai funcționeze; cei deja în grup rămân.',
          ],
        },
      ],
    },
    {
      id: 'expenses',
      title: '3. Adăugarea cheltuielilor',
      blocks: [
        {
          tip: 'Facturile și cumpărăturile vin singure: conectează **Facturi utilități** și **Liste de cumpărături** și adaugă o factură sau ce s-a cumpărat direct de acolo. Cheltuiala arată de unde vine și deschide factura sau lista.',
        },
        {
          p: 'Apasă **Adaugă o cheltuială**: pentru ce a fost, suma, cine a plătit, ziua și o categorie. Bifează-i pe toți cei care o împart.',
        },
        {
          list: [
            '**În mod egal**: la fel pentru toți cei bifați; banii care nu se împart exact îi preia cel care a plătit.',
            '**Pe părți**: de exemplu 2 pentru un cuplu și 1 pentru o persoană singură.',
            '**Procentual**: procentele trebuie să dea împreună 100.',
            '**Sume exacte**: sumele trebuie să dea împreună cheltuiala.',
          ],
        },
        {
          p: 'Partea fiecăruia apare pe măsură ce scrii și se salvează exact, la ban. Deschide o cheltuială ca să vezi cine cât plătește, s-o **comentezi**, s-o **corectezi** sau s-o **ștergi**.',
        },
      ],
    },
    {
      id: 'balances',
      title: '4. Solduri și decontare',
      blocks: [
        {
          p: 'Fila **Solduri** arată cât i se datorează fiecăruia sau cât datorează. **Decontare** listează cele mai puține transferuri care îi aduc pe toți la zi.',
        },
        {
          steps: [
            'Plătește persoana în afara aplicației (numerar, transfer bancar…).',
            'Apasă **Marchează ca plătit** lângă transfer sau **Înregistrează o plată** pentru altă sumă.',
            'Soldurile se actualizează imediat; o plată greșită se poate șterge din listă.',
          ],
        },
        {
          tip: 'Cheltuieli comune nu mută bani: doar ține socoteala a cine cui datorează.',
        },
      ],
    },
    {
      id: 'activity',
      title: '5. Activitate și statistici',
      blocks: [
        {
          p: 'Fila **Activitate** arată fiecare cheltuială, modificare, plată, comentariu și fiecare membru care intră sau pleacă, cu cine și când.',
        },
        {
          p: 'Fila **Statistici** arată unde s-au dus banii: pe categorii, pe luni și cât a plătit fiecare și cât i-a revenit.',
        },
      ],
    },
    {
      id: 'leaving',
      title: '6. Părăsirea unui grup și datele tale',
      blocks: [
        {
          list: [
            'Poți **părăsi** un grup, iar proprietarul poate **scoate** pe cineva, după ce soldul este la zi. Persoana rămâne în cheltuielile comune ca fost membru, ca soldurile celorlalți să rămână corecte.',
            'Proprietarul poate schimba numele și tipul grupului; moneda doar până la prima cheltuială.',
            'Proprietarul poate **șterge grupul** cu toate cheltuielile, plățile și comentariile.',
            'Când îți anulezi abonamentul sau îți ștergi contul DevQuake, grupurile folosite doar de tine se șterg. În grupurile comune numele tău este șters și apari ca „Fost membru”.',
          ],
        },
      ],
    },
  ],
  questions: 'Întrebări sau idei? Scrie la {email}.',
  back: 'Înapoi la grupurile tale',
};

const hu: Manual = {
  metaTitle: 'Felhasználói kézikönyv · Közös kiadások',
  metaDescription:
    'Így osztod meg a költségeket utazáson, albérletben vagy párként: csoport létrehozása, a többiek meghívása, kiadások a saját módodon elosztva, elszámolás a legkevesebb utalással.',
  ogTitle: 'Közös kiadások: felhasználói kézikönyv',
  cta: 'Kipróbálnád? A Közös kiadások a DevQuake tagjainak szóló alkalmazás. {link}, majd fizess elő az alkalmazásra.',
  ctaLink: 'Hozz létre fiókot vagy jelentkezz be',
  kicker: 'Közös kiadások · Felhasználói kézikönyv',
  title: 'Így osztjátok meg a kiadásokat és számoltok el',
  intro:
    'A Közös kiadások nyilvántartja, ki mit fizetett egy csoportban, ki kinek tartozik, és hogyan számolhattok el a lehető legkevesebb utalással. Ez a kézikönyv lépésről lépésre végigvezet.',
  contents: 'Tartalom',
  sections: [
    {
      id: 'start',
      title: '1. Az első lépések',
      blocks: [
        {
          steps: [
            'Jelentkezz be a {host} oldalon (vagy hozz létre fiókot, és erősítsd meg az e-mail-címedet).',
            'Nyisd meg a **Fiókod → Elérhető projektek** részt, és **fizess elő** a „Közös kiadások” alkalmazásra.',
            'Nyisd meg az alkalmazást, és hozz létre egy **Új csoportot**: név, típus (utazás, albérlet, pár, esemény) és pénznem.',
          ],
        },
        {
          p: 'A kezdőlap mutatja a csoportjaidat, hogy mennyit költöttetek, és **az egyenlegedet** mindegyikben: zöld, ha neked jár pénz, piros, ha tartozol.',
        },
      ],
    },
    {
      id: 'invite',
      title: '2. Emberek meghívása',
      blocks: [
        {
          p: 'A csoport **Tagok** fülén küldd el a **meghívó linket**, vagy olvastasd be a **QR-kódját**. A DevQuake-be bejelentkezve azonnal csatlakoznak, és **ingyen** megkapják az alkalmazást: nem kell előfizetniük.',
        },
        {
          list: [
            'A tulajdonos **fiók nélküli személyt** is hozzáadhat név szerint, annak, aki nem használja a DevQuake-et, és rögzítheti helyette a kiadásait.',
            'Akik rajtad keresztül jöttek a DevQuake-re (vagy meghívtak), egy koppintással hozzáadhatók.',
            'Az **Új link** után a régi link és kód nem működik; aki már a csoportban van, marad.',
          ],
        },
      ],
    },
    {
      id: 'expenses',
      title: '3. Kiadások rögzítése',
      blocks: [
        {
          tip: 'A számlák és a vásárlások maguktól érkeznek: kapcsold össze a **Közműszámlák** és a **Bevásárlólisták** alkalmazást, és onnan add hozzá a számlát vagy a vásárlást. A kiadás mutatja, honnan jött, és megnyitja a számlát vagy a listát.',
        },
        {
          p: 'Koppints a **Kiadás hozzáadása** gombra: mire volt, az összeg, ki fizette, a nap és egy kategória. Pipáld be mindenkit, aki osztozik rajta.',
        },
        {
          list: [
            '**Egyenlően**: mindenkinek ugyanannyi, aki be van pipálva; a nem osztható filléreket az viseli, aki fizetett.',
            '**Arányosan**: például 2 egy párnak és 1 egy egyedülállónak.',
            '**Százalékosan**: a százalékok összege 100 kell legyen.',
            '**Pontos összegekkel**: az összegeknek ki kell adniuk a kiadást.',
          ],
        },
        {
          p: 'Mindenki része gépelés közben látszik, és fillérre pontosan mentődik. Nyiss meg egy kiadást, hogy lásd, ki mennyit fizet, **hozzászólj**, **javítsd** vagy **töröld**.',
        },
      ],
    },
    {
      id: 'balances',
      title: '4. Egyenlegek és elszámolás',
      blocks: [
        {
          p: 'Az **Egyenlegek** fül mutatja, kinek mennyi jár, és ki mennyivel tartozik. Az **Elszámolás** a legkevesebb utalást sorolja fel, amivel mindenki rendezve lesz.',
        },
        {
          steps: [
            'Fizesd ki a személyt az alkalmazáson kívül (készpénz, banki átutalás…).',
            'Koppints az utalás mellett a **Kifizetettnek jelölöm** gombra, vagy a **Befizetés rögzítése** gombra más összeghez.',
            'Az egyenlegek azonnal frissülnek; a hibás befizetés törölhető a listából.',
          ],
        },
        {
          tip: 'A Közös kiadások nem mozgat pénzt: csak nyilvántartja, ki kinek tartozik.',
        },
      ],
    },
    {
      id: 'activity',
      title: '5. Történések és statisztika',
      blocks: [
        {
          p: 'A **Történések** fül minden kiadást, módosítást, befizetést, hozzászólást, valamint a tagok csatlakozását és kilépését mutatja, azzal, hogy ki és mikor.',
        },
        {
          p: 'A **Statisztika** fül mutatja, hová ment a pénz: kategória és hónap szerint, és hogy ki mennyit fizetett, illetve mennyi volt a része.',
        },
      ],
    },
    {
      id: 'leaving',
      title: '6. Kilépés egy csoportból és az adataid',
      blocks: [
        {
          list: [
            '**Kiléphetsz** egy csoportból, a tulajdonos pedig **eltávolíthat** valakit, ha az egyenlege rendezve van. A személy korábbi tagként a közös kiadásokban marad, hogy a többiek egyenlege helyes maradjon.',
            'A tulajdonos módosíthatja a csoport nevét és típusát; a pénznemet csak az első kiadásig.',
            'A tulajdonos **törölheti a csoportot** az összes kiadással, befizetéssel és hozzászólással együtt.',
            'Ha lemondod az előfizetést vagy törlöd a DevQuake-fiókodat, a csak általad használt csoportok törlődnek. A közös csoportokban a neved törlődik, és „Korábbi tag” néven jelensz meg.',
          ],
        },
      ],
    },
  ],
  questions: 'Kérdésed vagy ötleted van? Írj a {email} címre.',
  back: 'Vissza a csoportjaidhoz',
};

const it: Manual = {
  metaTitle: 'Manuale d’uso · Spese condivise',
  metaDescription:
    'Come dividere le spese in viaggio, in una casa condivisa o in coppia: crea un gruppo, invita gli altri, aggiungi spese divise come vuoi e salda i conti con il minor numero di trasferimenti.',
  ogTitle: 'Spese condivise: manuale d’uso',
  cta: 'Vuoi provarla? Spese condivise è un’app per i membri di DevQuake. {link}, poi abbonati all’app.',
  ctaLink: 'Crea un account o accedi',
  kicker: 'Spese condivise · Manuale d’uso',
  title: 'Come dividere le spese e saldare i conti',
  intro:
    'Spese condivise tiene traccia di chi ha pagato cosa in un gruppo, di chi deve quanto a chi e di come saldare i conti con il minor numero possibile di trasferimenti. Questo manuale ti guida passo dopo passo.',
  contents: 'Indice',
  sections: [
    {
      id: 'start',
      title: '1. Per iniziare',
      blocks: [
        {
          steps: [
            'Accedi su {host} (oppure crea un account e conferma la tua email).',
            'Apri **Il tuo account → Progetti disponibili** e **abbonati** a “Spese condivise”.',
            'Apri l’app e crea un **Nuovo gruppo**: un nome, il tipo (viaggio, casa condivisa, coppia, evento) e la valuta.',
          ],
        },
        {
          p: 'La pagina iniziale elenca i tuoi gruppi con quanto è stato speso e **il tuo saldo** in ognuno: verde quando ti spettano soldi, rosso quando devi qualcosa.',
        },
      ],
    },
    {
      id: 'invite',
      title: '2. Invitare persone',
      blocks: [
        {
          p: 'Nella scheda **Membri** del gruppo, manda il **link di invito** o fai scansionare il suo **codice QR**. Con l’accesso a DevQuake, le persone entrano subito e ricevono l’app **gratis**: non devono abbonarsi.',
        },
        {
          list: [
            'Il proprietario può anche aggiungere per nome **qualcuno senza account**, per un amico che non usa DevQuake, e inserire le sue spese al posto suo.',
            'Le persone arrivate su DevQuake grazie a te (o che ti hanno invitato) si aggiungono con un tocco.',
            'Un **Nuovo link** fa smettere di funzionare il vecchio link e il vecchio codice; chi è già nel gruppo resta.',
          ],
        },
      ],
    },
    {
      id: 'expenses',
      title: '3. Aggiungere spese',
      blocks: [
        {
          tip: 'Bollette e acquisti arrivano da soli: collega **Bollette** e **Liste della spesa** e aggiungi una bolletta o quello che hai comprato direttamente da lì. La spesa mostra da dove arriva e apre la bolletta o la lista.',
        },
        {
          p: 'Tocca **Aggiungi una spesa**: per cosa era, l’importo, chi ha pagato, il giorno e una categoria. Spunta tutti quelli che la dividono.',
        },
        {
          list: [
            '**In parti uguali**: lo stesso per tutte le persone spuntate; i centesimi che non si dividono vanno a chi ha pagato.',
            '**Per quote**: per esempio 2 per una coppia e 1 per un single.',
            '**In percentuale**: le percentuali devono fare 100 in totale.',
            '**Importi esatti**: gli importi devono dare in totale la spesa.',
          ],
        },
        {
          p: 'La parte di ognuno appare mentre scrivi e viene salvata esatta al centesimo. Apri una spesa per vedere chi paga cosa, **commentarla**, **correggerla** o **eliminarla**.',
        },
      ],
    },
    {
      id: 'balances',
      title: '4. Saldi e saldare i conti',
      blocks: [
        {
          p: 'La scheda **Saldi** mostra quanto spetta o quanto deve ognuno. **Saldare i conti** elenca il minor numero di trasferimenti che mette tutti in pari.',
        },
        {
          steps: [
            'Paga la persona fuori dall’app (contanti, bonifico…).',
            'Tocca **Segna come pagato** accanto al trasferimento, oppure **Registra un pagamento** per qualsiasi altro importo.',
            'I saldi si aggiornano subito; un pagamento sbagliato si può eliminare dall’elenco.',
          ],
        },
        {
          tip: 'Spese condivise non sposta denaro: tiene solo il conto di chi deve quanto a chi.',
        },
      ],
    },
    {
      id: 'activity',
      title: '5. Attività e statistiche',
      blocks: [
        {
          p: 'La scheda **Attività** mostra ogni spesa, modifica, pagamento, commento e ogni membro che entra o esce, con chi è stato e quando.',
        },
        {
          p: 'La scheda **Statistiche** mostra dove sono finiti i soldi: per categoria, per mese, e quanto ha pagato ogni persona e a quanto ammontava la sua quota.',
        },
      ],
    },
    {
      id: 'leaving',
      title: '6. Lasciare un gruppo e i tuoi dati',
      blocks: [
        {
          list: [
            'Puoi **lasciare** un gruppo, e il proprietario può **rimuovere** qualcuno, quando il suo saldo è in pari. La persona resta nelle spese condivise come ex membro, così i saldi degli altri restano giusti.',
            'Il proprietario può cambiare il nome e il tipo del gruppo; la valuta solo fino alla prima spesa.',
            'Il proprietario può **eliminare il gruppo** con tutte le sue spese, i pagamenti e i commenti.',
            'Quando annulli l’abbonamento o elimini il tuo account DevQuake, i gruppi usati solo da te vengono eliminati. Nei gruppi condivisi il tuo nome viene rimosso e appari come “Ex membro”.',
          ],
        },
      ],
    },
  ],
  questions: 'Domande o idee? Scrivi a {email}.',
  back: 'Torna ai tuoi gruppi',
};

const es: Manual = {
  metaTitle: 'Manual de uso · Gastos compartidos',
  metaDescription:
    'Cómo compartir gastos en un viaje, en un piso compartido o en pareja: crea un grupo, invita a los demás, añade gastos divididos a tu manera y saldad cuentas con las menos transferencias.',
  ogTitle: 'Gastos compartidos: manual de uso',
  cta: '¿Quieres probarla? Gastos compartidos es una app para los miembros de DevQuake. {link} y luego suscríbete a la app.',
  ctaLink: 'Crea una cuenta o inicia sesión',
  kicker: 'Gastos compartidos · Manual de uso',
  title: 'Cómo compartir gastos y saldar cuentas',
  intro:
    'Gastos compartidos lleva la cuenta de quién pagó qué en un grupo, quién debe a quién y cómo saldar cuentas con las menos transferencias posibles. Este manual te guía paso a paso.',
  contents: 'Índice',
  sections: [
    {
      id: 'start',
      title: '1. Primeros pasos',
      blocks: [
        {
          steps: [
            'Inicia sesión en {host} (o crea una cuenta y confirma tu correo).',
            'Abre **Tu cuenta → Proyectos disponibles** y **suscríbete** a “Gastos compartidos”.',
            'Abre la app y crea un **Nuevo grupo**: un nombre, el tipo (viaje, piso compartido, pareja, evento) y la moneda.',
          ],
        },
        {
          p: 'La página de inicio muestra tus grupos con lo que se ha gastado y **tu saldo** en cada uno: verde cuando te deben dinero, rojo cuando debes.',
        },
      ],
    },
    {
      id: 'invite',
      title: '2. Invitar a personas',
      blocks: [
        {
          p: 'En la pestaña **Miembros** del grupo, envía el **enlace de invitación** o deja que escaneen su **código QR**. Con la sesión iniciada en DevQuake, se unen al instante y reciben la app **gratis**: no tienen que suscribirse.',
        },
        {
          list: [
            'El propietario también puede añadir por su nombre a **alguien sin cuenta**, para un amigo que no usa DevQuake, e introducir sus gastos por él.',
            'Las personas que llegaron a DevQuake gracias a ti (o que te invitaron) se añaden con un toque.',
            'Un **Nuevo enlace** hace que el enlace y el código antiguos dejen de funcionar; quienes ya están en el grupo se quedan.',
          ],
        },
      ],
    },
    {
      id: 'expenses',
      title: '3. Añadir gastos',
      blocks: [
        {
          tip: 'Las facturas y las compras llegan solas: conecta **Facturas del hogar** y **Listas de la compra** y añade una factura o lo que se compró directamente desde allí. El gasto indica de dónde viene y abre la factura o la lista.',
        },
        {
          p: 'Toca **Añadir un gasto**: para qué fue, el importe, quién pagó, el día y una categoría. Marca a todos los que lo comparten.',
        },
        {
          list: [
            '**A partes iguales**: lo mismo para todas las personas marcadas; los céntimos que no se pueden dividir son para quien pagó.',
            '**Por partes**: por ejemplo, 2 para una pareja y 1 para una persona sola.',
            '**Por porcentaje**: los porcentajes deben sumar 100.',
            '**Importes exactos**: los importes deben sumar el total del gasto.',
          ],
        },
        {
          p: 'La parte de cada persona aparece mientras escribes y se guarda exacta al céntimo. Abre un gasto para ver quién paga qué, **comentarlo**, **corregirlo** o **eliminarlo**.',
        },
      ],
    },
    {
      id: 'balances',
      title: '4. Saldos y saldar cuentas',
      blocks: [
        {
          p: 'La pestaña **Saldos** muestra lo que le deben a cada uno o lo que debe. **Saldar cuentas** enumera las menos transferencias que dejan a todos al día.',
        },
        {
          steps: [
            'Paga a la persona fuera de la app (efectivo, transferencia bancaria…).',
            'Toca **Marcar como pagado** junto a la transferencia, o **Registrar un pago** para cualquier otro importe.',
            'Los saldos se actualizan al instante; un pago equivocado se puede eliminar de la lista.',
          ],
        },
        {
          tip: 'Gastos compartidos no mueve dinero: solo lleva la cuenta de quién debe a quién.',
        },
      ],
    },
    {
      id: 'activity',
      title: '5. Actividad y estadísticas',
      blocks: [
        {
          p: 'La pestaña **Actividad** muestra cada gasto, cambio, pago, comentario y cada miembro que entra o sale, con quién lo hizo y cuándo.',
        },
        {
          p: 'La pestaña **Estadísticas** muestra adónde fue el dinero: por categoría, por mes, y lo que pagó cada persona y lo que le tocaba.',
        },
      ],
    },
    {
      id: 'leaving',
      title: '6. Salir de un grupo y tus datos',
      blocks: [
        {
          list: [
            'Puedes **salir** de un grupo, y el propietario puede **quitar** a alguien, cuando su saldo esté al día. La persona sigue en los gastos que compartió, como antiguo miembro, para que los saldos de los demás sigan siendo correctos.',
            'El propietario puede cambiar el nombre y el tipo del grupo; la moneda solo hasta el primer gasto.',
            'El propietario puede **eliminar el grupo** con todos sus gastos, pagos y comentarios.',
            'Cuando cancelas la suscripción o eliminas tu cuenta de DevQuake, los grupos que solo usas tú se eliminan. En los grupos compartidos se quita tu nombre y apareces como “Antiguo miembro”.',
          ],
        },
      ],
    },
  ],
  questions: '¿Preguntas o ideas? Escribe a {email}.',
  back: 'Volver a tus grupos',
};

export const MANUAL: Record<Locale, Manual> = { en, de, ro, hu, it, es };
