import { defineMessages } from './define';

/** Which page shows which tips (tips.<key>), matched by the address (PageTips, @devquake/ui). */
export const TIPS_PAGES: Record<string, string> = {
  '/': 'home',
  '/join/:code': 'join',
  '/lists/:id': 'list',
  '/lists/:id/share': 'share',
};

/** How-to tips for each page: how to see the details, how to add, how to change. */
export const tips = defineMessages(
  {
    tips: {
      home: {
        see: 'Today shows every list planned for today with its totals; Calendar shows all lists by date; Statistics what you bought.',
        create:
          'In the “New list” tab, give a name and the shopping date and press “Create list”, or join with an invite code.',
        edit: 'Tap “Open list” to work on a list; copy lists to other days from the “New list” tab.',
      },
      join: {
        see: 'The list this invitation is for.',
        create: 'Join to add products and shop together.',
        edit: 'You can leave the list later under “Share and members”.',
      },
      list: {
        see: 'The products grouped by store, with prices and totals; tap a photo to see it large.',
        create:
          'Use “Add to the cart”: the product, its unit and, if you like, quantity, price, store and a photo; “Usual products” adds one in a tap.',
        edit: '“Edit” changes a product or store; “Go shopping” gives big tick boxes for the shop.',
      },
      share: {
        see: 'The invite link, code and QR code, and everyone on the list.',
        create: 'Send the link or code, or add people from your DevQuake referrals with one click.',
        edit: '“New link” makes the old one stop working; the owner can remove members or change the list’s settings.',
      },
    },
  },
  {
    de: {
      tips: {
        home: {
          see: 'Heute zeigt alle Listen für heute mit Summen; Kalender alle Listen nach Datum; Statistik, was du gekauft hast.',
          create:
            'Gib im Reiter „Neue Liste“ Namen und Einkaufstag ein und lege sie an, oder tritt mit einem Einladungscode bei.',
          edit: 'Öffne eine Liste, um an ihr zu arbeiten; kopiere Listen im Reiter „Neue Liste“ auf andere Tage.',
        },
        join: {
          see: 'Die Liste, für die diese Einladung gilt.',
          create: 'Tritt bei, um Produkte hinzuzufügen und gemeinsam einzukaufen.',
          edit: 'Du kannst die Liste später unter „Teilen und Mitglieder“ verlassen.',
        },
        list: {
          see: 'Die Produkte nach Geschäft gruppiert, mit Preisen und Summen; tippe auf ein Foto, um es groß zu sehen.',
          create:
            'Füge ein Produkt hinzu: Name, Einheit und nach Wunsch Menge, Preis, Geschäft und Foto; „Übliche Produkte“ fügt eines mit einem Tipp hinzu.',
          edit: '„Bearbeiten“ ändert ein Produkt oder Geschäft; „Einkaufen gehen“ zeigt große Häkchen für den Laden.',
        },
        share: {
          see: 'Der Einladungslink, Code und QR-Code, und alle auf der Liste.',
          create:
            'Sende Link oder Code, oder füge Personen aus deinen DevQuake-Empfehlungen mit einem Klick hinzu.',
          edit: 'Ein neuer Link stoppt den alten; der Besitzer kann Mitglieder entfernen oder die Einstellungen ändern.',
        },
      },
    },
    ro: {
      tips: {
        home: {
          see: 'Azi arată fiecare listă pentru azi cu totalurile; Calendar toate listele după dată; Statistici ce ai cumpărat.',
          create:
            'În fila „Listă nouă”, dă un nume și ziua cumpărăturilor și creeaz-o, sau intră cu un cod de invitație.',
          edit: 'Deschide o listă ca să lucrezi pe ea; copiază liste în alte zile din fila „Listă nouă”.',
        },
        join: {
          see: 'Lista pentru care e această invitație.',
          create: 'Intră ca să adaugi produse și să faceți cumpărăturile împreună.',
          edit: 'Poți părăsi lista mai târziu, la „Partajare și membri”.',
        },
        list: {
          see: 'Produsele grupate pe magazine, cu prețuri și totaluri; atinge o fotografie ca s-o vezi mare.',
          create:
            'Adaugă un produs: numele, unitatea și, dacă vrei, cantitatea, prețul, magazinul și o fotografie; „Produse obișnuite” adaugă unul dintr-o atingere.',
          edit: '„Editează” schimbă un produs sau un magazin; „La cumpărături” dă căsuțe mari de bifat în magazin.',
        },
        share: {
          see: 'Linkul de invitație, codul și codul QR, și toți cei de pe listă.',
          create:
            'Trimite linkul sau codul, sau adaugă dintr-un clic oameni din recomandările tale DevQuake.',
          edit: 'Un link nou îl oprește pe cel vechi; proprietarul poate scoate membri sau schimba setările listei.',
        },
      },
    },
    hu: {
      tips: {
        home: {
          see: 'A Ma fül a mai listákat mutatja összegekkel, a Naptár minden listát dátum szerint, a Statisztika azt, mit vásároltál.',
          create:
            'Az „Új lista” fülön adj nevet és vásárlási napot, és hozd létre, vagy csatlakozz meghívókóddal.',
          edit: 'Nyiss meg egy listát a munkához; az „Új lista” fülön más napokra másolhatsz listákat.',
        },
        join: {
          see: 'A lista, amelyre ez a meghívó szól.',
          create: 'Csatlakozz, hogy termékeket adj hozzá és együtt vásároljatok.',
          edit: 'Később a „Megosztás és tagok” alatt kiléphetsz a listából.',
        },
        list: {
          see: 'A termékek boltonként, árakkal és összegekkel; koppints egy fotóra a nagy nézethez.',
          create:
            'Adj hozzá terméket: név, mértékegység és ha kell mennyiség, ár, bolt és fotó; a „Szokásos termékek” egy koppintással hozzáad egyet.',
          edit: 'A „Szerkesztés” módosít egy terméket vagy boltot; a „Vásárlás” nagy pipálókat ad a boltba.',
        },
        share: {
          see: 'A meghívó link, a kód és a QR-kód, és mindenki a listán.',
          create:
            'Küldd el a linket vagy a kódot, vagy adj hozzá egy kattintással embereket a DevQuake-ajánlásaidból.',
          edit: 'Az új link leállítja a régit; a tulajdonos tagokat távolíthat el, vagy módosíthatja a lista beállításait.',
        },
      },
    },
    it: {
      tips: {
        home: {
          see: 'Oggi mostra le liste di oggi con i totali; Calendario tutte le liste per data; Statistiche ciò che hai comprato.',
          create:
            'Nella scheda «Nuova lista» scrivi un nome e il giorno della spesa e creala, o unisciti con un codice d’invito.',
          edit: 'Apri una lista per lavorarci; copia le liste su altri giorni dalla scheda «Nuova lista».',
        },
        join: {
          see: 'La lista a cui si riferisce questo invito.',
          create: 'Unisciti per aggiungere prodotti e fare la spesa insieme.',
          edit: 'Puoi lasciare la lista più tardi in «Condivisione e membri».',
        },
        list: {
          see: 'I prodotti raggruppati per negozio, con prezzi e totali; tocca una foto per vederla grande.',
          create:
            'Aggiungi un prodotto: nome, unità e, se vuoi, quantità, prezzo, negozio e una foto; «Prodotti abituali» ne aggiunge uno con un tocco.',
          edit: '«Modifica» cambia un prodotto o un negozio; «Vai a fare la spesa» dà caselle grandi da spuntare in negozio.',
        },
        share: {
          see: 'Il link d’invito, il codice e il codice QR, e tutti quelli sulla lista.',
          create:
            'Invia il link o il codice, o aggiungi con un clic persone dai tuoi inviti DevQuake.',
          edit: 'Un nuovo link ferma il vecchio; il proprietario può togliere membri o cambiare le impostazioni della lista.',
        },
      },
    },
    es: {
      tips: {
        home: {
          see: 'Hoy muestra las listas de hoy con sus totales; Calendario todas las listas por fecha; Estadísticas lo que compraste.',
          create:
            'En la pestaña «Nueva lista», escribe un nombre y el día de la compra y créala, o únete con un código de invitación.',
          edit: 'Abre una lista para trabajar en ella; copia listas a otros días desde la pestaña «Nueva lista».',
        },
        join: {
          see: 'La lista de esta invitación.',
          create: 'Únete para añadir productos y comprar juntos.',
          edit: 'Puedes salir de la lista más tarde en «Compartir y miembros».',
        },
        list: {
          see: 'Los productos agrupados por tienda, con precios y totales; toca una foto para verla grande.',
          create:
            'Añade un producto: nombre, unidad y, si quieres, cantidad, precio, tienda y una foto; «Productos habituales» añade uno con un toque.',
          edit: '«Editar» cambia un producto o una tienda; «Ir a comprar» muestra casillas grandes para la tienda.',
        },
        share: {
          see: 'El enlace de invitación, el código y el código QR, y todos los de la lista.',
          create:
            'Envía el enlace o el código, o añade con un clic a personas de tus invitaciones de DevQuake.',
          edit: 'Un enlace nuevo detiene el anterior; el dueño puede quitar miembros o cambiar los ajustes de la lista.',
        },
      },
    },
  },
);
