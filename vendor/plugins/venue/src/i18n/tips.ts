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
  '/floor': 'floor',
  '/tablet': 'floor',
  '/tables': 'tables',
  '/reports': 'reports',
  '/t/:code': 'table',
  '/b/:code': 'guestBill',
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
      floor: {
        see: 'Every table: free, or its bill with what is still to bring.',
        create: 'Tap a table to open a bill or add to the order.',
        edit: 'Find a table with the search bar; switch user on a tablet.',
      },
      tables: {
        see: 'Your tables with their QR stickers.',
        create: 'Add a table, then print the stickers.',
        edit: 'Rename a table, make a new sticker or remove it.',
      },
      reports: {
        see: 'Sales, VAT, tips and payments for a month, by day.',
        create: 'Sales add up as bills are finalised.',
        edit: 'Go to another month or search the bills.',
      },
      table: {
        see: 'The table’s order: brought and still to bring, with the totals.',
        create: 'Search the menu to add items, with a note for the kitchen.',
        edit: 'Tick off what was brought; finalise when the guests pay.',
      },
      guestBill: {
        see: 'Your order, what is still coming, the VAT and the total.',
        create: 'Choose a tip if you like.',
        edit: 'It refreshes by itself until the bill is paid.',
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
        floor: {
          see: 'Jeder Tisch: frei oder seine Rechnung mit dem, was noch zu bringen ist.',
          create: 'Tippe auf einen Tisch, um eine Rechnung zu öffnen oder zu bestellen.',
          edit: 'Finde einen Tisch mit der Suche; wechsle am Tablet die Person.',
        },
        tables: {
          see: 'Deine Tische mit ihren QR-Stickern.',
          create: 'Füge einen Tisch hinzu und drucke die Sticker.',
          edit: 'Benenne einen Tisch um, erstelle einen neuen Sticker oder entferne ihn.',
        },
        reports: {
          see: 'Umsatz, MwSt., Trinkgeld und Zahlungen eines Monats, nach Tagen.',
          create: 'Der Umsatz entsteht, wenn Rechnungen abgeschlossen werden.',
          edit: 'Wechsle den Monat oder durchsuche die Rechnungen.',
        },
        table: {
          see: 'Die Bestellung des Tisches: gebracht und noch zu bringen, mit Summen.',
          create: 'Durchsuche die Karte und füge hinzu, mit Notiz für die Küche.',
          edit: 'Hake ab, was gebracht wurde; schließe ab, wenn die Gäste zahlen.',
        },
        guestBill: {
          see: 'Deine Bestellung, was noch kommt, die MwSt. und die Summe.',
          create: 'Wähle auf Wunsch ein Trinkgeld.',
          edit: 'Sie aktualisiert sich selbst, bis bezahlt ist.',
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
        floor: {
          see: 'Fiecare masă: liberă sau nota ei cu ce mai e de adus.',
          create: 'Atinge o masă ca să deschizi o notă sau să adaugi la comandă.',
          edit: 'Găsește o masă cu căutarea; schimbă persoana pe tabletă.',
        },
        tables: {
          see: 'Mesele tale cu abțibildurile QR.',
          create: 'Adaugă o masă, apoi tipărește abțibildurile.',
          edit: 'Redenumește o masă, fă un abțibild nou sau elimin-o.',
        },
        reports: {
          see: 'Vânzări, TVA, bacșiș și plăți pe o lună, pe zile.',
          create: 'Vânzările se adună când se închid notele.',
          edit: 'Treci la altă lună sau caută în note.',
        },
        table: {
          see: 'Comanda mesei: adus și de adus, cu totalurile.',
          create: 'Caută în meniu ca să adaugi, cu o notă pentru bucătărie.',
          edit: 'Bifează ce a fost adus; închide nota când clienții plătesc.',
        },
        guestBill: {
          see: 'Comanda ta, ce mai vine, TVA-ul și totalul.',
          create: 'Alege un bacșiș dacă vrei.',
          edit: 'Se actualizează singură până la plată.',
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
        floor: {
          see: 'Minden asztal: szabad, vagy a számlája azzal, ami még kihozandó.',
          create: 'Koppints egy asztalra számlanyitáshoz vagy rendeléshez.',
          edit: 'Keress asztalt a keresővel; a tableten válts személyt.',
        },
        tables: {
          see: 'Az asztalaid a QR-matricáikkal.',
          create: 'Adj hozzá egy asztalt, aztán nyomtasd ki a matricákat.',
          edit: 'Nevezz át egy asztalt, készíts új matricát, vagy távolítsd el.',
        },
        reports: {
          see: 'Egy hónap forgalma, áfája, borravalója és fizetései naponként.',
          create: 'A forgalom a számlák lezárásával gyűlik.',
          edit: 'Válts hónapot, vagy keress a számlák között.',
        },
        table: {
          see: 'Az asztal rendelése: kihozva és kihozandó, összegekkel.',
          create: 'Keress az étlapon a hozzáadáshoz, megjegyzéssel a konyhának.',
          edit: 'Jelöld, mi került ki; zárd le, amikor a vendégek fizetnek.',
        },
        guestBill: {
          see: 'A rendelésed, ami még jön, az áfa és a végösszeg.',
          create: 'Ha szeretnél, válassz borravalót.',
          edit: 'Fizetésig magától frissül.',
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
        floor: {
          see: 'Ogni tavolo: libero o il suo conto con cosa resta da portare.',
          create: 'Tocca un tavolo per aprire un conto o aggiungere all’ordine.',
          edit: 'Trova un tavolo con la ricerca; cambia persona sul tablet.',
        },
        tables: {
          see: 'I tuoi tavoli con i loro adesivi QR.',
          create: 'Aggiungi un tavolo, poi stampa gli adesivi.',
          edit: 'Rinomina un tavolo, crea un nuovo adesivo o rimuovilo.',
        },
        reports: {
          see: 'Vendite, IVA, mance e pagamenti di un mese, per giorno.',
          create: 'Le vendite si sommano quando i conti vengono chiusi.',
          edit: 'Passa a un altro mese o cerca tra i conti.',
        },
        table: {
          see: 'L’ordine del tavolo: portato e da portare, con i totali.',
          create: 'Cerca nel menu per aggiungere, con una nota per la cucina.',
          edit: 'Segna ciò che è stato portato; chiudi quando i clienti pagano.',
        },
        guestBill: {
          see: 'Il tuo ordine, cosa arriva ancora, l’IVA e il totale.',
          create: 'Scegli una mancia se vuoi.',
          edit: 'Si aggiorna da solo fino al pagamento.',
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
        floor: {
          see: 'Cada mesa: libre o su cuenta con lo que falta por llevar.',
          create: 'Toca una mesa para abrir una cuenta o añadir al pedido.',
          edit: 'Busca una mesa con el buscador; cambia de persona en la tableta.',
        },
        tables: {
          see: 'Tus mesas con sus pegatinas QR.',
          create: 'Añade una mesa y luego imprime las pegatinas.',
          edit: 'Renombra una mesa, crea una pegatina nueva o quítala.',
        },
        reports: {
          see: 'Ventas, IVA, propinas y pagos de un mes, por día.',
          create: 'Las ventas se suman al cerrar las cuentas.',
          edit: 'Cambia de mes o busca en las cuentas.',
        },
        table: {
          see: 'El pedido de la mesa: servido y por servir, con los totales.',
          create: 'Busca en la carta para añadir, con una nota para la cocina.',
          edit: 'Marca lo servido; cierra cuando los clientes paguen.',
        },
        guestBill: {
          see: 'Tu pedido, lo que falta, el IVA y el total.',
          create: 'Elige una propina si quieres.',
          edit: 'Se actualiza sola hasta el pago.',
        },
      },
    },
  },
);
