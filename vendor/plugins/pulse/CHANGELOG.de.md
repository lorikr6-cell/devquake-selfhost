# Änderungen — Pulse

## 0.6.0

- Pulse läuft jetzt auch auf deinem eigenen Server (DevQuake selbst gehostet): Dort bekommt jedes Mitglied den vollen Plan.

## 0.5.1

- „Zurück“-Links führen jetzt zu der Seite, von der du kamst, mit ihren Filtern und der Stelle, bis zu der du gescrollt hattest.

## 0.5.0

- Die Karte der App auf DevQuake und ihre Startseite zeigen jetzt, wie viele Mitglieder sie nutzen, und ihre Zahlen: API-Dienste, Ereignisse heute.

0.4.1

- Wer die App noch nicht nutzt, sieht jetzt auf ihrer Startseite, was sie kann, mit einem Link zum Benutzerhandbuch, und geteilte Links zeigen das eigene Bild der App.

## 0.4.0

- Live ausprobieren: Öffne die neue Demo in zwei Browsern (mit demselben Konto angemeldet) und sende eine Nachricht oder dein eigenes JSON vom einen zum anderen über die echte Pulse-API. Der andere Browser zeigt, was angekommen ist und wie lange es gedauert hat, vom Absender zum Server, vom Server zum Browser und insgesamt, mit Durchschnitt, schnellstem und langsamstem Wert. Kostenlos in jedem Tarif, auf einem privaten Kanal, den nur du nutzen kannst.

## 0.3.0

- API-Aufrufe werden gezählt: Die Seite deines Dienstes zeigt, wie viele Aufrufe er insgesamt erhalten hat, in Kurzform (etwa 1,2K oder 100K; die genaue Zahl, wenn du darauf zeigst), wie viele abgelehnt wurden, und die letzten Aufrufe mit Antwort und Dauer.
- Für DevQuake-Admins: die Summen aller Dienste, die Größe des Aufrufprotokolls und das Bereinigen des Protokolls jetzt oder automatisch alle 1, 7, 30 oder 90 Tage. Das Bereinigen ändert die Summen nie. Wenn Pulse nicht starten kann, sehen Admins jetzt, welche Einstellung fehlt.

## 0.2.0

- Die App auf den Home-Bildschirm legen: Auf Handys und Tablets legt der neue Knopf in der Werkzeugleiste das Symbol der App (ihr Logo mit dem DevQuake-Abzeichen) auf deinen Home-Bildschirm, sodass sie sich wie eine App öffnet.

## 0.1.0

- Lege API-Dienste an und bekomme einen öffentlichen Schlüssel für deine Webseiten und einen geheimen Schlüssel für deinen Server (einmal angezeigt, nie gespeichert; jederzeit erneuerbar, der alte funktioniert noch 24 Stunden).
- Sende Events mit deinen eigenen Schlüssel-Wert-Daten und empfange sie live in jedem verbundenen Browser, mit Abfragen als Ausweg, wo Live-Verbindungen blockiert sind; neu verbundene Clients holen Verpasstes nach.
- Beschreibe deine eigene Datenstruktur pro Event (Schlüssel, Typen, Pflicht) und lehne auf Wunsch alles andere ab.
- Sicherheit: Der öffentliche Schlüssel funktioniert nur auf Websites, die du per DNS-Eintrag bestätigt hast, der geheime Schlüssel wird in Webseiten abgelehnt und kann an die Adressen deiner Server gebunden werden, private Kanäle brauchen kurzlebige Client-Tokens, und ein Sicherheitsprotokoll warnt dich, wenn ein Schlüssel geteilt zu sein scheint.
- Ein Live-Test, um alles mit zwei Geräten auszuprobieren, Code zum Kopieren und die Nutzung pro Tag. Teste es 24 Stunden kostenlos (absichtlich langsamer) oder abonniere es; frag uns nach vollem Zugang.
