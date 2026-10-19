import { defineMessages } from './define';

/** The payment confirmation email (lib/payment-email.ts). */
export const emails = defineMessages(
  {
    paymentEmail: {
      subject: 'Payment confirmed: {name}, {month}',
      preheader: '{amount} received for your utility bill',
      heading: 'Your payment is confirmed',
      intro:
        'The manager of “{name}” confirmed your payment for {month}. Here is the whole bill and your part of it.',
      extra:
        'You paid {amount} more than your part: it is taken off your next bill of this utility.',
      missing:
        'You paid {amount} less than your part: it is added to your next bill of this utility.',
      settled: 'Your part of this bill is paid in full.',
      pdf: 'The provider’s PDF can be opened on the bill.',
      bill: 'Bill',
      total: 'Bill total',
      billConsumption: 'Consumption on the bill',
      unitPrice: 'Unit price',
      yourConsumption: 'Your consumption',
      yourShare: 'Your share',
      carry: 'From earlier bills',
      credit: '{amount} paid before (taken off)',
      debt: '{amount} missing before (added)',
      due: 'To pay',
      paid: 'Paid',
      button: 'Open the bill',
      footer:
        'You get this email because you share this utility bill in DevQuake’s utility bills app.',
    },
  },
  {
    de: {
      paymentEmail: {
        subject: 'Zahlung bestätigt: {name}, {month}',
        preheader: '{amount} für deine Nebenkostenrechnung erhalten',
        heading: 'Deine Zahlung ist bestätigt',
        intro:
          'Die verwaltende Person von „{name}“ hat deine Zahlung für {month} bestätigt. Hier sind die ganze Rechnung und dein Anteil.',
        extra:
          'Du hast {amount} mehr als deinen Anteil bezahlt: Das wird bei der nächsten Rechnung dieses Versorgers abgezogen.',
        missing:
          'Du hast {amount} weniger als deinen Anteil bezahlt: Das kommt zur nächsten Rechnung dieses Versorgers hinzu.',
        settled: 'Dein Anteil an dieser Rechnung ist vollständig bezahlt.',
        pdf: 'Das PDF des Anbieters kannst du bei der Rechnung öffnen.',
        bill: 'Rechnung',
        total: 'Rechnungsbetrag',
        billConsumption: 'Verbrauch laut Rechnung',
        unitPrice: 'Preis pro Einheit',
        yourConsumption: 'Dein Verbrauch',
        yourShare: 'Dein Anteil',
        carry: 'Aus früheren Rechnungen',
        credit: '{amount} vorher zu viel bezahlt (abgezogen)',
        debt: '{amount} vorher gefehlt (hinzugerechnet)',
        due: 'Zu zahlen',
        paid: 'Bezahlt',
        button: 'Rechnung öffnen',
        footer:
          'Du bekommst diese E-Mail, weil du diese Rechnung in der Nebenkosten-App von DevQuake teilst.',
      },
    },
    ro: {
      paymentEmail: {
        subject: 'Plată confirmată: {name}, {month}',
        preheader: '{amount} primiți pentru factura ta de utilități',
        heading: 'Plata ta este confirmată',
        intro:
          'Administratorul utilității „{name}” ți-a confirmat plata pentru {month}. Iată întreaga factură și partea ta.',
        extra:
          'Ai plătit cu {amount} mai mult decât partea ta: suma se scade din următoarea factură a acestei utilități.',
        missing:
          'Ai plătit cu {amount} mai puțin decât partea ta: suma se adaugă la următoarea factură a acestei utilități.',
        settled: 'Partea ta din această factură este plătită integral.',
        pdf: 'PDF-ul furnizorului poate fi deschis la factură.',
        bill: 'Factura',
        total: 'Totalul facturii',
        billConsumption: 'Consumul de pe factură',
        unitPrice: 'Preț unitar',
        yourConsumption: 'Consumul tău',
        yourShare: 'Partea ta',
        carry: 'Din facturile anterioare',
        credit: '{amount} plătiți în plus înainte (scăzuți)',
        debt: '{amount} lipsă înainte (adăugați)',
        due: 'De plată',
        paid: 'Plătit',
        button: 'Deschide factura',
        footer:
          'Primești acest e-mail pentru că împarți această factură în aplicația de facturi de utilități DevQuake.',
      },
    },
    hu: {
      paymentEmail: {
        subject: 'Fizetés visszaigazolva: {name}, {month}',
        preheader: '{amount} beérkezett a közműszámládra',
        heading: 'A fizetésed vissza van igazolva',
        intro:
          'A(z) „{name}” kezelője visszaigazolta a(z) {month} havi fizetésedet. Itt a teljes számla és a te részed.',
        extra:
          '{amount} összeggel többet fizettél a részednél: ezt levonjuk a közmű következő számlájából.',
        missing:
          '{amount} összeggel kevesebbet fizettél a részednél: ezt hozzáadjuk a közmű következő számlájához.',
        settled: 'A részed ebből a számlából teljesen ki van fizetve.',
        pdf: 'A szolgáltató PDF-je a számlánál nyitható meg.',
        bill: 'Számla',
        total: 'Számla végösszege',
        billConsumption: 'Fogyasztás a számlán',
        unitPrice: 'Egységár',
        yourConsumption: 'A fogyasztásod',
        yourShare: 'A részed',
        carry: 'Korábbi számlákból',
        credit: '{amount} korábbi többlet (levonva)',
        debt: '{amount} korábbi hiány (hozzáadva)',
        due: 'Fizetendő',
        paid: 'Fizetve',
        button: 'Számla megnyitása',
        footer:
          'Azért kapod ezt az e-mailt, mert a DevQuake közműszámla-alkalmazásában osztozol ezen a számlán.',
      },
    },
    it: {
      paymentEmail: {
        subject: 'Pagamento confermato: {name}, {month}',
        preheader: '{amount} ricevuti per la tua bolletta',
        heading: 'Il tuo pagamento è confermato',
        intro:
          'Il gestore di “{name}” ha confermato il tuo pagamento per {month}. Ecco la bolletta completa e la tua parte.',
        extra:
          'Hai pagato {amount} in più della tua parte: verranno scalati dalla prossima bolletta di questa utenza.',
        missing:
          'Hai pagato {amount} in meno della tua parte: verranno aggiunti alla prossima bolletta di questa utenza.',
        settled: 'La tua parte di questa bolletta è pagata per intero.',
        pdf: 'Il PDF del fornitore si può aprire dalla bolletta.',
        bill: 'Bolletta',
        total: 'Totale della bolletta',
        billConsumption: 'Consumo in bolletta',
        unitPrice: 'Prezzo unitario',
        yourConsumption: 'Il tuo consumo',
        yourShare: 'La tua parte',
        carry: 'Da bollette precedenti',
        credit: '{amount} pagati in più prima (scalati)',
        debt: '{amount} mancanti prima (aggiunti)',
        due: 'Da pagare',
        paid: 'Pagato',
        button: 'Apri la bolletta',
        footer:
          'Ricevi questa email perché condividi questa bolletta nell’app delle bollette di DevQuake.',
      },
    },
    es: {
      paymentEmail: {
        subject: 'Pago confirmado: {name}, {month}',
        preheader: '{amount} recibidos por tu factura de suministros',
        heading: 'Tu pago está confirmado',
        intro:
          'El gestor de “{name}” ha confirmado tu pago de {month}. Aquí tienes la factura completa y tu parte.',
        extra:
          'Has pagado {amount} más de tu parte: se descontarán de la próxima factura de este suministro.',
        missing:
          'Has pagado {amount} menos de tu parte: se sumarán a la próxima factura de este suministro.',
        settled: 'Tu parte de esta factura está pagada por completo.',
        pdf: 'El PDF del proveedor se puede abrir desde la factura.',
        bill: 'Factura',
        total: 'Total de la factura',
        billConsumption: 'Consumo en la factura',
        unitPrice: 'Precio unitario',
        yourConsumption: 'Tu consumo',
        yourShare: 'Tu parte',
        carry: 'De facturas anteriores',
        credit: '{amount} pagados de más antes (descontados)',
        debt: '{amount} pendientes de antes (sumados)',
        due: 'A pagar',
        paid: 'Pagado',
        button: 'Abrir la factura',
        footer:
          'Recibes este correo porque compartes esta factura en la app Facturas del hogar de DevQuake.',
      },
    },
  },
);
