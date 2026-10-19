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

const it: Manual = {
  metaTitle: 'Manuale · Darts',
  metaDescription:
    'Tieni il punteggio delle freccette sul telefono: allenati da solo con esercizi fatti per te, gioca partite amichevoli con gli amici o organizza tornei con tabellone in diretta. 501, 301, Cricket, Shanghai, Giro dell’orologio e Killer.',
  ogTitle: 'Darts: manuale',
  cta: 'Vuoi provarla? Darts è un’app per i membri di DevQuake. {link}, poi iscriviti all’app.',
  ctaLink: 'Crea un account o accedi',
  kicker: 'Darts · Manuale',
  title: 'Come giocare a freccette con l’app',
  intro:
    'L’app tiene il punteggio di ogni freccetta, controlla le regole, suggerisce le chiusure migliori e impara come giochi. Allenati da solo, gioca con gli amici o organizza un torneo su più bersagli.',
  contents: 'Indice',
  sections: [
    {
      id: 'start',
      title: '1. Per iniziare',
      blocks: [
        {
          steps: [
            'Accedi su {host} (o crea un account e conferma la tua email).',
            'Apri **Il tuo account → Progetti disponibili** e **iscriviti** a “Darts”.',
            'Apri l’app e imposta il tuo **profilo**: il tuo nome al bersaglio, la mano di tiro, il livello, come preferisci inserire i punteggi e, se ne hai uno, il tuo doppio preferito.',
          ],
        },
      ],
    },
    {
      id: 'modes',
      title: '2. Tre modi di giocare',
      blocks: [
        {
          list: [
            '**Allenamento**: da solo. Qualsiasi gioco, o esercizi creati dalle tue statistiche. Ogni turno e le sue tre freccette vengono salvati, così vedi i tuoi progressi sessione dopo sessione.',
            '**Amichevoli**: inizi una partita e i tuoi amici entrano con il suo codice o codice QR. Come organizzatore avvii la partita e puoi rimuovere un giocatore perché ne entri un altro.',
            '**Torneo**: un torneo a eliminazione diretta sui tuoi bersagli. I giocatori si iscrivono, tu sorteggi ogni round, gli incontri si giocano sui bersagli e tutti seguono il tabellone in diretta.',
          ],
        },
      ],
    },
    {
      id: 'games',
      title: '3. I giochi',
      blocks: [
        {
          list: [
            '**501 / 301** (anche 701 e 1001): scendi esattamente a zero; l’ultima freccetta deve essere un doppio o il bull. Scendere sotto zero, a 1 o a zero senza un doppio è un bust e il turno non conta. Opzioni: double in, single o master out, più leg.',
            '**Cricket**: chiudi i numeri dal 15 al 20 e il bull con tre segni ciascuno, poi fai punti sui numeri che i tuoi avversari non hanno chiuso. Nel cut-throat i tuoi punti vanno agli avversari.',
            '**Shanghai**: un numero per giro. Singolo, doppio e triplo di quel numero in un solo turno fanno vincere subito.',
            '**Giro dell’orologio**: da 1 a 20 in ordine, poi il bull. A scelta, solo doppi.',
            '**Killer**: ognuno riceve un numero. Colpisci il suo doppio per diventare killer, poi togli le vite agli altri con i loro doppi.',
            '**Count-Up**: vince chi fa più punti dopo un certo numero di giri.',
            '**Esercizio sui bersagli** ed **esercizio di chiusura**: allenamento sui bersagli o sulle chiusure che scegli (solo in Allenamento).',
          ],
        },
      ],
    },
    {
      id: 'scoring',
      title: '4. Inserire un turno',
      blocks: [
        {
          p: 'Quando tocca a te, inserisci le tue tre freccette in uno dei due modi (puoi cambiare quando vuoi):',
        },
        {
          list: [
            '**Bersaglio**: tocca il settore in cui è finita ogni freccetta. Gli anelli sono larghi, così doppi e tripli si toccano facilmente. Tocca fuori dal bersaglio o **Fuori** per una freccetta che lo ha mancato.',
            '**Tastierino**: un tocco per freccetta. Se serve, tocca prima **Doppio** o **Triplo** (vale solo per la freccetta successiva), poi il numero. Sopra, i **turni con un clic** inseriscono un turno intero in una volta: le chiusure, i tuoi turni frequenti e i punteggi comuni a questo punto della partita (solo turni ammessi dalle regole). Al computer: D o T poi il numero, B bull, 0 fuori, Invio invia.',
          ],
        },
        {
          p: 'Ogni freccetta viene controllata con le regole mentre la inserisci e i punteggi si aggiornano subito. Dopo un bust o una chiusura il turno è finito: invialo. Il pulsante dice cosa succede dopo, per esempio **Tocca a: Ana**, **Bust · tocca a: Ana** o **Vinci la partita!** **Annulla freccetta** toglie una freccetta prima di inviare; **Annulla il mio ultimo turno** annulla un turno già inviato, purché nessuno abbia tirato dopo.',
        },
        {
          tip: 'Sotto le freccette l’app mostra fino a tre suggerimenti che ti avvicinano di più alla vittoria: percorsi di chiusura (per esempio Triplo 20 → Doppio 20 per 100), un tiro di preparazione quando non si può chiudere, o i bersagli che contano in Cricket, Shanghai e Killer. Il primo si illumina anche sul bersaglio.',
        },
      ],
    },
    {
      id: 'casual',
      title: '5. Giocare con gli amici',
      blocks: [
        {
          steps: [
            'In **Amichevoli** scegli un gioco e le sue opzioni, poi **Crea la partita e invita**.',
            'I tuoi amici scansionano il codice QR, aprono il link o scrivono il codice di 8 caratteri. Servono un account DevQuake e l’app.',
            'Quando ci sono tutti, **Inizia la partita** (a scelta sorteggiando chi tira per primo). Ogni giocatore inserisce le proprie freccette sul proprio telefono.',
          ],
        },
        {
          p: 'Per far seguire la partita ad altri senza giocare, apri **Fai guardare gli altri** e condividi quel link o codice QR. Chi guarda vede i punteggi in diretta ma non può cambiare nulla.',
        },
      ],
    },
    {
      id: 'tournament',
      title: '6. Organizzare un torneo',
      blocks: [
        {
          steps: [
            'In **Tornei → Nuovo torneo** scegli il nome, il gioco, il numero di bersagli e, se vuoi, una quota d’iscrizione con la tua percentuale (può essere 0).',
            'Stampa i codici QR dei bersagli e metti ognuno accanto al suo bersaglio. I giocatori entrano scansionando il codice di un bersaglio (vengono assegnati a quel bersaglio) o con il codice del torneo (l’app li distribuisce sui bersagli).',
            'Quando ci sono tutti, **Inizia il torneo**. L’app suggerisce coppie di giocatori di forza simile; tocca un giocatore e poi un altro per scambiarli, poi **Inizia il round**.',
            'Gli incontri vanno sui bersagli liberi; se ci sono più incontri che bersagli, gli altri iniziano appena un bersaglio si libera. I giocatori vedono il loro incontro nella schermata iniziale e nel torneo.',
            'Quando tutti gli incontri di un round sono finiti, sorteggia il round successivo. L’ultimo giocatore rimasto vince il torneo.',
          ],
        },
        {
          tip: 'Tocca un incontro qualsiasi nel tabellone per guardarlo in diretta. Solo i suoi due giocatori possono inserire i punteggi. L’app tiene traccia di chi ha pagato la quota e del montepremi; i soldi li gestisci tu. Sotto il tabellone, **Andamento del punteggio** mostra ogni incontro turno per turno: cerca il nome di un giocatore per vedere cosa ha tirato, come è sceso il suo punteggio e contro chi ha giocato.',
        },
      ],
    },
    {
      id: 'stats',
      title: '7. Statistiche ed esercizi',
      blocks: [
        {
          p: 'La pagina delle statistiche è solo per te. Mostra:',
        },
        {
          list: [
            'I tuoi risultati in ogni modalità e ogni avversario, con le tue vittorie e sconfitte contro di lui.',
            'La tua media su tre freccette, il miglior turno, la chiusura più alta e i punteggi che fai più spesso.',
            'Una mappa di calore di dove finiscono le tue freccette sul bersaglio.',
            'Sei abilità (punteggio, doppi, tripli, bull, precisione, costanza), con i tuoi punti forti e deboli e i doppi e i numeri che sbagli di più.',
          ],
        },
        {
          p: 'In **Allenamento → Fatti per te**, **Crea esercizi per me** crea esercizi proprio per i tuoi punti deboli. Sono solo tuoi e ogni esercizio che giochi arricchisce le tue statistiche.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '8. I tuoi dati',
      blocks: [
        {
          p: 'Se annulli l’iscrizione all’app o elimini il tuo account DevQuake, vengono eliminati il tuo profilo, gli esercizi, le partite di allenamento e i tornei che hai organizzato. Nelle partite giocate con altri il tuo nome viene rimosso, così loro conservano i propri risultati contro un “ex giocatore”.',
        },
      ],
    },
  ],
  questions: 'Domande o idee? Scrivi a {email}.',
  back: '← Torna all’app',
};

const es: Manual = {
  metaTitle: 'Manual de uso · Darts',
  metaDescription:
    'Lleva la puntuación de los dardos en el móvil: entrena solo con ejercicios hechos para ti, juega partidas amistosas con amigos u organiza torneos con un cuadro en directo. 501, 301, Cricket, Shanghai, Vuelta al reloj y Killer.',
  ogTitle: 'Darts: manual de uso',
  cta: '¿Quieres probarla? Darts es una app para miembros de DevQuake. {link} y suscríbete a la app.',
  ctaLink: 'Crea una cuenta o inicia sesión',
  kicker: 'Darts · Manual de uso',
  title: 'Cómo jugar a los dardos con la app',
  intro:
    'La app lleva la puntuación de cada dardo, comprueba las reglas, sugiere los mejores cierres y aprende cómo juegas. Practica solo, juega con amigos u organiza un torneo en varias dianas.',
  contents: 'Contenido',
  sections: [
    {
      id: 'start',
      title: '1. Primeros pasos',
      blocks: [
        {
          steps: [
            'Inicia sesión en {host} (o crea una cuenta y confirma tu correo).',
            'Abre **Tu cuenta → Proyectos disponibles** y **suscríbete** a “Darts”.',
            'Abre la app y configura tu **perfil**: tu nombre en la diana, tu mano de lanzamiento, tu nivel, cómo prefieres introducir las puntuaciones y, si tienes uno, tu doble favorito.',
          ],
        },
      ],
    },
    {
      id: 'modes',
      title: '2. Tres formas de jugar',
      blocks: [
        {
          list: [
            '**Práctica**: solo. Cualquier juego, o ejercicios creados a partir de tus estadísticas. Se guarda cada tirada con sus tres dardos, así ves tu progreso sesión tras sesión.',
            '**Amistosas**: empiezas una partida y tus amigos se unen con su código o código QR. Como anfitrión, empiezas la partida y puedes quitar a un jugador para que entre otro.',
            '**Torneo**: un torneo eliminatorio en tus dianas. Los jugadores se apuntan, tú sorteas cada ronda, los enfrentamientos se juegan en las dianas y todos siguen el cuadro en directo.',
          ],
        },
      ],
    },
    {
      id: 'games',
      title: '3. Los juegos',
      blocks: [
        {
          list: [
            '**501 / 301** (también 701 y 1001): baja exactamente a cero; el último dardo debe ser un doble o el bull. Bajar de cero, quedarte en 1 o llegar a cero sin doble es un bust y la tirada no cuenta. Opciones: double in, single o master out, varios legs.',
            '**Cricket**: cierra del 15 al 20 y el bull con tres marcas cada uno, y luego puntúa en los números que tus rivales no han cerrado. En cut-throat tus puntos van a los rivales.',
            '**Shanghai**: un número por ronda. Su simple, su doble y su triple en una sola tirada ganan al instante.',
            '**Vuelta al reloj**: del 1 al 20 en orden, y luego el bull. Opcionalmente, solo dobles.',
            '**Killer**: cada uno recibe un número. Acierta su doble para convertirte en killer y luego quita vidas a los demás con sus dobles.',
            '**Count-Up**: gana quien más puntos tenga tras un número de rondas.',
            '**Ejercicio de objetivos** y **ejercicio de cierre**: práctica en los objetivos o cierres que elijas (solo en Práctica).',
          ],
        },
      ],
    },
    {
      id: 'scoring',
      title: '4. Introducir una tirada',
      blocks: [
        {
          p: 'Cuando te toque, introduce tus tres dardos de una de estas dos formas (puedes cambiar cuando quieras):',
        },
        {
          list: [
            '**Diana**: toca el sector donde cayó cada dardo. Los anillos son anchos, así que los dobles y triples son fáciles de tocar. Toca fuera de la diana o **Fallo** para un dardo que no le dio.',
            '**Teclado**: un toque por dardo. Si hace falta, toca primero **Doble** o **Triple** (solo vale para el siguiente dardo) y luego el número. Encima, las **tiradas con un clic** introducen una tirada entera de una vez: los cierres, tus tiradas frecuentes y las puntuaciones habituales en este punto de la partida (solo tiradas que permiten las reglas). En el ordenador: D o T y luego el número, B bull, 0 fallo, Intro envía.',
          ],
        },
        {
          p: 'Cada dardo se comprueba con las reglas al introducirlo y las puntuaciones se actualizan al momento. Tras un bust o un cierre, la tirada ha terminado: envíala. El botón dice qué pasará, por ejemplo **Le toca a: Ana**, **Bust · le toca a: Ana** o **¡Gana la partida!** **Deshacer dardo** retira un dardo antes de enviar; **Deshacer mi última tirada** retira una tirada ya enviada, siempre que nadie haya lanzado después.',
        },
        {
          tip: 'Debajo de los dardos, la app muestra hasta tres sugerencias que más te acercan a la victoria: rutas de cierre (por ejemplo Triple 20 → Doble 20 para 100), un tiro de preparación cuando no se puede cerrar, o los objetivos que importan en Cricket, Shanghai y Killer. La primera también se ilumina en la diana.',
        },
      ],
    },
    {
      id: 'casual',
      title: '5. Jugar con amigos',
      blocks: [
        {
          steps: [
            'En **Amistosas**, elige un juego y sus opciones, y luego **Crear partida e invitar**.',
            'Tus amigos escanean el código QR, abren el enlace o escriben el código de 8 caracteres. Necesitan una cuenta de DevQuake y la app.',
            'Cuando estén todos, **Empezar partida** (opcionalmente sorteando quién lanza primero). Cada jugador introduce sus propios dardos en su propio móvil.',
          ],
        },
        {
          p: 'Para que otros sigan la partida sin jugar, abre **Deja que otros miren** y comparte ese enlace o código QR. Quienes miran ven las puntuaciones en directo, pero no pueden cambiar nada.',
        },
      ],
    },
    {
      id: 'tournament',
      title: '6. Organizar un torneo',
      blocks: [
        {
          steps: [
            'En **Torneos → Nuevo torneo**, elige el nombre, el juego, el número de dianas y, si quieres, una cuota de inscripción con tu parte en porcentaje (puede ser 0).',
            'Imprime los códigos QR de las dianas y pon cada uno junto a su diana. Los jugadores se unen escaneando el código de una diana (quedan asignados a esa diana) o con el código del torneo (la app los reparte entre las dianas).',
            'Cuando estén todos, **Empezar torneo**. La app sugiere parejas de jugadores de nivel parecido; toca un jugador y luego otro para intercambiarlos, y después **Empezar ronda**.',
            'Los enfrentamientos van a las dianas libres; si hay más enfrentamientos que dianas, el resto empieza en cuanto quede una diana libre. Los jugadores ven su enfrentamiento en la pantalla de inicio y en el torneo.',
            'Cuando terminen todos los enfrentamientos de una ronda, sortea la siguiente. El último jugador que quede gana el torneo.',
          ],
        },
        {
          tip: 'Toca cualquier enfrentamiento del cuadro para verlo en directo. Solo sus dos jugadores pueden anotar puntos. La app lleva la cuenta de quién ha pagado la cuota y del bote; el dinero lo gestionas tú. Debajo del cuadro, **Evolución de la puntuación** muestra cada enfrentamiento tirada a tirada: busca el nombre de un jugador para ver qué lanzó, cómo bajó su puntuación y contra quién jugó.',
        },
      ],
    },
    {
      id: 'stats',
      title: '7. Estadísticas y ejercicios',
      blocks: [
        {
          p: 'Tu página de estadísticas es solo para ti. Muestra:',
        },
        {
          list: [
            'Tus resultados en cada modo y cada rival, con tus victorias y derrotas contra él.',
            'Tu media de tres dardos, tu mejor tirada, tu cierre más alto y las puntuaciones que más lanzas.',
            'Un mapa de calor de dónde caen tus dardos en la diana.',
            'Seis habilidades (puntuación, dobles, triples, bull, precisión, regularidad), con tus puntos fuertes y débiles y los dobles y números que más fallas.',
          ],
        },
        {
          p: 'En **Práctica → Hechos para ti**, **Crea ejercicios para mí** crea ejercicios justo para tus puntos débiles. Son solo tuyos, y cada uno que juegas alimenta tus estadísticas.',
        },
      ],
    },
    {
      id: 'privacy',
      title: '8. Tus datos',
      blocks: [
        {
          p: 'Si cancelas tu suscripción a la app o eliminas tu cuenta de DevQuake, se eliminan tu perfil, tus ejercicios, tus partidas de práctica y los torneos que organizaste. En las partidas que jugaste con otros se quita tu nombre, así ellos conservan sus resultados contra un “antiguo jugador”.',
        },
      ],
    },
  ],
  questions: '¿Preguntas o ideas? Escribe a {email}.',
  back: '← Volver a la app',
};

export const MANUAL: Record<Locale, Manual> = { en, de, ro, hu, it, es };
