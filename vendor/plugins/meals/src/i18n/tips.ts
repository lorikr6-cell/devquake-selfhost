import { defineMessages } from './define';

/** Which page shows which tips (tips.<key>), matched by the address (PageTips, @devquake/ui). */
export const TIPS_PAGES: Record<string, string> = {
  '/': 'home',
  '/h/:id': 'week',
  '/h/:id/household': 'household',
  '/meals': 'sets',
  '/meals/:id': 'set',
  '/join/:code': 'join',
};

/** How-to tips for each page: how to see the details, how to add, how to change. */
export const tips = defineMessages(
  {
    tips: {
      home: {
        see: 'Your households; with only one you go straight to its week.',
        create: '“Create a household”, for example “Home”: you become its planner.',
        edit: 'Open a household to plan its week or change who eats.',
      },
      week: {
        see: 'Each day’s meals with their servings, and the energy and protein per portion against your targets.',
        create:
          '“+ Add a meal” on a day: find a recipe, type a meal or pick a saved one; “Suggest the week” fills the gaps.',
        edit: 'Tick a meal when it is cooked, add a part with “+ part”, and send the week to a shopping list.',
      },
      household: {
        see: 'Who eats and their portions, the diet, allergens to avoid, dislikes, targets and members.',
        create: 'Add everyone at the table, with or without an account, or send the invite link.',
        edit: 'Change a portion, the diet or the targets and save; suggestions follow from then on.',
      },
      sets: {
        see: 'Your saved meals and, under Community, everyone’s public ones, most recommended first.',
        create: 'Save a planned meal with “Save this meal” on the week.',
        edit: 'Open a saved meal to add it to a day, make it public or change its parts.',
      },
      set: {
        see: 'The meal’s parts, its recommendations and comments.',
        create: 'Add it to your plan on any day, recommend it or leave a comment.',
        edit: 'On your own meal, change its parts or name, make it public or private, or delete it.',
      },
      join: {
        see: 'The household this invitation is for.',
        create: 'Join to see and change its weekly plan.',
        edit: 'You can leave the household later under Household.',
      },
    },
  },
  {
    de: {
      tips: {
        home: {
          see: 'Deine Haushalte; mit nur einem kommst du direkt zu seiner Woche.',
          create: 'Lege einen Haushalt an, zum Beispiel „Zuhause“: du wirst sein Planer.',
          edit: 'Öffne einen Haushalt, um seine Woche zu planen oder zu ändern, wer mitisst.',
        },
        week: {
          see: 'Die Mahlzeiten jedes Tages mit Portionen, sowie Energie und Eiweiß pro Portion im Vergleich zu deinen Zielen.',
          create:
            'Füge an einem Tag eine Mahlzeit hinzu: Rezept suchen, frei eintippen oder gespeicherte wählen; „Woche vorschlagen“ füllt die Lücken.',
          edit: 'Hake eine gekochte Mahlzeit ab, füge Teile hinzu und schicke die Woche auf eine Einkaufsliste.',
        },
        household: {
          see: 'Wer mitisst und die Portionen, Ernährung, zu meidende Allergene, Abneigungen, Ziele und Mitglieder.',
          create: 'Füge alle am Tisch hinzu, mit oder ohne Konto, oder sende den Einladungslink.',
          edit: 'Ändere eine Portion, die Ernährung oder die Ziele und speichere; Vorschläge richten sich danach.',
        },
        sets: {
          see: 'Deine gespeicherten Mahlzeiten und unter Community die öffentlichen aller, die beliebtesten zuerst.',
          create: 'Speichere eine geplante Mahlzeit in der Woche mit „Diese Mahlzeit speichern“.',
          edit: 'Öffne eine gespeicherte Mahlzeit, um sie einem Tag hinzuzufügen, zu veröffentlichen oder ihre Teile zu ändern.',
        },
        set: {
          see: 'Die Teile der Mahlzeit, ihre Empfehlungen und Kommentare.',
          create:
            'Füge sie an einem Tag deinem Plan hinzu, empfiehl sie oder schreibe einen Kommentar.',
          edit: 'Bei deiner eigenen änderst du Teile oder Namen, machst sie öffentlich oder privat, oder löschst sie.',
        },
        join: {
          see: 'Der Haushalt, für den diese Einladung gilt.',
          create: 'Tritt bei, um seinen Wochenplan zu sehen und zu ändern.',
          edit: 'Du kannst den Haushalt später unter Haushalt verlassen.',
        },
      },
    },
    ro: {
      tips: {
        home: {
          see: 'Gospodăriile tale; cu una singură ajungi direct la săptămâna ei.',
          create: 'Creează o gospodărie, de exemplu „Acasă”: devii planificatorul ei.',
          edit: 'Deschide o gospodărie ca să-i planifici săptămâna sau să schimbi cine mănâncă.',
        },
        week: {
          see: 'Mesele fiecărei zile cu porțiile, și energia și proteinele pe porție față de țintele tale.',
          create:
            'Adaugă o masă într-o zi: caută o rețetă, scrie o masă sau alege una salvată; „Propune săptămâna” umple golurile.',
          edit: 'Bifează o masă gătită, adaugă părți și trimite săptămâna pe o listă de cumpărături.',
        },
        household: {
          see: 'Cine mănâncă și porțiile, dieta, alergenii de evitat, ce nu place, țintele și membrii.',
          create: 'Adaugă pe toți de la masă, cu sau fără cont, sau trimite linkul de invitație.',
          edit: 'Schimbă o porție, dieta sau țintele și salvează; propunerile țin cont de ele de acum.',
        },
        sets: {
          see: 'Mesele tale salvate și, la Comunitate, cele publice ale tuturor, cele mai recomandate primele.',
          create: 'Salvează o masă planificată din săptămână, cu „Salvează această masă”.',
          edit: 'Deschide o masă salvată ca s-o adaugi într-o zi, s-o faci publică sau să-i schimbi părțile.',
        },
        set: {
          see: 'Părțile mesei, recomandările și comentariile ei.',
          create: 'Adaug-o în plan în orice zi, recomand-o sau lasă un comentariu.',
          edit: 'La masa ta îi schimbi părțile sau numele, o faci publică sau privată, sau o ștergi.',
        },
        join: {
          see: 'Gospodăria pentru care e această invitație.',
          create: 'Intră ca să vezi și să schimbi planul ei pe săptămână.',
          edit: 'Poți părăsi gospodăria mai târziu, la Gospodărie.',
        },
      },
    },
    hu: {
      tips: {
        home: {
          see: 'A háztartásaid; ha csak egy van, egyenesen a hetéhez jutsz.',
          create: 'Hozz létre háztartást, például „Otthon”: te leszel a tervezője.',
          edit: 'Nyiss meg egy háztartást a hét megtervezéséhez vagy annak módosításához, ki eszik.',
        },
        week: {
          see: 'Minden nap étkezései az adagokkal, és az adagonkénti energia és fehérje a céljaidhoz képest.',
          create:
            'Adj hozzá étkezést egy naphoz: keress receptet, írd be, vagy válassz mentettet; a hét javaslása kitölti a hézagokat.',
          edit: 'Pipáld ki a megfőzött étkezést, adj hozzá részeket, és küldd a hetet bevásárlólistára.',
        },
        household: {
          see: 'Ki eszik és mekkora adagot, az étrend, kerülendő allergének, amit nem szeretnek, célok és tagok.',
          create:
            'Add hozzá mindenkit az asztaltól, fiókkal vagy anélkül, vagy küldd el a meghívó linket.',
          edit: 'Módosíts egy adagot, az étrendet vagy a célokat és ments; a javaslatok ezután ezt követik.',
        },
        sets: {
          see: 'A mentett étkezéseid és a Közösségnél mindenki nyilvános étkezései, a legtöbbet ajánlott elöl.',
          create: 'A héten egy tervezett étkezést a „Mentés” gombbal tarthatsz meg.',
          edit: 'Nyiss meg egy mentett étkezést, hogy egy naphoz add, nyilvánossá tedd vagy módosítsd a részeit.',
        },
        set: {
          see: 'Az étkezés részei, ajánlásai és hozzászólásai.',
          create: 'Add a tervedhez bármelyik napra, ajánld, vagy írj hozzászólást.',
          edit: 'A sajátodnál módosítod a részeit vagy nevét, nyilvánossá vagy priváttá teszed, vagy törlöd.',
        },
        join: {
          see: 'A háztartás, amelyre ez a meghívó szól.',
          create: 'Csatlakozz, hogy lásd és módosítsd a heti tervét.',
          edit: 'Később a Háztartás alatt kiléphetsz.',
        },
      },
    },
    it: {
      tips: {
        home: {
          see: 'Le tue case; con una sola vai direttamente alla sua settimana.',
          create: 'Crea una casa, per esempio «Casa»: ne diventi il pianificatore.',
          edit: 'Apri una casa per pianificarne la settimana o cambiare chi mangia.',
        },
        week: {
          see: 'I pasti di ogni giorno con le porzioni, ed energia e proteine per porzione rispetto ai tuoi obiettivi.',
          create:
            'Aggiungi un pasto a un giorno: cerca una ricetta, scrivi un pasto o scegline uno salvato; «Suggerisci la settimana» riempie i vuoti.',
          edit: 'Spunta un pasto cucinato, aggiungi parti e manda la settimana a una lista della spesa.',
        },
        household: {
          see: 'Chi mangia e le porzioni, la dieta, gli allergeni da evitare, ciò che non piace, obiettivi e membri.',
          create: 'Aggiungi tutti quelli a tavola, con o senza account, o invia il link d’invito.',
          edit: 'Cambia una porzione, la dieta o gli obiettivi e salva; i suggerimenti ne tengono conto da lì.',
        },
        sets: {
          see: 'I tuoi pasti salvati e, in Comunità, quelli pubblici di tutti, i più consigliati prima.',
          create: 'Salva un pasto pianificato dalla settimana con «Salva questo pasto».',
          edit: 'Apri un pasto salvato per aggiungerlo a un giorno, renderlo pubblico o cambiarne le parti.',
        },
        set: {
          see: 'Le parti del pasto, i consigli e i commenti.',
          create: 'Aggiungilo al tuo piano in qualsiasi giorno, consiglialo o lascia un commento.',
          edit: 'Sul tuo pasto cambi parti o nome, lo rendi pubblico o privato, o lo elimini.',
        },
        join: {
          see: 'La casa a cui si riferisce questo invito.',
          create: 'Unisciti per vedere e cambiare il suo piano settimanale.',
          edit: 'Puoi lasciare la casa più tardi in Casa.',
        },
      },
    },
    es: {
      tips: {
        home: {
          see: 'Tus hogares; con uno solo vas directo a su semana.',
          create: 'Crea un hogar, por ejemplo «Casa»: pasas a ser su planificador.',
          edit: 'Abre un hogar para planificar su semana o cambiar quién come.',
        },
        week: {
          see: 'Las comidas de cada día con sus raciones, y la energía y proteína por ración frente a tus objetivos.',
          create:
            'Añade una comida a un día: busca una receta, escribe una comida o elige una guardada; «Sugerir la semana» rellena los huecos.',
          edit: 'Marca una comida cocinada, añade partes y manda la semana a una lista de la compra.',
        },
        household: {
          see: 'Quién come y sus raciones, la dieta, los alérgenos que evitar, lo que no gusta, objetivos y miembros.',
          create:
            'Añade a todos los de la mesa, con o sin cuenta, o envía el enlace de invitación.',
          edit: 'Cambia una ración, la dieta o los objetivos y guarda; las sugerencias lo tienen en cuenta desde ahí.',
        },
        sets: {
          see: 'Tus comidas guardadas y, en Comunidad, las públicas de todos, las más recomendadas primero.',
          create: 'Guarda una comida planificada desde la semana con «Guardar esta comida».',
          edit: 'Abre una comida guardada para añadirla a un día, hacerla pública o cambiar sus partes.',
        },
        set: {
          see: 'Las partes de la comida, sus recomendaciones y comentarios.',
          create: 'Añádela a tu plan cualquier día, recomiéndala o deja un comentario.',
          edit: 'En la tuya cambias sus partes o el nombre, la haces pública o privada, o la borras.',
        },
        join: {
          see: 'El hogar de esta invitación.',
          create: 'Únete para ver y cambiar su plan semanal.',
          edit: 'Puedes salir del hogar más tarde en Hogar.',
        },
      },
    },
  },
);
