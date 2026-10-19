import type { PluginAbout } from '@devquake/plugin-sdk';

/** The app's public front page and search engines (ADR 0032), in every language. */
export const about: PluginAbout = {
  category: 'DeveloperApplication',
  description: {
    en: 'A realtime events API: send events from your server or website, and every browser listening to the channel receives them live.',
    de: 'Eine Echtzeit-Event-API: Sende Events von deinem Server oder deiner Website, und jeder Browser im Kanal empfängt sie live.',
    ro: 'Un API de evenimente în timp real: trimite evenimente de pe serverul sau site-ul tău, iar fiecare browser abonat la canal le primește live.',
    hu: 'Valós idejű esemény-API: küldj eseményeket a szerveredről vagy weboldaladról, és a csatornát figyelő minden böngésző élőben megkapja őket.',
    it: 'Un’API di eventi in tempo reale: invia eventi dal tuo server o sito web e ogni browser in ascolto sul canale li riceve dal vivo.',
    es: 'Una API de eventos en tiempo real: envía eventos desde tu servidor o sitio web y cada navegador que escucha el canal los recibe en directo.',
  },
  features: {
    en: [
      'Secret, public and client keys for servers, websites and users',
      'Live delivery with Server-Sent Events, polling as fallback',
      'Describe your events and refuse everything else',
      'Try it live between two browsers',
    ],
    de: [
      'Geheime, öffentliche und Client-Schlüssel für Server, Websites und Nutzer',
      'Live-Zustellung per Server-Sent Events, Polling als Ausweichlösung',
      'Beschreibe deine Events und lehne alles andere ab',
      'Live ausprobieren zwischen zwei Browsern',
    ],
    ro: [
      'Chei secrete, publice și de client pentru servere, site-uri și utilizatori',
      'Livrare live cu Server-Sent Events, polling ca rezervă',
      'Descrie-ți evenimentele și refuză orice altceva',
      'Încearcă-l live între două browsere',
    ],
    hu: [
      'Titkos, nyilvános és kliens kulcsok szerverekhez, weboldalakhoz és felhasználókhoz',
      'Élő kézbesítés Server-Sent Events-szel, tartalékként lekérdezéssel',
      'Írd le az eseményeidet, és utasíts el minden mást',
      'Próbáld ki élőben két böngésző között',
    ],
    it: [
      'Chiavi segrete, pubbliche e client per server, siti web e utenti',
      'Consegna dal vivo con Server-Sent Events, polling come alternativa',
      'Descrivi i tuoi eventi e rifiuta tutto il resto',
      'Provalo dal vivo tra due browser',
    ],
    es: [
      'Claves secretas, públicas y de cliente para servidores, sitios web y usuarios',
      'Entrega en directo con Server-Sent Events, polling como alternativa',
      'Describe tus eventos y rechaza todo lo demás',
      'Pruébalo en directo entre dos navegadores',
    ],
  },
};
