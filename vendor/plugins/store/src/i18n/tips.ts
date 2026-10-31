import { defineMessages } from './define';

/** Which page shows which tips (tips.<key>), matched by the address (PageTips, @devquake/ui). */
export const TIPS_PAGES: Record<string, string> = {
  '/': 'overview',
  '/products': 'products',
  '/products/new': 'product',
  '/products/types': 'types',
  '/products/:id': 'product',
  '/vendors': 'vendors',
  '/packages': 'packages',
  '/claim/:token': 'claim',
  '/orders': 'orders',
  '/orders/:id': 'order',
  '/messages': 'messages',
  '/messages/:id': 'message',
  '/customers': 'customers',
  '/customers/:key': 'customer',
  '/reviews': 'reviews',
  '/marketing': 'marketing',
  '/newsletters': 'newsletters',
  '/newsletters/new': 'newsletter',
  '/newsletters/:id': 'newsletter',
  '/stats': 'stats',
  '/settings': 'settings',
  '/settings/payments': 'payments',
  '/settings/shipping': 'shipping',
  '/settings/design': 'design',
  '/settings/seo': 'seo',
  '/settings/languages': 'languages',
  '/team': 'team',
  '/join/:code': 'join',
  '/s/:slug': 'shop',
  '/s/:slug/p/:product': 'shopProduct',
  '/s/:slug/cart': 'cart',
  '/s/:slug/checkout': 'checkout',
  '/s/:slug/orders/:code': 'shopOrder',
  '/s/:slug/info': 'info',
  '/s/:slug/compare': 'compare',
  '/s/:slug/favorites': 'favorites',
  '/s/:slug/account': 'account',
  '/s/:slug/account/messages/:id': 'thread',
  '/s/:slug/newsletter': 'shopNewsletter',
};

/** How-to tips for each page: how to see the details, how to add, how to change. */
export const tips = defineMessages(
  {
    tips: {
      overview: {
        see: 'The checklist to open the shop, and the tasks of your roles: orders to ship, messages, reviews and low stock.',
        create: 'Without a shop yet, give it a name, the currency and the VAT rate to make it.',
        edit: 'Follow the checklist; open the shop or end maintenance mode from here.',
      },
      products: {
        see: 'Every product with its status, price and stock; search and filter by type, vendor and status.',
        create: '“New product” adds one; “Copy” makes a draft from an existing product.',
        edit: 'Click a product to change it, or tick several to put them on sale, make them drafts or delete them.',
      },
      product: {
        see: 'The product’s texts, photos, options with price, code and stock, sale price and search preview.',
        create: 'Add up to eight photos and an option for each size or colour.',
        edit: 'Change anything and save; drafts are seen only by you, and a product can be shared or get a QR code.',
      },
      types: {
        see: 'Each kind of product with its own fields, such as a phone’s memory or a book’s author.',
        create: 'Start from a ready-made type or make your own, then add its fields.',
        edit: 'Change or remove a field; products of the type show the change.',
      },
      packages: {
        see: 'The NPS point packages DevQuake gives as prizes and rewards; never shown in the shop.',
        create: 'Add a package with a name and 1 to 100 points.',
        edit: 'Remove a package; claims already made keep its name and points.',
      },
      claim: {
        see: 'What you can claim and how many NPS points it gives.',
        create: 'Sign in to DevQuake as yourself, then type the secret code from the email.',
        edit: 'Five wrong codes lock the claim; write to DevQuake to have it reopened.',
      },
      vendors: {
        see: 'Who makes or supplies your products, with their contacts.',
        create:
          'Add a vendor; mark it as a brand to show it on its products and in search engines.',
        edit: 'Change a vendor’s details or remove it.',
      },
      orders: {
        see: 'Every order with its state, buyer and total, newest first.',
        create: 'Orders come in from the shop by themselves; you get an email for each new one.',
        edit: 'Open an order to mark it paid, shipped or delivered.',
      },
      order: {
        see: 'The buyer, address, items and payment of one order.',
        create: 'Add the courier and the tracking number; the buyer’s page links to the parcel.',
        edit: 'Mark it paid, shipped and delivered, or cancel it: the stock comes back, refunds are up to you.',
      },
      messages: {
        see: 'Messages buyers wrote from their account, unanswered first.',
        create: 'Messages arrive by themselves; you get an email for each new one.',
        edit: 'Open a conversation to answer it.',
      },
      message: {
        see: 'One conversation with a buyer, with their orders.',
        create: 'Write your answer; the buyer gets it by email.',
        edit: 'Messages that were sent cannot be changed.',
      },
      customers: {
        see: 'Everyone who ordered or has an account, with their orders and what they spent.',
        create: 'Customers are added when they order or open an account.',
        edit: 'Open a customer to see their orders and messages.',
      },
      customer: {
        see: 'One customer’s details, orders, messages and newsletter choice.',
        create: 'Write to them from their messages.',
        edit: 'Their details are changed by the buyer in their account.',
      },
      reviews: {
        see: 'Buyers’ reviews of what they bought, waiting first.',
        create: 'Choose whether you approve every review or let verified buyers publish at once.',
        edit: 'Publish, hide, answer or delete each review.',
      },
      marketing: {
        see: 'Campaigns, vouchers, announcements and automatic discounts.',
        create:
          'Add a campaign, a voucher code, an announcement bar or banner, or a promotion rule.',
        edit: 'Change dates, amounts or limits, or end one early.',
      },
      newsletters: {
        see: 'Your newsletters, drafts and sent, with how many subscribers they reached.',
        create: 'Write a new newsletter.',
        edit: 'Open a draft to change it, test it and send it.',
      },
      newsletter: {
        see: 'The newsletter as it looks on a computer and a phone.',
        create: 'Write a subject and a text, add a voucher and pick products on offer or new.',
        edit: 'Save to see the preview, send yourself a test, then send it to every subscriber.',
      },
      stats: {
        see: 'Sales, orders, the average order, views and conversion, compared with the period before.',
        create: 'The numbers grow with every visit and order.',
        edit: 'Choose 7, 30, 90 or 365 days; see interest votes for products that ask for votes.',
      },
      settings: {
        see: 'The shop’s name, address, currency, VAT, seller details, terms and maintenance mode.',
        create:
          'Fill in who sells and your terms of sale and returns; the shop shows them to buyers.',
        edit: 'Change and save; open or close the shop, or switch on maintenance mode with a message.',
      },
      payments: {
        see: 'The payment methods: card (Stripe), PayPal, bank transfer and cash on delivery.',
        create:
          'Turn on a method and paste its keys or your bank details; secret keys are stored encrypted.',
        edit: 'Turn a method off or replace its keys; keys are never shown again.',
      },
      shipping: {
        see: 'Your shipping zones with their countries, rates and free shipping amounts.',
        create: 'Add a zone for each group of countries; “Everywhere else” covers the rest.',
        edit: 'Change a zone’s rate or countries, or remove it.',
      },
      design: {
        see: 'The shop’s logo, banner, colours, fonts, corners, cards and products per row, with a preview.',
        create: 'Add your logo and a banner.',
        edit: 'Change the design and save; the editor warns when text is hard to read.',
      },
      seo: {
        see: 'The shop’s title and description for search engines, with a preview and a score per product.',
        create: 'The owner adds tracking (Analytics, Ads, Meta pixel) and verification codes.',
        edit: 'Change the texts and follow the tips for each product.',
      },
      languages: {
        see: 'The languages buyers can choose and the labels of each.',
        create:
          'Copy the labels, translate them, and paste them back with a language code and name.',
        edit: 'Paste changed labels again to correct them; choose the language buyers see first.',
      },
      team: {
        see: 'Your team with their roles, and the open invitations.',
        create: 'Make an invitation link with one or more roles and send it.',
        edit: 'Change a member’s roles or remove them; revoke an open invitation.',
      },
      join: {
        see: 'The shop team this invitation is for, and your roles.',
        create: 'Join to work on the shop with those roles.',
        edit: 'The shop’s owner can change your roles later.',
      },
      shop: {
        see: 'The shop’s products by category, with prices, campaigns and sales.',
        create: 'Open a product to add it to the cart; no account is needed.',
        edit: 'Search, choose a category, or change the language and currency at the bottom.',
      },
      shopProduct: {
        see: 'The product’s photos, description, options, price and reviews.',
        create: 'Choose an option and add it to the cart, or to your favourites or the comparison.',
        edit: 'Change the option or quantity before adding it; share the product or scan its QR code.',
      },
      cart: {
        see: 'What you are buying, the discounts and what is still missing for the next one.',
        create: 'Go to the checkout when you are ready.',
        edit: 'Change a quantity or remove a product; the cart is kept in this browser.',
      },
      checkout: {
        see: 'The order’s total with shipping and discounts.',
        create: 'Fill in your address, a voucher code if you have one, and choose how to pay.',
        edit: 'Change the address or payment method before you order.',
      },
      shopOrder: {
        see: 'Your order’s state, how to pay and the parcel’s tracking.',
        create: 'Once it is on its way, rate what you bought.',
        edit: 'Keep this link: it is the way back to your order.',
      },
      info: {
        see: 'Who sells, the terms of sale and the returns.',
        create: 'Write to the seller from your account.',
        edit: 'Only the seller can change these details.',
      },
      compare: {
        see: 'The products you chose side by side.',
        create: 'Add products to compare from their pages.',
        edit: 'Remove a product from the comparison.',
      },
      favorites: {
        see: 'The products you saved in this shop.',
        create: 'Add a favourite from a product’s page.',
        edit: 'Remove a product from your favourites.',
      },
      account: {
        see: 'Your orders, messages and newsletter choice in this shop.',
        create: 'Sign in with a link sent to your email; write to the seller.',
        edit: 'Change your saved delivery details or the newsletter.',
      },
      thread: {
        see: 'One conversation with the seller.',
        create: 'Write a message; you get the answer by email.',
        edit: 'Messages that were sent cannot be changed.',
      },
      shopNewsletter: {
        see: 'What the shop’s newsletter brings: offers and new products.',
        create: 'Subscribe with your email and confirm with the link you receive.',
        edit: 'Every newsletter has a link to unsubscribe.',
      },
    },
  },
  {
    de: {
      tips: {
        overview: {
          see: 'Die Checkliste zum Öffnen des Shops und die Aufgaben deiner Rollen: Versand, Nachrichten, Bewertungen und niedriger Bestand.',
          create:
            'Ohne Shop gibst du einen Namen, die Währung und den MwSt.-Satz ein, um ihn anzulegen.',
          edit: 'Folge der Checkliste; öffne den Shop oder beende hier den Wartungsmodus.',
        },
        products: {
          see: 'Jedes Produkt mit Status, Preis und Bestand; suche und filtere nach Typ, Hersteller und Status.',
          create:
            '„Neues Produkt“ fügt eines hinzu; „Kopieren“ macht einen Entwurf aus einem bestehenden.',
          edit: 'Klicke auf ein Produkt, um es zu ändern, oder hake mehrere an, um sie anzubieten, zu Entwürfen zu machen oder zu löschen.',
        },
        product: {
          see: 'Texte, Fotos, Optionen mit Preis, Code und Bestand, Angebotspreis und Suchvorschau des Produkts.',
          create: 'Füge bis zu acht Fotos und eine Option je Größe oder Farbe hinzu.',
          edit: 'Ändere etwas und speichere; Entwürfe siehst nur du, und ein Produkt lässt sich teilen oder als QR-Code ausgeben.',
        },
        types: {
          see: 'Jede Produktart mit eigenen Feldern, etwa der Speicher eines Telefons oder der Autor eines Buchs.',
          create: 'Beginne mit einem fertigen Typ oder einem eigenen, und füge seine Felder hinzu.',
          edit: 'Ändere oder entferne ein Feld; die Produkte des Typs zeigen die Änderung.',
        },
        packages: {
          see: 'Die NPS-Punktepakete, die DevQuake als Preise und Belohnungen vergibt; nie im Shop sichtbar.',
          create: 'Füge ein Paket mit Namen und 1 bis 100 Punkten hinzu.',
          edit: 'Entferne ein Paket; bereits erstellte Einlösungen behalten Namen und Punkte.',
        },
        claim: {
          see: 'Was du einlösen kannst und wie viele NPS-Punkte es bringt.',
          create:
            'Melde dich als du selbst bei DevQuake an und gib den geheimen Code aus der E-Mail ein.',
          edit: 'Fünf falsche Codes sperren die Einlösung; schreib DevQuake, damit sie wieder geöffnet wird.',
        },
        vendors: {
          see: 'Wer deine Produkte herstellt oder liefert, mit Kontakten.',
          create:
            'Füge einen Hersteller hinzu; als Marke erscheint er bei seinen Produkten und in Suchmaschinen.',
          edit: 'Ändere die Angaben eines Herstellers oder entferne ihn.',
        },
        orders: {
          see: 'Jede Bestellung mit Stand, Käufer und Summe, neueste zuerst.',
          create:
            'Bestellungen kommen von selbst aus dem Shop; zu jeder neuen bekommst du eine E-Mail.',
          edit: 'Öffne eine Bestellung, um sie als bezahlt, versandt oder zugestellt zu markieren.',
        },
        order: {
          see: 'Käufer, Adresse, Artikel und Zahlung einer Bestellung.',
          create:
            'Trage Versanddienst und Sendungsnummer ein; die Seite des Käufers verlinkt das Paket.',
          edit: 'Markiere sie als bezahlt, versandt und zugestellt, oder storniere: der Bestand kommt zurück, Erstattungen machst du selbst.',
        },
        messages: {
          see: 'Nachrichten, die Käufer aus ihrem Konto geschrieben haben, unbeantwortete zuerst.',
          create: 'Nachrichten kommen von selbst; zu jeder neuen bekommst du eine E-Mail.',
          edit: 'Öffne ein Gespräch, um zu antworten.',
        },
        message: {
          see: 'Ein Gespräch mit einem Käufer, mit seinen Bestellungen.',
          create: 'Schreibe deine Antwort; der Käufer bekommt sie per E-Mail.',
          edit: 'Gesendete Nachrichten lassen sich nicht ändern.',
        },
        customers: {
          see: 'Alle, die bestellt oder ein Konto haben, mit Bestellungen und Umsatz.',
          create: 'Kunden kommen dazu, wenn sie bestellen oder ein Konto eröffnen.',
          edit: 'Öffne einen Kunden, um Bestellungen und Nachrichten zu sehen.',
        },
        customer: {
          see: 'Angaben, Bestellungen, Nachrichten und Newsletter-Wahl eines Kunden.',
          create: 'Schreibe ihm über seine Nachrichten.',
          edit: 'Seine Angaben ändert der Käufer in seinem Konto.',
        },
        reviews: {
          see: 'Bewertungen der Käufer zu dem, was sie gekauft haben, wartende zuerst.',
          create:
            'Wähle, ob du jede Bewertung freigibst oder verifizierte Käufer sofort veröffentlichen.',
          edit: 'Veröffentliche, verstecke, beantworte oder lösche jede Bewertung.',
        },
        marketing: {
          see: 'Aktionen, Gutscheine, Ankündigungen und automatische Rabatte.',
          create:
            'Füge eine Aktion, einen Gutscheincode, eine Ankündigungsleiste oder ein Banner, oder eine Rabattregel hinzu.',
          edit: 'Ändere Daten, Beträge oder Grenzen, oder beende eine früher.',
        },
        newsletters: {
          see: 'Deine Newsletter, Entwürfe und gesendete, mit der Zahl erreichter Abonnenten.',
          create: 'Schreibe einen neuen Newsletter.',
          edit: 'Öffne einen Entwurf, um ihn zu ändern, zu testen und zu senden.',
        },
        newsletter: {
          see: 'Der Newsletter, wie er auf Computer und Telefon aussieht.',
          create:
            'Schreibe Betreff und Text, füge einen Gutschein hinzu und wähle Angebote oder neue Produkte.',
          edit: 'Speichere für die Vorschau, sende dir einen Test, dann an alle Abonnenten.',
        },
        stats: {
          see: 'Umsatz, Bestellungen, Durchschnittsbestellung, Aufrufe und Konversion, verglichen mit dem Zeitraum davor.',
          create: 'Die Zahlen wachsen mit jedem Besuch und jeder Bestellung.',
          edit: 'Wähle 7, 30, 90 oder 365 Tage; sieh Interessenstimmen für Produkte, die Stimmen sammeln.',
        },
        settings: {
          see: 'Name, Adresse, Währung, MwSt., Verkäuferangaben, Bedingungen und Wartungsmodus des Shops.',
          create:
            'Gib an, wer verkauft, und deine Verkaufs- und Rückgabebedingungen; der Shop zeigt sie Käufern.',
          edit: 'Ändere und speichere; öffne oder schließe den Shop, oder schalte den Wartungsmodus mit einer Nachricht ein.',
        },
        payments: {
          see: 'Die Zahlarten: Karte (Stripe), PayPal, Überweisung und Nachnahme.',
          create:
            'Schalte eine Zahlart ein und füge ihre Schlüssel oder deine Bankdaten ein; geheime Schlüssel werden verschlüsselt gespeichert.',
          edit: 'Schalte eine Zahlart aus oder ersetze ihre Schlüssel; Schlüssel werden nie wieder gezeigt.',
        },
        shipping: {
          see: 'Deine Versandzonen mit Ländern, Preisen und Beträgen für kostenlosen Versand.',
          create: 'Füge für jede Ländergruppe eine Zone hinzu; „Überall sonst“ deckt den Rest ab.',
          edit: 'Ändere Preis oder Länder einer Zone, oder entferne sie.',
        },
        design: {
          see: 'Logo, Banner, Farben, Schriften, Ecken, Karten und Produkte pro Reihe des Shops, mit Vorschau.',
          create: 'Füge dein Logo und ein Banner hinzu.',
          edit: 'Ändere das Design und speichere; der Editor warnt, wenn Text schwer lesbar ist.',
        },
        seo: {
          see: 'Titel und Beschreibung des Shops für Suchmaschinen, mit Vorschau und einer Bewertung je Produkt.',
          create:
            'Der Besitzer fügt Tracking (Analytics, Ads, Meta-Pixel) und Verifizierungscodes hinzu.',
          edit: 'Ändere die Texte und folge den Tipps zu jedem Produkt.',
        },
        languages: {
          see: 'Die Sprachen, die Käufer wählen können, und die Beschriftungen jeder Sprache.',
          create:
            'Kopiere die Beschriftungen, übersetze sie und füge sie mit Sprachcode und Namen wieder ein.',
          edit: 'Füge geänderte Beschriftungen erneut ein, um sie zu korrigieren; wähle die Sprache, die Käufer zuerst sehen.',
        },
        team: {
          see: 'Dein Team mit Rollen und die offenen Einladungen.',
          create: 'Erstelle einen Einladungslink mit einer oder mehreren Rollen und sende ihn.',
          edit: 'Ändere die Rollen eines Mitglieds oder entferne es; widerrufe eine offene Einladung.',
        },
        join: {
          see: 'Das Shop-Team, für das diese Einladung gilt, und deine Rollen.',
          create: 'Tritt bei, um mit diesen Rollen am Shop zu arbeiten.',
          edit: 'Der Besitzer des Shops kann deine Rollen später ändern.',
        },
        shop: {
          see: 'Die Produkte des Shops nach Kategorie, mit Preisen, Aktionen und Angeboten.',
          create: 'Öffne ein Produkt, um es in den Warenkorb zu legen; ein Konto ist nicht nötig.',
          edit: 'Suche, wähle eine Kategorie, oder ändere unten Sprache und Währung.',
        },
        shopProduct: {
          see: 'Fotos, Beschreibung, Optionen, Preis und Bewertungen des Produkts.',
          create:
            'Wähle eine Option und lege sie in den Warenkorb, zu deinen Favoriten oder in den Vergleich.',
          edit: 'Ändere Option oder Menge vor dem Hinzufügen; teile das Produkt oder scanne seinen QR-Code.',
        },
        cart: {
          see: 'Was du kaufst, die Rabatte und was für den nächsten noch fehlt.',
          create: 'Geh zur Kasse, wenn du so weit bist.',
          edit: 'Ändere eine Menge oder entferne ein Produkt; der Warenkorb bleibt in diesem Browser.',
        },
        checkout: {
          see: 'Die Summe der Bestellung mit Versand und Rabatten.',
          create:
            'Gib deine Adresse, einen Gutscheincode falls vorhanden ein, und wähle, wie du zahlst.',
          edit: 'Ändere Adresse oder Zahlart, bevor du bestellst.',
        },
        shopOrder: {
          see: 'Der Stand deiner Bestellung, wie du zahlst und die Paketverfolgung.',
          create: 'Sobald sie unterwegs ist, bewerte, was du gekauft hast.',
          edit: 'Bewahre diesen Link auf: er führt zurück zu deiner Bestellung.',
        },
        info: {
          see: 'Wer verkauft, die Verkaufsbedingungen und die Rückgabe.',
          create: 'Schreibe dem Verkäufer aus deinem Konto.',
          edit: 'Nur der Verkäufer kann diese Angaben ändern.',
        },
        compare: {
          see: 'Die gewählten Produkte nebeneinander.',
          create: 'Füge Produkte auf ihren Seiten zum Vergleich hinzu.',
          edit: 'Entferne ein Produkt aus dem Vergleich.',
        },
        favorites: {
          see: 'Die Produkte, die du in diesem Shop gemerkt hast.',
          create: 'Merke ein Produkt auf seiner Seite.',
          edit: 'Entferne ein Produkt aus deinen Favoriten.',
        },
        account: {
          see: 'Deine Bestellungen, Nachrichten und Newsletter-Wahl in diesem Shop.',
          create: 'Melde dich mit einem Link per E-Mail an; schreibe dem Verkäufer.',
          edit: 'Ändere deine gespeicherten Lieferdaten oder den Newsletter.',
        },
        thread: {
          see: 'Ein Gespräch mit dem Verkäufer.',
          create: 'Schreibe eine Nachricht; die Antwort kommt per E-Mail.',
          edit: 'Gesendete Nachrichten lassen sich nicht ändern.',
        },
        shopNewsletter: {
          see: 'Was der Newsletter des Shops bringt: Angebote und neue Produkte.',
          create: 'Abonniere mit deiner E-Mail und bestätige mit dem Link, den du bekommst.',
          edit: 'Jeder Newsletter hat einen Link zum Abbestellen.',
        },
      },
    },
    ro: {
      tips: {
        overview: {
          see: 'Lista de pași pentru deschiderea magazinului și sarcinile rolurilor tale: livrări, mesaje, recenzii și stoc mic.',
          create: 'Fără magazin încă, dă-i un nume, moneda și cota de TVA ca să-l creezi.',
          edit: 'Urmează lista de pași; deschide magazinul sau oprește de aici modul de întreținere.',
        },
        products: {
          see: 'Fiecare produs cu starea, prețul și stocul; caută și filtrează după tip, furnizor și stare.',
          create: '„Produs nou” adaugă unul; „Copiază” face o ciornă dintr-un produs existent.',
          edit: 'Apasă pe un produs ca să-l modifici, sau bifează mai multe ca să le pui la vânzare, să le faci ciorne sau să le ștergi.',
        },
        product: {
          see: 'Textele, fotografiile, opțiunile cu preț, cod și stoc, prețul redus și previzualizarea în căutare.',
          create: 'Adaugă până la opt fotografii și o opțiune pentru fiecare mărime sau culoare.',
          edit: 'Modifică orice și salvează; ciornele le vezi doar tu, iar un produs poate fi partajat sau primi un cod QR.',
        },
        types: {
          see: 'Fiecare fel de produs cu câmpurile lui, de exemplu memoria unui telefon sau autorul unei cărți.',
          create: 'Pornește de la un tip gata făcut sau fă unul propriu, apoi adaugă-i câmpurile.',
          edit: 'Modifică sau scoate un câmp; produsele tipului arată schimbarea.',
        },
        packages: {
          see: 'Pachetele de puncte NPS pe care DevQuake le dă ca premii și recompense; nu apar niciodată în magazin.',
          create: 'Adaugă un pachet cu un nume și 1–100 de puncte.',
          edit: 'Elimină un pachet; revendicările deja făcute își păstrează numele și punctele.',
        },
        claim: {
          see: 'Ce poți revendica și câte puncte NPS îți aduce.',
          create: 'Conectează-te la DevQuake cu contul tău, apoi scrie codul secret din e-mail.',
          edit: 'Cinci coduri greșite blochează revendicarea; scrie-i lui DevQuake ca s-o redeschidă.',
        },
        vendors: {
          see: 'Cine face sau furnizează produsele tale, cu datele de contact.',
          create:
            'Adaugă un furnizor; marcat ca brand, apare pe produsele lui și în motoarele de căutare.',
          edit: 'Modifică datele unui furnizor sau scoate-l.',
        },
        orders: {
          see: 'Fiecare comandă cu starea, cumpărătorul și totalul, cele mai noi primele.',
          create: 'Comenzile vin singure din magazin; primești un e-mail pentru fiecare nouă.',
          edit: 'Deschide o comandă ca s-o marchezi plătită, expediată sau livrată.',
        },
        order: {
          see: 'Cumpărătorul, adresa, produsele și plata unei comenzi.',
          create: 'Adaugă curierul și numărul AWB; pagina cumpărătorului duce la colet.',
          edit: 'Marcheaz-o plătită, expediată și livrată, sau anuleaz-o: stocul revine, rambursările le faci tu.',
        },
        messages: {
          see: 'Mesajele scrise de cumpărători din contul lor, cele fără răspuns primele.',
          create: 'Mesajele vin singure; primești un e-mail pentru fiecare nou.',
          edit: 'Deschide o conversație ca să răspunzi.',
        },
        message: {
          see: 'O conversație cu un cumpărător, cu comenzile lui.',
          create: 'Scrie răspunsul; cumpărătorul îl primește pe e-mail.',
          edit: 'Mesajele trimise nu se mai pot schimba.',
        },
        customers: {
          see: 'Toți cei care au comandat sau au cont, cu comenzile și cât au cheltuit.',
          create: 'Clienții apar când comandă sau își fac cont.',
          edit: 'Deschide un client ca să-i vezi comenzile și mesajele.',
        },
        customer: {
          see: 'Datele, comenzile, mesajele și alegerea de newsletter ale unui client.',
          create: 'Scrie-i din mesajele lui.',
          edit: 'Datele lui le schimbă cumpărătorul în contul său.',
        },
        reviews: {
          see: 'Recenziile cumpărătorilor la ce au cumpărat, cele în așteptare primele.',
          create:
            'Alege dacă aprobi fiecare recenzie sau lași cumpărătorii verificați să publice imediat.',
          edit: 'Publică, ascunde, răspunde sau șterge fiecare recenzie.',
        },
        marketing: {
          see: 'Campanii, vouchere, anunțuri și reduceri automate.',
          create:
            'Adaugă o campanie, un cod de voucher, o bară sau un banner de anunț, ori o regulă de promoție.',
          edit: 'Schimbă datele, sumele sau limitele, ori încheie una mai devreme.',
        },
        newsletters: {
          see: 'Newsletterele tale, ciorne și trimise, cu câți abonați au ajuns.',
          create: 'Scrie un newsletter nou.',
          edit: 'Deschide o ciornă ca s-o modifici, s-o testezi și s-o trimiți.',
        },
        newsletter: {
          see: 'Newsletterul cum arată pe calculator și pe telefon.',
          create:
            'Scrie un subiect și un text, adaugă un voucher și alege produse în ofertă sau noi.',
          edit: 'Salvează ca să vezi previzualizarea, trimite-ți un test, apoi trimite-l tuturor abonaților.',
        },
        stats: {
          see: 'Vânzări, comenzi, comanda medie, vizualizări și conversie, față de perioada dinainte.',
          create: 'Cifrele cresc cu fiecare vizită și comandă.',
          edit: 'Alege 7, 30, 90 sau 365 de zile; vezi voturile de interes pentru produsele care cer voturi.',
        },
        settings: {
          see: 'Numele magazinului, adresa, moneda, TVA, datele vânzătorului, condițiile și modul de întreținere.',
          create:
            'Completează cine vinde și condițiile de vânzare și retur; magazinul le arată cumpărătorilor.',
          edit: 'Modifică și salvează; deschide sau închide magazinul, ori pornește modul de întreținere cu un mesaj.',
        },
        payments: {
          see: 'Metodele de plată: card (Stripe), PayPal, transfer bancar și ramburs.',
          create:
            'Pornește o metodă și lipește cheile ei sau datele bancare; cheile secrete se păstrează criptat.',
          edit: 'Oprește o metodă sau înlocuiește-i cheile; cheile nu se mai arată niciodată.',
        },
        shipping: {
          see: 'Zonele tale de livrare cu țările, tarifele și pragurile de livrare gratuită.',
          create: 'Adaugă o zonă pentru fiecare grup de țări; „Oriunde altundeva” acoperă restul.',
          edit: 'Schimbă tariful sau țările unei zone, ori scoate-o.',
        },
        design: {
          see: 'Sigla, bannerul, culorile, fonturile, colțurile, cardurile și produsele pe rând, cu previzualizare.',
          create: 'Adaugă sigla și un banner.',
          edit: 'Schimbă designul și salvează; editorul avertizează când textul se citește greu.',
        },
        seo: {
          see: 'Titlul și descrierea magazinului pentru motoarele de căutare, cu previzualizare și un scor pe produs.',
          create:
            'Proprietarul adaugă urmărirea (Analytics, Ads, pixel Meta) și codurile de verificare.',
          edit: 'Modifică textele și urmează sfaturile pentru fiecare produs.',
        },
        languages: {
          see: 'Limbile pe care le pot alege cumpărătorii și etichetele fiecăreia.',
          create:
            'Copiază etichetele, traduce-le și lipește-le înapoi cu un cod și un nume de limbă.',
          edit: 'Lipește din nou etichetele schimbate ca să le corectezi; alege limba pe care cumpărătorii o văd prima.',
        },
        team: {
          see: 'Echipa ta cu rolurile ei și invitațiile deschise.',
          create: 'Fă un link de invitație cu unul sau mai multe roluri și trimite-l.',
          edit: 'Schimbă rolurile unui membru sau scoate-l; revocă o invitație deschisă.',
        },
        join: {
          see: 'Echipa magazinului pentru care e invitația și rolurile tale.',
          create: 'Intră ca să lucrezi la magazin cu aceste roluri.',
          edit: 'Proprietarul magazinului îți poate schimba rolurile mai târziu.',
        },
        shop: {
          see: 'Produsele magazinului pe categorii, cu prețuri, campanii și reduceri.',
          create: 'Deschide un produs ca să-l pui în coș; nu e nevoie de cont.',
          edit: 'Caută, alege o categorie, sau schimbă jos limba și moneda.',
        },
        shopProduct: {
          see: 'Fotografiile, descrierea, opțiunile, prețul și recenziile produsului.',
          create: 'Alege o opțiune și pune-o în coș, la favorite sau în comparație.',
          edit: 'Schimbă opțiunea sau cantitatea înainte s-o adaugi; partajează produsul sau scanează-i codul QR.',
        },
        cart: {
          see: 'Ce cumperi, reducerile și ce mai lipsește pentru următoarea.',
          create: 'Mergi la finalizarea comenzii când ești gata.',
          edit: 'Schimbă o cantitate sau scoate un produs; coșul se păstrează în acest browser.',
        },
        checkout: {
          see: 'Totalul comenzii cu livrarea și reducerile.',
          create: 'Completează adresa, un cod de voucher dacă ai, și alege cum plătești.',
          edit: 'Schimbă adresa sau metoda de plată înainte să comanzi.',
        },
        shopOrder: {
          see: 'Starea comenzii, cum plătești și urmărirea coletului.',
          create: 'După ce pleacă, evaluează ce ai cumpărat.',
          edit: 'Păstrează linkul: e drumul înapoi la comanda ta.',
        },
        info: {
          see: 'Cine vinde, condițiile de vânzare și returul.',
          create: 'Scrie-i vânzătorului din contul tău.',
          edit: 'Doar vânzătorul poate schimba aceste date.',
        },
        compare: {
          see: 'Produsele alese, unul lângă altul.',
          create: 'Adaugă produse la comparație de pe paginile lor.',
          edit: 'Scoate un produs din comparație.',
        },
        favorites: {
          see: 'Produsele salvate în acest magazin.',
          create: 'Adaugă un favorit de pe pagina unui produs.',
          edit: 'Scoate un produs din favorite.',
        },
        account: {
          see: 'Comenzile, mesajele și alegerea de newsletter în acest magazin.',
          create: 'Intră cu un link trimis pe e-mail; scrie-i vânzătorului.',
          edit: 'Schimbă datele de livrare salvate sau newsletterul.',
        },
        thread: {
          see: 'O conversație cu vânzătorul.',
          create: 'Scrie un mesaj; răspunsul vine pe e-mail.',
          edit: 'Mesajele trimise nu se mai pot schimba.',
        },
        shopNewsletter: {
          see: 'Ce aduce newsletterul magazinului: oferte și produse noi.',
          create: 'Abonează-te cu e-mailul și confirmă cu linkul primit.',
          edit: 'Fiecare newsletter are un link de dezabonare.',
        },
      },
    },
    hu: {
      tips: {
        overview: {
          see: 'A bolt megnyitásának lépései és a szerepeid feladatai: szállítandó rendelések, üzenetek, értékelések és fogyó készlet.',
          create: 'Ha még nincs boltod, adj meg nevet, pénznemet és áfakulcsot a létrehozásához.',
          edit: 'Kövesd a lépéseket; innen nyithatod meg a boltot, vagy kapcsolhatod ki a karbantartást.',
        },
        products: {
          see: 'Minden termék állapottal, árral és készlettel; keress, és szűrj típusra, gyártóra és állapotra.',
          create: 'Az „Új termék” hozzáad egyet; a „Másolás” piszkozatot készít egy meglévőből.',
          edit: 'Kattints egy termékre a módosításhoz, vagy pipálj be többet, hogy árusítsd, piszkozattá tedd vagy töröld őket.',
        },
        product: {
          see: 'A termék szövegei, fotói, változatai árral, kóddal és készlettel, akciós ára és keresési előnézete.',
          create: 'Adj hozzá legfeljebb nyolc fotót, és egy változatot minden méretre vagy színre.',
          edit: 'Módosíts és ments; a piszkozatot csak te látod, a terméket megoszthatod vagy QR-kódot kaphat.',
        },
        types: {
          see: 'Minden terméktípus saját mezőkkel, például egy telefon memóriája vagy egy könyv szerzője.',
          create: 'Kezdj egy kész típussal vagy sajáttal, és add hozzá a mezőit.',
          edit: 'Módosíts vagy távolíts el egy mezőt; a típus termékei mutatják a változást.',
        },
        packages: {
          see: 'Az NPS-pontcsomagok, amelyeket a DevQuake díjként és jutalomként ad; a boltban soha nem látszanak.',
          create: 'Adj hozzá egy csomagot névvel és 1–100 ponttal.',
          edit: 'Távolíts el egy csomagot; a már elkészült beváltások megtartják a nevét és a pontjait.',
        },
        claim: {
          see: 'Mit válthatsz be, és hány NPS-pontot ad.',
          create:
            'Jelentkezz be a DevQuake-be a saját fiókoddal, majd írd be az e-mailben kapott titkos kódot.',
          edit: 'Öt rossz kód zárolja a beváltást; írj a DevQuake-nek, hogy újranyissák.',
        },
        vendors: {
          see: 'Kik gyártják vagy szállítják a termékeidet, az elérhetőségeikkel.',
          create: 'Adj hozzá gyártót; márkaként megjelenik a termékein és a keresőkben.',
          edit: 'Módosítsd egy gyártó adatait, vagy távolítsd el.',
        },
        orders: {
          see: 'Minden rendelés állapottal, vevővel és összeggel, a legújabb elöl.',
          create: 'A rendelések maguktól jönnek a boltból; mindegyikről e-mailt kapsz.',
          edit: 'Nyiss meg egy rendelést, hogy fizetettnek, feladottnak vagy kézbesítettnek jelöld.',
        },
        order: {
          see: 'Egy rendelés vevője, címe, tételei és fizetése.',
          create:
            'Add meg a futárszolgálatot és a csomagszámot; a vevő oldala a csomagkövetésre mutat.',
          edit: 'Jelöld fizetettnek, feladottnak és kézbesítettnek, vagy mondd le: a készlet visszajön, a visszatérítés a te dolgod.',
        },
        messages: {
          see: 'A vevők fiókjukból írt üzenetei, a megválaszolatlanok elöl.',
          create: 'Az üzenetek maguktól jönnek; mindegyikről e-mailt kapsz.',
          edit: 'Nyiss meg egy beszélgetést a válaszhoz.',
        },
        message: {
          see: 'Egy beszélgetés egy vevővel, a rendeléseivel.',
          create: 'Írd meg a válaszod; a vevő e-mailben kapja meg.',
          edit: 'Az elküldött üzenetek nem módosíthatók.',
        },
        customers: {
          see: 'Mindenki, aki rendelt vagy fiókja van, a rendeléseivel és költésével.',
          create: 'A vásárlók rendeléskor vagy fióknyitáskor kerülnek ide.',
          edit: 'Nyiss meg egy vásárlót a rendelései és üzenetei megtekintéséhez.',
        },
        customer: {
          see: 'Egy vásárló adatai, rendelései, üzenetei és hírlevél-választása.',
          create: 'Az üzenetei között írhatsz neki.',
          edit: 'Az adatait a vevő a fiókjában módosítja.',
        },
        reviews: {
          see: 'A vevők értékelései arról, amit vettek, a várakozók elöl.',
          create:
            'Válaszd ki, hogy minden értékelést jóváhagysz-e, vagy az igazolt vevők azonnal közzétehetnek.',
          edit: 'Tedd közzé, rejtsd el, válaszolj rá vagy töröld az értékeléseket.',
        },
        marketing: {
          see: 'Kampányok, kuponok, közlemények és automatikus kedvezmények.',
          create:
            'Adj hozzá kampányt, kuponkódot, közleménysávot vagy bannert, vagy kedvezményszabályt.',
          edit: 'Módosítsd a dátumokat, összegeket vagy korlátokat, vagy fejezz be egyet korábban.',
        },
        newsletters: {
          see: 'A hírleveleid, piszkozatok és elküldöttek, azzal, hány feliratkozóhoz jutottak el.',
          create: 'Írj új hírlevelet.',
          edit: 'Nyiss meg egy piszkozatot, hogy módosítsd, teszteld és elküldd.',
        },
        newsletter: {
          see: 'A hírlevél, ahogy számítógépen és telefonon kinéz.',
          create:
            'Írj tárgyat és szöveget, adj hozzá kupont, és válassz akciós vagy új termékeket.',
          edit: 'Mentsd az előnézethez, küldj magadnak tesztet, aztán minden feliratkozónak.',
        },
        stats: {
          see: 'Eladások, rendelések, átlagos rendelés, megtekintések és konverzió az előző időszakhoz képest.',
          create: 'A számok minden látogatással és rendeléssel nőnek.',
          edit: 'Válassz 7, 30, 90 vagy 365 napot; nézd meg az érdeklődési szavazatokat a szavazást kérő termékeknél.',
        },
        settings: {
          see: 'A bolt neve, címe, pénzneme, áfája, eladói adatai, feltételei és karbantartási módja.',
          create:
            'Add meg, ki árul, és az eladási és visszaküldési feltételeidet; a bolt megmutatja a vevőknek.',
          edit: 'Módosíts és ments; nyisd meg vagy zárd be a boltot, vagy kapcsold be a karbantartást egy üzenettel.',
        },
        payments: {
          see: 'A fizetési módok: kártya (Stripe), PayPal, banki átutalás és utánvét.',
          create:
            'Kapcsolj be egy módot, és illeszd be a kulcsait vagy a bankszámlaadataidat; a titkos kulcsokat titkosítva tároljuk.',
          edit: 'Kapcsolj ki egy módot, vagy cseréld a kulcsait; a kulcsok soha többé nem látszanak.',
        },
        shipping: {
          see: 'A szállítási zónáid országokkal, díjakkal és ingyenes szállítási határokkal.',
          create: 'Adj hozzá zónát minden országcsoporthoz; a „Mindenhol máshol” lefedi a többit.',
          edit: 'Módosítsd egy zóna díját vagy országait, vagy töröld.',
        },
        design: {
          see: 'A bolt logója, bannere, színei, betűtípusai, sarkai, kártyái és soronkénti termékei, előnézettel.',
          create: 'Add hozzá a logódat és egy bannert.',
          edit: 'Módosítsd a dizájnt és ments; a szerkesztő figyelmeztet, ha a szöveg nehezen olvasható.',
        },
        seo: {
          see: 'A bolt címe és leírása a keresőknek, előnézettel és termékenkénti pontszámmal.',
          create:
            'A tulajdonos ad hozzá követést (Analytics, Ads, Meta-pixel) és ellenőrző kódokat.',
          edit: 'Módosítsd a szövegeket, és kövesd a tippeket minden terméknél.',
        },
        languages: {
          see: 'A nyelvek, amelyeket a vevők választhatnak, és mindegyik feliratai.',
          create: 'Másold ki a feliratokat, fordítsd le, és illeszd vissza nyelvkóddal és névvel.',
          edit: 'Illeszd be újra a módosított feliratokat a javításhoz; válaszd ki, melyik nyelvet lássák először a vevők.',
        },
        team: {
          see: 'A csapatod a szerepekkel, és a nyitott meghívók.',
          create: 'Készíts meghívó linket egy vagy több szereppel, és küldd el.',
          edit: 'Módosítsd egy tag szerepeit, vagy távolítsd el; vond vissza a nyitott meghívót.',
        },
        join: {
          see: 'A bolt csapata, amelyre ez a meghívó szól, és a szerepeid.',
          create: 'Csatlakozz, hogy ezekkel a szerepekkel dolgozz a bolton.',
          edit: 'A bolt tulajdonosa később módosíthatja a szerepeidet.',
        },
        shop: {
          see: 'A bolt termékei kategóriánként, árakkal, kampányokkal és akciókkal.',
          create: 'Nyiss meg egy terméket, hogy kosárba tedd; fiók nem kell.',
          edit: 'Keress, válassz kategóriát, vagy lent módosítsd a nyelvet és a pénznemet.',
        },
        shopProduct: {
          see: 'A termék fotói, leírása, változatai, ára és értékelései.',
          create:
            'Válassz változatot, és tedd a kosárba, a kedvencek közé vagy az összehasonlításba.',
          edit: 'Hozzáadás előtt módosítsd a változatot vagy a mennyiséget; oszd meg a terméket vagy olvasd be a QR-kódját.',
        },
        cart: {
          see: 'Amit veszel, a kedvezmények, és ami még hiányzik a következőhöz.',
          create: 'Ha kész vagy, menj a pénztárhoz.',
          edit: 'Módosíts egy mennyiséget vagy vegyél ki egy terméket; a kosár ebben a böngészőben marad.',
        },
        checkout: {
          see: 'A rendelés végösszege szállítással és kedvezményekkel.',
          create: 'Add meg a címed, ha van, a kuponkódot, és válaszd ki, hogyan fizetsz.',
          edit: 'Rendelés előtt módosíthatod a címet vagy a fizetési módot.',
        },
        shopOrder: {
          see: 'A rendelésed állapota, a fizetés módja és a csomagkövetés.',
          create: 'Ha úton van, értékeld, amit vettél.',
          edit: 'Őrizd meg ezt a linket: ezen jutsz vissza a rendelésedhez.',
        },
        info: {
          see: 'Ki árul, az eladási feltételek és a visszaküldés.',
          create: 'A fiókodból írhatsz az eladónak.',
          edit: 'Ezeket az adatokat csak az eladó módosíthatja.',
        },
        compare: {
          see: 'A választott termékek egymás mellett.',
          create: 'A termékek oldalán adhatsz hozzá az összehasonlításhoz.',
          edit: 'Vegyél ki egy terméket az összehasonlításból.',
        },
        favorites: {
          see: 'A boltban elmentett termékeid.',
          create: 'Egy termék oldalán adhatod a kedvencekhez.',
          edit: 'Vegyél ki egy terméket a kedvencek közül.',
        },
        account: {
          see: 'A rendeléseid, üzeneteid és hírlevél-választásod ebben a boltban.',
          create: 'Lépj be az e-mailben kapott linkkel; írj az eladónak.',
          edit: 'Módosítsd a mentett szállítási adataidat vagy a hírlevelet.',
        },
        thread: {
          see: 'Egy beszélgetés az eladóval.',
          create: 'Írj üzenetet; a választ e-mailben kapod.',
          edit: 'Az elküldött üzenetek nem módosíthatók.',
        },
        shopNewsletter: {
          see: 'Amit a bolt hírlevele hoz: ajánlatok és új termékek.',
          create: 'Iratkozz fel az e-mail-címeddel, és erősítsd meg a kapott linkkel.',
          edit: 'Minden hírlevélben van leiratkozó link.',
        },
      },
    },
    it: {
      tips: {
        overview: {
          see: 'La lista per aprire il negozio e i compiti dei tuoi ruoli: ordini da spedire, messaggi, recensioni e scorte basse.',
          create: 'Senza un negozio, dagli un nome, la valuta e l’aliquota IVA per crearlo.',
          edit: 'Segui la lista; apri il negozio o termina da qui la modalità manutenzione.',
        },
        products: {
          see: 'Ogni prodotto con stato, prezzo e scorte; cerca e filtra per tipo, produttore e stato.',
          create:
            '«Nuovo prodotto» ne aggiunge uno; «Copia» crea una bozza da un prodotto esistente.',
          edit: 'Clicca su un prodotto per cambiarlo, o spuntane diversi per metterli in vendita, renderli bozze o eliminarli.',
        },
        product: {
          see: 'Testi, foto, opzioni con prezzo, codice e scorte, prezzo scontato e anteprima di ricerca del prodotto.',
          create: 'Aggiungi fino a otto foto e un’opzione per ogni taglia o colore.',
          edit: 'Cambia e salva; le bozze le vedi solo tu, e un prodotto si può condividere o avere un codice QR.',
        },
        types: {
          see: 'Ogni tipo di prodotto con i suoi campi, come la memoria di un telefono o l’autore di un libro.',
          create: 'Parti da un tipo pronto o creane uno tuo, poi aggiungi i campi.',
          edit: 'Cambia o togli un campo; i prodotti del tipo mostrano la modifica.',
        },
        packages: {
          see: 'I pacchetti di punti NPS che DevQuake assegna come premi e ricompense; mai visibili nel negozio.',
          create: 'Aggiungi un pacchetto con un nome e da 1 a 100 punti.',
          edit: 'Rimuovi un pacchetto; i riscatti già creati ne mantengono nome e punti.',
        },
        claim: {
          see: 'Cosa puoi riscattare e quanti punti NPS ti dà.',
          create: 'Accedi a DevQuake con il tuo account, poi scrivi il codice segreto dell’e-mail.',
          edit: 'Cinque codici sbagliati bloccano il riscatto; scrivi a DevQuake per farlo riaprire.',
        },
        vendors: {
          see: 'Chi produce o fornisce i tuoi prodotti, con i contatti.',
          create:
            'Aggiungi un produttore; come marchio compare sui suoi prodotti e nei motori di ricerca.',
          edit: 'Cambia i dati di un produttore o toglilo.',
        },
        orders: {
          see: 'Ogni ordine con stato, acquirente e totale, i più recenti prima.',
          create: 'Gli ordini arrivano da soli dal negozio; ricevi un’email per ogni nuovo ordine.',
          edit: 'Apri un ordine per segnarlo pagato, spedito o consegnato.',
        },
        order: {
          see: 'Acquirente, indirizzo, articoli e pagamento di un ordine.',
          create:
            'Aggiungi il corriere e il numero di tracciamento; la pagina dell’acquirente porta al pacco.',
          edit: 'Segnalo pagato, spedito e consegnato, o annullalo: le scorte tornano, i rimborsi li fai tu.',
        },
        messages: {
          see: 'I messaggi degli acquirenti dal loro account, prima quelli senza risposta.',
          create: 'I messaggi arrivano da soli; ricevi un’email per ognuno.',
          edit: 'Apri una conversazione per rispondere.',
        },
        message: {
          see: 'Una conversazione con un acquirente, con i suoi ordini.',
          create: 'Scrivi la risposta; l’acquirente la riceve per email.',
          edit: 'I messaggi inviati non si possono cambiare.',
        },
        customers: {
          see: 'Chi ha ordinato o ha un account, con ordini e spesa.',
          create: 'I clienti si aggiungono quando ordinano o aprono un account.',
          edit: 'Apri un cliente per vederne ordini e messaggi.',
        },
        customer: {
          see: 'Dati, ordini, messaggi e scelta della newsletter di un cliente.',
          create: 'Scrivigli dai suoi messaggi.',
          edit: 'I suoi dati li cambia l’acquirente nel suo account.',
        },
        reviews: {
          see: 'Le recensioni degli acquirenti su ciò che hanno comprato, prima quelle in attesa.',
          create:
            'Scegli se approvare ogni recensione o lasciar pubblicare subito gli acquirenti verificati.',
          edit: 'Pubblica, nascondi, rispondi o elimina ogni recensione.',
        },
        marketing: {
          see: 'Campagne, buoni, annunci e sconti automatici.',
          create:
            'Aggiungi una campagna, un codice sconto, una barra o un banner d’annuncio, o una regola di promozione.',
          edit: 'Cambia date, importi o limiti, o termina prima una promozione.',
        },
        newsletters: {
          see: 'Le tue newsletter, bozze e inviate, con quanti iscritti hanno raggiunto.',
          create: 'Scrivi una nuova newsletter.',
          edit: 'Apri una bozza per cambiarla, provarla e inviarla.',
        },
        newsletter: {
          see: 'La newsletter come appare su computer e telefono.',
          create: 'Scrivi oggetto e testo, aggiungi un buono e scegli prodotti in offerta o nuovi.',
          edit: 'Salva per l’anteprima, mandati una prova, poi inviala a tutti gli iscritti.',
        },
        stats: {
          see: 'Vendite, ordini, ordine medio, visite e conversione, rispetto al periodo prima.',
          create: 'I numeri crescono con ogni visita e ordine.',
          edit: 'Scegli 7, 30, 90 o 365 giorni; vedi i voti d’interesse per i prodotti che chiedono voti.',
        },
        settings: {
          see: 'Nome, indirizzo, valuta, IVA, dati del venditore, condizioni e modalità manutenzione del negozio.',
          create:
            'Indica chi vende e le condizioni di vendita e di reso; il negozio le mostra agli acquirenti.',
          edit: 'Cambia e salva; apri o chiudi il negozio, o attiva la manutenzione con un messaggio.',
        },
        payments: {
          see: 'I metodi di pagamento: carta (Stripe), PayPal, bonifico e contrassegno.',
          create:
            'Attiva un metodo e incolla le sue chiavi o i tuoi dati bancari; le chiavi segrete sono cifrate.',
          edit: 'Disattiva un metodo o sostituiscine le chiavi; le chiavi non si vedono più.',
        },
        shipping: {
          see: 'Le tue zone di spedizione con paesi, tariffe e soglie di spedizione gratuita.',
          create: 'Aggiungi una zona per ogni gruppo di paesi; «Ovunque altrove» copre il resto.',
          edit: 'Cambia tariffa o paesi di una zona, o toglila.',
        },
        design: {
          see: 'Logo, banner, colori, caratteri, angoli, schede e prodotti per riga del negozio, con anteprima.',
          create: 'Aggiungi il tuo logo e un banner.',
          edit: 'Cambia il design e salva; l’editor avvisa quando il testo è difficile da leggere.',
        },
        seo: {
          see: 'Titolo e descrizione del negozio per i motori di ricerca, con anteprima e un punteggio per prodotto.',
          create:
            'Il proprietario aggiunge il tracciamento (Analytics, Ads, pixel Meta) e i codici di verifica.',
          edit: 'Cambia i testi e segui i suggerimenti per ogni prodotto.',
        },
        languages: {
          see: 'Le lingue che gli acquirenti possono scegliere e le etichette di ognuna.',
          create:
            'Copia le etichette, traducile e incollale di nuovo con un codice e un nome di lingua.',
          edit: 'Incolla di nuovo le etichette cambiate per correggerle; scegli la lingua che gli acquirenti vedono prima.',
        },
        team: {
          see: 'Il tuo team con i ruoli e gli inviti aperti.',
          create: 'Crea un link d’invito con uno o più ruoli e invialo.',
          edit: 'Cambia i ruoli di un membro o toglilo; revoca un invito aperto.',
        },
        join: {
          see: 'Il team del negozio a cui si riferisce l’invito, e i tuoi ruoli.',
          create: 'Unisciti per lavorare al negozio con questi ruoli.',
          edit: 'Il proprietario del negozio può cambiare i tuoi ruoli più tardi.',
        },
        shop: {
          see: 'I prodotti del negozio per categoria, con prezzi, campagne e saldi.',
          create: 'Apri un prodotto per metterlo nel carrello; non serve un account.',
          edit: 'Cerca, scegli una categoria, o cambia in fondo lingua e valuta.',
        },
        shopProduct: {
          see: 'Foto, descrizione, opzioni, prezzo e recensioni del prodotto.',
          create: 'Scegli un’opzione e mettila nel carrello, nei preferiti o nel confronto.',
          edit: 'Cambia opzione o quantità prima di aggiungerla; condividi il prodotto o scansiona il suo codice QR.',
        },
        cart: {
          see: 'Cosa stai comprando, gli sconti e cosa manca per il prossimo.',
          create: 'Vai alla cassa quando sei pronto.',
          edit: 'Cambia una quantità o togli un prodotto; il carrello resta in questo browser.',
        },
        checkout: {
          see: 'Il totale dell’ordine con spedizione e sconti.',
          create: 'Inserisci l’indirizzo, un codice sconto se ce l’hai, e scegli come pagare.',
          edit: 'Cambia indirizzo o metodo di pagamento prima di ordinare.',
        },
        shopOrder: {
          see: 'Lo stato del tuo ordine, come pagare e il tracciamento del pacco.',
          create: 'Quando è in viaggio, valuta ciò che hai comprato.',
          edit: 'Conserva questo link: è la strada per tornare al tuo ordine.',
        },
        info: {
          see: 'Chi vende, le condizioni di vendita e i resi.',
          create: 'Scrivi al venditore dal tuo account.',
          edit: 'Solo il venditore può cambiare questi dati.',
        },
        compare: {
          see: 'I prodotti scelti uno accanto all’altro.',
          create: 'Aggiungi prodotti al confronto dalle loro pagine.',
          edit: 'Togli un prodotto dal confronto.',
        },
        favorites: {
          see: 'I prodotti salvati in questo negozio.',
          create: 'Aggiungi un preferito dalla pagina di un prodotto.',
          edit: 'Togli un prodotto dai preferiti.',
        },
        account: {
          see: 'I tuoi ordini, messaggi e la scelta della newsletter in questo negozio.',
          create: 'Accedi con un link inviato per email; scrivi al venditore.',
          edit: 'Cambia i dati di consegna salvati o la newsletter.',
        },
        thread: {
          see: 'Una conversazione con il venditore.',
          create: 'Scrivi un messaggio; la risposta arriva per email.',
          edit: 'I messaggi inviati non si possono cambiare.',
        },
        shopNewsletter: {
          see: 'Cosa porta la newsletter del negozio: offerte e novità.',
          create: 'Iscriviti con la tua email e conferma con il link che ricevi.',
          edit: 'Ogni newsletter ha un link per disiscriversi.',
        },
      },
    },
    es: {
      tips: {
        overview: {
          see: 'La lista para abrir la tienda y las tareas de tus roles: pedidos por enviar, mensajes, reseñas y poco stock.',
          create: 'Sin tienda aún, ponle un nombre, la moneda y el tipo de IVA para crearla.',
          edit: 'Sigue la lista; abre la tienda o termina desde aquí el modo de mantenimiento.',
        },
        products: {
          see: 'Cada producto con su estado, precio y stock; busca y filtra por tipo, fabricante y estado.',
          create:
            '«Nuevo producto» añade uno; «Copiar» crea un borrador a partir de uno existente.',
          edit: 'Haz clic en un producto para cambiarlo, o marca varios para ponerlos a la venta, hacerlos borrador o borrarlos.',
        },
        product: {
          see: 'Los textos, fotos, opciones con precio, código y stock, precio rebajado y vista previa en buscadores del producto.',
          create: 'Añade hasta ocho fotos y una opción por cada talla o color.',
          edit: 'Cambia lo que quieras y guarda; los borradores solo los ves tú, y un producto se puede compartir o tener un código QR.',
        },
        types: {
          see: 'Cada tipo de producto con sus propios campos, como la memoria de un teléfono o el autor de un libro.',
          create: 'Empieza con un tipo ya hecho o crea el tuyo, y añade sus campos.',
          edit: 'Cambia o quita un campo; los productos del tipo muestran el cambio.',
        },
        packages: {
          see: 'Los paquetes de puntos NPS que DevQuake da como premios y recompensas; nunca se muestran en la tienda.',
          create: 'Añade un paquete con un nombre y de 1 a 100 puntos.',
          edit: 'Quita un paquete; los canjes ya creados conservan su nombre y sus puntos.',
        },
        claim: {
          see: 'Lo que puedes canjear y cuántos puntos NPS te da.',
          create: 'Inicia sesión en DevQuake con tu cuenta y escribe el código secreto del correo.',
          edit: 'Cinco códigos erróneos bloquean el canje; escribe a DevQuake para que lo reabran.',
        },
        vendors: {
          see: 'Quién fabrica o suministra tus productos, con sus contactos.',
          create: 'Añade un fabricante; como marca aparece en sus productos y en los buscadores.',
          edit: 'Cambia los datos de un fabricante o quítalo.',
        },
        orders: {
          see: 'Cada pedido con su estado, comprador y total, los más nuevos primero.',
          create: 'Los pedidos llegan solos desde la tienda; recibes un correo por cada uno nuevo.',
          edit: 'Abre un pedido para marcarlo pagado, enviado o entregado.',
        },
        order: {
          see: 'El comprador, la dirección, los artículos y el pago de un pedido.',
          create:
            'Añade la empresa de transporte y el número de seguimiento; la página del comprador enlaza al paquete.',
          edit: 'Márcalo pagado, enviado y entregado, o cancélalo: el stock vuelve, los reembolsos los haces tú.',
        },
        messages: {
          see: 'Los mensajes que escribieron los compradores desde su cuenta, primero los sin responder.',
          create: 'Los mensajes llegan solos; recibes un correo por cada uno nuevo.',
          edit: 'Abre una conversación para responder.',
        },
        message: {
          see: 'Una conversación con un comprador, con sus pedidos.',
          create: 'Escribe tu respuesta; el comprador la recibe por correo.',
          edit: 'Los mensajes enviados no se pueden cambiar.',
        },
        customers: {
          see: 'Todos los que pidieron o tienen cuenta, con sus pedidos y lo que gastaron.',
          create: 'Los clientes se añaden cuando piden o abren una cuenta.',
          edit: 'Abre un cliente para ver sus pedidos y mensajes.',
        },
        customer: {
          see: 'Los datos, pedidos, mensajes y elección de boletín de un cliente.',
          create: 'Escríbele desde sus mensajes.',
          edit: 'Sus datos los cambia el comprador en su cuenta.',
        },
        reviews: {
          see: 'Las reseñas de los compradores sobre lo que compraron, primero las pendientes.',
          create:
            'Elige si apruebas cada reseña o dejas que los compradores verificados publiquen al momento.',
          edit: 'Publica, oculta, responde o borra cada reseña.',
        },
        marketing: {
          see: 'Campañas, cupones, avisos y descuentos automáticos.',
          create:
            'Añade una campaña, un código de cupón, una barra o un banner de aviso, o una regla de promoción.',
          edit: 'Cambia fechas, importes o límites, o termina una antes.',
        },
        newsletters: {
          see: 'Tus boletines, borradores y enviados, con cuántos suscriptores alcanzaron.',
          create: 'Escribe un boletín nuevo.',
          edit: 'Abre un borrador para cambiarlo, probarlo y enviarlo.',
        },
        newsletter: {
          see: 'El boletín tal como se ve en un ordenador y en un teléfono.',
          create:
            'Escribe un asunto y un texto, añade un cupón y elige productos en oferta o nuevos.',
          edit: 'Guarda para ver la vista previa, envíate una prueba y luego a todos los suscriptores.',
        },
        stats: {
          see: 'Ventas, pedidos, pedido medio, visitas y conversión, frente al periodo anterior.',
          create: 'Los números crecen con cada visita y pedido.',
          edit: 'Elige 7, 30, 90 o 365 días; mira los votos de interés de los productos que piden votos.',
        },
        settings: {
          see: 'El nombre, la dirección, la moneda, el IVA, los datos del vendedor, las condiciones y el modo de mantenimiento.',
          create:
            'Indica quién vende y tus condiciones de venta y devolución; la tienda las muestra a los compradores.',
          edit: 'Cambia y guarda; abre o cierra la tienda, o activa el mantenimiento con un mensaje.',
        },
        payments: {
          see: 'Los métodos de pago: tarjeta (Stripe), PayPal, transferencia y contra reembolso.',
          create:
            'Activa un método y pega sus claves o tus datos bancarios; las claves secretas se guardan cifradas.',
          edit: 'Desactiva un método o sustituye sus claves; las claves no se vuelven a mostrar.',
        },
        shipping: {
          see: 'Tus zonas de envío con sus países, tarifas e importes para envío gratis.',
          create:
            'Añade una zona por cada grupo de países; «En cualquier otro lugar» cubre el resto.',
          edit: 'Cambia la tarifa o los países de una zona, o quítala.',
        },
        design: {
          see: 'El logo, el banner, los colores, las fuentes, las esquinas, las tarjetas y los productos por fila, con vista previa.',
          create: 'Añade tu logo y un banner.',
          edit: 'Cambia el diseño y guarda; el editor avisa cuando un texto se lee mal.',
        },
        seo: {
          see: 'El título y la descripción de la tienda para los buscadores, con vista previa y una puntuación por producto.',
          create:
            'El dueño añade el seguimiento (Analytics, Ads, píxel de Meta) y los códigos de verificación.',
          edit: 'Cambia los textos y sigue los consejos de cada producto.',
        },
        languages: {
          see: 'Los idiomas que pueden elegir los compradores y las etiquetas de cada uno.',
          create:
            'Copia las etiquetas, tradúcelas y pégalas de nuevo con un código y un nombre de idioma.',
          edit: 'Vuelve a pegar las etiquetas cambiadas para corregirlas; elige el idioma que los compradores ven primero.',
        },
        team: {
          see: 'Tu equipo con sus roles y las invitaciones abiertas.',
          create: 'Crea un enlace de invitación con uno o varios roles y envíalo.',
          edit: 'Cambia los roles de un miembro o quítalo; revoca una invitación abierta.',
        },
        join: {
          see: 'El equipo de la tienda de esta invitación y tus roles.',
          create: 'Únete para trabajar en la tienda con esos roles.',
          edit: 'El dueño de la tienda puede cambiar tus roles más tarde.',
        },
        shop: {
          see: 'Los productos de la tienda por categoría, con precios, campañas y rebajas.',
          create: 'Abre un producto para añadirlo al carrito; no hace falta cuenta.',
          edit: 'Busca, elige una categoría, o cambia abajo el idioma y la moneda.',
        },
        shopProduct: {
          see: 'Las fotos, la descripción, las opciones, el precio y las reseñas del producto.',
          create: 'Elige una opción y añádela al carrito, a tus favoritos o a la comparación.',
          edit: 'Cambia la opción o la cantidad antes de añadirla; comparte el producto o escanea su código QR.',
        },
        cart: {
          see: 'Lo que compras, los descuentos y lo que falta para el siguiente.',
          create: 'Ve a pagar cuando estés listo.',
          edit: 'Cambia una cantidad o quita un producto; el carrito se guarda en este navegador.',
        },
        checkout: {
          see: 'El total del pedido con el envío y los descuentos.',
          create: 'Escribe tu dirección, un código de cupón si tienes, y elige cómo pagar.',
          edit: 'Cambia la dirección o el método de pago antes de pedir.',
        },
        shopOrder: {
          see: 'El estado de tu pedido, cómo pagar y el seguimiento del paquete.',
          create: 'Cuando esté en camino, valora lo que compraste.',
          edit: 'Guarda este enlace: es el camino de vuelta a tu pedido.',
        },
        info: {
          see: 'Quién vende, las condiciones de venta y las devoluciones.',
          create: 'Escribe al vendedor desde tu cuenta.',
          edit: 'Solo el vendedor puede cambiar estos datos.',
        },
        compare: {
          see: 'Los productos que elegiste, uno al lado del otro.',
          create: 'Añade productos a la comparación desde sus páginas.',
          edit: 'Quita un producto de la comparación.',
        },
        favorites: {
          see: 'Los productos que guardaste en esta tienda.',
          create: 'Añade un favorito desde la página de un producto.',
          edit: 'Quita un producto de tus favoritos.',
        },
        account: {
          see: 'Tus pedidos, mensajes y elección de boletín en esta tienda.',
          create: 'Entra con un enlace enviado a tu correo; escribe al vendedor.',
          edit: 'Cambia tus datos de entrega guardados o el boletín.',
        },
        thread: {
          see: 'Una conversación con el vendedor.',
          create: 'Escribe un mensaje; la respuesta llega por correo.',
          edit: 'Los mensajes enviados no se pueden cambiar.',
        },
        shopNewsletter: {
          see: 'Lo que trae el boletín de la tienda: ofertas y productos nuevos.',
          create: 'Suscríbete con tu correo y confirma con el enlace que recibas.',
          edit: 'Cada boletín tiene un enlace para darse de baja.',
        },
      },
    },
  },
);
