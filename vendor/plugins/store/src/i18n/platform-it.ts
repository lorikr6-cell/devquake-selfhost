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
