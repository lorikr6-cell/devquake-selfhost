import { defineMessages } from './define';

/** Which page shows which tips (tips.<key>), matched by the address (PageTips, @devquake/ui). */
export const TIPS_PAGES: Record<string, string> = {
  '/': 'home',
  '/profile': 'profile',
  '/practice': 'practice',
  '/casual': 'casual',
  '/tournaments': 'tournaments',
  '/tournaments/new': 'tournamentNew',
  '/tournaments/:id': 'tournament',
  '/games/:id': 'game',
  '/watch/:code': 'watch',
  '/join/:code': 'join',
  '/stats': 'stats',
};

/** How-to tips for each page: how to see the details, how to add, how to change. */
export const tips = defineMessages(
  {
    tips: {
      home: {
        see: 'Your tournament match and the games to continue are at the top; the three modes are below.',
        create: 'Pick Practice, Casual or Tournament to start, or type a code to join a game.',
        edit: 'Open a game to continue it; change your name at the board and how you enter scores in your profile.',
      },
      profile: {
        see: 'Your name at the board, throwing hand, level, favourite double and how you like to enter scores.',
        create: 'Set it up once before your first game; the drills and suggestions use it.',
        edit: 'Change any field and save; it counts from the next game.',
      },
      practice: {
        see: 'Drills made for you from your statistics, and your practice sessions with every visit.',
        create:
          'Choose a game or drill and start it, or press “Make drills for me” for your weak spots.',
        edit: 'Open a session to continue it; new drills replace the old ones when you make them again.',
      },
      casual: {
        see: 'Your casual games with friends, waiting, running and finished.',
        create:
          'Choose a game and its options, then “Create game and invite”; friends join with the code or QR code.',
        edit: 'As the host, start the game when everyone is in, or remove a player so someone else can join.',
      },
      tournaments: {
        see: 'The tournaments you organise or play in, with their state.',
        create: 'Use “New tournament”, or type a tournament’s code to join it.',
        edit: 'Open a tournament to draw rounds, swap players or follow the bracket.',
      },
      tournamentNew: {
        see: 'The settings of a knock-out on your boards: game, boards, entry fee and your share.',
        create:
          'Fill in the name and game, choose the number of boards and whether you play too, then create it.',
        edit: 'Most settings can be changed in the tournament until it starts.',
      },
      tournament: {
        see: 'The live bracket; tap a match to watch it, your own match shows at the top.',
        create:
          'Print the boards’ QR codes; when everyone is in, “Start tournament” and draw the first round.',
        edit: 'Tap one player and then another to swap them before “Start round”; tick who paid the fee.',
      },
      game: {
        see: 'The scores of every player and the suggested finishes under the darts.',
        create: 'Enter your three darts on the dartboard or the keypad, then send the visit.',
        edit: 'A wrong visit can be undone after sending; switch between dartboard and keypad at any time.',
      },
      watch: {
        see: 'A live game, read only: the scores update as the players throw.',
        create: 'Only the players enter scores; share this link so others can watch too.',
        edit: 'Nothing can be changed here.',
      },
      join: {
        see: 'The game, tournament or board this code or QR code belongs to.',
        create: 'Press join to take your place; a board’s code puts you on that board.',
        edit: 'Leave a game you joined from its page before it starts.',
      },
      stats: {
        see: 'Your averages, best visit, highest finish, a heat map, your six skills and every opponent.',
        create: 'Statistics grow with every game you play; drills are made from them in Practice.',
        edit: 'Nothing to change: the numbers follow your games, and only you see this page.',
      },
    },
  },
  {
    de: {
      tips: {
        home: {
          see: 'Dein Turnierspiel und offene Spiele stehen oben, darunter die drei Modi.',
          create:
            'Wähle Training, Freies Spiel oder Turnier, oder gib einen Code ein, um beizutreten.',
          edit: 'Öffne ein Spiel, um weiterzuspielen; Name am Board und Eingabeart änderst du im Profil.',
        },
        profile: {
          see: 'Dein Name am Board, Wurfhand, Niveau, Lieblingsdoppel und wie du Punkte eingibst.',
          create: 'Richte es vor dem ersten Spiel einmal ein; Übungen und Vorschläge nutzen es.',
          edit: 'Ändere ein Feld und speichere; es gilt ab dem nächsten Spiel.',
        },
        practice: {
          see: 'Für dich gemachte Übungen aus deiner Statistik und deine Trainings mit jeder Aufnahme.',
          create:
            'Wähle ein Spiel oder eine Übung und starte, oder lass dir Übungen für deine Schwächen machen.',
          edit: 'Öffne ein Training, um weiterzumachen; neue Übungen ersetzen die alten.',
        },
        casual: {
          see: 'Deine Spiele mit Freunden: wartend, laufend und beendet.',
          create:
            'Wähle ein Spiel und seine Optionen und lade ein; Freunde treten mit Code oder QR-Code bei.',
          edit: 'Als Gastgeber startest du, wenn alle da sind, oder entfernst einen Spieler, damit ein anderer beitreten kann.',
        },
        tournaments: {
          see: 'Die Turniere, die du organisierst oder spielst, mit ihrem Stand.',
          create:
            'Lege ein neues Turnier an, oder gib den Code eines Turniers ein, um beizutreten.',
          edit: 'Öffne ein Turnier, um Runden auszulosen, Spieler zu tauschen oder dem Turnierbaum zu folgen.',
        },
        tournamentNew: {
          see: 'Die Einstellungen eines K.-o.-Turniers auf deinen Boards: Spiel, Boards, Startgeld und dein Anteil.',
          create:
            'Gib Name und Spiel ein, wähle die Zahl der Boards und ob du mitspielst, und lege es an.',
          edit: 'Die meisten Einstellungen lassen sich bis zum Start im Turnier ändern.',
        },
        tournament: {
          see: 'Der Live-Turnierbaum; tippe auf ein Spiel, um zuzusehen, dein eigenes steht oben.',
          create:
            'Drucke die QR-Codes der Boards; wenn alle da sind, starte das Turnier und lose die erste Runde aus.',
          edit: 'Tippe nacheinander auf zwei Spieler, um sie vor dem Rundenstart zu tauschen; hake ab, wer bezahlt hat.',
        },
        game: {
          see: 'Die Punkte aller Spieler und die vorgeschlagenen Finishes unter den Darts.',
          create:
            'Gib deine drei Darts auf der Scheibe oder dem Tastenfeld ein und sende die Aufnahme.',
          edit: 'Eine falsche Aufnahme lässt sich nach dem Senden zurücknehmen; wechsle jederzeit zwischen Scheibe und Tastenfeld.',
        },
        watch: {
          see: 'Ein Live-Spiel zum Zusehen: die Punkte ändern sich, während die Spieler werfen.',
          create: 'Nur die Spieler geben Punkte ein; teile diesen Link, damit andere auch zusehen.',
          edit: 'Hier lässt sich nichts ändern.',
        },
        join: {
          see: 'Das Spiel, Turnier oder Board, zu dem dieser Code oder QR-Code gehört.',
          create:
            'Tritt bei, um deinen Platz einzunehmen; der Code eines Boards setzt dich an dieses Board.',
          edit: 'Ein Spiel, dem du beigetreten bist, verlässt du vor dem Start auf seiner Seite.',
        },
        stats: {
          see: 'Deine Durchschnitte, beste Aufnahme, höchstes Finish, eine Heatmap, sechs Fähigkeiten und jeder Gegner.',
          create:
            'Die Statistik wächst mit jedem Spiel; im Training werden daraus Übungen gemacht.',
          edit: 'Nichts zu ändern: die Zahlen folgen deinen Spielen, und nur du siehst diese Seite.',
        },
      },
    },
    ro: {
      tips: {
        home: {
          see: 'Meciul tău din turneu și jocurile de continuat sunt sus; dedesubt sunt cele trei moduri.',
          create:
            'Alege Antrenament, Joc liber sau Turneu, sau scrie un cod ca să intri într-un joc.',
          edit: 'Deschide un joc ca să-l continui; numele la țintă și felul de introducere le schimbi în profil.',
        },
        profile: {
          see: 'Numele tău la țintă, mâna cu care arunci, nivelul, dublul preferat și cum introduci scorul.',
          create:
            'Completează-l o dată înainte de primul joc; exercițiile și sugestiile îl folosesc.',
          edit: 'Modifică orice câmp și salvează; contează de la jocul următor.',
        },
        practice: {
          see: 'Exerciții făcute pentru tine din statistici și antrenamentele tale, cu fiecare rundă.',
          create:
            'Alege un joc sau un exercițiu și pornește-l, sau cere exerciții pentru punctele tale slabe.',
          edit: 'Deschide un antrenament ca să-l continui; exercițiile noi le înlocuiesc pe cele vechi.',
        },
        casual: {
          see: 'Jocurile tale cu prietenii: în așteptare, în desfășurare și terminate.',
          create: 'Alege un joc și opțiunile, apoi invită; prietenii intră cu codul sau codul QR.',
          edit: 'Ca gazdă pornești jocul când sunt toți, sau scoți un jucător ca să poată intra altcineva.',
        },
        tournaments: {
          see: 'Turneele pe care le organizezi sau la care joci, cu stadiul lor.',
          create: 'Creează un turneu nou, sau scrie codul unui turneu ca să intri.',
          edit: 'Deschide un turneu ca să tragi la sorți runde, să schimbi jucători sau să urmărești tabloul.',
        },
        tournamentNew: {
          see: 'Setările unui turneu eliminatoriu pe țintele tale: joc, ținte, taxă de participare și partea ta.',
          create:
            'Completează numele și jocul, alege numărul de ținte și dacă joci și tu, apoi creează-l.',
          edit: 'Cele mai multe setări se pot schimba în turneu până la start.',
        },
        tournament: {
          see: 'Tabloul în timp real; atinge un meci ca să-l urmărești, meciul tău e sus.',
          create:
            'Tipărește codurile QR ale țintelor; când sunt toți, pornește turneul și trage la sorți prima rundă.',
          edit: 'Atinge un jucător și apoi altul ca să-i schimbi înainte de start; bifează cine a plătit.',
        },
        game: {
          see: 'Scorul fiecărui jucător și închiderile sugerate sub săgeți.',
          create: 'Introdu cele trei săgeți pe țintă sau pe tastatură, apoi trimite runda.',
          edit: 'O rundă greșită se poate anula după trimitere; schimbă oricând între țintă și tastatură.',
        },
        watch: {
          see: 'Un joc în direct, doar de privit: scorul se schimbă pe măsură ce jucătorii aruncă.',
          create: 'Doar jucătorii introduc scorul; partajează linkul ca să privească și alții.',
          edit: 'Aici nu se poate schimba nimic.',
        },
        join: {
          see: 'Jocul, turneul sau ținta de care ține acest cod sau cod QR.',
          create: 'Intră ca să-ți iei locul; codul unei ținte te pune la acea țintă.',
          edit: 'Un joc în care ai intrat îl părăsești de pe pagina lui, înainte de start.',
        },
        stats: {
          see: 'Mediile, cea mai bună rundă, cea mai mare închidere, o hartă termică, șase abilități și fiecare adversar.',
          create: 'Statisticile cresc cu fiecare joc; la Antrenament se fac din ele exerciții.',
          edit: 'Nimic de schimbat: cifrele urmează jocurile tale, și doar tu vezi pagina asta.',
        },
      },
    },
    hu: {
      tips: {
        home: {
          see: 'Fent a tornameccsed és a folytatható játékok, alattuk a három mód.',
          create:
            'Válaszd a Gyakorlást, a Baráti játékot vagy a Tornát, vagy írj be egy kódot a csatlakozáshoz.',
          edit: 'Nyiss meg egy játékot a folytatáshoz; a táblánál használt neved és a pontbevitelt a profilban módosítod.',
        },
        profile: {
          see: 'A neved a táblánál, a dobókezed, a szinted, a kedvenc duplád és ahogy a pontokat beviszed.',
          create:
            'Az első játék előtt egyszer állítsd be; a gyakorlatok és javaslatok ezt használják.',
          edit: 'Módosíts bármelyik mezőt és ments; a következő játéktól számít.',
        },
        practice: {
          see: 'A statisztikáidból neked készült gyakorlatok és az edzéseid minden körrel.',
          create:
            'Válassz játékot vagy gyakorlatot és indítsd, vagy kérj gyakorlatokat a gyenge pontjaidra.',
          edit: 'Nyiss meg egy edzést a folytatáshoz; az új gyakorlatok felváltják a régieket.',
        },
        casual: {
          see: 'A baráti játékaid: várakozók, folyamatban lévők és befejezettek.',
          create:
            'Válassz játékot és beállításokat, majd hívd meg a barátaidat; kóddal vagy QR-kóddal csatlakoznak.',
          edit: 'Házigazdaként akkor indítod, ha mindenki ott van, vagy eltávolítasz egy játékost, hogy más beléphessen.',
        },
        tournaments: {
          see: 'A tornák, amelyeket szervezel vagy amelyeken játszol, az állásukkal.',
          create: 'Hozz létre új tornát, vagy írd be egy torna kódját a csatlakozáshoz.',
          edit: 'Nyiss meg egy tornát a fordulók sorsolásához, játékosok cseréjéhez vagy az ágrajz követéséhez.',
        },
        tournamentNew: {
          see: 'Egy kieséses torna beállításai a tábláidon: játék, táblák, nevezési díj és a részed.',
          create:
            'Add meg a nevet és a játékot, a táblák számát és hogy te is játszol-e, majd hozd létre.',
          edit: 'A legtöbb beállítás a tornában a kezdésig módosítható.',
        },
        tournament: {
          see: 'Az élő ágrajz; koppints egy meccsre a nézéséhez, a saját meccsed fent van.',
          create:
            'Nyomtasd ki a táblák QR-kódjait; ha mindenki megvan, indítsd a tornát és sorsold az első fordulót.',
          edit: 'Koppints egy játékosra, majd egy másikra a cseréhez a forduló előtt; jelöld, ki fizetett.',
        },
        game: {
          see: 'Minden játékos pontjai és a javasolt kiszállók a nyilak alatt.',
          create: 'Vidd be a három nyilad a táblán vagy a billentyűzeten, majd küldd el a kört.',
          edit: 'Egy hibás kört küldés után visszavonhatsz; bármikor válthatsz tábla és billentyűzet között.',
        },
        watch: {
          see: 'Egy élő játék nézésre: a pontok frissülnek, ahogy a játékosok dobnak.',
          create:
            'Pontot csak a játékosok visznek be; oszd meg ezt a linket, hogy mások is nézhessék.',
          edit: 'Itt semmi sem módosítható.',
        },
        join: {
          see: 'A játék, torna vagy tábla, amelyhez ez a kód vagy QR-kód tartozik.',
          create: 'Csatlakozz, hogy elfoglald a helyed; egy tábla kódja arra a táblára tesz.',
          edit: 'Egy játékból, amelyhez csatlakoztál, a kezdés előtt az oldalán léphetsz ki.',
        },
        stats: {
          see: 'Az átlagaid, a legjobb köröd, a legmagasabb kiszállód, hőtérkép, hat készség és minden ellenfél.',
          create:
            'A statisztika minden játékkal bővül; a Gyakorlásnál ebből készülnek a gyakorlatok.',
          edit: 'Nincs mit módosítani: a számok a játékaidat követik, és ezt az oldalt csak te látod.',
        },
      },
    },
    it: {
      tips: {
        home: {
          see: 'In alto la tua partita del torneo e le partite da continuare; sotto le tre modalità.',
          create:
            'Scegli Allenamento, Partita libera o Torneo, oppure scrivi un codice per unirti.',
          edit: 'Apri una partita per continuarla; nome al bersaglio e modo di inserire i punti si cambiano nel profilo.',
        },
        profile: {
          see: 'Il tuo nome al bersaglio, la mano di tiro, il livello, il doppio preferito e come inserisci i punti.',
          create:
            'Impostalo una volta prima della prima partita; esercizi e suggerimenti lo usano.',
          edit: 'Cambia un campo e salva; vale dalla partita successiva.',
        },
        practice: {
          see: 'Esercizi fatti per te dalle tue statistiche e i tuoi allenamenti con ogni turno.',
          create:
            'Scegli un gioco o un esercizio e avvialo, o fatti preparare esercizi per i punti deboli.',
          edit: 'Apri un allenamento per continuarlo; i nuovi esercizi sostituiscono i vecchi.',
        },
        casual: {
          see: 'Le tue partite con gli amici: in attesa, in corso e finite.',
          create:
            'Scegli un gioco e le opzioni, poi invita; gli amici entrano con il codice o il codice QR.',
          edit: 'Come ospite avvii quando ci sono tutti, o togli un giocatore perché ne entri un altro.',
        },
        tournaments: {
          see: 'I tornei che organizzi o in cui giochi, con il loro stato.',
          create: 'Crea un nuovo torneo, o scrivi il codice di un torneo per unirti.',
          edit: 'Apri un torneo per sorteggiare i turni, scambiare giocatori o seguire il tabellone.',
        },
        tournamentNew: {
          see: 'Le impostazioni di un torneo a eliminazione sui tuoi bersagli: gioco, bersagli, quota e la tua parte.',
          create:
            'Inserisci nome e gioco, scegli quanti bersagli e se giochi anche tu, poi crealo.',
          edit: 'Quasi tutte le impostazioni si cambiano nel torneo fino all’inizio.',
        },
        tournament: {
          see: 'Il tabellone dal vivo; tocca una partita per guardarla, la tua è in alto.',
          create:
            'Stampa i codici QR dei bersagli; quando ci sono tutti, avvia il torneo e sorteggia il primo turno.',
          edit: 'Tocca un giocatore e poi un altro per scambiarli prima del turno; segna chi ha pagato.',
        },
        game: {
          see: 'I punti di ogni giocatore e le chiusure suggerite sotto le freccette.',
          create: 'Inserisci le tre freccette sul bersaglio o sul tastierino, poi invia il turno.',
          edit: 'Un turno sbagliato si può annullare dopo l’invio; passa quando vuoi tra bersaglio e tastierino.',
        },
        watch: {
          see: 'Una partita dal vivo da guardare: i punti cambiano mentre i giocatori tirano.',
          create: 'Solo i giocatori inseriscono i punti; condividi il link perché altri guardino.',
          edit: 'Qui non si può cambiare nulla.',
        },
        join: {
          see: 'La partita, il torneo o il bersaglio a cui appartiene questo codice o codice QR.',
          create:
            'Unisciti per prendere il tuo posto; il codice di un bersaglio ti mette a quel bersaglio.',
          edit: 'Lasci una partita a cui ti sei unito dalla sua pagina, prima dell’inizio.',
        },
        stats: {
          see: 'Le tue medie, il turno migliore, la chiusura più alta, una mappa di calore, sei abilità e ogni avversario.',
          create:
            'Le statistiche crescono con ogni partita; in Allenamento ne nascono gli esercizi.',
          edit: 'Niente da cambiare: i numeri seguono le tue partite, e solo tu vedi questa pagina.',
        },
      },
    },
    es: {
      tips: {
        home: {
          see: 'Arriba están tu partido del torneo y las partidas por continuar; debajo, los tres modos.',
          create: 'Elige Práctica, Partida libre o Torneo, o escribe un código para unirte.',
          edit: 'Abre una partida para continuarla; tu nombre en la diana y cómo anotas se cambian en el perfil.',
        },
        profile: {
          see: 'Tu nombre en la diana, tu mano de tiro, tu nivel, tu doble favorito y cómo anotas.',
          create:
            'Configúralo una vez antes de tu primera partida; los ejercicios y sugerencias lo usan.',
          edit: 'Cambia cualquier campo y guarda; cuenta desde la siguiente partida.',
        },
        practice: {
          see: 'Ejercicios hechos para ti con tus estadísticas y tus sesiones con cada tirada.',
          create:
            'Elige un juego o ejercicio y empiézalo, o pide ejercicios para tus puntos débiles.',
          edit: 'Abre una sesión para continuarla; los ejercicios nuevos sustituyen a los antiguos.',
        },
        casual: {
          see: 'Tus partidas con amigos: en espera, en curso y terminadas.',
          create:
            'Elige un juego y sus opciones e invita; tus amigos se unen con el código o el código QR.',
          edit: 'Como anfitrión empiezas cuando están todos, o quitas a un jugador para que entre otro.',
        },
        tournaments: {
          see: 'Los torneos que organizas o en los que juegas, con su estado.',
          create: 'Crea un torneo nuevo, o escribe el código de un torneo para unirte.',
          edit: 'Abre un torneo para sortear rondas, cambiar jugadores o seguir el cuadro.',
        },
        tournamentNew: {
          see: 'Los ajustes de un torneo eliminatorio en tus dianas: juego, dianas, inscripción y tu parte.',
          create:
            'Escribe el nombre y el juego, elige cuántas dianas y si juegas tú también, y créalo.',
          edit: 'Casi todos los ajustes se pueden cambiar en el torneo hasta que empieza.',
        },
        tournament: {
          see: 'El cuadro en directo; toca un partido para verlo, el tuyo está arriba.',
          create:
            'Imprime los códigos QR de las dianas; cuando estén todos, empieza el torneo y sortea la primera ronda.',
          edit: 'Toca un jugador y luego otro para cambiarlos antes de la ronda; marca quién pagó.',
        },
        game: {
          see: 'Los puntos de cada jugador y los cierres sugeridos bajo los dardos.',
          create: 'Anota tus tres dardos en la diana o en el teclado y envía la tirada.',
          edit: 'Una tirada equivocada se puede deshacer después de enviarla; cambia cuando quieras entre diana y teclado.',
        },
        watch: {
          see: 'Una partida en directo para mirar: los puntos cambian mientras los jugadores tiran.',
          create: 'Solo los jugadores anotan; comparte este enlace para que otros también miren.',
          edit: 'Aquí no se puede cambiar nada.',
        },
        join: {
          see: 'La partida, el torneo o la diana a la que pertenece este código o código QR.',
          create: 'Únete para ocupar tu sitio; el código de una diana te pone en esa diana.',
          edit: 'Una partida a la que te uniste se deja desde su página, antes de empezar.',
        },
        stats: {
          see: 'Tus medias, mejor tirada, cierre más alto, un mapa de calor, seis habilidades y cada rival.',
          create:
            'Las estadísticas crecen con cada partida; en Práctica salen de ellas los ejercicios.',
          edit: 'Nada que cambiar: los números siguen tus partidas, y solo tú ves esta página.',
        },
      },
    },
  },
);
