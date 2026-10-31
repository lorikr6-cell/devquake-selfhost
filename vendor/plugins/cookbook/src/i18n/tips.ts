import { defineMessages } from './define';

/** Which page shows which tips (tips.<key>), matched by the address (PageTips, @devquake/ui). */
export const TIPS_PAGES: Record<string, string> = {
  '/': 'home',
  '/new': 'new',
  '/r/:id': 'recipe',
  '/r/:id/cook': 'cook',
  '/r/:id/edit': 'edit',
  '/comments': 'comments',
  '/p/:code': 'public',
  '/admin/foods': 'foods',
  '/admin/foods/:id': 'food',
  '/admin/new-food': 'food',
};

/** How-to tips for each page: how to see the details, how to add, how to change. */
export const tips = defineMessages(
  {
    tips: {
      home: {
        see: 'Click a recipe to open it; the tabs switch between the library, your recipes, shared ones and favourites.',
        create: 'Use “New recipe” to write your own, or copy a library recipe to make it yours.',
        edit: 'Search by name and filter by diet or time; your own recipes are changed on their page.',
      },
      new: {
        see: 'The editor has four steps: basics, ingredients, steps and a final check.',
        create: 'Fill in each step; tap the suggestions for equipment, nutrition links and timers.',
        edit: 'Go back to any step before saving; the check lists what is still missing to make it public.',
      },
      recipe: {
        see: 'Choose the servings with − and +; quantities, nutrition per portion, diets and allergens follow.',
        create: 'Add it to a shopping list or the meal planner, or make a share or public link.',
        edit: 'On your own recipe, “Edit” changes it and “Make public” shares it with everyone.',
      },
      cook: {
        see: 'One step per screen in big text; the screen stays on while you cook.',
        create: 'Start the timer of a step; it beeps and vibrates when the time is up.',
        edit: 'Move with Next and Back (or the arrow keys); “Read the steps aloud” reads each one.',
      },
      edit: {
        see: 'The same four steps as a new recipe, filled in with what you wrote.',
        create: 'Add ingredients or steps at the end of their lists, or a photo in the basics.',
        edit: 'Change anything and save; ingredients and steps are replaced as you leave them.',
      },
      comments: {
        see: 'The comments others wrote on your public recipes, newest first, with the recipe.',
        create: 'Comments are written by others on your public recipes; yours go on their recipes.',
        edit: 'Delete a comment you do not want to keep; open the recipe to answer on it.',
      },
      public: {
        see: 'A recipe its author shared with a public link: servings, quantities and steps.',
        create:
          'With a DevQuake account you can subscribe to the Cookbook and save recipes of your own.',
        edit: 'Change the servings with − and +; the quantities follow.',
      },
      foods: {
        see: 'The food catalogue the nutrition comes from; search by name or filter by kind.',
        create: 'Use “New food” to add one with its names, nutrition, weights and allergens.',
        edit: 'Click a food to change it.',
      },
      food: {
        see: 'A food’s names in every language, its kind, picture, nutrition per 100 g and allergens.',
        create: 'Add a weight per piece or spoon so recipes can count in pieces.',
        edit: 'Change the values and save; show a member’s picture to everyone or go back to the drawing.',
      },
    },
  },
  {
    de: {
      tips: {
        home: {
          see: 'Klicke auf ein Rezept, um es zu öffnen; die Reiter wechseln zwischen Bibliothek, deinen Rezepten, geteilten und Favoriten.',
          create:
            'Mit „Neues Rezept“ schreibst du ein eigenes, oder kopiere ein Bibliotheksrezept als deins.',
          edit: 'Suche nach Namen und filtere nach Ernährung oder Zeit; eigene Rezepte änderst du auf ihrer Seite.',
        },
        new: {
          see: 'Der Editor hat vier Schritte: Grundlagen, Zutaten, Schritte und eine Prüfung.',
          create:
            'Fülle jeden Schritt aus; tippe auf die Vorschläge für Geräte, Nährwerte und Timer.',
          edit: 'Geh vor dem Speichern zu jedem Schritt zurück; die Prüfung zeigt, was für „öffentlich“ noch fehlt.',
        },
        recipe: {
          see: 'Wähle die Portionen mit − und +; Mengen, Nährwerte pro Portion, Ernährung und Allergene passen sich an.',
          create:
            'Setze es auf eine Einkaufsliste oder in den Essensplaner, oder erstelle einen Teilen- oder öffentlichen Link.',
          edit: 'Bei deinem Rezept ändert „Bearbeiten“ es, „Öffentlich machen“ teilt es mit allen.',
        },
        cook: {
          see: 'Ein Schritt pro Bildschirm in großer Schrift; der Bildschirm bleibt beim Kochen an.',
          create: 'Starte den Timer eines Schritts; er piept und vibriert, wenn die Zeit um ist.',
          edit: 'Blättere mit Weiter und Zurück (oder den Pfeiltasten); „Schritte vorlesen“ liest jeden vor.',
        },
        edit: {
          see: 'Dieselben vier Schritte wie bei einem neuen Rezept, mit deinen Angaben ausgefüllt.',
          create:
            'Füge Zutaten oder Schritte am Ende der Listen hinzu, oder ein Foto in den Grundlagen.',
          edit: 'Ändere alles und speichere; Zutaten und Schritte werden so übernommen, wie du sie lässt.',
        },
        comments: {
          see: 'Die Kommentare anderer zu deinen öffentlichen Rezepten, neueste zuerst, mit dem Rezept.',
          create:
            'Kommentare schreiben andere zu deinen öffentlichen Rezepten; deine stehen bei ihren Rezepten.',
          edit: 'Lösche einen Kommentar, den du nicht behalten willst; antworte beim Rezept.',
        },
        public: {
          see: 'Ein Rezept, das sein Autor mit einem öffentlichen Link geteilt hat: Portionen, Mengen und Schritte.',
          create:
            'Mit einem DevQuake-Konto kannst du das Kochbuch abonnieren und eigene Rezepte speichern.',
          edit: 'Ändere die Portionen mit − und +; die Mengen passen sich an.',
        },
        foods: {
          see: 'Der Lebensmittelkatalog für die Nährwerte; suche nach Namen oder filtere nach Art.',
          create:
            'Mit „Neues Lebensmittel“ fügst du eines mit Namen, Nährwerten, Gewichten und Allergenen hinzu.',
          edit: 'Klicke auf ein Lebensmittel, um es zu ändern.',
        },
        food: {
          see: 'Die Namen eines Lebensmittels in allen Sprachen, Art, Bild, Nährwerte pro 100 g und Allergene.',
          create:
            'Füge ein Gewicht pro Stück oder Löffel hinzu, damit Rezepte in Stück rechnen können.',
          edit: 'Ändere die Werte und speichere; zeige das Bild eines Mitglieds allen oder nimm wieder die Zeichnung.',
        },
      },
    },
    ro: {
      tips: {
        home: {
          see: 'Apasă pe o rețetă ca s-o deschizi; filele comută între bibliotecă, rețetele tale, cele partajate și favorite.',
          create:
            'Cu „Rețetă nouă” scrii una proprie, sau copiază o rețetă din bibliotecă ca să fie a ta.',
          edit: 'Caută după nume și filtrează după dietă sau timp; rețetele tale se modifică pe pagina lor.',
        },
        new: {
          see: 'Editorul are patru pași: de bază, ingrediente, pași și o verificare finală.',
          create:
            'Completează fiecare pas; apasă pe sugestii pentru ustensile, valori nutritive și cronometre.',
          edit: 'Întoarce-te la orice pas înainte de salvare; verificarea arată ce lipsește ca s-o faci publică.',
        },
        recipe: {
          see: 'Alege porțiile cu − și +; cantitățile, valorile pe porție, dietele și alergenii se potrivesc.',
          create:
            'Pune-o pe o listă de cumpărături sau în planificatorul de mese, sau fă un link de partajare ori public.',
          edit: 'La rețeta ta, „Editează” o modifică, iar „Fă publică” o arată tuturor.',
        },
        cook: {
          see: 'Un pas pe ecran, cu litere mari; ecranul rămâne aprins cât gătești.',
          create: 'Pornește cronometrul unui pas; sună și vibrează când timpul s-a scurs.',
          edit: 'Mergi cu Înainte și Înapoi (sau săgețile); „Citește pașii cu voce tare” îi citește pe rând.',
        },
        edit: {
          see: 'Aceiași patru pași ca la o rețetă nouă, completați cu ce ai scris.',
          create:
            'Adaugă ingrediente sau pași la capătul listelor, ori o fotografie la partea de bază.',
          edit: 'Modifică orice și salvează; ingredientele și pașii rămân așa cum îi lași.',
        },
        comments: {
          see: 'Comentariile altora la rețetele tale publice, cele mai noi primele, cu rețeta.',
          create:
            'Comentariile le scriu alții la rețetele tale publice; ale tale apar la rețetele lor.',
          edit: 'Șterge un comentariu pe care nu vrei să-l păstrezi; răspunde la rețetă.',
        },
        public: {
          see: 'O rețetă pe care autorul a partajat-o cu un link public: porții, cantități și pași.',
          create:
            'Cu un cont DevQuake te poți abona la Carte de bucate și îți poți salva propriile rețete.',
          edit: 'Schimbă porțiile cu − și +; cantitățile se potrivesc.',
        },
        foods: {
          see: 'Catalogul de alimente din care vin valorile nutritive; caută după nume sau filtrează după tip.',
          create: 'Cu „Aliment nou” adaugi unul, cu nume, valori nutritive, greutăți și alergeni.',
          edit: 'Apasă pe un aliment ca să-l modifici.',
        },
        food: {
          see: 'Numele unui aliment în toate limbile, tipul, imaginea, valorile la 100 g și alergenii.',
          create: 'Adaugă o greutate pe bucată sau lingură, ca rețetele să poată număra bucăți.',
          edit: 'Modifică valorile și salvează; arată tuturor imaginea unui membru sau revino la desen.',
        },
      },
    },
    hu: {
      tips: {
        home: {
          see: 'Kattints egy receptre a megnyitásához; a fülek a könyvtár, a saját, a megosztott és a kedvenc receptek között váltanak.',
          create:
            'Az „Új recept” gombbal sajátot írhatsz, vagy másolj le egy könyvtári receptet magadnak.',
          edit: 'Keress név szerint, és szűrj étrendre vagy időre; a saját receptjeidet az oldalukon módosítod.',
        },
        new: {
          see: 'A szerkesztő négy lépésből áll: alapok, hozzávalók, lépések és egy ellenőrzés.',
          create:
            'Töltsd ki a lépéseket; koppints a javaslatokra eszközökért, tápértékért és időzítőkért.',
          edit: 'Mentés előtt bármelyik lépéshez visszaléphetsz; az ellenőrzés mutatja, mi hiányzik még a nyilvánossághoz.',
        },
        recipe: {
          see: 'Az adagokat a − és + gombbal választod; a mennyiségek, az adagonkénti tápérték, az étrendek és az allergének követik.',
          create:
            'Tedd bevásárlólistára vagy az étkezéstervezőbe, vagy készíts megosztási vagy nyilvános linket.',
          edit: 'A saját receptednél a „Szerkesztés” módosítja, a „Nyilvánossá tétel” mindenkinek megmutatja.',
        },
        cook: {
          see: 'Képernyőnként egy lépés, nagy betűkkel; a képernyő főzés közben bekapcsolva marad.',
          create: 'Indítsd el egy lépés időzítőjét; lejártakor csipog és rezeg.',
          edit: 'A Tovább és Vissza gombbal (vagy a nyilakkal) lépkedsz; a felolvasás minden lépést felolvas.',
        },
        edit: {
          see: 'Ugyanaz a négy lépés, mint egy új receptnél, kitöltve azzal, amit írtál.',
          create:
            'A listák végén adj hozzá hozzávalókat vagy lépéseket, az alapoknál pedig fényképet.',
          edit: 'Módosíts bármit és ments; a hozzávalók és lépések úgy maradnak, ahogy hagyod őket.',
        },
        comments: {
          see: 'Mások hozzászólásai a nyilvános receptjeidhez, a legújabb elöl, a recepttel.',
          create:
            'A hozzászólásokat mások írják a nyilvános receptjeidhez; a tieid az ő receptjeiknél vannak.',
          edit: 'Töröld a hozzászólást, amit nem akarsz megtartani; a receptnél válaszolhatsz.',
        },
        public: {
          see: 'Egy recept, amelyet a szerzője nyilvános linkkel osztott meg: adagok, mennyiségek és lépések.',
          create:
            'DevQuake-fiókkal feliratkozhatsz a Szakácskönyvre, és saját recepteket menthetsz.',
          edit: 'Az adagokat a − és + gombbal változtatod; a mennyiségek követik.',
        },
        foods: {
          see: 'Az alapanyag-katalógus, amelyből a tápértékek jönnek; keress név szerint vagy szűrj fajtára.',
          create:
            'Az „Új alapanyag” gombbal adhatsz hozzá egyet nevekkel, tápértékkel, súlyokkal és allergénekkel.',
          edit: 'Kattints egy alapanyagra a módosításához.',
        },
        food: {
          see: 'Egy alapanyag nevei minden nyelven, fajtája, képe, 100 g-ra vetített tápértéke és allergénjei.',
          create:
            'Adj meg darabonkénti vagy kanalankénti súlyt, hogy a receptek darabban számolhassanak.',
          edit: 'Módosítsd az értékeket és ments; mutasd mindenkinek egy tag képét, vagy térj vissza a rajzhoz.',
        },
      },
    },
    it: {
      tips: {
        home: {
          see: 'Clicca su una ricetta per aprirla; le schede passano tra libreria, le tue ricette, quelle condivise e i preferiti.',
          create:
            'Con «Nuova ricetta» ne scrivi una tua, oppure copia una ricetta della libreria per farla tua.',
          edit: 'Cerca per nome e filtra per dieta o tempo; le tue ricette si modificano sulla loro pagina.',
        },
        new: {
          see: 'L’editor ha quattro passaggi: base, ingredienti, passaggi e un controllo finale.',
          create:
            'Compila ogni passaggio; tocca i suggerimenti per attrezzatura, valori nutrizionali e timer.',
          edit: 'Torna a qualsiasi passaggio prima di salvare; il controllo dice cosa manca per renderla pubblica.',
        },
        recipe: {
          see: 'Scegli le porzioni con − e +; quantità, valori per porzione, diete e allergeni si adeguano.',
          create:
            'Aggiungila a una lista della spesa o al pianificatore dei pasti, o crea un link di condivisione o pubblico.',
          edit: 'Sulla tua ricetta, «Modifica» la cambia e «Rendi pubblica» la mostra a tutti.',
        },
        cook: {
          see: 'Un passaggio per schermata a caratteri grandi; lo schermo resta acceso mentre cucini.',
          create: 'Avvia il timer di un passaggio; suona e vibra allo scadere.',
          edit: 'Spostati con Avanti e Indietro (o le frecce); «Leggi i passaggi ad alta voce» li legge uno a uno.',
        },
        edit: {
          see: 'Gli stessi quattro passaggi di una nuova ricetta, compilati con ciò che hai scritto.',
          create:
            'Aggiungi ingredienti o passaggi in fondo alle liste, o una foto nella parte di base.',
          edit: 'Cambia ciò che vuoi e salva; ingredienti e passaggi restano come li lasci.',
        },
        comments: {
          see: 'I commenti degli altri alle tue ricette pubbliche, i più recenti prima, con la ricetta.',
          create:
            'I commenti li scrivono gli altri sulle tue ricette pubbliche; i tuoi sono sulle loro ricette.',
          edit: 'Elimina un commento che non vuoi tenere; rispondi sulla ricetta.',
        },
        public: {
          see: 'Una ricetta che l’autore ha condiviso con un link pubblico: porzioni, quantità e passaggi.',
          create: 'Con un account DevQuake puoi abbonarti al Ricettario e salvare ricette tue.',
          edit: 'Cambia le porzioni con − e +; le quantità si adeguano.',
        },
        foods: {
          see: 'Il catalogo degli alimenti da cui vengono i valori nutrizionali; cerca per nome o filtra per tipo.',
          create:
            'Con «Nuovo alimento» ne aggiungi uno con nomi, valori nutrizionali, pesi e allergeni.',
          edit: 'Clicca su un alimento per modificarlo.',
        },
        food: {
          see: 'I nomi di un alimento in ogni lingua, il tipo, l’immagine, i valori per 100 g e gli allergeni.',
          create:
            'Aggiungi un peso per pezzo o cucchiaio, così le ricette possono contare in pezzi.',
          edit: 'Cambia i valori e salva; mostra a tutti l’immagine di un membro o torna al disegno.',
        },
      },
    },
    es: {
      tips: {
        home: {
          see: 'Haz clic en una receta para abrirla; las pestañas cambian entre la biblioteca, tus recetas, las compartidas y las favoritas.',
          create:
            'Con «Nueva receta» escribes la tuya, o copia una receta de la biblioteca para hacerla tuya.',
          edit: 'Busca por nombre y filtra por dieta o tiempo; tus recetas se cambian en su página.',
        },
        new: {
          see: 'El editor tiene cuatro pasos: lo básico, ingredientes, pasos y una revisión final.',
          create:
            'Rellena cada paso; toca las sugerencias de utensilios, valores nutricionales y temporizadores.',
          edit: 'Vuelve a cualquier paso antes de guardar; la revisión dice qué falta para hacerla pública.',
        },
        recipe: {
          see: 'Elige las raciones con − y +; las cantidades, los valores por ración, las dietas y los alérgenos se ajustan.',
          create:
            'Añádela a una lista de la compra o al planificador de comidas, o crea un enlace para compartir o público.',
          edit: 'En tu receta, «Editar» la cambia y «Hacer pública» la muestra a todos.',
        },
        cook: {
          see: 'Un paso por pantalla con letra grande; la pantalla sigue encendida mientras cocinas.',
          create: 'Inicia el temporizador de un paso; suena y vibra cuando se acaba el tiempo.',
          edit: 'Avanza con Siguiente y Atrás (o las flechas); «Leer los pasos en voz alta» los lee uno a uno.',
        },
        edit: {
          see: 'Los mismos cuatro pasos que una receta nueva, rellenados con lo que escribiste.',
          create: 'Añade ingredientes o pasos al final de sus listas, o una foto en lo básico.',
          edit: 'Cambia lo que quieras y guarda; los ingredientes y pasos quedan como los dejes.',
        },
        comments: {
          see: 'Los comentarios de otros en tus recetas públicas, los más nuevos primero, con la receta.',
          create:
            'Los comentarios los escriben otros en tus recetas públicas; los tuyos están en sus recetas.',
          edit: 'Borra un comentario que no quieras conservar; responde en la receta.',
        },
        public: {
          see: 'Una receta que su autor compartió con un enlace público: raciones, cantidades y pasos.',
          create:
            'Con una cuenta de DevQuake puedes suscribirte al Recetario y guardar recetas propias.',
          edit: 'Cambia las raciones con − y +; las cantidades se ajustan.',
        },
        foods: {
          see: 'El catálogo de alimentos del que salen los valores nutricionales; busca por nombre o filtra por tipo.',
          create:
            'Con «Nuevo alimento» añades uno con nombres, valores nutricionales, pesos y alérgenos.',
          edit: 'Haz clic en un alimento para cambiarlo.',
        },
        food: {
          see: 'Los nombres de un alimento en cada idioma, su tipo, imagen, valores por 100 g y alérgenos.',
          create:
            'Añade un peso por pieza o cucharada para que las recetas puedan contar en piezas.',
          edit: 'Cambia los valores y guarda; muestra a todos la imagen de un miembro o vuelve al dibujo.',
        },
      },
    },
  },
);
