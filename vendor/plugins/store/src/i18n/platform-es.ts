import type { MessagesOf } from '@devquake/ui';
import type { platformEn } from './platform-en';

export const platformEs: MessagesOf<typeof platformEn> = {
  account: {
    connectTitle: '¿Ya estás en DevQuake?',
    connectBody:
      'Continúa como {name}: tu cuenta aquí se rellena con tu perfil de DevQuake (tu nombre y tu email; DevQuake te lo pregunta una vez). Los pedidos hechos con esa dirección aparecen aquí.',
    connect: 'Continuar con DevQuake',
    orEmail: 'O inicia sesión con cualquier dirección de email',
    linked: 'Conectado con tu cuenta de DevQuake.',
    devquakeTitle: 'De tu cuenta de DevQuake',
    devquakeName: 'Nombre',
    devquakeEmail: 'Email',
    manageOnDevQuake: 'Cambiar en DevQuake',
    statFavorites: 'Favoritos',
    statPurchases: 'Compras',
    statCart: 'En el carrito',
    memberPrivacyNote:
      'Tu nombre y tu email vienen de tu cuenta de DevQuake. Esta tienda guarda tus datos de entrega, tus mensajes y tus pedidos (como exige la ley); al eliminar la cuenta aquí se borra todo menos los pedidos.',
    deliveryTitle: 'Datos de entrega',
    deliveryHint: 'Guardados en tu cuenta aquí, rellenan el pago por ti.',
    phone: 'Teléfono',
    addressLine: 'Calle y número',
    city: 'Ciudad',
    postalCode: 'Código postal',
    country: 'País',
    noCountry: 'Sin indicar',
    saveDetails: 'Guardar datos',
    detailsSaved: 'Datos guardados',
  },
  checkout: {
    remember: 'Guardar estos datos de entrega en mi cuenta',
    filledIn: 'Rellenado con tu cuenta.',
  },
  shop: {
    theme: { label: 'Tema', adaptive: 'Automático', light: 'Claro', dark: 'Oscuro' },
    currency: 'Moneda',
    newsletterToggle: 'Enviarme la newsletter de esta tienda',
    newsletterToggleHint: 'A {email}. Desmárcalo para dejar de recibirla cuando quieras.',
    newsletterOn: 'Newsletter activada.',
    newsletterOff: 'Newsletter desactivada.',
    newsletterFailed: 'No se ha podido guardar el ajuste de la newsletter. Inténtalo de nuevo.',
    fxNote:
      'Los precios en {currency} son aproximados, al cambio del Banco Central Europeo del {date}. Pagas en {base}; tu banco o tu tarjeta hacen la conversión.',
  },
  promo: {
    title: 'Hecho por DevQuake',
    body: 'Esta tienda pertenece a DevQuake, el taller de un desarrollador con apps web para problemas del día a día. Una sola cuenta gratuita te da acceso a todas, y a esta tienda.',
    apps: 'Apps para gastos compartidos, el hogar, currículums, clubes de dardos y más',
    ideas: 'Propón y vota la próxima app',
    selfHost: 'Varias apps también funcionan en tu propio servidor, de código abierto',
    join: 'Únete gratis a DevQuake',
    explore: 'Descubre las apps',
  },
  errors: {
    shopsClosed: 'Aquí solo los administradores del sitio pueden abrir una tienda.',
  },
};
