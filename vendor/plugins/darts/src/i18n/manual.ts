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
  metaTitle: 'User manual · Darts',
  metaDescription:
    'Score darts on your phone: practise alone with drills made for you, play casual games with friends, or run tournaments with a live bracket. 501, 301, Cricket, Shanghai, Around the Clock and Killer.',
  ogTitle: 'Darts: user manual',
  cta: 'Want to try it? Darts is an app for DevQuake members. {link}, then subscribe to the app.',
  ctaLink: 'Create an account or sign in',
  kicker: 'Darts · User manual',
  title: 'How to play darts with the app',
  intro:
    'The app keeps the score of every dart, checks the rules, suggests the best finishes and learns how you play. Practise alone, play friends, or organise a tournament on several boards.',
  contents: 'Contents',
  sections: [
    {
      id: 'start',
      title: '1. Getting started',
      blocks: [
        {
          steps: [
            'Sign in on {host} (or create an account and confirm your email).',
            'Open **Your account → Available projects** and **Subscribe** to “Darts”.',
            'Open the app and set up your **profile**: your name at the board, your throwing hand, your level, how you like to enter scores and, if you have one, your favourite double.',
          ],
        },
      ],
    },
    {
      id: 'modes',
      title: '2. Three ways to play',
      blocks: [
        {
          list: [
            '**Practice**: alone. Any game, or drills made from your statistics. Every visit and its three darts are kept, so you can see your progress session after session.',
            '**Casual**: start a game and your friends join with its code or QR code. As the host you start the game, and you can remove a player so someone else can join.',
            '**Tournament**: a knock-out on your boards. Players join, you draw each round, the matches are played on the boards and everyone follows the bracket live.',
          ],
        },
      ],
    },
    {
      id: 'games',
      title: '3. The games',
      blocks: [
        {
          list: [
            '**501 / 301** (also 701 and 1001): count down to exactly zero; the last dart must be a double or the bull. Going below zero, to 1, or to zero without a double is a bust and the visit does not count. Options: double in, single or master out, several legs.',
            '**Cricket**: close 15 to 20 and the bull with three marks each, then score on the numbers your opponents have not closed. Cut-throat gives your points to the opponents.',
            '**Shanghai**: one number per round. A single, double and treble of it in one visit wins at once.',
            '**Around the Clock**: 1 to 20 in order, then the bull. Optionally doubles only.',
            '**Killer**: everyone gets a number. Hit its double to become a killer, then take the others’ lives with their doubles.',
            '**Count-Up**: the most points after a number of rounds.',
            '**Target drill** and **finishing drill**: practice on the targets or finishes you choose (only in Practice).',
          ],
        },
      ],
    },
    {
      id: 'scoring',
      title: '4. Entering a visit',
      blocks: [
        {
          p: 'When it is your turn, enter your three darts in one of two ways (you can switch any time):',
        },
        {
          list: [
            '**Dartboard**: tap the segment each dart landed in. The rings are wide so doubles and trebles are easy to hit. Tap outside the board or **Miss** for a dart that missed.',
            '**Keypad**: one tap per dart. Tap **Double** or **Treble** first if needed (it applies to the next dart only), then the number. Above it, **one-click visits** enter a whole visit at once: the finishes, your own frequent visits and common scores at this point of the game (only visits the rules allow). On a computer: D or T then the number, B bull, 0 miss, Enter sends.',
          ],
        },
        {
          p: 'Every dart is checked with the rules as you enter it, and the scores update straight away. After a bust or a finish the visit is over: send it. The button says what happens then, for example **Next: Ana**, **Bust · next: Ana** or **Win the game!** **Undo dart** takes back a dart before you send; **Undo my last visit** takes back a visit you already sent, as long as nobody has thrown since.',
        },
        {
          tip: 'Under the darts the app shows up to three suggestions that bring you closest to winning: finishing routes (for example Treble 20 → Double 20 for 100), a setup shot when no finish is possible, or the targets that matter in Cricket, Shanghai and Killer. The first one also lights up on the dartboard.',
        },
      ],
    },
    {
      id: 'casual',
      title: '5. Playing friends',
      blocks: [
        {
          steps: [
            'In **Casual**, choose a game and its options, then **Create game and invite**.',
            'Your friends scan the QR code, open the link, or type the 8-character code. They need a DevQuake account and the app.',
            'When everyone is in, **Start game** (optionally drawing who throws first). Each player enters their own darts on their own phone.',
          ],
        },
        {
          p: 'To let others follow the game without playing, open **Let others watch** and share that link or QR code. Watchers see the scores live but cannot change anything.',
        },
      ],
    },
    {
      id: 'tournament',
      title: '6. Organising a tournament',
      blocks: [
        {
          steps: [
            'In **Tournaments → New tournament**, choose the name, the game, the number of boards, and optionally an entry fee with your share in percent (it can be 0).',
            'Print the boards’ QR codes and put each one next to its board. Players join by scanning a board’s code (they are placed on that board) or with the tournament’s code (the app spreads them over the boards).',
            'When everyone is there, **Start tournament**. The app suggests pairs of players of similar strength; tap one player and then another to swap them, then **Start round**.',
            'Matches go on free boards; if there are more matches than boards, the rest start as soon as a board is free. Players see their match on the start screen and in the tournament.',
            'When every match of a round is over, draw the next round. The last player left wins the tournament.',
          ],
        },
        {
          tip: 'Tap any match in the bracket to watch it live. Only its two players can enter scores. The app keeps track of who paid the entry fee and of the pot; the money itself is handled by you. Under the bracket, **Score progress** shows every match visit by visit: search a player’s name to see what they threw, how their score went down and whom they played.',
        },
      ],
    },
    {
      id: 'stats',
      title: '7. Statistics and drills',
      blocks: [
        {
          p: 'Your statistics page is only for you. It shows:',
        },
        {
          list: [
            'Your results in each mode, and every opponent with your wins and losses against them.',
            'Your three-dart average, best visit, highest finish and the scores you throw most often.',
            'A heat map of where your darts land on the board.',
            'Six skills (scoring, doubles, trebles, bull, accuracy, consistency), with your strong and weak spots and the doubles and numbers you miss most.',
          ],
        },
        {
          p: 'In **Practice → Made for you**, **Make drills for me** creates drills for exactly your weak spots. They are yours alone, and every one you play feeds back into your statistics.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '8. Your data',
      blocks: [
        {
          p: 'If you unsubscribe from the app or delete your DevQuake account, your profile, drills, practice games and tournaments you organised are deleted. In games you played with others your name is removed, so they keep their own results against a “former player”.',
        },
      ],
    },
  ],
  questions: 'Questions or ideas? Write to {email}.',
  back: '← Back to the app',
};

const de: Manual = {
  metaTitle: 'Anleitung · Darts',
  metaDescription:
    'Darts auf dem Handy zählen: allein mit Übungen für dich trainieren, frei mit Freunden spielen oder Turniere mit Live-Turnierbaum veranstalten. 501, 301, Cricket, Shanghai, Rund um die Uhr und Killer.',
  ogTitle: 'Darts: Anleitung',
  cta: 'Lust, es auszuprobieren? Darts ist eine App für DevQuake-Mitglieder. {link}, dann abonniere die App.',
  ctaLink: 'Konto erstellen oder anmelden',
  kicker: 'Darts · Anleitung',
  title: 'So spielst du Darts mit der App',
  intro:
    'Die App zählt jeden Pfeil, prüft die Regeln, schlägt die besten Finishes vor und lernt, wie du spielst. Trainiere allein, spiele gegen Freunde oder veranstalte ein Turnier auf mehreren Scheiben.',
  contents: 'Inhalt',
  sections: [
    {
      id: 'start',
      title: '1. Erste Schritte',
      blocks: [
        {
          steps: [
            'Melde dich auf {host} an (oder erstelle ein Konto und bestätige deine E-Mail).',
            'Öffne **Dein Konto → Verfügbare Projekte** und **abonniere** „Darts“.',
            'Öffne die App und richte dein **Profil** ein: deinen Namen am Board, deine Wurfhand, dein Niveau, wie du Punkte eingeben möchtest und, falls du eins hast, dein Lieblingsdoppel.',
          ],
        },
      ],
    },
    {
      id: 'modes',
      title: '2. Drei Arten zu spielen',
      blocks: [
        {
          list: [
            '**Training**: allein. Jedes Spiel oder Übungen aus deiner Statistik. Jede Aufnahme mit ihren drei Pfeilen wird gespeichert, so siehst du deinen Fortschritt von Training zu Training.',
            '**Frei**: Starte ein Spiel, deine Freunde treten mit dem Code oder QR-Code bei. Als Gastgeber startest du das Spiel und kannst einen Spieler entfernen, damit jemand anderes beitreten kann.',
            '**Turnier**: ein K.-o.-Turnier auf deinen Scheiben. Spieler treten bei, du lost jede Runde aus, die Matches werden auf den Scheiben gespielt und alle verfolgen den Turnierbaum live.',
          ],
        },
      ],
    },
    {
      id: 'games',
      title: '3. Die Spiele',
      blocks: [
        {
          list: [
            '**501 / 301** (auch 701 und 1001): genau auf null herunterspielen; der letzte Pfeil muss ein Doppel oder das Bull sein. Unter null, auf 1 oder auf null ohne Doppel ist ein Bust und die Aufnahme zählt nicht. Optionen: Double in, Single oder Master out, mehrere Legs.',
            '**Cricket**: 15 bis 20 und das Bull mit je drei Treffern schließen, dann auf Zahlen punkten, die deine Gegner nicht geschlossen haben. Bei Cut-throat bekommen die Gegner deine Punkte.',
            '**Shanghai**: eine Zahl pro Runde. Single, Doppel und Triple davon in einer Aufnahme gewinnen sofort.',
            '**Rund um die Uhr**: 1 bis 20 der Reihe nach, dann das Bull. Optional nur Doppel.',
            '**Killer**: Jeder bekommt eine Zahl. Triff ihr Doppel, um Killer zu werden, dann nimm den anderen mit ihren Doppeln Leben.',
            '**Count-Up**: die meisten Punkte nach einer Anzahl von Runden.',
            '**Zielübung** und **Finish-Übung**: Training auf Ziele oder Finishes deiner Wahl (nur im Training).',
          ],
        },
      ],
    },
    {
      id: 'scoring',
      title: '4. Eine Aufnahme eingeben',
      blocks: [
        {
          p: 'Wenn du dran bist, gib deine drei Pfeile auf eine von zwei Arten ein (du kannst jederzeit wechseln):',
        },
        {
          list: [
            '**Dartscheibe**: Tippe das Feld an, in dem jeder Pfeil gelandet ist. Die Ringe sind breit, damit Doppel und Triple leicht zu treffen sind. Tippe außerhalb der Scheibe oder auf **Daneben** für einen Fehlwurf.',
            '**Tastenfeld**: ein Tipp pro Pfeil. Tippe bei Bedarf zuerst **Doppel** oder **Triple** an (gilt nur für den nächsten Pfeil), dann die Zahl. Darüber geben **Aufnahmen mit einem Klick** eine ganze Aufnahme auf einmal ein: die Finishes, deine häufigen Aufnahmen und übliche Punktzahlen an dieser Stelle des Spiels (nur, was die Regeln erlauben). Am Computer: D oder T, dann die Zahl, B Bull, 0 daneben, Enter sendet.',
          ],
        },
        {
          p: 'Jeder Pfeil wird schon bei der Eingabe nach den Regeln geprüft, und die Punkte ändern sich sofort. Nach einem Bust oder Finish ist die Aufnahme vorbei: Schick sie ab. Der Knopf sagt, was dann passiert, zum Beispiel **Weiter: Ana**, **Bust · weiter: Ana** oder **Spiel gewinnen!** **Pfeil zurück** nimmt einen Pfeil vor dem Senden zurück; **Meine letzte Aufnahme zurücknehmen** nimmt eine gesendete Aufnahme zurück, solange seitdem niemand geworfen hat.',
        },
        {
          tip: 'Unter den Pfeilen zeigt die App bis zu drei Vorschläge, die dich dem Sieg am nächsten bringen: Finish-Wege (zum Beispiel Triple 20 → Doppel 20 für 100), einen Stellwurf, wenn kein Finish möglich ist, oder die wichtigen Ziele bei Cricket, Shanghai und Killer. Der erste leuchtet auch auf der Dartscheibe auf.',
        },
      ],
    },
    {
      id: 'casual',
      title: '5. Gegen Freunde spielen',
      blocks: [
        {
          steps: [
            'Wähle unter **Frei** ein Spiel und seine Optionen, dann **Spiel erstellen und einladen**.',
            'Deine Freunde scannen den QR-Code, öffnen den Link oder tippen den 8-stelligen Code ein. Sie brauchen ein DevQuake-Konto und die App.',
            'Wenn alle da sind, **Spiel starten** (optional mit Auslosung, wer beginnt). Jeder gibt seine eigenen Pfeile auf seinem eigenen Handy ein.',
          ],
        },
        {
          p: 'Damit andere zusehen können, ohne mitzuspielen, öffne **Andere zusehen lassen** und teile diesen Link oder QR-Code. Zuschauer sehen die Punkte live, können aber nichts ändern.',
        },
      ],
    },
    {
      id: 'tournament',
      title: '6. Ein Turnier veranstalten',
      blocks: [
        {
          steps: [
            'Wähle unter **Turniere → Neues Turnier** den Namen, das Spiel, die Zahl der Scheiben und optional ein Startgeld mit deinem Anteil in Prozent (er kann 0 sein).',
            'Drucke die QR-Codes der Scheiben und häng jeden neben seine Scheibe. Spieler treten bei, indem sie den Code einer Scheibe scannen (sie kommen an diese Scheibe) oder mit dem Code des Turniers (die App verteilt sie auf die Scheiben).',
            'Wenn alle da sind, **Turnier starten**. Die App schlägt Paare ähnlich starker Spieler vor; tippe einen Spieler und dann einen anderen an, um sie zu tauschen, dann **Runde starten**.',
            'Matches kommen auf freie Scheiben; gibt es mehr Matches als Scheiben, beginnen die übrigen, sobald eine Scheibe frei ist. Spieler sehen ihr Match auf dem Startbildschirm und im Turnier.',
            'Wenn alle Matches einer Runde vorbei sind, lose die nächste Runde aus. Wer als Letzter übrig bleibt, gewinnt das Turnier.',
          ],
        },
        {
          tip: 'Tippe auf ein Match im Turnierbaum, um es live zu verfolgen. Nur seine beiden Spieler können Punkte eingeben. Die App hält fest, wer das Startgeld bezahlt hat und wie hoch der Topf ist; das Geld selbst verwaltest du. Unter dem Turnierbaum zeigt der **Punkteverlauf** jedes Match Aufnahme für Aufnahme: Suche nach dem Namen eines Spielers, um zu sehen, was er geworfen hat, wie sich sein Stand entwickelt hat und gegen wen er gespielt hat.',
        },
      ],
    },
    {
      id: 'stats',
      title: '7. Statistik und Übungen',
      blocks: [
        {
          p: 'Deine Statistikseite ist nur für dich. Sie zeigt:',
        },
        {
          list: [
            'Deine Ergebnisse in jeder Art und jeden Gegner mit deinen Siegen und Niederlagen gegen ihn.',
            'Deinen Drei-Dart-Schnitt, die beste Aufnahme, das höchste Finish und die Punktzahlen, die du am häufigsten wirfst.',
            'Ein Wärmebild, wo deine Pfeile auf der Scheibe landen.',
            'Sechs Fähigkeiten (Punkten, Doppel, Triple, Bull, Genauigkeit, Beständigkeit) mit deinen Stärken und Schwächen und den Doppeln und Zahlen, die du am häufigsten verfehlst.',
          ],
        },
        {
          p: 'Unter **Training → Für dich gemacht** erstellt **Übungen für mich erstellen** Übungen genau für deine Schwächen. Sie gehören nur dir, und jede gespielte fließt wieder in deine Statistik ein.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '8. Deine Daten',
      blocks: [
        {
          p: 'Wenn du die App kündigst oder dein DevQuake-Konto löschst, werden dein Profil, deine Übungen, deine Trainings und die von dir veranstalteten Turniere gelöscht. In Spielen mit anderen wird dein Name entfernt, sodass sie ihre eigenen Ergebnisse gegen einen „ehemaligen Spieler“ behalten.',
        },
      ],
    },
  ],
  questions: 'Fragen oder Ideen? Schreib an {email}.',
  back: '← Zurück zur App',
};

const ro: Manual = {
  metaTitle: 'Manual de utilizare · Darts',
  metaDescription:
    'Ține scorul la darts pe telefon: exersează singur cu exerciții făcute pentru tine, joacă liber cu prietenii sau organizează turnee cu tablou live. 501, 301, Cricket, Shanghai, În jurul ceasului și Killer.',
  ogTitle: 'Darts: manual de utilizare',
  cta: 'Vrei să încerci? Darts este o aplicație pentru membrii DevQuake. {link}, apoi abonează-te la aplicație.',
  ctaLink: 'Creează un cont sau autentifică-te',
  kicker: 'Darts · Manual de utilizare',
  title: 'Cum joci darts cu aplicația',
  intro:
    'Aplicația ține scorul fiecărei săgeți, verifică regulile, propune cele mai bune închideri și învață cum joci. Exersează singur, joacă cu prietenii sau organizează un turneu pe mai multe ținte.',
  contents: 'Cuprins',
  sections: [
    {
      id: 'start',
      title: '1. Primii pași',
      blocks: [
        {
          steps: [
            'Autentifică-te pe {host} (sau creează un cont și confirmă-ți adresa de e-mail).',
            'Deschide **Contul tău → Proiecte disponibile** și **Abonează-te** la „Darts”.',
            'Deschide aplicația și configurează-ți **profilul**: numele la țintă, mâna cu care arunci, nivelul, cum vrei să introduci scorurile și, dacă ai unul, dublul preferat.',
          ],
        },
      ],
    },
    {
      id: 'modes',
      title: '2. Trei moduri de joc',
      blocks: [
        {
          list: [
            '**Antrenament**: singur. Orice joc sau exerciții făcute din statisticile tale. Fiecare tură și cele trei săgeți ale ei sunt păstrate, ca să-ți vezi progresul de la un antrenament la altul.',
            '**Liber**: începe un joc, iar prietenii tăi intră cu codul sau codul QR. Ca gazdă pornești jocul și poți elimina un jucător ca să intre altcineva.',
            '**Turneu**: un turneu eliminatoriu pe țintele tale. Jucătorii se înscriu, tu tragi la sorți fiecare rundă, meciurile se joacă pe ținte și toată lumea urmărește tabloul live.',
          ],
        },
      ],
    },
    {
      id: 'games',
      title: '3. Jocurile',
      blocks: [
        {
          list: [
            '**501 / 301** (și 701 sau 1001): cobori exact la zero; ultima săgeată trebuie să fie un dublu sau centrul. Sub zero, la 1 sau la zero fără dublu e bust și tura nu contează. Opțiuni: double in, single sau master out, mai multe leg-uri.',
            '**Cricket**: închide 15–20 și centrul cu câte trei marcaje, apoi punctează pe numerele pe care adversarii nu le-au închis. La cut-throat punctele tale merg la adversari.',
            '**Shanghai**: un număr pe rundă. Simplul, dublul și triplul lui într-o tură câștigă pe loc.',
            '**În jurul ceasului**: de la 1 la 20 în ordine, apoi centrul. Opțional doar dubluri.',
            '**Killer**: fiecare primește un număr. Lovește-i dublul ca să devii killer, apoi ia viețile celorlalți cu dublurile lor.',
            '**Count-Up**: cele mai multe puncte după un număr de runde.',
            '**Exercițiu pe ținte** și **exercițiu de închidere**: antrenament pe țintele sau închiderile alese de tine (doar la Antrenament).',
          ],
        },
      ],
    },
    {
      id: 'scoring',
      title: '4. Introducerea unei ture',
      blocks: [
        {
          p: 'Când e rândul tău, introdu cele trei săgeți în unul din două moduri (poți schimba oricând):',
        },
        {
          list: [
            '**Ținta**: atinge zona în care a ajuns fiecare săgeată. Inelele sunt late, ca dublurile și triplurile să fie ușor de atins. Atinge în afara țintei sau **Ratat** pentru o săgeată ratată.',
            '**Tastatura**: o atingere pentru fiecare săgeată. Atinge mai întâi **Dublu** sau **Triplu** dacă e nevoie (se aplică doar săgeții următoare), apoi numărul. Deasupra, **turele dintr-un clic** introduc o tură întreagă deodată: închiderile, turele tale frecvente și scorurile obișnuite în acel moment al jocului (doar ce permit regulile). Pe calculator: D sau T, apoi numărul, B centru, 0 ratat, Enter trimite.',
          ],
        },
        {
          p: 'Fiecare săgeată este verificată după reguli încă de la introducere, iar scorurile se actualizează imediat. După un bust sau o închidere tura s-a încheiat: trimite-o. Butonul spune ce urmează, de exemplu **Urmează: Ana**, **Bust · urmează: Ana** sau **Câștigă jocul!** **Anulează săgeata** retrage o săgeată înainte de trimitere; **Anulează ultima mea tură** retrage o tură deja trimisă, cât timp nu a mai aruncat nimeni între timp.',
        },
        {
          tip: 'Sub săgeți aplicația arată până la trei sugestii care te aduc cel mai aproape de victorie: rute de închidere (de exemplu Triplu 20 → Dublu 20 pentru 100), o aruncare de pregătire când nu se poate închide sau țintele care contează la Cricket, Shanghai și Killer. Prima se aprinde și pe țintă.',
        },
      ],
    },
    {
      id: 'casual',
      title: '5. Joacă cu prietenii',
      blocks: [
        {
          steps: [
            'La **Liber**, alege un joc și opțiunile lui, apoi **Creează jocul și invită**.',
            'Prietenii tăi scanează codul QR, deschid linkul sau scriu codul de 8 caractere. Au nevoie de un cont DevQuake și de aplicație.',
            'Când au intrat toți, **Începe jocul** (opțional cu tragere la sorți a celui care începe). Fiecare jucător își introduce propriile săgeți pe propriul telefon.',
          ],
        },
        {
          p: 'Ca alții să urmărească jocul fără să joace, deschide **Lasă-i pe alții să urmărească** și trimite acel link sau cod QR. Cei care urmăresc văd scorurile live, dar nu pot schimba nimic.',
        },
      ],
    },
    {
      id: 'tournament',
      title: '6. Organizarea unui turneu',
      blocks: [
        {
          steps: [
            'La **Turnee → Turneu nou**, alege numele, jocul, numărul de ținte și, opțional, o taxă de participare cu partea ta în procente (poate fi 0).',
            'Tipărește codurile QR ale țintelor și pune-l pe fiecare lângă ținta lui. Jucătorii se înscriu scanând codul unei ținte (sunt puși la acea țintă) sau cu codul turneului (aplicația îi împarte pe ținte).',
            'Când au venit toți, **Pornește turneul**. Aplicația propune perechi de jucători de forță apropiată; atinge un jucător, apoi altul ca să-i schimbi, apoi **Pornește runda**.',
            'Meciurile merg pe țintele libere; dacă sunt mai multe meciuri decât ținte, celelalte încep imediat ce se eliberează o țintă. Jucătorii își văd meciul pe ecranul de start și în turneu.',
            'Când toate meciurile unei runde s-au terminat, trage la sorți runda următoare. Ultimul jucător rămas câștigă turneul.',
          ],
        },
        {
          tip: 'Atinge orice meci din tablou ca să-l urmărești live. Doar cei doi jucători ai lui pot introduce scorurile. Aplicația ține evidența celor care au plătit taxa și a potului; banii îi gestionezi tu. Sub tablou, **Evoluția scorului** arată fiecare meci tură cu tură: caută numele unui jucător ca să vezi ce a aruncat, cum a evoluat scorul lui și cu cine a jucat.',
        },
      ],
    },
    {
      id: 'stats',
      title: '7. Statistici și exerciții',
      blocks: [
        {
          p: 'Pagina ta de statistici este doar pentru tine. Arată:',
        },
        {
          list: [
            'Rezultatele tale în fiecare mod și fiecare adversar, cu victoriile și înfrângerile tale cu el.',
            'Media ta pe trei săgeți, cea mai bună tură, cea mai mare închidere și scorurile pe care le arunci cel mai des.',
            'O hartă termică a locurilor unde ajung săgețile tale pe țintă.',
            'Șase abilități (punctaj, dubluri, tripluri, centru, precizie, constanță), cu punctele tale forte și slabe și dublurile și numerele pe care le ratezi cel mai des.',
          ],
        },
        {
          p: 'La **Antrenament → Făcute pentru tine**, **Creează exerciții pentru mine** face exerciții exact pentru punctele tale slabe. Sunt doar ale tale, iar fiecare jucat contribuie din nou la statisticile tale.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '8. Datele tale',
      blocks: [
        {
          p: 'Dacă renunți la abonamentul aplicației sau îți ștergi contul DevQuake, profilul, exercițiile, antrenamentele și turneele organizate de tine sunt șterse. În jocurile cu alții numele tău este eliminat, astfel încât ei își păstrează propriile rezultate împotriva unui „fost jucător”.',
        },
      ],
    },
  ],
  questions: 'Întrebări sau idei? Scrie-ne la {email}.',
  back: '← Înapoi la aplicație',
};

const hu: Manual = {
  metaTitle: 'Útmutató · Darts',
  metaDescription:
    'Darts-pontozás a telefonodon: gyakorolj egyedül neked készült gyakorlatokkal, játssz kötetlenül barátokkal, vagy rendezz versenyt élő ágrajzzal. 501, 301, Cricket, Shanghai, Körbe és Killer.',
  ogTitle: 'Darts: útmutató',
  cta: 'Kipróbálnád? A Darts a DevQuake-tagok alkalmazása. {link}, majd iratkozz fel az alkalmazásra.',
  ctaLink: 'Hozz létre fiókot vagy jelentkezz be',
  kicker: 'Darts · Útmutató',
  title: 'Így dartsozz az alkalmazással',
  intro:
    'Az app minden nyíl pontját vezeti, ellenőrzi a szabályokat, javasolja a legjobb kiszállókat, és megtanulja, hogyan játszol. Gyakorolj egyedül, játssz barátokkal, vagy rendezz versenyt több táblán.',
  contents: 'Tartalom',
  sections: [
    {
      id: 'start',
      title: '1. Első lépések',
      blocks: [
        {
          steps: [
            'Jelentkezz be itt: {host} (vagy hozz létre fiókot, és erősítsd meg az e-mail-címedet).',
            'Nyisd meg a **Fiókod → Elérhető projektek** részt, és **iratkozz fel** a „Darts” alkalmazásra.',
            'Nyisd meg az appot, és állítsd be a **profilodat**: a neved a táblánál, a dobókezed, a szinted, hogyan szeretnéd beírni a pontokat, és ha van, a kedvenc duplád.',
          ],
        },
      ],
    },
    {
      id: 'modes',
      title: '2. Háromféle játék',
      blocks: [
        {
          list: [
            '**Gyakorlás**: egyedül. Bármelyik játék, vagy a statisztikádból készült gyakorlatok. Minden kör és a három nyila megmarad, így alkalomról alkalomra látod a fejlődésedet.',
            '**Kötetlen**: indíts játékot, a barátaid a kódjával vagy QR-kódjával csatlakoznak. Házigazdaként te indítod a játékot, és eltávolíthatsz egy játékost, hogy más csatlakozhasson.',
            '**Verseny**: kieséses verseny a tábláidon. A játékosok neveznek, te sorsolod a fordulókat, a meccsek a táblákon folynak, és mindenki élőben követi az ágrajzot.',
          ],
        },
      ],
    },
    {
      id: 'games',
      title: '3. A játékok',
      blocks: [
        {
          list: [
            '**501 / 301** (701 és 1001 is): pontosan nullára kell lejutni; az utolsó nyíl dupla vagy bull legyen. Nulla alá, 1-re vagy dupla nélkül nullára menni bust, és a kör nem számít. Lehetőségek: double in, single vagy master out, több leg.',
            '**Cricket**: zárd le a 15–20-at és a bullt három-három jelöléssel, aztán szerezz pontot azokon a számokon, amelyeket az ellenfeleid nem zártak le. Cut-throatnál a pontjaid az ellenfelekhez kerülnek.',
            '**Shanghai**: körönként egy szám. A szimplája, duplája és triplája egy körben azonnal nyer.',
            '**Körbe**: 1-től 20-ig sorban, aztán a bull. Választhatóan csak duplákkal.',
            '**Killer**: mindenki kap egy számot. Találd el a dupláját, hogy killer legyél, aztán vedd el a többiek életét a duplájukkal.',
            '**Count-Up**: a legtöbb pont adott számú kör után.',
            '**Célgyakorlat** és **kiszálló gyakorlat**: gyakorlás a választott célokra vagy kiszállókra (csak a Gyakorlásban).',
          ],
        },
      ],
    },
    {
      id: 'scoring',
      title: '4. Egy kör beírása',
      blocks: [
        {
          p: 'Amikor te következel, kétféleképpen írhatod be a három nyiladat (bármikor válthatsz):',
        },
        {
          list: [
            '**Darts-tábla**: koppints arra a mezőre, ahová a nyíl ment. A gyűrűk szélesek, így a dupla és a tripla könnyen eltalálható. A táblát elkerülő nyílhoz koppints a táblán kívülre vagy a **Mellé** gombra.',
            '**Billentyűk**: nyilanként egy koppintás. Ha kell, előbb koppints a **Dupla** vagy **Tripla** gombra (csak a következő nyílra vonatkozik), aztán a számra. Fölötte a **körök egy kattintással** egyszerre egy egész kört visznek be: a kiszállókat, a gyakori köreidet és a játék adott pontján szokásos pontszámokat (csak amit a szabályok engednek). Számítógépen: D vagy T, aztán a szám, B bull, 0 mellé, Enter küld.',
          ],
        },
        {
          p: 'Minden nyilat már beíráskor ellenőriz a szabályok szerint, és a pontok azonnal frissülnek. Bust vagy kiszálló után a kör véget ért: küldd el. A gomb megmondja, mi történik ezután, például **Jön: Ana**, **Bust · jön: Ana** vagy **Játék megnyerése!** A **Nyíl visszavonása** küldés előtt visszavesz egy nyilat; az **Utolsó köröm visszavonása** egy már elküldött kört von vissza, amíg azóta senki sem dobott.',
        },
        {
          tip: 'A nyilak alatt az app legfeljebb három javaslatot mutat, amelyek a legközelebb visznek a győzelemhez: kiszálló utakat (például Tripla 20 → Dupla 20 a 100-hoz), előkészítő dobást, ha nincs kiszálló, vagy a Cricketben, Shanghaiban és Killerben fontos célokat. Az első a darts-táblán is felvillan.',
        },
      ],
    },
    {
      id: 'casual',
      title: '5. Játék barátokkal',
      blocks: [
        {
          steps: [
            'A **Kötetlen** részben válassz játékot és beállításokat, aztán **Játék létrehozása és meghívás**.',
            'A barátaid beolvassák a QR-kódot, megnyitják a linket, vagy beírják a 8 karakteres kódot. DevQuake-fiók és az app kell nekik.',
            'Ha mindenki bent van, **Játék indítása** (választhatóan sorsolással, ki kezd). Mindenki a saját telefonján írja be a saját nyilait.',
          ],
        },
        {
          p: 'Hogy mások játék nélkül követhessék, nyisd meg az **Engedd, hogy mások nézzék** részt, és oszd meg azt a linket vagy QR-kódot. A nézők élőben látják a pontokat, de semmit sem módosíthatnak.',
        },
      ],
    },
    {
      id: 'tournament',
      title: '6. Verseny szervezése',
      blocks: [
        {
          steps: [
            'A **Versenyek → Új verseny** részben add meg a nevet, a játékot, a táblák számát, és ha szeretnéd, a nevezési díjat a részeddel százalékban (lehet 0).',
            'Nyomtasd ki a táblák QR-kódjait, és tedd mindegyiket a táblája mellé. A játékosok egy tábla kódjának beolvasásával neveznek (arra a táblára kerülnek), vagy a verseny kódjával (az app elosztja őket a táblák között).',
            'Ha mindenki itt van, **Verseny indítása**. Az app hasonló erősségű párokat javasol; koppints egy játékosra, majd egy másikra a cseréhez, aztán **Forduló indítása**.',
            'A meccsek a szabad táblákra kerülnek; ha több meccs van, mint tábla, a többi akkor indul, amikor felszabadul egy tábla. A játékosok a kezdőképernyőn és a versenyben látják a meccsüket.',
            'Ha a forduló minden meccse véget ért, sorsold ki a következőt. Az utolsó bent maradt játékos nyeri a versenyt.',
          ],
        },
        {
          tip: 'Koppints bármelyik meccsre az ágrajzban, hogy élőben nézd. Pontot csak a két játékosa írhat be. Az app nyilvántartja, ki fizette be a nevezési díjat, és mennyi a kassza; a pénzt te kezeled. Az ágrajz alatt a **Pontszám alakulása** minden meccset körről körre mutat: keress rá egy játékos nevére, és látod, mit dobott, hogyan alakult az állása, és ki ellen játszott.',
        },
      ],
    },
    {
      id: 'stats',
      title: '7. Statisztika és gyakorlatok',
      blocks: [
        {
          p: 'A statisztika oldalad csak a tiéd. Ezt mutatja:',
        },
        {
          list: [
            'Az eredményeidet módonként, és minden ellenfeledet a velük szembeni győzelmeiddel és vereségeiddel.',
            'A háromnyilas átlagodat, a legjobb körödet, a legmagasabb kiszállódat és a leggyakrabban dobott pontszámaidat.',
            'Egy hőtérképet arról, hová mennek a nyilaid a táblán.',
            'Hat képességet (pontszerzés, dupla, tripla, bull, pontosság, egyenletesség), az erős és gyenge pontjaiddal, valamint a legtöbbször elhibázott duplákkal és számokkal.',
          ],
        },
        {
          p: 'A **Gyakorlás → Neked készült** részben a **Készíts gyakorlatokat nekem** pontosan a gyenge pontjaidra készít gyakorlatokat. Csak a tieid, és minden lejátszott gyakorlat visszakerül a statisztikádba.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '8. Az adataid',
      blocks: [
        {
          p: 'Ha leiratkozol az appról vagy törlöd a DevQuake-fiókodat, törlődik a profilod, a gyakorlataid, a gyakorló játékaid és az általad szervezett versenyek. A másokkal játszott játékokból a neved eltűnik, így ők megtartják a saját eredményeiket egy „korábbi játékos” ellen.',
        },
      ],
    },
  ],
  questions: 'Kérdésed vagy ötleted van? Írj ide: {email}.',
  back: '← Vissza az alkalmazáshoz',
};

export const MANUAL: Record<Locale, Manual> = { en, de, ro, hu };
