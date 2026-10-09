# Noutăți — Pulse

## 0.6.0

- Pulse poate rula acum pe propriul tău server (DevQuake găzduit de tine): acolo fiecare membru primește planul complet.

## 0.5.1

- Linkurile „Înapoi” te duc acum la pagina de unde ai venit, cu filtrele ei și acolo unde derulaseși.

## 0.5.0

- Cardul aplicației pe DevQuake și pagina ei de start arată acum câți membri o folosesc și totalurile ei: servicii API, evenimente azi.

0.4.1

- Cine nu folosește încă aplicația vede acum pe prima ei pagină ce face, cu un link spre manualul de utilizare, iar linkurile distribuite arată imaginea aplicației.

## 0.4.0

- Încearcă live: deschide noul demo în două browsere (autentificate cu același cont) și trimite un mesaj sau propriul JSON de la unul la altul prin API-ul Pulse real. Celălalt browser arată ce a sosit și cât a durat, de la expeditor la server, de la server la browser și în total, cu media, cel mai rapid și cel mai lent. Gratuit în orice plan, pe un canal privat pe care doar tu îl poți folosi.

## 0.3.0

- Apelurile API sunt numărate: pagina serviciului tău arată câte apeluri a primit în total, în formă scurtă (de exemplu 1,2K sau 100K; numărul exact când îndrepți cursorul spre el), câte au fost refuzate și ultimele apeluri, cu răspunsul și durata lor.
- Pentru administratorii DevQuake: totalurile tuturor serviciilor, mărimea jurnalului de apeluri și curățarea jurnalului acum sau automat la fiecare 1, 7, 30 sau 90 de zile. Curățarea nu schimbă niciodată totalurile. Când Pulse nu poate porni, administratorii văd acum ce setare lipsește.

## 0.2.0

- Adaugă aplicația pe ecranul principal: pe telefoane și tablete, noul buton din bara de instrumente pune pictograma aplicației (sigla ei cu insigna DevQuake) pe ecranul principal, ca să se deschidă ca o aplicație.

## 0.1.0

- Creează servicii API și primește o cheie publică pentru paginile tale web și o cheie secretă pentru serverul tău (afișată o dată, niciodată stocată; o poți reînnoi oricând, cea veche mai merge 24 de ore).
- Trimite evenimente cu propriile date cheie:valoare și primește-le live în fiecare browser conectat, cu interogare ca alternativă unde conexiunile live sunt blocate; clienții reconectați recuperează ce au ratat.
- Descrie propria structură de date pentru fiecare eveniment (chei, tipuri, obligatorii) și, opțional, refuză orice altceva.
- Securitate: cheia publică funcționează doar pe site-urile verificate cu o înregistrare DNS, cheia secretă e refuzată în pagini web și poate fi legată de adresele serverelor tale, canalele private au nevoie de tokenuri de client de scurtă durată, iar un jurnal de securitate te avertizează când o cheie pare partajată.
- Un test live pentru a încerca totul cu două dispozitive, cod gata de copiat și utilizarea pe zile. Încearcă-l gratuit 24 de ore (intenționat mai lent) sau abonează-te; cere-ne acces complet.
