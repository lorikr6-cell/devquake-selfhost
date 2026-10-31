import { defineMessages } from './define';

/** Which page shows which tips (tips.<key>), matched by the address (PageTips, @devquake/ui). */
export const TIPS_PAGES: Record<string, string> = {
  '/': 'home',
  '/apps/:id': 'app',
  '/apps/:id/test': 'test',
  '/demo': 'demo',
  '/platform': 'platform',
};

/** Demo pages: their tips are on until the visitor turns them off. */
export const TIPS_DEMO = ['/demo'];

/** How-to tips for each page: how to see the details, how to add, how to change. */
export const tips = defineMessages(
  {
    tips: {
      home: {
        see: 'Your API services with their plan and limits; click one to open it.',
        create:
          'Create an API service and copy its secret key straight away: it is shown only once.',
        edit: 'Open a service to change its websites, data structure and keys.',
      },
      app: {
        see: 'The keys, verified websites, data structure, code examples, usage and the log of refused calls.',
        create:
          'Add a website and its DNS record, or describe an event and its keys under “Your data structure”.',
        edit: 'Press “Check now” after adding the DNS record; make a new secret key if the old one leaked.',
      },
      test: {
        see: 'A live test: connect to a channel and see every event arrive, with how long it took.',
        create:
          'Under “Send”, choose the event and its keys and press “Send event”; open the page on a second device to see it there.',
        edit: 'Change the channel, or turn on “Use a client token” to try private channels.',
      },
      demo: {
        see: 'Two browsers on one private channel: what one sends, the other receives within a second.',
        create: 'Open this page in a second browser or on your phone, then send a message.',
        edit: 'Nothing is kept: the demo only shows how events travel.',
      },
      platform: {
        see: 'The platform service’s keys, whether the website has the current secret key, and today’s use (admins only).',
        create: '“New secret key” makes one and shows it once: put it into PULSE_PLATFORM_SECRET.',
        edit: 'The previous key keeps working for 24 hours; restart the app subdomains after setting the new one.',
      },
    },
  },
  {
    de: {
      tips: {
        home: {
          see: 'Deine API-Dienste mit Tarif und Grenzen; klicke auf einen, um ihn zu öffnen.',
          create:
            'Lege einen API-Dienst an und kopiere sofort seinen geheimen Schlüssel: er wird nur einmal gezeigt.',
          edit: 'Öffne einen Dienst, um Websites, Datenstruktur und Schlüssel zu ändern.',
        },
        app: {
          see: 'Die Schlüssel, geprüfte Websites, Datenstruktur, Codebeispiele, Nutzung und das Protokoll abgelehnter Aufrufe.',
          create:
            'Füge eine Website mit ihrem DNS-Eintrag hinzu, oder beschreibe ein Ereignis und seine Schlüssel unter „Deine Datenstruktur“.',
          edit: 'Drücke „Jetzt prüfen“, nachdem der DNS-Eintrag steht; erstelle einen neuen geheimen Schlüssel, wenn der alte bekannt wurde.',
        },
        test: {
          see: 'Ein Live-Test: verbinde dich mit einem Kanal und sieh jedes Ereignis ankommen, mit der Laufzeit.',
          create:
            'Wähle unter „Senden“ Ereignis und Schlüssel und sende; öffne die Seite auf einem zweiten Gerät, um es dort zu sehen.',
          edit: 'Ändere den Kanal, oder schalte das Client-Token ein, um private Kanäle zu testen.',
        },
        demo: {
          see: 'Zwei Browser auf einem privaten Kanal: was einer sendet, empfängt der andere innerhalb einer Sekunde.',
          create:
            'Öffne diese Seite in einem zweiten Browser oder auf dem Telefon und sende eine Nachricht.',
          edit: 'Nichts wird gespeichert: die Demo zeigt nur, wie Ereignisse reisen.',
        },
        platform: {
          see: 'Die Schlüssel des Plattformdienstes, ob die Website den aktuellen geheimen Schlüssel hat, und die heutige Nutzung (nur Admins).',
          create:
            '„Neuer geheimer Schlüssel“ erstellt einen und zeigt ihn einmal: trage ihn in PULSE_PLATFORM_SECRET ein.',
          edit: 'Der vorherige Schlüssel gilt noch 24 Stunden; starte die App-Subdomains neu, nachdem der neue gesetzt ist.',
        },
      },
    },
    ro: {
      tips: {
        home: {
          see: 'Serviciile tale API cu planul și limitele lor; apasă pe unul ca să-l deschizi.',
          create:
            'Creează un serviciu API și copiază imediat cheia secretă: se arată o singură dată.',
          edit: 'Deschide un serviciu ca să-i schimbi site-urile, structura datelor și cheile.',
        },
        app: {
          see: 'Cheile, site-urile verificate, structura datelor, exemple de cod, utilizarea și jurnalul apelurilor refuzate.',
          create:
            'Adaugă un site și înregistrarea lui DNS, sau descrie un eveniment și cheile lui la „Structura datelor tale”.',
          edit: 'Apasă „Verifică acum” după ce ai adăugat înregistrarea DNS; fă o cheie secretă nouă dacă cea veche a scăpat.',
        },
        test: {
          see: 'Un test în direct: conectează-te la un canal și vezi fiecare eveniment sosind, cu cât a durat.',
          create:
            'La „Trimite”, alege evenimentul și cheile și trimite-l; deschide pagina pe un al doilea dispozitiv ca să-l vezi acolo.',
          edit: 'Schimbă canalul, sau pornește tokenul de client ca să încerci canale private.',
        },
        demo: {
          see: 'Două browsere pe un canal privat: ce trimite unul, celălalt primește într-o secundă.',
          create:
            'Deschide pagina într-un al doilea browser sau pe telefon, apoi trimite un mesaj.',
          edit: 'Nu se păstrează nimic: demo-ul arată doar cum circulă evenimentele.',
        },
        platform: {
          see: 'Cheile serviciului de platformă, dacă site-ul are cheia secretă curentă și utilizarea de azi (doar administratori).',
          create:
            '„Cheie secretă nouă” face una și o arată o dată: pune-o în PULSE_PLATFORM_SECRET.',
          edit: 'Cheia anterioară mai merge 24 de ore; repornește subdomeniile aplicațiilor după ce ai pus-o pe cea nouă.',
        },
      },
    },
    hu: {
      tips: {
        home: {
          see: 'Az API-szolgáltatásaid a csomagjukkal és korlátaikkal; kattints egyre a megnyitásához.',
          create:
            'Hozz létre API-szolgáltatást, és azonnal másold ki a titkos kulcsát: csak egyszer látszik.',
          edit: 'Nyiss meg egy szolgáltatást a weboldalai, adatszerkezete és kulcsai módosításához.',
        },
        app: {
          see: 'A kulcsok, ellenőrzött weboldalak, adatszerkezet, kódpéldák, használat és az elutasított hívások naplója.',
          create:
            'Adj hozzá weboldalt a DNS-rekordjával, vagy írj le egy eseményt és kulcsait az adatszerkezetnél.',
          edit: 'A DNS-rekord felvétele után nyomd meg az ellenőrzést; ha a régi titkos kulcs kiszivárgott, készíts újat.',
        },
        test: {
          see: 'Élő teszt: csatlakozz egy csatornához, és nézd, ahogy minden esemény megérkezik, a futási idővel.',
          create:
            'A küldésnél válaszd ki az eseményt és kulcsait, és küldd el; nyisd meg az oldalt egy második eszközön is.',
          edit: 'Válts csatornát, vagy kapcsold be a klienstokent a privát csatornák kipróbálásához.',
        },
        demo: {
          see: 'Két böngésző egy privát csatornán: amit az egyik küld, a másik egy másodpercen belül megkapja.',
          create:
            'Nyisd meg ezt az oldalt egy második böngészőben vagy a telefonodon, és küldj üzenetet.',
          edit: 'Semmi sem marad meg: a bemutató csak azt mutatja, hogyan utaznak az események.',
        },
        platform: {
          see: 'A platformszolgáltatás kulcsai, hogy a weboldalon a jelenlegi titkos kulcs van-e, és a mai használat (csak adminoknak).',
          create:
            'Az „Új titkos kulcs” készít egyet, és egyszer megmutatja: tedd a PULSE_PLATFORM_SECRET változóba.',
          edit: 'Az előző kulcs még 24 óráig működik; az új beállítása után indítsd újra az alkalmazások aldomainjeit.',
        },
      },
    },
    it: {
      tips: {
        home: {
          see: 'I tuoi servizi API con piano e limiti; clicca su uno per aprirlo.',
          create:
            'Crea un servizio API e copia subito la sua chiave segreta: si vede una volta sola.',
          edit: 'Apri un servizio per cambiarne siti, struttura dei dati e chiavi.',
        },
        app: {
          see: 'Le chiavi, i siti verificati, la struttura dei dati, esempi di codice, l’uso e il registro delle chiamate rifiutate.',
          create:
            'Aggiungi un sito e il suo record DNS, o descrivi un evento e le sue chiavi in «La tua struttura dei dati».',
          edit: 'Premi «Verifica ora» dopo aver aggiunto il record DNS; crea una nuova chiave segreta se la vecchia è trapelata.',
        },
        test: {
          see: 'Un test dal vivo: collegati a un canale e vedi arrivare ogni evento, con il tempo impiegato.',
          create:
            'In «Invia» scegli l’evento e le chiavi e invialo; apri la pagina su un secondo dispositivo per vederlo lì.',
          edit: 'Cambia canale, o attiva il token client per provare i canali privati.',
        },
        demo: {
          see: 'Due browser su un canale privato: ciò che uno invia, l’altro lo riceve entro un secondo.',
          create:
            'Apri questa pagina in un secondo browser o sul telefono, poi invia un messaggio.',
          edit: 'Non si conserva nulla: la demo mostra solo come viaggiano gli eventi.',
        },
        platform: {
          see: 'Le chiavi del servizio di piattaforma, se il sito ha la chiave segreta attuale, e l’uso di oggi (solo amministratori).',
          create:
            '«Nuova chiave segreta» ne crea una e la mostra una volta: mettila in PULSE_PLATFORM_SECRET.',
          edit: 'La chiave precedente funziona ancora per 24 ore; riavvia i sottodomini delle app dopo aver impostato la nuova.',
        },
      },
    },
    es: {
      tips: {
        home: {
          see: 'Tus servicios API con su plan y sus límites; haz clic en uno para abrirlo.',
          create:
            'Crea un servicio API y copia enseguida su clave secreta: solo se muestra una vez.',
          edit: 'Abre un servicio para cambiar sus webs, su estructura de datos y sus claves.',
        },
        app: {
          see: 'Las claves, webs verificadas, estructura de datos, ejemplos de código, uso y el registro de llamadas rechazadas.',
          create:
            'Añade una web y su registro DNS, o describe un evento y sus claves en «Tu estructura de datos».',
          edit: 'Pulsa «Comprobar ahora» después de añadir el registro DNS; crea una clave secreta nueva si la antigua se filtró.',
        },
        test: {
          see: 'Una prueba en directo: conéctate a un canal y mira llegar cada evento, con lo que tardó.',
          create:
            'En «Enviar», elige el evento y sus claves y envíalo; abre la página en un segundo dispositivo para verlo allí.',
          edit: 'Cambia el canal, o activa el token de cliente para probar canales privados.',
        },
        demo: {
          see: 'Dos navegadores en un canal privado: lo que uno envía, el otro lo recibe en un segundo.',
          create: 'Abre esta página en un segundo navegador o en tu teléfono y envía un mensaje.',
          edit: 'No se guarda nada: la demo solo muestra cómo viajan los eventos.',
        },
        platform: {
          see: 'Las claves del servicio de plataforma, si la web tiene la clave secreta actual, y el uso de hoy (solo administradores).',
          create:
            '«Nueva clave secreta» crea una y la muestra una vez: ponla en PULSE_PLATFORM_SECRET.',
          edit: 'La clave anterior sigue funcionando 24 horas; reinicia los subdominios de las apps después de poner la nueva.',
        },
      },
    },
  },
);
