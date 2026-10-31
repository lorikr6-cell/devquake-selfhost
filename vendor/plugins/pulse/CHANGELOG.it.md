# Registro delle modifiche — Pulse

## 0.9.0

- Suggerimenti su ogni pagina: come vedere i dettagli, come aggiungere e come modificare. Attivali o disattivali con 💡 in alto; la scelta resta su questo dispositivo. Nella demo dal vivo sono attivi fin dall’inizio.

## 0.8.0

- L’app ora è anche in italiano e in spagnolo: scegli la lingua in alto nella pagina.

## 0.7.0

- Le app di DevQuake ricevono ora i loro aggiornamenti dal vivo tramite Pulse. I tuoi servizi, il tuo piano e i tuoi limiti restano come sono; le connessioni dal vivo restano disponibili per loro come prima.

## 0.6.0

- Pulse ora può funzionare anche sul tuo server (DevQuake self-hosted): lì ogni membro ha il piano completo.

## 0.5.1

- I link “Indietro” ora riportano alla pagina da cui arrivavi, con i suoi filtri e il punto in cui eri arrivato scorrendo.

## 0.5.0

- La scheda dell’app su DevQuake e la sua pagina iniziale ora mostrano quanti membri la usano e i suoi totali: servizi API, eventi di oggi.

## 0.4.1

- Chi non usa ancora l’app ora vede cosa fa nella sua pagina iniziale, con un link al manuale d’uso, e i link condivisi mostrano l’immagine dell’app.

## 0.4.0

- Provalo dal vivo: apri la nuova demo in due browser (con lo stesso account) e invia un messaggio o il tuo JSON dall’uno all’altro tramite la vera API di Pulse. L’altro browser mostra cosa è arrivato e quanto ci è voluto, dal mittente al server, dal server al browser e in totale, con la media, il più veloce e il più lento. Gratis con ogni piano, su un canale privato che puoi usare solo tu.

## 0.3.0

- Le chiamate API vengono contate: la pagina del tuo servizio mostra quante chiamate ha ricevuto in totale, in forma breve (come 1.2K o 100K; il numero esatto quando ci passi sopra), quante sono state rifiutate e le ultime chiamate con la risposta e il tempo impiegato.
- Per gli amministratori di DevQuake: i totali di tutti i servizi, la dimensione del registro delle chiamate e la pulizia del registro subito o automaticamente ogni 1, 7, 30 o 90 giorni. Pulire il registro non cambia mai i totali. Quando Pulse non riesce ad avviarsi, gli amministratori ora vedono quale impostazione manca.

## 0.2.0

- Aggiungi l’app alla schermata Home: su telefoni e tablet, il nuovo pulsante nella barra degli strumenti mette l’icona dell’app (il suo logo con il badge DevQuake) nella schermata Home, così si apre come un’app.

## 0.1.0

- Crea servizi API e ottieni una chiave pubblica per le tue pagine web e una chiave segreta per il tuo server (mostrata una volta, mai salvata; creane una nuova quando vuoi, la vecchia continua a funzionare per 24 ore).
- Invia eventi con i tuoi dati chiave:valore e ricevili dal vivo in ogni browser connesso, con il polling come alternativa dove le connessioni dal vivo sono bloccate; i client che si riconnettono recuperano ciò che si sono persi.
- Descrivi la tua struttura dati per ogni evento (chiavi, tipi, obbligatorie) e, se vuoi, rifiuta tutto il resto.
- Sicurezza: la chiave pubblica funziona solo sui siti web che hai verificato con un record DNS, la chiave segreta viene rifiutata nelle pagine web e può essere legata agli indirizzi dei tuoi server, i canali privati richiedono token client di breve durata e un registro di sicurezza ti avvisa quando una chiave sembra condivisa.
- Un test dal vivo per provare tutto con due dispositivi, codice pronto da copiare e utilizzo giornaliero. Provalo gratis per 24 ore (più lento di proposito) o abbonati; chiedici l’accesso completo.
