import { defineMessages } from './define';

/** Which page shows which tips (tips.<key>), matched by the address (PageTips, @devquake/ui). */
export const TIPS_PAGES: Record<string, string> = {
  '/': 'home',
  '/profile': 'profile',
  '/join/:code': 'join',
  '/utilities/:id': 'utility',
  '/utilities/:id/share': 'share',
  '/utilities/:id/bills/new': 'billNew',
  '/bills/:id': 'bill',
  '/bills/:id/edit': 'billEdit',
};

/** How-to tips for each page: how to see the details, how to add, how to change. */
export const tips = defineMessages(
  {
    tips: {
      home: {
        see: 'Bills lists your utilities by category with the last bill’s state; Calendar and Statistics show dates, consumption and costs.',
        create:
          'In the “New” tab, add a utility with its category, provider and unit, or search for the usual services near you.',
        edit: 'Open a utility to see its bills; its manager changes its settings there.',
      },
      profile: {
        see: 'Your full name and address, shown to the people you share utilities with.',
        create: 'Fill it in once; address suggestions appear while you type.',
        edit: 'Change it and save whenever you move.',
      },
      join: {
        see: 'The utility this invitation is for.',
        create: 'Join to share its bills from this month on.',
        edit: 'You can leave the utility later under “Share and members”.',
      },
      utility: {
        see: 'The utility’s bills with their state: ✔ paid, ⚠ payments missing, ⏳ readings missing.',
        create: 'The manager adds a bill with “Add bill”; open a bill to send your meter reading.',
        edit: 'The manager changes the utility’s settings here or deletes it.',
      },
      share: {
        see: 'The invite link, code and QR code, and everyone on the utility with their address.',
        create: 'Send the link or code, or add people from your DevQuake referrals with one click.',
        edit: 'Tick “View only” for someone who should only see the bills; “New link” stops the old one.',
      },
      billNew: {
        see: 'The new bill’s form; the provider’s PDF fills in what it can read.',
        create:
          'Pick the PDF, check the total, consumption, unit price and due date, and type in what is missing.',
        edit: 'Tick “I have paid the provider” once it is paid; the bill can be changed later.',
      },
      bill: {
        see: 'How the bill is split, everyone’s readings with photos, the payments and the comments.',
        create:
          'Under “Your meter reading”, take a photo of the meter, check the index and save it; write a comment.',
        edit: 'The manager records each amount received; extra or missing money carries over to the next bill.',
      },
      billEdit: {
        see: 'The bill’s total, consumption, unit price and due date.',
        create: 'Fill in what the PDF could not read.',
        edit: 'Change the values and save; the shares are worked out again.',
      },
    },
  },
  {
    de: {
      tips: {
        home: {
          see: 'Rechnungen zeigt deine Versorger nach Kategorie mit dem Stand der letzten Rechnung; Kalender und Statistik zeigen Daten, Verbrauch und Kosten.',
          create:
            'Füge im Reiter „Neu“ einen Versorger mit Kategorie, Anbieter und Einheit hinzu, oder suche die üblichen Dienste in deiner Nähe.',
          edit: 'Öffne einen Versorger, um seine Rechnungen zu sehen; sein Verwalter ändert dort die Einstellungen.',
        },
        profile: {
          see: 'Dein vollständiger Name und deine Adresse, sichtbar für die, mit denen du Versorger teilst.',
          create: 'Fülle es einmal aus; beim Tippen erscheinen Adressvorschläge.',
          edit: 'Ändere es und speichere, wenn du umziehst.',
        },
        join: {
          see: 'Der Versorger, für den diese Einladung gilt.',
          create: 'Tritt bei, um seine Rechnungen ab diesem Monat zu teilen.',
          edit: 'Du kannst den Versorger später unter „Teilen und Mitglieder“ verlassen.',
        },
        utility: {
          see: 'Die Rechnungen des Versorgers mit Stand: ✔ bezahlt, ⚠ Zahlungen fehlen, ⏳ Zählerstände fehlen.',
          create:
            'Der Verwalter fügt eine Rechnung hinzu; öffne eine Rechnung, um deinen Zählerstand zu senden.',
          edit: 'Der Verwalter ändert hier die Einstellungen des Versorgers oder löscht ihn.',
        },
        share: {
          see: 'Der Einladungslink, Code und QR-Code, und alle beim Versorger mit ihrer Adresse.',
          create:
            'Sende Link oder Code, oder füge Personen aus deinen DevQuake-Empfehlungen mit einem Klick hinzu.',
          edit: 'Hake „Nur ansehen“ für jemanden an, der nur die Rechnungen sehen soll; ein neuer Link stoppt den alten.',
        },
        billNew: {
          see: 'Das Formular der neuen Rechnung; das PDF des Anbieters füllt aus, was es lesen kann.',
          create:
            'Wähle das PDF, prüfe Summe, Verbrauch, Einheitspreis und Fälligkeit, und tippe Fehlendes ein.',
          edit: 'Hake ab, dass du den Anbieter bezahlt hast, sobald es so ist; die Rechnung lässt sich später ändern.',
        },
        bill: {
          see: 'Wie die Rechnung aufgeteilt wird, alle Zählerstände mit Fotos, die Zahlungen und Kommentare.',
          create:
            'Fotografiere unter „Dein Zählerstand“ den Zähler, prüfe den Stand und speichere; schreibe einen Kommentar.',
          edit: 'Der Verwalter trägt jeden erhaltenen Betrag ein; zu viel oder zu wenig wird auf die nächste Rechnung übertragen.',
        },
        billEdit: {
          see: 'Summe, Verbrauch, Einheitspreis und Fälligkeit der Rechnung.',
          create: 'Fülle aus, was das PDF nicht lesen konnte.',
          edit: 'Ändere die Werte und speichere; die Anteile werden neu berechnet.',
        },
      },
    },
    ro: {
      tips: {
        home: {
          see: 'Facturi arată utilitățile pe categorii cu starea ultimei facturi; Calendar și Statistici arată date, consum și costuri.',
          create:
            'În fila „Nou”, adaugă o utilitate cu categoria, furnizorul și unitatea, sau caută serviciile obișnuite din zona ta.',
          edit: 'Deschide o utilitate ca să-i vezi facturile; administratorul ei îi schimbă acolo setările.',
        },
        profile: {
          see: 'Numele tău complet și adresa, văzute de cei cu care împarți utilități.',
          create: 'Completează-le o dată; cât scrii apar sugestii de adresă.',
          edit: 'Modifică și salvează când te muți.',
        },
        join: {
          see: 'Utilitatea pentru care e această invitație.',
          create: 'Intră ca să împarți facturile ei din luna asta.',
          edit: 'Poți părăsi utilitatea mai târziu, la „Partajare și membri”.',
        },
        utility: {
          see: 'Facturile utilității cu starea lor: ✔ plătită, ⚠ lipsesc plăți, ⏳ lipsesc indexuri.',
          create: 'Administratorul adaugă o factură; deschide o factură ca să trimiți indexul tău.',
          edit: 'Administratorul schimbă aici setările utilității sau o șterge.',
        },
        share: {
          see: 'Linkul de invitație, codul și codul QR, și toți cei de pe utilitate cu adresa lor.',
          create:
            'Trimite linkul sau codul, sau adaugă dintr-un clic oameni din recomandările tale DevQuake.',
          edit: 'Bifează „Doar vizualizare” pentru cineva care doar vede facturile; un link nou îl oprește pe cel vechi.',
        },
        billNew: {
          see: 'Formularul facturii noi; PDF-ul furnizorului completează ce poate citi.',
          create:
            'Alege PDF-ul, verifică totalul, consumul, prețul unitar și scadența, și scrie ce lipsește.',
          edit: 'Bifează că ai plătit furnizorul când ai plătit; factura se poate modifica și mai târziu.',
        },
        bill: {
          see: 'Cum se împarte factura, indexurile tuturor cu fotografii, plățile și comentariile.',
          create:
            'La „Indexul tău”, fotografiază contorul, verifică indexul și salvează; scrie un comentariu.',
          edit: 'Administratorul înregistrează fiecare sumă primită; ce e în plus sau în minus trece pe factura următoare.',
        },
        billEdit: {
          see: 'Totalul facturii, consumul, prețul unitar și scadența.',
          create: 'Completează ce nu a putut citi PDF-ul.',
          edit: 'Modifică valorile și salvează; părțile se recalculează.',
        },
      },
    },
    hu: {
      tips: {
        home: {
          see: 'A Számlák a közműveidet mutatja kategóriánként, az utolsó számla állapotával; a Naptár és a Statisztika dátumokat, fogyasztást és költséget.',
          create:
            'Az „Új” fülön adj hozzá közművet kategóriával, szolgáltatóval és mértékegységgel, vagy keresd meg a környéked szokásos szolgáltatásait.',
          edit: 'Nyiss meg egy közművet a számlái megtekintéséhez; a kezelője ott módosítja a beállításait.',
        },
        profile: {
          see: 'A teljes neved és a címed, amelyet azok látnak, akikkel közművet osztasz meg.',
          create: 'Egyszer töltsd ki; gépelés közben címjavaslatok jelennek meg.',
          edit: 'Költözéskor módosítsd és mentsd.',
        },
        join: {
          see: 'A közmű, amelyre ez a meghívó szól.',
          create: 'Csatlakozz, hogy ettől a hónaptól osztozz a számláin.',
          edit: 'Később a „Megosztás és tagok” alatt kiléphetsz.',
        },
        utility: {
          see: 'A közmű számlái az állapotukkal: ✔ kifizetve, ⚠ hiányzó befizetések, ⏳ hiányzó óraállások.',
          create: 'A kezelő ad hozzá számlát; nyiss meg egy számlát az óraállásod elküldéséhez.',
          edit: 'A kezelő itt módosítja a közmű beállításait, vagy törli.',
        },
        share: {
          see: 'A meghívó link, a kód és a QR-kód, és a közmű minden tagja a címével.',
          create:
            'Küldd el a linket vagy a kódot, vagy adj hozzá egy kattintással embereket a DevQuake-ajánlásaidból.',
          edit: 'Pipáld be a „Csak megtekintés” lehetőséget annál, aki csak látja a számlákat; az új link leállítja a régit.',
        },
        billNew: {
          see: 'Az új számla űrlapja; a szolgáltató PDF-je kitölti, amit ki tud olvasni.',
          create:
            'Válaszd ki a PDF-et, ellenőrizd a végösszeget, a fogyasztást, az egységárat és a határidőt, és írd be, ami hiányzik.',
          edit: 'Jelöld be, hogy kifizetted a szolgáltatót, ha megtörtént; a számla később is módosítható.',
        },
        bill: {
          see: 'Hogyan oszlik meg a számla, mindenki óraállása fotóval, a befizetések és a hozzászólások.',
          create:
            'Az óraállásodnál fényképezd le a mérőórát, ellenőrizd az állást és mentsd; írj hozzászólást.',
          edit: 'A kezelő rögzíti a kapott összegeket; a többlet vagy hiány átkerül a következő számlára.',
        },
        billEdit: {
          see: 'A számla végösszege, fogyasztása, egységára és határideje.',
          create: 'Töltsd ki, amit a PDF-ből nem lehetett kiolvasni.',
          edit: 'Módosítsd az értékeket és ments; a részek újra kiszámolódnak.',
        },
      },
    },
    it: {
      tips: {
        home: {
          see: 'Bollette mostra le tue utenze per categoria con lo stato dell’ultima bolletta; Calendario e Statistiche mostrano date, consumi e costi.',
          create:
            'Nella scheda «Nuova» aggiungi un’utenza con categoria, fornitore e unità, o cerca i servizi abituali della tua zona.',
          edit: 'Apri un’utenza per vederne le bollette; chi la gestisce ne cambia lì le impostazioni.',
        },
        profile: {
          see: 'Il tuo nome completo e l’indirizzo, visibili a chi condivide utenze con te.',
          create: 'Compilali una volta; mentre scrivi compaiono suggerimenti di indirizzo.',
          edit: 'Cambiali e salva quando traslochi.',
        },
        join: {
          see: 'L’utenza a cui si riferisce questo invito.',
          create: 'Unisciti per dividere le sue bollette da questo mese.',
          edit: 'Puoi lasciare l’utenza più tardi in «Condivisione e membri».',
        },
        utility: {
          see: 'Le bollette dell’utenza con il loro stato: ✔ pagata, ⚠ mancano pagamenti, ⏳ mancano letture.',
          create:
            'Chi gestisce l’utenza aggiunge una bolletta; apri una bolletta per inviare la tua lettura.',
          edit: 'Chi la gestisce ne cambia qui le impostazioni o la elimina.',
        },
        share: {
          see: 'Il link d’invito, il codice e il codice QR, e tutti sull’utenza con il loro indirizzo.',
          create:
            'Invia il link o il codice, o aggiungi con un clic persone dai tuoi inviti DevQuake.',
          edit: 'Spunta «Solo visualizzazione» per chi deve solo vedere le bollette; un nuovo link ferma il vecchio.',
        },
        billNew: {
          see: 'Il modulo della nuova bolletta; il PDF del fornitore compila ciò che riesce a leggere.',
          create:
            'Scegli il PDF, controlla totale, consumo, prezzo unitario e scadenza, e scrivi ciò che manca.',
          edit: 'Segna di aver pagato il fornitore quando l’hai fatto; la bolletta si può cambiare più tardi.',
        },
        bill: {
          see: 'Come si divide la bolletta, le letture di tutti con le foto, i pagamenti e i commenti.',
          create:
            'In «La tua lettura» fotografa il contatore, controlla il numero e salva; scrivi un commento.',
          edit: 'Chi gestisce registra ogni importo ricevuto; ciò che è in più o in meno passa alla bolletta successiva.',
        },
        billEdit: {
          see: 'Totale, consumo, prezzo unitario e scadenza della bolletta.',
          create: 'Compila ciò che il PDF non è riuscito a leggere.',
          edit: 'Cambia i valori e salva; le quote vengono ricalcolate.',
        },
      },
    },
    es: {
      tips: {
        home: {
          see: 'Facturas muestra tus suministros por categoría con el estado de la última factura; Calendario y Estadísticas muestran fechas, consumo y costes.',
          create:
            'En la pestaña «Nuevo», añade un suministro con su categoría, proveedor y unidad, o busca los servicios habituales de tu zona.',
          edit: 'Abre un suministro para ver sus facturas; quien lo gestiona cambia allí sus ajustes.',
        },
        profile: {
          see: 'Tu nombre completo y tu dirección, que ven quienes comparten suministros contigo.',
          create: 'Rellénalo una vez; mientras escribes aparecen sugerencias de dirección.',
          edit: 'Cámbialo y guarda cuando te mudes.',
        },
        join: {
          see: 'El suministro de esta invitación.',
          create: 'Únete para compartir sus facturas desde este mes.',
          edit: 'Puedes salir del suministro más tarde en «Compartir y miembros».',
        },
        utility: {
          see: 'Las facturas del suministro con su estado: ✔ pagada, ⚠ faltan pagos, ⏳ faltan lecturas.',
          create: 'Quien lo gestiona añade una factura; abre una factura para enviar tu lectura.',
          edit: 'Quien lo gestiona cambia aquí sus ajustes o lo borra.',
        },
        share: {
          see: 'El enlace de invitación, el código y el código QR, y todos los del suministro con su dirección.',
          create:
            'Envía el enlace o el código, o añade con un clic a personas de tus invitaciones de DevQuake.',
          edit: 'Marca «Solo ver» para quien solo deba ver las facturas; un enlace nuevo detiene el anterior.',
        },
        billNew: {
          see: 'El formulario de la factura nueva; el PDF del proveedor rellena lo que puede leer.',
          create:
            'Elige el PDF, revisa el total, el consumo, el precio unitario y el vencimiento, y escribe lo que falte.',
          edit: 'Marca que pagaste al proveedor cuando lo hayas hecho; la factura se puede cambiar después.',
        },
        bill: {
          see: 'Cómo se reparte la factura, las lecturas de todos con fotos, los pagos y los comentarios.',
          create:
            'En «Tu lectura», fotografía el contador, revisa la cifra y guarda; escribe un comentario.',
          edit: 'Quien gestiona anota cada importe recibido; lo que sobra o falta pasa a la siguiente factura.',
        },
        billEdit: {
          see: 'El total de la factura, el consumo, el precio unitario y el vencimiento.',
          create: 'Rellena lo que el PDF no pudo leer.',
          edit: 'Cambia los valores y guarda; las partes se calculan de nuevo.',
        },
      },
    },
  },
);
