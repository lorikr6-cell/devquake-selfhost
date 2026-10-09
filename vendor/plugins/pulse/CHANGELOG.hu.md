# Változások — Pulse

## 0.6.0

- A Pulse mostantól a saját szervereden is futhat (saját üzemeltetésű DevQuake): ott minden tag a teljes csomagot kapja.

## 0.5.1

- A „Vissza” linkek most arra az oldalra visznek, ahonnan jöttél, a szűrőivel és oda, ameddig görgettél.

## 0.5.0

- Az alkalmazás kártyája a DevQuake-en és a kezdőoldala most megmutatja, hány tag használja, és a számait: API-szolgáltatás, mai esemény.

0.4.1

- Aki még nem használja az alkalmazást, most a kezdőlapján látja, mire jó, a felhasználói kézikönyv linkjével, a megosztott linkek pedig az alkalmazás saját képét mutatják.

## 0.4.0

- Próbáld ki élőben: nyisd meg az új demót két böngészőben (ugyanazzal a fiókkal bejelentkezve), és küldj üzenetet vagy saját JSON-t az egyikből a másikba a valódi Pulse API-n keresztül. A másik böngésző mutatja, mi érkezett és mennyi ideig tartott, a küldőtől a szerverig, a szervertől a böngészőig és összesen, átlaggal, a leggyorsabbal és a leglassabbal. Minden csomagban ingyenes, egy csak általad használható privát csatornán.

## 0.3.0

- Az API-hívásokat számoljuk: a szolgáltatásod oldala megmutatja, összesen hány hívást kapott, rövid formában (például 1,2K vagy 100K; a pontos számot, ha rámutatsz), hányat utasított el, és a legutóbbi hívásokat a válasszal és az időtartammal.
- A DevQuake adminjainak: az összes szolgáltatás összesítése, a hívásnapló mérete, és a napló törlése most vagy automatikusan 1, 7, 30 vagy 90 naponta. A törlés soha nem változtat az összesítéseken. Ha a Pulse nem tud elindulni, az adminok most látják, melyik beállítás hiányzik.

## 0.2.0

- Tedd ki az alkalmazást a kezdőképernyőre: telefonon és táblagépen az eszköztár új gombja kiteszi az alkalmazás ikonját (a logóját a DevQuake-jelvénnyel) a kezdőképernyődre, így alkalmazásként nyílik meg.

## 0.1.0

- Hozz létre API-szolgáltatásokat, és kapj nyilvános kulcsot a weboldalaidhoz, valamint titkos kulcsot a szerveredhez (egyszer látható, soha nem tároljuk; bármikor újat készíthetsz, a régi még 24 óráig működik).
- Küldj eseményeket saját kulcs–érték adatokkal, és fogadd őket élőben minden csatlakozott böngészőben, lekérdezéses tartalékkal ott, ahol az élő kapcsolat tiltott; az újracsatlakozó kliensek pótolják, amit elmulasztottak.
- Írd le a saját adatszerkezetedet eseményenként (kulcsok, típusok, kötelezőség), és ha szeretnéd, utasíts el minden mást.
- Biztonság: a nyilvános kulcs csak DNS-rekorddal igazolt weboldalakon működik, a titkos kulcsot weboldalakban elutasítjuk, és a szervereid címeihez köthető, a privát csatornákhoz rövid életű kliens-tokenek kellenek, és a biztonsági napló figyelmeztet, ha egy kulcs megosztottnak tűnik.
- Élő teszt, hogy két eszközzel mindent kipróbálhass, másolható kód és napi használat. Próbáld ki 24 órán át ingyen (szándékosan lassabban), vagy fizess elő; kérj tőlünk teljes hozzáférést.
