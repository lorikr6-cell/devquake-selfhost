import type { MessagesOf } from '@devquake/ui';
import type { claimsEn } from './claims-en';

export const claimsEs: MessagesOf<typeof claimsEn> = {
  claims: {
    email: {
      subject: 'Algo para ti de DevQuake: {title}',
      heading: 'Tienes algo para canjear',
      how: 'Abre el enlace de abajo, inicia sesión en DevQuake con tu cuenta y escribe este código secreto. Es solo tuyo: no lo compartas.',
      code: 'Tu código secreto: {code}',
      expires: 'Puedes canjearlo en un plazo de {days} días.',
      button: 'Canjear',
    },
    page: {
      title: 'Canjea tu recompensa',
      what: '{title}: {points} puntos NPS de DevQuake',
      signIn:
        'Inicia sesión en DevQuake con la cuenta del miembro para quien se hizo y vuelve a abrir este enlace.',
      signInButton: 'Iniciar sesión',
      notYours: 'Esto se hizo para otro miembro de DevQuake.',
      codeLabel: 'Código secreto del correo',
      submit: 'Canjear',
      wrong: 'El código no es correcto. Intentos restantes: {left}.',
      locked:
        'Demasiados códigos erróneos: el canje está bloqueado. Escribe a DevQuake para que lo reabran.',
      expired: 'Este canje ha caducado.',
      cancelled: 'Este canje fue retirado.',
      claimed: 'Ya se canjeó.',
      done: 'Hecho: se añadieron {points} puntos NPS a tu cuenta de DevQuake.',
      unknown: 'Este enlace no es válido.',
      failed: 'No se pudo canjear ahora. Inténtalo de nuevo más tarde.',
    },
    packages: {
      title: 'Paquetes de puntos NPS',
      intro:
        'Paquetes de puntos NPS de DevQuake que DevQuake da como premios y recompensas mediante canjes. Nunca se muestran en la tienda ni se venden: los puntos NPS no se pueden comprar.',
      name: 'Nombre',
      points: 'Puntos',
      add: 'Añadir el paquete',
      archive: 'Quitar',
      empty: 'Aún no hay paquetes.',
      errorName: 'Dale un nombre de 2 a 120 caracteres.',
      errorPoints: 'Elige de 1 a 100 puntos.',
      saved: 'Guardado.',
      failed: 'No se guardó. Inténtalo de nuevo.',
    },
  },
  errors: {
    packageName: 'Dale un nombre de 2 a 120 caracteres.',
    packagePoints: 'Elige de 1 a 100 puntos.',
  },
  subNav: { packages: 'Paquetes de puntos NPS' },
};
