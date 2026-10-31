import { defineMessages } from './define';

/** Which page shows which tips (tips.<key>), matched by the address (PageTips, @devquake/ui). */
export const TIPS_PAGES: Record<string, string> = {
  '/': 'home',
  '/groups/:id': 'group',
  '/groups/:id/balances': 'balances',
  '/groups/:id/activity': 'activity',
  '/groups/:id/stats': 'stats',
  '/groups/:id/members': 'members',
  '/groups/:id/expenses/:expenseId': 'expense',
  '/join/:code': 'join',
};

/** How-to tips for each page: how to see the details, how to add, how to change. */
export const tips = defineMessages(
  {
    tips: {
      home: {
        see: 'Your groups with what was spent and your balance: green when you are owed, red when you owe.',
        create: 'Make a “New group” with a name, the kind and the currency.',
        edit: 'Open a group to add expenses; its owner changes the name and kind under Members.',
      },
      group: {
        see: 'The group’s expenses, newest first; tap one to see who pays what.',
        create:
          '“Add an expense”: what it was for, the amount, who paid, the day, and everyone who shares it.',
        edit: 'Choose how it is split: equally, by shares, by percent or exact amounts.',
      },
      balances: {
        see: 'What everyone is owed or owes, and the fewest transfers that make everyone even.',
        create:
          'Pay outside the app, then “Mark as paid”, or “Record a payment” for another amount.',
        edit: 'Delete a payment entered by mistake from the list; the balances update at once.',
      },
      activity: {
        see: 'Every expense, change, payment, comment and member joining or leaving, with who and when.',
        create: 'Everything done in the group shows up here by itself.',
        edit: 'Open an entry’s expense to correct it.',
      },
      stats: {
        see: 'Where the money went: by category, by month, and what each person paid against their share.',
        create: 'The numbers grow with every expense you add.',
        edit: 'Correct an expense in the group and the statistics follow.',
      },
      members: {
        see: 'Everyone in the group, with their balance.',
        create: 'Send the invite link or QR code, or add someone without an account by name.',
        edit: 'Leave, or as owner remove someone, once their balance is settled; “New link” stops the old one.',
      },
      expense: {
        see: 'Who paid, how it was split and each person’s part to the cent.',
        create: 'Write a comment for the others.',
        edit: 'Correct it or delete it; the balances follow.',
      },
      join: {
        see: 'The group this invitation is for.',
        create: 'Join to see its expenses and add your own; the app is free for you here.',
        edit: 'You can leave the group later on its Members tab.',
      },
    },
  },
  {
    de: {
      tips: {
        home: {
          see: 'Deine Gruppen mit den Ausgaben und deinem Saldo: grün, wenn du etwas bekommst, rot, wenn du schuldest.',
          create: 'Lege eine neue Gruppe mit Name, Art und Währung an.',
          edit: 'Öffne eine Gruppe, um Ausgaben einzutragen; Name und Art ändert der Besitzer unter Mitglieder.',
        },
        group: {
          see: 'Die Ausgaben der Gruppe, neueste zuerst; tippe auf eine, um zu sehen, wer was zahlt.',
          create:
            'Trage eine Ausgabe ein: wofür, Betrag, wer gezahlt hat, Tag und alle, die sie teilen.',
          edit: 'Wähle die Aufteilung: gleich, nach Anteilen, nach Prozent oder genaue Beträge.',
        },
        balances: {
          see: 'Was jeder bekommt oder schuldet, und die wenigsten Überweisungen, damit alle quitt sind.',
          create:
            'Zahle außerhalb der App und markiere es als bezahlt, oder trage eine Zahlung mit anderem Betrag ein.',
          edit: 'Lösche eine falsch eingetragene Zahlung in der Liste; die Salden ändern sich sofort.',
        },
        activity: {
          see: 'Jede Ausgabe, Änderung, Zahlung, jeder Kommentar und jedes Kommen und Gehen, mit wer und wann.',
          create: 'Alles, was in der Gruppe passiert, erscheint hier von selbst.',
          edit: 'Öffne die Ausgabe eines Eintrags, um sie zu korrigieren.',
        },
        stats: {
          see: 'Wohin das Geld ging: nach Kategorie, nach Monat, und was jeder gezahlt hat gegenüber seinem Anteil.',
          create: 'Die Zahlen wachsen mit jeder Ausgabe.',
          edit: 'Korrigiere eine Ausgabe in der Gruppe, und die Statistik passt sich an.',
        },
        members: {
          see: 'Alle in der Gruppe mit ihrem Saldo.',
          create:
            'Sende den Einladungslink oder QR-Code, oder füge jemanden ohne Konto mit Namen hinzu.',
          edit: 'Verlasse die Gruppe oder entferne als Besitzer jemanden, sobald der Saldo ausgeglichen ist; ein neuer Link stoppt den alten.',
        },
        expense: {
          see: 'Wer gezahlt hat, wie aufgeteilt wurde und jeder Anteil auf den Cent.',
          create: 'Schreibe einen Kommentar für die anderen.',
          edit: 'Korrigiere oder lösche sie; die Salden passen sich an.',
        },
        join: {
          see: 'Die Gruppe, für die diese Einladung gilt.',
          create:
            'Tritt bei, um die Ausgaben zu sehen und eigene einzutragen; die App ist hier für dich kostenlos.',
          edit: 'Du kannst die Gruppe später unter Mitglieder verlassen.',
        },
      },
    },
    ro: {
      tips: {
        home: {
          see: 'Grupurile tale, cu cât s-a cheltuit și soldul tău: verde când ți se datorează, roșu când datorezi.',
          create: 'Fă un grup nou, cu nume, tip și monedă.',
          edit: 'Deschide un grup ca să adaugi cheltuieli; proprietarul schimbă numele și tipul la Membri.',
        },
        group: {
          see: 'Cheltuielile grupului, cele mai noi primele; atinge una ca să vezi cine cât plătește.',
          create:
            'Adaugă o cheltuială: pentru ce, suma, cine a plătit, ziua și toți cei care o împart.',
          edit: 'Alege cum se împarte: egal, pe părți, pe procente sau sume exacte.',
        },
        balances: {
          see: 'Cât i se datorează fiecăruia sau cât datorează, și cele mai puține transferuri ca toți să fie chit.',
          create:
            'Plătește în afara aplicației, apoi marchează ca plătit, sau înregistrează o plată cu altă sumă.',
          edit: 'Șterge din listă o plată introdusă greșit; soldurile se actualizează imediat.',
        },
        activity: {
          see: 'Fiecare cheltuială, modificare, plată, comentariu și membru venit sau plecat, cu cine și când.',
          create: 'Tot ce se face în grup apare aici singur.',
          edit: 'Deschide cheltuiala unei intrări ca s-o corectezi.',
        },
        stats: {
          see: 'Unde s-au dus banii: pe categorii, pe luni și cât a plătit fiecare față de partea lui.',
          create: 'Cifrele cresc cu fiecare cheltuială.',
          edit: 'Corectează o cheltuială în grup și statisticile urmează.',
        },
        members: {
          see: 'Toți cei din grup, cu soldul lor.',
          create:
            'Trimite linkul de invitație sau codul QR, sau adaugă pe nume pe cineva fără cont.',
          edit: 'Pleacă, sau ca proprietar scoate pe cineva, după ce soldul e achitat; un link nou îl oprește pe cel vechi.',
        },
        expense: {
          see: 'Cine a plătit, cum s-a împărțit și partea fiecăruia la ban.',
          create: 'Scrie un comentariu pentru ceilalți.',
          edit: 'Corecteaz-o sau șterge-o; soldurile urmează.',
        },
        join: {
          see: 'Grupul pentru care e această invitație.',
          create:
            'Intră ca să vezi cheltuielile și să le adaugi pe ale tale; aici aplicația e gratuită pentru tine.',
          edit: 'Poți părăsi grupul mai târziu, la Membri.',
        },
      },
    },
    hu: {
      tips: {
        home: {
          see: 'A csoportjaid a költésekkel és az egyenlegeddel: zöld, ha neked tartoznak, piros, ha te tartozol.',
          create: 'Hozz létre új csoportot névvel, fajtával és pénznemmel.',
          edit: 'Nyiss meg egy csoportot a kiadások felviteléhez; a nevét és fajtáját a tulajdonos a Tagoknál módosítja.',
        },
        group: {
          see: 'A csoport kiadásai, a legújabb elöl; koppints egyre, és látod, ki mennyit fizet.',
          create:
            'Vigyél fel kiadást: mire, mennyi, ki fizette, melyik nap, és kik osztoznak rajta.',
          edit: 'Válaszd ki a felosztást: egyenlően, arányokban, százalékban vagy pontos összegekkel.',
        },
        balances: {
          see: 'Ki mennyit kap vagy tartozik, és a legkevesebb utalás, amellyel mindenki kvitt.',
          create:
            'Fizess az alkalmazáson kívül, aztán jelöld kifizetettnek, vagy rögzíts más összegű fizetést.',
          edit: 'A tévesen felvitt fizetést a listából törölheted; az egyenlegek azonnal frissülnek.',
        },
        activity: {
          see: 'Minden kiadás, módosítás, fizetés, hozzászólás és tagváltozás, azzal, hogy ki és mikor.',
          create: 'Minden, ami a csoportban történik, magától megjelenik itt.',
          edit: 'Nyisd meg egy bejegyzés kiadását a javításhoz.',
        },
        stats: {
          see: 'Hová ment a pénz: kategóriánként, havonta, és ki mennyit fizetett a részéhez képest.',
          create: 'A számok minden kiadással nőnek.',
          edit: 'Javíts egy kiadást a csoportban, és a statisztika követi.',
        },
        members: {
          see: 'A csoport minden tagja az egyenlegével.',
          create:
            'Küldd el a meghívó linket vagy QR-kódot, vagy adj hozzá név szerint valakit fiók nélkül.',
          edit: 'Kiléphetsz, vagy tulajdonosként eltávolíthatsz valakit, ha rendezte az egyenlegét; az új link leállítja a régit.',
        },
        expense: {
          see: 'Ki fizetett, hogyan oszlott fel, és mindenki része fillérre.',
          create: 'Írj hozzászólást a többieknek.',
          edit: 'Javítsd vagy töröld; az egyenlegek követik.',
        },
        join: {
          see: 'A csoport, amelyre ez a meghívó szól.',
          create:
            'Csatlakozz, hogy lásd a kiadásokat és felvidd a sajátjaidat; itt az alkalmazás neked ingyenes.',
          edit: 'Később a Tagoknál kiléphetsz a csoportból.',
        },
      },
    },
    it: {
      tips: {
        home: {
          see: 'I tuoi gruppi con quanto speso e il tuo saldo: verde se ti devono, rosso se devi.',
          create: 'Crea un nuovo gruppo con nome, tipo e valuta.',
          edit: 'Apri un gruppo per aggiungere spese; nome e tipo li cambia il proprietario in Membri.',
        },
        group: {
          see: 'Le spese del gruppo, le più recenti prima; tocca una spesa per vedere chi paga cosa.',
          create:
            'Aggiungi una spesa: per cosa, importo, chi ha pagato, il giorno e tutti quelli che la dividono.',
          edit: 'Scegli come dividerla: in parti uguali, per quote, per percentuale o importi esatti.',
        },
        balances: {
          see: 'Quanto deve avere o dare ognuno, e i trasferimenti minimi per essere tutti pari.',
          create:
            'Paga fuori dall’app e segna come pagato, o registra un pagamento di un altro importo.',
          edit: 'Elimina dall’elenco un pagamento inserito per errore; i saldi si aggiornano subito.',
        },
        activity: {
          see: 'Ogni spesa, modifica, pagamento, commento e membro che entra o esce, con chi e quando.',
          create: 'Tutto ciò che succede nel gruppo compare qui da solo.',
          edit: 'Apri la spesa di una voce per correggerla.',
        },
        stats: {
          see: 'Dove sono andati i soldi: per categoria, per mese, e quanto ha pagato ognuno rispetto alla sua quota.',
          create: 'I numeri crescono con ogni spesa.',
          edit: 'Correggi una spesa nel gruppo e le statistiche seguono.',
        },
        members: {
          see: 'Tutti i membri del gruppo con il loro saldo.',
          create:
            'Invia il link d’invito o il codice QR, o aggiungi per nome qualcuno senza account.',
          edit: 'Esci, o come proprietario togli qualcuno, quando il suo saldo è a posto; un nuovo link ferma il vecchio.',
        },
        expense: {
          see: 'Chi ha pagato, come è stata divisa e la parte di ognuno al centesimo.',
          create: 'Scrivi un commento per gli altri.',
          edit: 'Correggila o eliminala; i saldi seguono.',
        },
        join: {
          see: 'Il gruppo a cui si riferisce questo invito.',
          create: 'Unisciti per vedere le spese e aggiungere le tue; qui l’app è gratuita per te.',
          edit: 'Puoi lasciare il gruppo più tardi in Membri.',
        },
      },
    },
    es: {
      tips: {
        home: {
          see: 'Tus grupos con lo gastado y tu saldo: verde cuando te deben, rojo cuando debes.',
          create: 'Crea un grupo nuevo con nombre, tipo y moneda.',
          edit: 'Abre un grupo para añadir gastos; el dueño cambia el nombre y el tipo en Miembros.',
        },
        group: {
          see: 'Los gastos del grupo, los más nuevos primero; toca uno para ver quién paga qué.',
          create:
            'Añade un gasto: para qué, el importe, quién pagó, el día y todos los que lo comparten.',
          edit: 'Elige cómo se reparte: a partes iguales, por partes, por porcentaje o importes exactos.',
        },
        balances: {
          see: 'Lo que a cada uno le deben o debe, y las transferencias mínimas para quedar en paz.',
          create: 'Paga fuera de la app y márcalo como pagado, o registra un pago de otro importe.',
          edit: 'Borra de la lista un pago anotado por error; los saldos se actualizan al momento.',
        },
        activity: {
          see: 'Cada gasto, cambio, pago, comentario y miembro que entra o sale, con quién y cuándo.',
          create: 'Todo lo que pasa en el grupo aparece aquí solo.',
          edit: 'Abre el gasto de una entrada para corregirlo.',
        },
        stats: {
          see: 'Adónde fue el dinero: por categoría, por mes, y lo que pagó cada uno frente a su parte.',
          create: 'Los números crecen con cada gasto.',
          edit: 'Corrige un gasto en el grupo y las estadísticas lo siguen.',
        },
        members: {
          see: 'Todos los del grupo, con su saldo.',
          create:
            'Envía el enlace de invitación o el código QR, o añade por nombre a alguien sin cuenta.',
          edit: 'Sal, o como dueño quita a alguien, cuando su saldo esté saldado; un enlace nuevo detiene el anterior.',
        },
        expense: {
          see: 'Quién pagó, cómo se repartió y la parte de cada uno al céntimo.',
          create: 'Escribe un comentario para los demás.',
          edit: 'Corrígelo o bórralo; los saldos lo siguen.',
        },
        join: {
          see: 'El grupo al que corresponde esta invitación.',
          create: 'Únete para ver los gastos y añadir los tuyos; aquí la app es gratis para ti.',
          edit: 'Puedes salir del grupo más tarde en Miembros.',
        },
      },
    },
  },
);
