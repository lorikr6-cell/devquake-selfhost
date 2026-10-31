import type { PluginAbout } from '@devquake/plugin-sdk';

/**
 * The app's public front page and search engines (ADR 0032): what visitors who may not use it
 * yet see on its subdomain, in every language (at most 160 characters each).
 */
export const about: PluginAbout = {
  category: 'BusinessApplication',
  description: {
    en: 'Run a café, bistro or bar: menu, tables, orders and stock. Guests scan the table’s QR for the menu; waiters use the phone app.',
    de: 'Führe Café, Bistro oder Bar: Karte, Tische, Bestellungen, Lager. Gäste scannen den QR am Tisch; die Bedienung nutzt die Handy-App.',
    ro: 'Condu o cafenea, un bistro sau un bar: meniu, mese, comenzi, stoc. Oaspeții scanează QR-ul mesei; ospătarii folosesc aplicația.',
    hu: 'Vezesd a kávézód, bisztród vagy bárod: étlap, asztalok, rendelések, készlet. A vendég az asztal QR-jét olvassa be, a pincér appot használ.',
    it: 'Gestisci caffè, bistrot o bar: menu, tavoli, ordini e magazzino. Gli ospiti scansionano il QR del tavolo; i camerieri usano l’app.',
    es: 'Gestiona cafetería, bistró o bar: carta, mesas, pedidos y existencias. Los clientes escanean el QR de la mesa; los camareros usan la app.',
  },
  features: {
    en: [
      'Guests need no app: the QR sticker on their table shows the menu and calls the waiter',
      'Waiters’ app for Android and iPhone: tables, orders and guests’ calls as notifications',
      'A menu with VAT and the 14 allergens; stock with recipes takes sold-out items off on its own',
      'Kitchen, bar and coffee screens, bills with tips, and reports',
      'The owner runs it on the website or in the Windows app',
    ],
    de: [
      'Gäste brauchen keine App: Der QR-Aufkleber am Tisch zeigt die Karte und ruft die Bedienung',
      'App für die Bedienung auf Android und iPhone: Tische, Bestellungen und Rufe als Benachrichtigung',
      'Eine Karte mit MwSt. und den 14 Allergenen; das Lager mit Rezepten nimmt Ausverkauftes von selbst raus',
      'Bildschirme für Küche, Bar und Kaffee, Belege mit Trinkgeld und Berichte',
      'Der Inhaber führt alles auf der Website oder in der Windows-App',
    ],
    ro: [
      'Oaspeții nu au nevoie de aplicație: autocolantul QR de pe masă arată meniul și cheamă ospătarul',
      'Aplicația ospătarilor pentru Android și iPhone: mese, comenzi și chemările oaspeților ca notificări',
      'Un meniu cu TVA și cei 14 alergeni; stocul cu rețete scoate singur ce s-a terminat',
      'Ecrane pentru bucătărie, bar și cafea, note cu bacșiș și rapoarte',
      'Proprietarul administrează totul pe site sau în aplicația pentru Windows',
    ],
    hu: [
      'A vendégeknek nem kell alkalmazás: az asztal QR-matricája mutatja az étlapot és hívja a pincért',
      'Pincéralkalmazás Androidra és iPhone-ra: asztalok, rendelések és a vendégek hívásai értesítésként',
      'Étlap áfával és a 14 allergénnel; a receptes készlet magától leveszi az elfogyott tételeket',
      'Konyhai, pult- és kávékijelzők, számlák borravalóval és jelentések',
      'A tulajdonos a weboldalon vagy a Windows-alkalmazásban kezeli',
    ],
    it: [
      'Agli ospiti non serve un’app: l’adesivo QR sul tavolo mostra il menu e chiama il cameriere',
      'App per camerieri su Android e iPhone: tavoli, ordini e chiamate degli ospiti come notifiche',
      'Un menu con IVA e i 14 allergeni; il magazzino con ricette toglie da solo ciò che è finito',
      'Schermi per cucina, bar e caffè, conti con mance e report',
      'Il titolare gestisce tutto sul sito o nell’app per Windows',
    ],
    es: [
      'Los clientes no necesitan app: la pegatina QR de su mesa muestra la carta y llama al camarero',
      'App para camareros en Android e iPhone: mesas, pedidos y llamadas de clientes como notificaciones',
      'Una carta con IVA y los 14 alérgenos; las existencias con recetas retiran solas lo agotado',
      'Pantallas de cocina, barra y café, cuentas con propina e informes',
      'El dueño lo gestiona en la web o en la app de Windows',
    ],
  },
};
