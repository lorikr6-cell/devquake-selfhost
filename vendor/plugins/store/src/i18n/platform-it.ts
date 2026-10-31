import type { MessagesOf } from '@devquake/ui';
import type { platformEn } from './platform-en';

export const platformIt: MessagesOf<typeof platformEn> = {
  account: {
    connectTitle: 'Sei già su DevQuake?',
    connectBody:
      'Continua come {name}: il tuo account qui viene compilato dal tuo profilo DevQuake (nome e indirizzo email; DevQuake te lo chiede una volta). Gli ordini fatti con quell’indirizzo compaiono qui.',
    connect: 'Continua con DevQuake',
    orEmail: 'Oppure accedi con un indirizzo email qualsiasi',
    linked: 'Collegato al tuo account DevQuake.',
    devquakeTitle: 'Dal tuo account DevQuake',
    devquakeName: 'Nome',
    devquakeEmail: 'Email',
    manageOnDevQuake: 'Modifica su DevQuake',
    statFavorites: 'Preferiti',
    statPurchases: 'Acquisti',
    statCart: 'Nel carrello',
    memberPrivacyNote:
      'Il tuo nome e il tuo indirizzo email vengono dal tuo account DevQuake. Questo negozio conserva i tuoi dati di consegna, i tuoi messaggi e i tuoi ordini (come richiede la legge); eliminando l’account qui si cancella tutto tranne gli ordini.',
    deliveryTitle: 'Dati di consegna',
    deliveryHint: 'Salvati nel tuo account qui, compilano il checkout al posto tuo.',
    phone: 'Telefono',
    addressLine: 'Via e numero civico',
    city: 'Città',
    postalCode: 'CAP',
    country: 'Paese',
    noCountry: 'Non impostato',
    saveDetails: 'Salva i dati',
    detailsSaved: 'Dati salvati',
  },
  checkout: {
    remember: 'Salva questi dati di consegna nel mio account',
    filledIn: 'Compilato dal tuo account.',
  },
  shop: {
    theme: { label: 'Tema', adaptive: 'Automatico', light: 'Chiaro', dark: 'Scuro' },
    currency: 'Valuta',
    newsletterToggle: 'Inviami la newsletter di questo negozio',
    newsletterToggleHint: 'A {email}. Togli la spunta per interromperla quando vuoi.',
    newsletterOn: 'Newsletter attivata.',
    newsletterOff: 'Newsletter disattivata.',
    newsletterFailed: 'Non è stato possibile salvare l’impostazione della newsletter. Riprova.',
    fxNote:
      'I prezzi in {currency} sono indicativi, ai tassi della Banca centrale europea del {date}. Paghi in {base}; la conversione la fa la tua banca o la tua carta.',
  },
  artPromo: {
    logoText: 'galleria d’{art}',
    logoArt: 'arte',
    title: 'Arte dalla galleria d’arte DevQuake',
    body: 'I membri di DevQuake mostrano la loro arte digitale nella galleria d’arte DevQuake, ogni opera con l’idea che la ispira. Col tempo, alcune delle opere più apprezzate potranno apparire anche qui, come decorazioni per prodotti DevQuake selezionati.',
    consent:
      'Solo con il consenso dell’artista: un’opera viene presa in considerazione solo se il suo artista ha acconsentito, e DevQuake sceglie tra le più apprezzate.',
    copyright:
      'L’artista conserva il diritto d’autore. DevQuake riceve solo il diritto di stampare la decorazione sui prodotti interessati, per il tempo concordato.',
    share:
      'Gli artisti le cui decorazioni vengono vendute possono ricevere una parte dei ricavi, alle condizioni concordate con loro in anticipo.',
    credit: 'Ogni prodotto indica il suo artista e porta il nome DevQuake.',
    visit: 'Visita la galleria d’arte',
    show: 'Mostra la tua arte',
    note: 'Le decorazioni sui prodotti e un’eventuale parte dei ricavi sono soggette a condizioni separate concordate con ciascun artista; non costituiscono una promessa di vendite o guadagni.',
  },
  promo: {
    title: 'Fatto da DevQuake',
    body: 'Questo negozio appartiene a DevQuake, il laboratorio di uno sviluppatore con app web per i problemi di tutti i giorni. Un solo account gratuito ti fa accedere a tutte, e a questo negozio.',
    apps: 'App per spese condivise, la casa, i CV, i club di freccette e altro',
    ideas: 'Proponi e vota la prossima app',
    selfHost: 'Diverse app funzionano anche sul tuo server, open source',
    join: 'Iscriviti gratis a DevQuake',
    explore: 'Scopri le app',
  },
  errors: {
    shopsClosed: 'Qui solo gli amministratori del sito possono aprire un negozio.',
  },
};
