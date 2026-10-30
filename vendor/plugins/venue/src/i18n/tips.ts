import { defineMessages } from './define';

/** Which page shows which tips (tips.<key>), matched by the address (PageTips, @devquake/ui). */
export const TIPS_PAGES: Record<string, string> = {
  '/': 'home',
  '/settings': 'settings',
  '/menu': 'menu',
  '/staff': 'staff',
  '/tablets': 'tablets',
  '/m/:slug': 'publicMenu',
  '/help': 'help',
  '/about': 'about',
};

/** How-to tips for each page: how to see the details, how to add, how to change. */
export const tips = defineMessages(
  {
    tips: {
      home: {
        see: 'Your venue at a glance: the menu, staff, tablets and settings.',
        create: 'The first time, set up your venue here.',
        edit: 'Open a section to change it.',
      },
      settings: {
        see: 'The venue’s name, country, currency and VAT rates.',
        create: 'Add a VAT rate to the list, separated by a comma.',
        edit: 'Change any field and save; switch the public menu on or off; set the tips on the bill.',
      },
      menu: {
        see: 'Your categories with their items, prices and allergens.',
        create: 'Add a category at the bottom, then a new item.',
        edit: 'Click an item to change it or mark it sold out.',
      },
      staff: {
        see: 'Your staff with their roles and whether a PIN is set.',
        create: 'Add a staff member with a role and a PIN.',
        edit: 'Give someone a new PIN, or remove them.',
      },
      tablets: {
        see: 'The devices enabled as tablets and when they were last used.',
        create: 'Open this page on the tablet itself and enable it.',
        edit: 'Disable a lost or replaced tablet at once.',
      },
      publicMenu: {
        see: 'The menu as your guests see it.',
        create: 'Items are added by the owner in the menu editor.',
        edit: 'Ask the staff about allergens and today’s offers.',
      },
      help: {
        see: 'How the app works, step by step.',
        create: 'Start by setting up your venue on the overview.',
        edit: 'Come back here whenever something is unclear.',
      },
      about: {
        see: 'What this app is for.',
        create: 'Open the overview to start.',
        edit: 'Your venue’s data is deleted with your account.',
      },
    },
  },
  {
    de: {
      tips: {
        home: {
          see: 'Dein Lokal auf einen Blick: Karte, Personal, Tablets und Einstellungen.',
          create: 'Beim ersten Mal richtest du hier dein Lokal ein.',
          edit: 'Öffne einen Bereich, um ihn zu ändern.',
        },
        settings: {
          see: 'Name, Land, Währung und Mehrwertsteuersätze des Lokals.',
          create: 'Füge einen Mehrwertsteuersatz mit Komma getrennt hinzu.',
          edit: 'Ändere ein Feld und speichere; schalte die öffentliche Karte ein oder aus; lege das Trinkgeld fest.',
        },
        menu: {
          see: 'Deine Kategorien mit Einträgen, Preisen und Allergenen.',
          create: 'Füge unten eine Kategorie hinzu, dann einen neuen Eintrag.',
          edit: 'Klicke auf einen Eintrag, um ihn zu ändern oder als ausverkauft zu markieren.',
        },
        staff: {
          see: 'Dein Personal mit Rollen und ob eine PIN gesetzt ist.',
          create: 'Füge eine Person mit Rolle und PIN hinzu.',
          edit: 'Gib jemandem eine neue PIN oder entferne die Person.',
        },
        tablets: {
          see: 'Die als Tablet freigeschalteten Geräte und wann sie zuletzt genutzt wurden.',
          create: 'Öffne diese Seite auf dem Tablet selbst und schalte es frei.',
          edit: 'Sperre ein verlorenes oder ersetztes Tablet sofort.',
        },
        publicMenu: {
          see: 'Die Karte, wie deine Gäste sie sehen.',
          create: 'Einträge fügt der Inhaber im Karten-Editor hinzu.',
          edit: 'Frag das Personal nach Allergenen und Tagesangeboten.',
        },
        help: {
          see: 'Wie die App funktioniert, Schritt für Schritt.',
          create: 'Beginne damit, dein Lokal in der Übersicht einzurichten.',
          edit: 'Komm hierher zurück, wenn etwas unklar ist.',
        },
        about: {
          see: 'Wofür diese App da ist.',
          create: 'Öffne die Übersicht, um zu beginnen.',
          edit: 'Die Daten deines Lokals werden mit deinem Konto gelöscht.',
        },
      },
    },
    ro: {
      tips: {
        home: {
          see: 'Localul tău dintr-o privire: meniul, personalul, tabletele și setările.',
          create: 'Prima dată, configurează-ți localul aici.',
          edit: 'Deschide o secțiune ca s-o schimbi.',
        },
        settings: {
          see: 'Numele, țara, moneda și cotele de TVA ale localului.',
          create: 'Adaugă o cotă de TVA în listă, separată prin virgulă.',
          edit: 'Schimbă orice câmp și salvează; activează sau dezactivează meniul public; setează bacșișul.',
        },
        menu: {
          see: 'Categoriile tale cu produse, prețuri și alergeni.',
          create: 'Adaugă o categorie jos, apoi un produs nou.',
          edit: 'Apasă pe un produs ca să-l schimbi sau să-l marchezi epuizat.',
        },
        staff: {
          see: 'Personalul cu rolurile sale și dacă are PIN.',
          create: 'Adaugă o persoană cu un rol și un PIN.',
          edit: 'Dă cuiva un PIN nou sau elimină persoana.',
        },
        tablets: {
          see: 'Dispozitivele activate ca tablete și când au fost folosite ultima dată.',
          create: 'Deschide această pagină pe tableta însăși și activeaz-o.',
          edit: 'Dezactivează imediat o tabletă pierdută sau înlocuită.',
        },
        publicMenu: {
          see: 'Meniul așa cum îl văd clienții.',
          create: 'Produsele le adaugă proprietarul în editorul de meniu.',
          edit: 'Întreabă personalul despre alergeni și ofertele zilei.',
        },
        help: {
          see: 'Cum funcționează aplicația, pas cu pas.',
          create: 'Începe prin a-ți configura localul în prezentare.',
          edit: 'Revino aici oricând ceva nu e clar.',
        },
        about: {
          see: 'La ce folosește această aplicație.',
          create: 'Deschide prezentarea ca să începi.',
          edit: 'Datele localului se șterg odată cu contul tău.',
        },
      },
    },
    hu: {
      tips: {
        home: {
          see: 'A helyed egy pillantással: étlap, személyzet, tabletek és beállítások.',
          create: 'Először itt állítsd be a helyed.',
          edit: 'Nyiss meg egy részt a módosításhoz.',
        },
        settings: {
          see: 'A hely neve, országa, pénzneme és áfakulcsai.',
          create: 'Adj hozzá egy áfakulcsot vesszővel elválasztva.',
          edit: 'Módosíts bármelyik mezőt és ments; kapcsold be vagy ki a nyilvános étlapot; állítsd be a borravalót.',
        },
        menu: {
          see: 'A kategóriáid tételekkel, árakkal és allergénekkel.',
          create: 'Adj hozzá lent egy kategóriát, majd egy új tételt.',
          edit: 'Kattints egy tételre a módosításhoz vagy hogy elfogyottnak jelöld.',
        },
        staff: {
          see: 'A személyzet a szerepekkel, és hogy van-e PIN.',
          create: 'Adj hozzá egy munkatársat szereppel és PIN-nel.',
          edit: 'Adj valakinek új PIN-t, vagy távolítsd el.',
        },
        tablets: {
          see: 'A tabletként engedélyezett eszközök és utolsó használatuk.',
          create: 'Nyisd meg ezt az oldalt magán a tableten, és engedélyezd.',
          edit: 'Az elveszett vagy lecserélt tabletet azonnal tiltsd le.',
        },
        publicMenu: {
          see: 'Az étlap úgy, ahogy a vendégek látják.',
          create: 'A tételeket a tulajdonos adja hozzá az étlapszerkesztőben.',
          edit: 'Az allergénekről és a napi ajánlatról kérdezd a személyzetet.',
        },
        help: {
          see: 'Hogyan működik az alkalmazás, lépésről lépésre.',
          create: 'Kezdd azzal, hogy az áttekintésben beállítod a helyed.',
          edit: 'Gyere vissza ide, ha valami nem világos.',
        },
        about: {
          see: 'Mire való ez az alkalmazás.',
          create: 'Nyisd meg az áttekintést a kezdéshez.',
          edit: 'A hely adatai a fiókoddal együtt törlődnek.',
        },
      },
    },
    it: {
      tips: {
        home: {
          see: 'Il tuo locale in un colpo d’occhio: menu, personale, tablet e impostazioni.',
          create: 'La prima volta, configura qui il tuo locale.',
          edit: 'Apri una sezione per modificarla.',
        },
        settings: {
          see: 'Nome, paese, valuta e aliquote IVA del locale.',
          create: 'Aggiungi un’aliquota IVA all’elenco, separata da una virgola.',
          edit: 'Cambia un campo e salva; attiva o disattiva il menu pubblico; imposta la mancia.',
        },
        menu: {
          see: 'Le tue categorie con voci, prezzi e allergeni.',
          create: 'Aggiungi una categoria in fondo, poi una nuova voce.',
          edit: 'Fai clic su una voce per modificarla o segnarla esaurita.',
        },
        staff: {
          see: 'Il personale con i ruoli e se ha un PIN.',
          create: 'Aggiungi una persona con ruolo e PIN.',
          edit: 'Dai a qualcuno un nuovo PIN o rimuovilo.',
        },
        tablets: {
          see: 'I dispositivi abilitati come tablet e il loro ultimo uso.',
          create: 'Apri questa pagina sul tablet stesso e abilitalo.',
          edit: 'Disabilita subito un tablet perso o sostituito.',
        },
        publicMenu: {
          see: 'Il menu come lo vedono i clienti.',
          create: 'Le voci le aggiunge il titolare nell’editor del menu.',
          edit: 'Chiedi al personale per allergeni e offerte del giorno.',
        },
        help: {
          see: 'Come funziona l’app, passo dopo passo.',
          create: 'Inizia configurando il locale nella panoramica.',
          edit: 'Torna qui quando qualcosa non è chiaro.',
        },
        about: {
          see: 'A cosa serve questa app.',
          create: 'Apri la panoramica per iniziare.',
          edit: 'I dati del locale vengono eliminati con il tuo account.',
        },
      },
    },
    es: {
      tips: {
        home: {
          see: 'Tu local de un vistazo: la carta, el personal, las tabletas y los ajustes.',
          create: 'La primera vez, configura aquí tu local.',
          edit: 'Abre una sección para cambiarla.',
        },
        settings: {
          see: 'Nombre, país, moneda y tipos de IVA del local.',
          create: 'Añade un tipo de IVA a la lista, separado por una coma.',
          edit: 'Cambia cualquier campo y guarda; activa o desactiva la carta pública; fija la propina.',
        },
        menu: {
          see: 'Tus categorías con productos, precios y alérgenos.',
          create: 'Añade una categoría abajo y luego un producto nuevo.',
          edit: 'Pulsa un producto para cambiarlo o marcarlo como agotado.',
        },
        staff: {
          see: 'Tu personal con sus funciones y si tiene PIN.',
          create: 'Añade a una persona con función y PIN.',
          edit: 'Dale a alguien un PIN nuevo o quítalo.',
        },
        tablets: {
          see: 'Los dispositivos activados como tabletas y su último uso.',
          create: 'Abre esta página en la propia tableta y actívala.',
          edit: 'Desactiva al momento una tableta perdida o sustituida.',
        },
        publicMenu: {
          see: 'La carta tal como la ven tus clientes.',
          create: 'Los productos los añade el propietario en el editor de la carta.',
          edit: 'Pregunta al personal por los alérgenos y las ofertas del día.',
        },
        help: {
          see: 'Cómo funciona la app, paso a paso.',
          create: 'Empieza configurando tu local en el resumen.',
          edit: 'Vuelve aquí cuando algo no esté claro.',
        },
        about: {
          see: 'Para qué sirve esta app.',
          create: 'Abre el resumen para empezar.',
          edit: 'Los datos de tu local se eliminan con tu cuenta.',
        },
      },
    },
  },
);
