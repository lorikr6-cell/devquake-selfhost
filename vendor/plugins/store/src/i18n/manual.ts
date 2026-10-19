import type { Locale } from '@devquake/ui';

// The user manual (/help) in every language (ADR 0011). Inline markup: **bold**; {host} is a
// link to the instance's home. Every language has the same sections and blocks (a test checks).

export type ManualBlock =
  { p: string } | { steps: string[] } | { list: string[] } | { tip: string };

export interface Manual {
  metaTitle: string;
  metaDescription: string;
  ogTitle: string;
  /** For visitors who are not signed in; {link} is the sign-in link. */
  cta: string;
  ctaLink: string;
  kicker: string;
  title: string;
  intro: string;
  contents: string;
  sections: Array<{ id: string; title: string; blocks: ManualBlock[] }>;
  /** {email} is the contact address. */
  questions: string;
  back: string;
}

const en: Manual = {
  metaTitle: 'User manual · Store',
  metaDescription:
    'How to run your own small online shop: products with options and sales, card, PayPal, bank transfer or cash on delivery, shipping zones and orders.',
  ogTitle: 'Store: user manual',
  cta: 'This manual is for the shop’s owner. {link} to manage your shop.',
  ctaLink: 'Sign in',
  kicker: 'Store · User manual',
  title: 'How to run your shop',
  intro:
    'Store is a small online shop on your own server: you add products, choose how buyers pay and where you ship, and follow every order until it is delivered. Buyers do not need an account.',
  contents: 'Contents',
  sections: [
    {
      id: 'start',
      title: '1. Opening the shop',
      blocks: [
        {
          steps: [
            'Sign in and give the shop a **name**. Its web address is made from the name; you can change it.',
            'Choose the **currency** and the **VAT rate**. Prices you type include VAT; use 0 when you do not charge VAT.',
            'Follow the checklist on the **Overview**: a product, a payment method, shipping, your seller details, then **open the shop** under Settings.',
          ],
        },
        {
          tip: 'While the shop is closed, only you can see it: open it from the Overview to check how buyers will see it.',
        },
      ],
    },
    {
      id: 'products',
      title: '2. Products, options and sales',
      blocks: [
        {
          p: 'A product has a name, a short description for lists, a longer description, a category and up to eight **photos**; the first photo is the main one.',
        },
        {
          list: [
            '**Options**: sizes, colours… each with its own price, code and stock. A simple product has one option without a name.',
            '**Stock** is counted when you fill it in: an order takes it, a cancelled order gives it back, and sold-out options cannot be bought.',
            '**Sale price**: lower than the price, from a start to an end time (both optional). The shop shows the old price struck through.',
            '**Drafts** (not “on sale”) are seen only by you.',
          ],
        },
      ],
    },
    {
      id: 'payments',
      title: '3. Payment methods',
      blocks: [
        {
          p: 'Money goes straight to your own accounts. Turn on the methods you want under **Payments**:',
        },
        {
          list: [
            '**Card (Stripe)**: paste your secret key and add the webhook address shown on the page in Stripe, with its signing secret. Paid orders are marked paid by themselves.',
            '**PayPal**: your app’s client ID and secret; try it first in the sandbox, then switch to live.',
            '**Bank transfer**: your IBAN and account holder. The order page shows them with the order’s reference; mark the order paid when the money arrives.',
            '**Cash on delivery**: optional extra fee; the courier collects, and the order counts as paid when you mark it delivered.',
          ],
        },
        {
          tip: 'Secret keys are stored encrypted and never shown again. Card details never reach your server: buyers pay on Stripe’s or PayPal’s own page.',
        },
      ],
    },
    {
      id: 'shipping',
      title: '4. Shipping',
      blocks: [
        {
          p: 'Make a **zone** for each group of countries you ship to, with a flat rate per order and, if you like, free shipping from an amount. “Everywhere else” covers all other countries. Buyers from countries in no zone cannot order.',
        },
      ],
    },
    {
      id: 'orders',
      title: '5. Orders',
      blocks: [
        {
          steps: [
            'You get an **email** for every new order (card and PayPal orders once they are paid).',
            'Open the order: buyer, address, items, payment. Mark it **paid** (bank, cash), then **shipped**.',
            'Add the **courier** and the **tracking number**: the buyer’s page links to the parcel’s tracking page.',
            'Mark it **delivered**. Cancelling puts the products back into stock; refund any money yourself.',
          ],
        },
        {
          p: 'Card and PayPal orders not paid within a day are cancelled by themselves, so their stock is free again.',
        },
      ],
    },
    {
      id: 'buyers',
      title: '6. What buyers see',
      blocks: [
        {
          list: [
            'The shop, its categories and products, with prices, campaigns and sales, without signing in; they can **compare** products side by side and **share** them or scan their **QR code**.',
            'A **cart** kept in their browser, and checkout with their address, the shipping cost, a **voucher code** and the payment method.',
            'Their **order’s page**, behind a secret link: its state, how to pay, and the parcel’s tracking. When the server can send email, they also get the link in a confirmation email.',
            'An optional **account** in your shop: they sign in with a link sent to their email, see all their orders, write to you and manage the newsletter. No password.',
            'Once the order is on its way, they can **rate** what they bought from the order’s page.',
          ],
        },
      ],
    },
    {
      id: 'legal',
      title: '7. Seller details, terms and search engines',
      blocks: [
        {
          p: 'Under **Settings**, fill in who sells (name or company, address, registration and VAT numbers, contact), your **terms of sale** and **returns**. The shop shows them on its “Seller and terms” page, with the EU’s 14-day right of withdrawal; shops in Romania can show the ANPC links.',
        },
        {
          p: 'Open shops and their products can be found by search engines: every page has its own address, description and price data, and the shop lists them in a sitemap.',
        },
      ],
    },
    {
      id: 'catalogue',
      title: '8. Product types, vendors and many products',
      blocks: [
        {
          p: 'Under **Products → Types and fields**, give each kind of product its own fields: a phone’s memory, a shirt’s composition, a book’s author. Start from a ready-made type (electronics, clothing, shoes, books, food, cosmetics, furniture, jewellery, toys, sports, handmade) in your language and change it as you like. Products of that type fill in the fields; the shop shows them as **Details** and in the **comparison**.',
        },
        {
          list: [
            '**Vendors** keep who makes or supplies your products, with their contacts. A vendor shown as **brand** appears on its products and in search engines.',
            'The product list has a **search** and filters by type, vendor and status. Tick several products to put them on sale, make them drafts or delete them at once; **Copy** makes a draft from a product.',
          ],
        },
      ],
    },
    {
      id: 'promotions',
      title: '9. Campaigns, vouchers and announcements',
      blocks: [
        {
          list: [
            '**Campaigns** take a percentage off everything, a category or chosen products, from a start to an end. The shop shows the old price struck through.',
            '**Vouchers** are codes buyers type at checkout: a percentage or an amount off the products, or free shipping; with a minimum order, a number of uses and once per buyer if you like.',
            '**Announcements** show a bar on every page or a banner on the front page, with a voucher code to copy or a link to a campaign.',
          ],
        },
        {
          tip: 'When a sale price and a campaign meet, the lower price wins. A voucher comes on top, on the products only.',
        },
      ],
    },
    {
      id: 'newsletter',
      title: '10. Newsletters',
      blocks: [
        {
          steps: [
            'Buyers subscribe in the shop’s footer, in their account or at checkout, and confirm with the link in an email.',
            'Under **Marketing → Newsletters**, write a subject and a text, add a voucher if you like, and pick products **on offer** or **new** (or add all on sale or the newest at once).',
            'Save to see the email as on a computer and on a phone, send yourself a **test**, then send it to every subscriber.',
          ],
        },
        {
          tip: 'Every newsletter has a link to unsubscribe. The shop sends email through the server’s SMTP settings; without them there are no newsletters or sign-in links.',
        },
      ],
    },
    {
      id: 'reviews',
      title: '11. Reviews and messages',
      blocks: [
        {
          list: [
            'Under **Reviews**, choose whether you approve every review or let verified buyers publish at once. Publish, hide, answer or delete each one.',
            'Under **Messages**, read and answer buyers who wrote from their account; they get an email with your answer. You get an email for each new message.',
          ],
        },
      ],
    },
    {
      id: 'design',
      title: '12. Design, search engines and tracking',
      blocks: [
        {
          p: 'Under **Settings → Design**, add your logo and a banner and choose colours, fonts, corners, cards and how many products show per row; the editor warns when text is hard to read.',
        },
        {
          list: [
            'Under **Search engines**, set the shop’s title and description with a preview, and see a score with tips for every product (photos, texts, category, brand, barcode). Each product has its own search engine texts too.',
            'The owner can add **Google Analytics**, **Google Ads**, **Tag Manager**, the **Meta pixel** or other code, and the verification codes for Google Search Console and Bing. Buyers are asked first; tags load only after they accept.',
            'Every product can be **shared** on social networks or as a **QR code** to download or print.',
          ],
        },
      ],
    },
    {
      id: 'team',
      title: '13. Your team',
      blocks: [
        {
          list: [
            'Under **Settings → Team**, make an invitation link with one or more roles and send it: **Manager** (everything but payments, tracking and the team), **Products** (products, stock, types, vendors, search engines), **Marketing** (promotions, newsletters, reviews, design, statistics), **Support** (buyers’ messages, reviews, orders), **Shipping and delivery** (orders to ship, shipping zones) or **Maintenance** (opening, maintenance mode, seller details, languages, design).',
            'Each member’s **Overview** shows the tasks of their roles: orders to ship with a button to mark them shipped, unanswered messages and reviews to publish, sold-out and low-stock products, running campaigns and newsletters, and what the shop still lacks. Change a member’s roles or remove them at any time; members can leave the team from the Overview.',
          ],
        },
      ],
    },
    {
      id: 'stats',
      title: '14. Statistics',
      blocks: [
        {
          p: 'Under **Statistics**, see sales, orders, the average order, product views and conversion for 7, 30, 90 or 365 days, compared with the period before; sales, orders and views by day or week; and every product’s numbers, which you can sort.',
        },
      ],
    },
    {
      id: 'rules',
      title: '15. Automatic discounts and free shipping',
      blocks: [
        {
          p: 'Under **Marketing → Promotions**, add rules that apply without a code: **free shipping** from an amount, or a **percentage off all products** from a number of items (e.g. 3 items: −5 %, 5 items: −10 %) or from an amount. When several are reached, the highest counts.',
        },
        {
          list: [
            'Buyers see the discount in the **cart** and at **checkout** before they order, and a hint such as “Add 2 more items for 10 % off everything” or “Add €12 more for free shipping”.',
            'A voucher comes on top, on what is left; the order keeps both discounts with their names.',
          ],
        },
      ],
    },
    {
      id: 'languages',
      title: '16. Maintenance mode and languages',
      blocks: [
        {
          p: 'Under **Settings**, switch on **maintenance mode** with a message: buyers see it instead of the shop and cannot order, while your team still sees everything. Turn it off from the Overview with one click.',
        },
        {
          steps: [
            'Under **Settings → Languages**, choose the language to translate from and **copy** the labels buyers see (or download them).',
            'Translate them in a translator or an AI, keeping the names before the colons and the words in curly brackets as they are.',
            'Paste them back with a code (fr, pl, nl…) and the language’s name, and save. The page tells you how many labels were taken, missing or refused. Use de, ro, hu, it, es or en to change the wording of a built-in language instead.',
          ],
        },
        {
          tip: 'Buyers choose the language at the bottom of the shop; you can also make one of your languages the one buyers see first.',
        },
      ],
    },
    {
      id: 'devquake',
      title: '17. Accounts for DevQuake members',
      blocks: [
        {
          p: 'On a site that is part of DevQuake, members sign in to your shop with **Continue with DevQuake** on the account page: DevQuake asks them once to allow their email address, and their account in the shop is filled in with their name and that address. Orders they placed with it show up, and the shop recognises them on their next visits until they sign out of it.',
        },
        {
          list: [
            'Everyone else still opens an account with any email address, by a link.',
            'Buyers save their **delivery details** in their account, and the checkout fills them in; at checkout they can keep new details for next time.',
            'The site’s administrators decide whether members may open their own shops, and whether visitors see a short introduction to DevQuake above the shop’s footer.',
            'With **approximate prices in other currencies** on, buyers choose a currency at the bottom of the shop and see “≈” prices in it; they still pay in your shop’s currency.',
          ],
        },
      ],
    },
    {
      id: 'interest',
      title: '18. Interest votes before selling',
      blocks: [
        {
          p: 'Not sure a product will sell? When the site’s administrators turn on **Interest votes**, switch a product to **Ask for votes instead of selling** on its page. Buyers then see a vote instead of the price: whether they want it, what they would pay and which version (the multiple-choice fields of its type, such as colours and sizes). Nobody can order it meanwhile.',
        },
        {
          list: [
            'Enter a **cost per piece** and a **one-time investment** on the product’s page.',
            'Under **Statistics → Interest votes** you see the demand, what voters would pay, a suggested price, the expected buyers, revenue, profit, return and break-even, and the most wanted versions.',
            'To start selling, switch the vote off and give the options their real prices.',
          ],
        },
      ],
    },
  ],
  questions: 'Questions or ideas? Write to {email}.',
  back: 'Back to your shop',
};

const de: Manual = {
  metaTitle: 'Benutzerhandbuch · Shop',
  metaDescription:
    'So führst du deinen eigenen kleinen Onlineshop: Produkte mit Varianten und Rabatten, Karte, PayPal, Überweisung oder Nachnahme, Versandzonen und Bestellungen.',
  ogTitle: 'Shop: Benutzerhandbuch',
  cta: 'Dieses Handbuch ist für den Inhaber des Shops. {link}, um deinen Shop zu verwalten.',
  ctaLink: 'Melde dich an',
  kicker: 'Shop · Benutzerhandbuch',
  title: 'So führst du deinen Shop',
  intro:
    'Der Shop ist ein kleiner Onlineshop auf deinem eigenen Server: Du fügst Produkte hinzu, legst fest, wie Käufer zahlen und wohin du versendest, und verfolgst jede Bestellung bis zur Zustellung. Käufer brauchen kein Konto.',
  contents: 'Inhalt',
  sections: [
    {
      id: 'start',
      title: '1. Den Shop eröffnen',
      blocks: [
        {
          steps: [
            'Melde dich an und gib dem Shop einen **Namen**. Seine Webadresse entsteht aus dem Namen; du kannst sie ändern.',
            'Wähle die **Währung** und den **Mehrwertsteuersatz**. Eingegebene Preise enthalten die MwSt.; nimm 0, wenn du keine MwSt. berechnest.',
            'Folge der Checkliste in der **Übersicht**: ein Produkt, eine Zahlungsart, Versand, deine Verkäuferangaben, dann **öffne den Shop** unter Einstellungen.',
          ],
        },
        {
          tip: 'Solange der Shop geschlossen ist, siehst nur du ihn: Öffne ihn aus der Übersicht, um zu sehen, wie Käufer ihn sehen werden.',
        },
      ],
    },
    {
      id: 'products',
      title: '2. Produkte, Varianten und Rabatte',
      blocks: [
        {
          p: 'Ein Produkt hat einen Namen, eine Kurzbeschreibung für Listen, eine längere Beschreibung, eine Kategorie und bis zu acht **Fotos**; das erste Foto ist das Hauptfoto.',
        },
        {
          list: [
            '**Varianten**: Größen, Farben … jede mit eigenem Preis, eigener Nummer und eigenem Lagerbestand. Ein einfaches Produkt hat eine Variante ohne Namen.',
            'Der **Lagerbestand** wird gezählt, wenn du ihn einträgst: eine Bestellung nimmt ihn, eine stornierte gibt ihn zurück, und ausverkaufte Varianten kann man nicht kaufen.',
            '**Rabattpreis**: niedriger als der Preis, von einem Beginn bis zu einem Ende (beides optional). Der Shop zeigt den alten Preis durchgestrichen.',
            '**Entwürfe** (nicht „im Verkauf“) siehst nur du.',
          ],
        },
      ],
    },
    {
      id: 'payments',
      title: '3. Zahlungsarten',
      blocks: [
        {
          p: 'Das Geld geht direkt auf deine eigenen Konten. Schalte unter **Zahlungen** die gewünschten Arten ein:',
        },
        {
          list: [
            '**Karte (Stripe)**: Füge deinen geheimen Schlüssel ein und lege in Stripe den auf der Seite gezeigten Webhook mit seinem Signaturgeheimnis an. Bezahlte Bestellungen werden von selbst als bezahlt markiert.',
            '**PayPal**: Client-ID und Secret deiner App; probiere es zuerst in der Sandbox, dann schalte auf live.',
            '**Überweisung**: deine IBAN und der Kontoinhaber. Die Bestellseite zeigt sie mit dem Verwendungszweck; markiere die Bestellung als bezahlt, wenn das Geld da ist.',
            '**Nachnahme**: optionale Zusatzgebühr; der Paketdienst kassiert, und die Bestellung gilt als bezahlt, wenn du sie als zugestellt markierst.',
          ],
        },
        {
          tip: 'Geheime Schlüssel werden verschlüsselt gespeichert und nie wieder angezeigt. Kartendaten erreichen deinen Server nie: Käufer zahlen auf der Seite von Stripe oder PayPal.',
        },
      ],
    },
    {
      id: 'shipping',
      title: '4. Versand',
      blocks: [
        {
          p: 'Lege für jede Gruppe von Ländern, in die du versendest, eine **Zone** an, mit einem Pauschalpreis pro Bestellung und auf Wunsch kostenlosem Versand ab einem Betrag. „Überall sonst“ deckt alle anderen Länder ab. Käufer aus Ländern ohne Zone können nicht bestellen.',
        },
      ],
    },
    {
      id: 'orders',
      title: '5. Bestellungen',
      blocks: [
        {
          steps: [
            'Du bekommst für jede neue Bestellung eine **E-Mail** (Karte und PayPal, sobald bezahlt).',
            'Öffne die Bestellung: Käufer, Adresse, Artikel, Zahlung. Markiere sie als **bezahlt** (Überweisung, Nachnahme), dann als **versendet**.',
            'Trage den **Paketdienst** und die **Sendungsnummer** ein: Die Seite des Käufers verlinkt die Sendungsverfolgung.',
            'Markiere sie als **zugestellt**. Stornieren legt die Produkte zurück ins Lager; erstatte Geld selbst.',
          ],
        },
        {
          p: 'Karten- und PayPal-Bestellungen, die nicht innerhalb eines Tages bezahlt werden, werden von selbst storniert, damit ihr Lagerbestand wieder frei ist.',
        },
      ],
    },
    {
      id: 'buyers',
      title: '6. Was Käufer sehen',
      blocks: [
        {
          list: [
            'Den Shop, seine Kategorien und Produkte mit Preisen, Kampagnen und Rabatten, ohne Anmeldung; sie können Produkte nebeneinander **vergleichen**, sie **teilen** oder ihren **QR-Code** scannen.',
            'Einen **Warenkorb** in ihrem Browser und die Kasse mit Adresse, Versandkosten, einem **Gutscheincode** und der Zahlungsart.',
            'Die **Seite ihrer Bestellung** hinter einem geheimen Link: Status, Zahlung und Sendungsverfolgung. Kann der Server E-Mails senden, erhalten sie den Link auch in einer Bestätigungs-E-Mail.',
            'Ein freiwilliges **Konto** in deinem Shop: Sie melden sich mit einem Link per E-Mail an, sehen alle ihre Bestellungen, schreiben dir und verwalten den Newsletter. Kein Passwort.',
            'Sobald die Bestellung unterwegs ist, können sie auf der Bestellseite **bewerten**, was sie gekauft haben.',
          ],
        },
      ],
    },
    {
      id: 'legal',
      title: '7. Verkäuferangaben, AGB und Suchmaschinen',
      blocks: [
        {
          p: 'Trage unter **Einstellungen** ein, wer verkauft (Name oder Firma, Adresse, Register- und USt-Nummer, Kontakt), deine **AGB** und die **Rückgabe**. Der Shop zeigt sie auf seiner Seite „Verkäufer und AGB“, mit dem 14-tägigen Widerrufsrecht der EU; Shops in Rumänien können die ANPC-Links zeigen.',
        },
        {
          p: 'Geöffnete Shops und ihre Produkte sind für Suchmaschinen auffindbar: Jede Seite hat ihre eigene Adresse, Beschreibung und Preisangaben, und der Shop listet sie in einer Sitemap.',
        },
      ],
    },
    {
      id: 'catalogue',
      title: '8. Produkttypen, Lieferanten und viele Produkte',
      blocks: [
        {
          p: 'Unter **Produkte → Typen und Felder** gibst du jeder Art von Produkt eigene Felder: den Speicher eines Handys, das Material eines Hemds, den Autor eines Buchs. Beginne mit einem fertigen Typ (Elektronik, Kleidung, Schuhe, Bücher, Lebensmittel, Kosmetik, Möbel, Schmuck, Spielzeug, Sport, Handgemachtes) in deiner Sprache und ändere ihn nach Belieben. Produkte dieses Typs füllen die Felder aus; der Shop zeigt sie als **Details** und im **Vergleich**.',
        },
        {
          list: [
            '**Lieferanten** halten fest, wer deine Produkte herstellt oder liefert, mit Kontakten. Ein Lieferant, der als **Marke** gezeigt wird, erscheint bei seinen Produkten und in Suchmaschinen.',
            'Die Produktliste hat eine **Suche** und Filter nach Typ, Lieferant und Status. Hake mehrere Produkte an, um sie auf einmal in den Verkauf zu stellen, zu Entwürfen zu machen oder zu löschen; **Kopieren** macht aus einem Produkt einen Entwurf.',
          ],
        },
      ],
    },
    {
      id: 'promotions',
      title: '9. Kampagnen, Gutscheine und Hinweise',
      blocks: [
        {
          list: [
            '**Kampagnen** geben einen Prozentsatz auf alles, eine Kategorie oder ausgewählte Produkte, von einem Beginn bis zu einem Ende. Der Shop zeigt den alten Preis durchgestrichen.',
            '**Gutscheine** sind Codes, die Käufer an der Kasse eingeben: ein Prozentsatz oder ein Betrag weniger auf die Produkte oder kostenloser Versand; auf Wunsch mit Mindestbestellwert, einer Zahl von Einlösungen und einmal pro Käufer.',
            '**Hinweise** zeigen eine Leiste auf jeder Seite oder ein Banner auf der Startseite, mit einem Gutscheincode zum Kopieren oder einem Link zu einer Kampagne.',
          ],
        },
        {
          tip: 'Treffen Rabattpreis und Kampagne aufeinander, gilt der niedrigere Preis. Ein Gutschein kommt obendrauf, nur auf die Produkte.',
        },
      ],
    },
    {
      id: 'newsletter',
      title: '10. Newsletter',
      blocks: [
        {
          steps: [
            'Käufer melden sich im Fuß des Shops, in ihrem Konto oder an der Kasse an und bestätigen mit dem Link in einer E-Mail.',
            'Unter **Marketing → Newsletter** schreibst du Betreff und Text, fügst auf Wunsch einen Gutschein hinzu und wählst Produkte **im Angebot** oder **neue** (oder alles im Angebot bzw. die neuesten auf einmal).',
            'Speichere, um die E-Mail wie am Computer und auf dem Handy zu sehen, schicke dir einen **Test** und sende sie dann an alle Abonnenten.',
          ],
        },
        {
          tip: 'Jeder Newsletter enthält einen Link zum Abmelden. Der Shop sendet E-Mails über die SMTP-Einstellungen des Servers; ohne sie gibt es keine Newsletter und keine Anmeldelinks.',
        },
      ],
    },
    {
      id: 'reviews',
      title: '11. Bewertungen und Nachrichten',
      blocks: [
        {
          list: [
            'Unter **Bewertungen** wählst du, ob du jede Bewertung prüfst oder verifizierte Käufer sofort veröffentlichen dürfen. Veröffentliche, verberge, beantworte oder lösche jede einzelne.',
            'Unter **Nachrichten** liest und beantwortest du Käufer, die aus ihrem Konto geschrieben haben; sie erhalten eine E-Mail mit deiner Antwort. Du erhältst eine E-Mail für jede neue Nachricht.',
          ],
        },
      ],
    },
    {
      id: 'design',
      title: '12. Design, Suchmaschinen und Tracking',
      blocks: [
        {
          p: 'Unter **Einstellungen → Design** fügst du Logo und Banner hinzu und wählst Farben, Schriften, Ecken, Karten und wie viele Produkte pro Reihe erscheinen; der Editor warnt, wenn Text schwer lesbar ist.',
        },
        {
          list: [
            'Unter **Suchmaschinen** legst du Titel und Beschreibung des Shops mit Vorschau fest und siehst für jedes Produkt einen Wert mit Tipps (Fotos, Texte, Kategorie, Marke, Strichcode). Jedes Produkt hat auch eigene Suchmaschinentexte.',
            'Der Inhaber kann **Google Analytics**, **Google Ads**, **Tag Manager**, das **Meta-Pixel** oder anderen Code hinzufügen sowie die Verifizierungscodes für die Google Search Console und Bing. Käufer werden zuerst gefragt; Tags laden erst nach ihrer Zustimmung.',
            'Jedes Produkt lässt sich in sozialen Netzwerken **teilen** oder als **QR-Code** herunterladen und drucken.',
          ],
        },
      ],
    },
    {
      id: 'team',
      title: '13. Dein Team',
      blocks: [
        {
          list: [
            'Unter **Einstellungen → Team** erstellst du einen Einladungslink mit einer oder mehreren Rollen und schickst ihn: **Manager** (alles außer Zahlungen, Tracking und Team), **Produkte** (Produkte, Bestand, Typen, Lieferanten, Suchmaschinen), **Marketing** (Aktionen, Newsletter, Bewertungen, Design, Statistik), **Kundenservice** (Nachrichten von Käufern, Bewertungen, Bestellungen), **Versand und Zustellung** (zu versendende Bestellungen, Versandzonen) oder **Wartung** (Öffnen, Wartungsmodus, Verkäuferangaben, Sprachen, Design).',
            'Die **Übersicht** jedes Mitglieds zeigt die Aufgaben seiner Rollen: zu versendende Bestellungen mit einer Schaltfläche zum Markieren, unbeantwortete Nachrichten und zu veröffentlichende Bewertungen, ausverkaufte Produkte und solche mit wenig Bestand, laufende Kampagnen und Newsletter, und was dem Shop noch fehlt. Ändere die Rollen eines Mitglieds oder entferne es jederzeit; Mitglieder können das Team in der Übersicht verlassen.',
          ],
        },
      ],
    },
    {
      id: 'stats',
      title: '14. Statistik',
      blocks: [
        {
          p: 'Unter **Statistik** siehst du Umsatz, Bestellungen, die durchschnittliche Bestellung, Produktaufrufe und Konversion für 7, 30, 90 oder 365 Tage im Vergleich zum Zeitraum davor; Umsatz, Bestellungen und Aufrufe pro Tag oder Woche; und die Zahlen jedes Produkts, sortierbar.',
        },
      ],
    },
    {
      id: 'rules',
      title: '15. Automatische Rabatte und kostenloser Versand',
      blocks: [
        {
          p: 'Unter **Marketing → Aktionen** legst du Regeln an, die ohne Code gelten: **kostenloser Versand** ab einem Betrag oder **Prozent auf alle Produkte** ab einer Stückzahl (z. B. 3 Stück: −5 %, 5 Stück: −10 %) oder einem Betrag. Werden mehrere erreicht, zählt die höchste.',
        },
        {
          list: [
            'Käufer sehen den Rabatt im **Warenkorb** und an der **Kasse**, bevor sie bestellen, und einen Hinweis wie „Noch 2 Stück mehr für 10 % auf alles“ oder „Noch 12 € mehr für kostenlosen Versand“.',
            'Ein Gutschein kommt obendrauf, auf den Rest; die Bestellung behält beide Rabatte mit ihren Namen.',
          ],
        },
      ],
    },
    {
      id: 'languages',
      title: '16. Wartungsmodus und Sprachen',
      blocks: [
        {
          p: 'Unter **Einstellungen** schaltest du den **Wartungsmodus** mit einer Nachricht ein: Käufer sehen sie statt des Shops und können nicht bestellen, dein Team sieht weiterhin alles. In der Übersicht schaltest du ihn mit einem Klick aus.',
        },
        {
          steps: [
            'Unter **Einstellungen → Sprachen** wählst du die Sprache, aus der übersetzt wird, und **kopierst** die Texte, die Käufer sehen (oder lädst sie herunter).',
            'Übersetze sie mit einem Übersetzer oder einer KI und lass die Namen vor den Doppelpunkten und die Wörter in geschweiften Klammern unverändert.',
            'Füge sie mit einem Code (fr, pl, nl…) und dem Namen der Sprache wieder ein und speichere. Die Seite sagt dir, wie viele Texte übernommen wurden, fehlen oder abgelehnt wurden. Mit de, ro, hu, it, es oder en änderst du stattdessen die Formulierungen einer eingebauten Sprache.',
          ],
        },
        {
          tip: 'Käufer wählen die Sprache unten im Shop; du kannst auch eine deiner Sprachen zu der machen, die Käufer zuerst sehen.',
        },
      ],
    },
    {
      id: 'devquake',
      title: '17. Konten für DevQuake-Mitglieder',
      blocks: [
        {
          p: 'Auf einer Seite, die zu DevQuake gehört, melden sich Mitglieder mit **Weiter mit DevQuake** auf der Kontoseite in deinem Shop an: DevQuake fragt sie einmal, ob ihre E-Mail-Adresse genutzt werden darf, und ihr Konto im Shop wird mit ihrem Namen und dieser Adresse ausgefüllt. Bestellungen, die sie damit aufgegeben haben, erscheinen, und der Shop erkennt sie bei den nächsten Besuchen wieder, bis sie sich abmelden.',
        },
        {
          list: [
            'Alle anderen eröffnen ein Konto weiter mit einer beliebigen E-Mail-Adresse, über einen Link.',
            'Käufer speichern ihre **Lieferangaben** in ihrem Konto, und die Kasse füllt sie aus; an der Kasse können sie neue Angaben für das nächste Mal behalten.',
            'Die Administratoren der Seite entscheiden, ob Mitglieder eigene Shops eröffnen dürfen und ob Besucher über der Fußzeile des Shops eine kurze Vorstellung von DevQuake sehen.',
            'Mit **ungefähren Preisen in anderen Währungen** wählen Käufer unten im Shop eine Währung und sehen darin „≈“-Preise; sie zahlen weiter in der Währung deines Shops.',
          ],
        },
      ],
    },
    {
      id: 'interest',
      title: '18. Interessenabfragen vor dem Verkauf',
      blocks: [
        {
          p: 'Nicht sicher, ob sich ein Produkt verkauft? Wenn die Administratoren der Seite **Interessenabfragen** einschalten, stellst du ein Produkt auf seiner Seite auf **Abstimmen lassen statt verkaufen**. Käufer sehen dann statt des Preises eine Abstimmung: ob sie es wollen, was sie zahlen würden und welche Ausführung (die Mehrfachauswahl-Felder seines Typs, etwa Farben und Größen). Bestellen kann es solange niemand.',
        },
        {
          list: [
            'Trag auf der Seite des Produkts **Kosten pro Stück** und eine **einmalige Investition** ein.',
            'Unter **Statistik → Interessenabfragen** siehst du die Nachfrage, was die Abstimmenden zahlen würden, einen vorgeschlagenen Preis, die erwarteten Käufer, Umsatz, Gewinn, Rendite und Gewinnschwelle sowie die gefragtesten Ausführungen.',
            'Zum Verkaufen schaltest du die Abstimmung aus und gibst den Ausführungen ihre echten Preise.',
          ],
        },
      ],
    },
  ],
  questions: 'Fragen oder Ideen? Schreib an {email}.',
  back: 'Zurück zu deinem Shop',
};

const ro: Manual = {
  metaTitle: 'Manual de utilizare · Magazin',
  metaDescription:
    'Cum îți administrezi propriul magazin online: produse cu variante și reduceri, card, PayPal, transfer bancar sau ramburs, zone de livrare și comenzi.',
  ogTitle: 'Magazin: manual de utilizare',
  cta: 'Acest manual e pentru proprietarul magazinului. {link} ca să-ți administrezi magazinul.',
  ctaLink: 'Autentifică-te',
  kicker: 'Magazin · Manual de utilizare',
  title: 'Cum îți administrezi magazinul',
  intro:
    'Magazinul e un mic magazin online pe propriul tău server: adaugi produse, alegi cum plătesc cumpărătorii și unde livrezi, și urmărești fiecare comandă până la livrare. Cumpărătorii nu au nevoie de cont.',
  contents: 'Cuprins',
  sections: [
    {
      id: 'start',
      title: '1. Deschiderea magazinului',
      blocks: [
        {
          steps: [
            'Autentifică-te și dă-i magazinului un **nume**. Adresa web se face din nume; o poți schimba.',
            'Alege **moneda** și **cota TVA**. Prețurile scrise includ TVA; pune 0 dacă nu percepi TVA.',
            'Urmează lista din **Prezentare**: un produs, o metodă de plată, livrarea, datele de vânzător, apoi **deschide magazinul** din Setări.',
          ],
        },
        {
          tip: 'Cât timp magazinul e închis, doar tu îl vezi: deschide-l din Prezentare ca să vezi cum îl vor vedea cumpărătorii.',
        },
      ],
    },
    {
      id: 'products',
      title: '2. Produse, variante și reduceri',
      blocks: [
        {
          p: 'Un produs are un nume, o descriere scurtă pentru liste, o descriere mai lungă, o categorie și până la opt **fotografii**; prima e cea principală.',
        },
        {
          list: [
            '**Variante**: mărimi, culori… fiecare cu prețul, codul și stocul ei. Un produs simplu are o singură variantă, fără nume.',
            '**Stocul** se numără dacă îl completezi: o comandă îl scade, o comandă anulată îl readuce, iar variantele epuizate nu pot fi cumpărate.',
            '**Prețul redus**: mai mic decât prețul, de la un început până la un sfârșit (ambele opționale). Magazinul arată prețul vechi tăiat.',
            '**Ciornele** (nu „la vânzare”) le vezi doar tu.',
          ],
        },
      ],
    },
    {
      id: 'payments',
      title: '3. Metode de plată',
      blocks: [
        {
          p: 'Banii ajung direct în conturile tale. Pornește metodele dorite din **Plăți**:',
        },
        {
          list: [
            '**Card (Stripe)**: lipește cheia secretă și adaugă în Stripe webhook-ul afișat pe pagină, cu secretul lui de semnare. Comenzile plătite se marchează singure ca plătite.',
            '**PayPal**: client ID-ul și secretul aplicației tale; încearcă întâi în sandbox, apoi treci pe live.',
            '**Transfer bancar**: IBAN-ul și titularul contului. Pagina comenzii le arată cu referința comenzii; marchează comanda ca plătită când sosesc banii.',
            '**Ramburs**: taxă suplimentară opțională; curierul încasează, iar comanda e plătită când o marchezi ca livrată.',
          ],
        },
        {
          tip: 'Cheile secrete sunt salvate criptat și nu mai sunt afișate. Datele cardului nu ajung niciodată pe serverul tău: cumpărătorii plătesc pe pagina Stripe sau PayPal.',
        },
      ],
    },
    {
      id: 'shipping',
      title: '4. Livrare',
      blocks: [
        {
          p: 'Fă câte o **zonă** pentru fiecare grup de țări în care livrezi, cu un tarif fix pe comandă și, dacă vrei, livrare gratuită peste o sumă. „Restul lumii” acoperă toate celelalte țări. Cumpărătorii din țări fără zonă nu pot comanda.',
        },
      ],
    },
    {
      id: 'orders',
      title: '5. Comenzi',
      blocks: [
        {
          steps: [
            'Primești un **e-mail** la fiecare comandă nouă (cele cu card și PayPal după ce sunt plătite).',
            'Deschide comanda: cumpărător, adresă, articole, plată. Marchează-o ca **plătită** (transfer, ramburs), apoi ca **expediată**.',
            'Adaugă **curierul** și **AWB-ul**: pagina cumpărătorului duce la urmărirea coletului.',
            'Marchează-o ca **livrată**. Anularea readuce produsele în stoc; banii îi returnezi tu.',
          ],
        },
        {
          p: 'Comenzile cu card și PayPal neplătite într-o zi se anulează singure, ca stocul lor să fie din nou liber.',
        },
      ],
    },
    {
      id: 'buyers',
      title: '6. Ce văd cumpărătorii',
      blocks: [
        {
          list: [
            'Magazinul, categoriile și produsele, cu prețuri, campanii și reduceri, fără autentificare; pot **compara** produse unul lângă altul, le pot **distribui** sau le pot scana **codul QR**.',
            'Un **coș** păstrat în browserul lor și finalizarea comenzii cu adresa, costul livrării, un **cod de voucher** și metoda de plată.',
            '**Pagina comenzii**, în spatele unui link secret: starea, plata și urmărirea coletului. Când serverul poate trimite e-mailuri, primesc linkul și într-un e-mail de confirmare.',
            'Un **cont** opțional în magazinul tău: se autentifică cu un link primit pe e-mail, își văd toate comenzile, îți scriu și își gestionează newsletterul. Fără parolă.',
            'După ce comanda e pe drum, pot **nota** ce au cumpărat din pagina comenzii.',
          ],
        },
      ],
    },
    {
      id: 'legal',
      title: '7. Datele vânzătorului, termeni și motoare de căutare',
      blocks: [
        {
          p: 'În **Setări** completezi cine vinde (nume sau firmă, adresă, Nr. Reg. Com. și CUI, contact), **termenii și condițiile** și **retururile**. Magazinul le arată pe pagina „Vânzător și termeni”, cu dreptul UE de retragere în 14 zile; magazinele din România pot afișa linkurile ANPC.',
        },
        {
          p: 'Magazinele deschise și produsele lor pot fi găsite de motoarele de căutare: fiecare pagină are adresa, descrierea și datele de preț proprii, iar magazinul le listează într-un sitemap.',
        },
      ],
    },
    {
      id: 'catalogue',
      title: '8. Tipuri de produse, furnizori și multe produse',
      blocks: [
        {
          p: 'La **Produse → Tipuri și câmpuri**, dă fiecărui fel de produs câmpurile lui: memoria unui telefon, compoziția unei cămăși, autorul unei cărți. Pornește de la un tip gata făcut (electronice, îmbrăcăminte, încălțăminte, cărți, alimente, cosmetice, mobilă, bijuterii, jucării, sport, handmade) în limba ta și schimbă-l cum vrei. Produsele de acel tip completează câmpurile; magazinul le arată la **Detalii** și în **comparație**.',
        },
        {
          list: [
            '**Furnizorii** păstrează cine îți face sau îți livrează produsele, cu contactele lor. Un furnizor afișat ca **marcă** apare la produsele lui și în motoarele de căutare.',
            'Lista de produse are **căutare** și filtre după tip, furnizor și stare. Bifează mai multe produse ca să le pui la vânzare, să le faci ciorne sau să le ștergi deodată; **Copiază** face o ciornă dintr-un produs.',
          ],
        },
      ],
    },
    {
      id: 'promotions',
      title: '9. Campanii, vouchere și anunțuri',
      blocks: [
        {
          list: [
            '**Campaniile** scad un procent la tot, la o categorie sau la produse alese, de la un început la un sfârșit. Magazinul arată prețul vechi tăiat.',
            '**Voucherele** sunt coduri pe care cumpărătorii le scriu la finalizarea comenzii: un procent sau o sumă în minus la produse, sau livrare gratuită; cu comandă minimă, număr de utilizări și o dată per cumpărător, dacă vrei.',
            '**Anunțurile** afișează o bară pe fiecare pagină sau un banner pe prima pagină, cu un cod de voucher de copiat sau un link spre o campanie.',
          ],
        },
        {
          tip: 'Când un preț redus și o campanie se întâlnesc, câștigă prețul mai mic. Voucherul se adaugă peste, doar la produse.',
        },
      ],
    },
    {
      id: 'newsletter',
      title: '10. Newslettere',
      blocks: [
        {
          steps: [
            'Cumpărătorii se abonează în subsolul magazinului, din cont sau la finalizarea comenzii și confirmă cu linkul dintr-un e-mail.',
            'La **Marketing → Newslettere**, scrie un subiect și un text, adaugă un voucher dacă vrei și alege produse **la ofertă** sau **noi** (sau adaugă deodată tot ce e redus sau cele mai noi).',
            'Salvează ca să vezi e-mailul ca pe calculator și ca pe telefon, trimite-ți un **test**, apoi trimite-l tuturor abonaților.',
          ],
        },
        {
          tip: 'Fiecare newsletter are un link de dezabonare. Magazinul trimite e-mailuri prin setările SMTP ale serverului; fără ele nu există newslettere și nici linkuri de autentificare.',
        },
      ],
    },
    {
      id: 'reviews',
      title: '11. Recenzii și mesaje',
      blocks: [
        {
          list: [
            'La **Recenzii**, alegi dacă aprobi fiecare recenzie sau lași cumpărătorii verificați să publice imediat. Publică, ascunde, răspunde sau șterge fiecare recenzie.',
            'La **Mesaje**, citești și răspunzi cumpărătorilor care ți-au scris din cont; ei primesc un e-mail cu răspunsul tău. Tu primești un e-mail pentru fiecare mesaj nou.',
          ],
        },
      ],
    },
    {
      id: 'design',
      title: '12. Design, motoare de căutare și urmărire',
      blocks: [
        {
          p: 'La **Setări → Design**, adaugă logo-ul și un banner și alege culorile, fonturile, colțurile, cardurile și câte produse apar pe rând; editorul te avertizează când textul se citește greu.',
        },
        {
          list: [
            'La **Motoare de căutare**, setezi titlul și descrierea magazinului cu previzualizare și vezi un scor cu sfaturi pentru fiecare produs (fotografii, texte, categorie, marcă, cod de bare). Fiecare produs are și propriile texte pentru motoarele de căutare.',
            'Proprietarul poate adăuga **Google Analytics**, **Google Ads**, **Tag Manager**, **pixelul Meta** sau alt cod, plus codurile de verificare pentru Google Search Console și Bing. Cumpărătorii sunt întrebați întâi; etichetele se încarcă doar după acordul lor.',
            'Fiecare produs poate fi **distribuit** pe rețele sociale sau ca **cod QR** de descărcat sau tipărit.',
          ],
        },
      ],
    },
    {
      id: 'team',
      title: '13. Echipa ta',
      blocks: [
        {
          list: [
            'La **Setări → Echipă**, creează un link de invitație cu unul sau mai multe roluri și trimite-l: **Manager** (tot, în afară de plăți, urmărire și echipă), **Produse** (produse, stoc, tipuri, furnizori, motoare de căutare), **Marketing** (promoții, newslettere, recenzii, design, statistici), **Asistență clienți** (mesajele cumpărătorilor, recenzii, comenzi), **Expediere și livrare** (comenzi de expediat, zone de livrare) sau **Mentenanță** (deschidere, mod de mentenanță, datele vânzătorului, limbi, design).',
            '**Prezentarea** fiecărui membru arată sarcinile rolurilor lui: comenzi de expediat cu un buton pentru a le marca expediate, mesaje fără răspuns și recenzii de publicat, produse epuizate sau cu stoc mic, campanii și newslettere în curs, și ce mai lipsește magazinului. Schimbă rolurile unui membru sau elimină-l oricând; membrii pot părăsi echipa din Prezentare.',
          ],
        },
      ],
    },
    {
      id: 'stats',
      title: '14. Statistici',
      blocks: [
        {
          p: 'La **Statistici**, vezi vânzările, comenzile, comanda medie, vizualizările produselor și conversia pentru 7, 30, 90 sau 365 de zile, comparate cu perioada anterioară; vânzările, comenzile și vizualizările pe zile sau săptămâni; și cifrele fiecărui produs, pe care le poți ordona.',
        },
      ],
    },
    {
      id: 'rules',
      title: '15. Reduceri automate și livrare gratuită',
      blocks: [
        {
          p: 'La **Marketing → Promoții**, adaugă reguli care se aplică fără cod: **livrare gratuită** de la o sumă, sau un **procent la toate produsele** de la un număr de bucăți (de ex. 3 bucăți: −5 %, 5 bucăți: −10 %) sau de la o sumă. Când se ating mai multe, contează cea mai mare.',
        },
        {
          list: [
            'Cumpărătorii văd reducerea în **coș** și la **finalizarea comenzii** înainte să comande, plus un îndemn ca „Mai adaugă 2 bucăți pentru 10 % la tot” sau „Mai adaugă 12 lei pentru livrare gratuită”.',
            'Voucherul se adaugă peste, la ce rămâne; comanda păstrează ambele reduceri cu numele lor.',
          ],
        },
      ],
    },
    {
      id: 'languages',
      title: '16. Mod de mentenanță și limbi',
      blocks: [
        {
          p: 'La **Setări**, pornește **modul de mentenanță** cu un mesaj: cumpărătorii îl văd în locul magazinului și nu pot comanda, iar echipa ta vede în continuare tot. Îl oprești din Prezentare cu un clic.',
        },
        {
          steps: [
            'La **Setări → Limbi**, alege limba din care traduci și **copiază** textele pe care le văd cumpărătorii (sau descarcă-le).',
            'Tradu-le cu un traducător sau un AI, păstrând neschimbate numele dinaintea celor două puncte și cuvintele dintre acolade.',
            'Lipește-le înapoi cu un cod (fr, pl, nl…) și numele limbii, apoi salvează. Pagina îți spune câte texte au fost preluate, lipsesc sau au fost respinse. Cu de, ro, hu, it, es sau en schimbi în schimb formulările unei limbi încorporate.',
          ],
        },
        {
          tip: 'Cumpărătorii aleg limba în partea de jos a magazinului; poți face și ca una dintre limbile tale să fie prima pe care o văd.',
        },
      ],
    },
    {
      id: 'devquake',
      title: '17. Conturi pentru membrii DevQuake',
      blocks: [
        {
          p: 'Pe un site care face parte din DevQuake, membrii intră în magazinul tău cu **Continuă cu DevQuake** pe pagina contului: DevQuake îi întreabă o singură dată dacă își permit adresa de e-mail, iar contul lor din magazin se completează cu numele și acea adresă. Comenzile plasate cu ea apar, iar magazinul îi recunoaște la vizitele următoare până ies din cont.',
        },
        {
          list: [
            'Ceilalți își deschid în continuare un cont cu orice adresă de e-mail, printr-un link.',
            'Cumpărătorii își salvează **datele de livrare** în cont, iar finalizarea comenzii le completează; la finalizare pot păstra datele noi pentru data viitoare.',
            'Administratorii site-ului decid dacă membrii pot deschide magazine proprii și dacă vizitatorii văd deasupra subsolului magazinului o scurtă prezentare a DevQuake.',
            'Cu **prețuri aproximative în alte monede**, cumpărătorii aleg o monedă în partea de jos a magazinului și văd în ea prețuri „≈”; plătesc în continuare în moneda magazinului tău.',
          ],
        },
      ],
    },
    {
      id: 'interest',
      title: '18. Voturi de interes înainte de vânzare',
      blocks: [
        {
          p: 'Nu știi sigur dacă un produs se va vinde? Când administratorii site-ului pornesc **Voturile de interes**, treci un produs pe **Cere voturi în loc să-l vinzi** pe pagina lui. Cumpărătorii văd atunci un vot în locul prețului: dacă îl vor, cât ar plăti și ce variantă (câmpurile cu alegere multiplă ale tipului, de ex. culori și mărimi). Între timp nu îl poate comanda nimeni.',
        },
        {
          list: [
            'Trece pe pagina produsului **costul pe bucată** și o **investiție unică**.',
            'La **Statistici → Voturi de interes** vezi cererea, cât ar plăti votanții, un preț sugerat, cumpărătorii așteptați, veniturile, profitul, randamentul și pragul de rentabilitate, plus variantele cele mai dorite.',
            'Ca să începi vânzarea, oprește votul și dă variantelor prețurile reale.',
          ],
        },
      ],
    },
  ],
  questions: 'Întrebări sau idei? Scrie la {email}.',
  back: 'Înapoi la magazinul tău',
};

const hu: Manual = {
  metaTitle: 'Felhasználói kézikönyv · Bolt',
  metaDescription:
    'Így működtetheted a saját kis webáruházad: termékek változatokkal és akciókkal, kártya, PayPal, átutalás vagy utánvét, szállítási zónák és rendelések.',
  ogTitle: 'Bolt: felhasználói kézikönyv',
  cta: 'Ez a kézikönyv a bolt tulajdonosának szól. {link} a boltod kezeléséhez.',
  ctaLink: 'Jelentkezz be',
  kicker: 'Bolt · Felhasználói kézikönyv',
  title: 'Így működteted a boltodat',
  intro:
    'A Bolt egy kis webáruház a saját szervereden: termékeket adsz hozzá, eldöntöd, hogyan fizetnek a vásárlók és hová szállítasz, és minden rendelést követsz a kézbesítésig. A vásárlóknak nem kell fiók.',
  contents: 'Tartalom',
  sections: [
    {
      id: 'start',
      title: '1. A bolt megnyitása',
      blocks: [
        {
          steps: [
            'Jelentkezz be, és adj a boltnak **nevet**. A webcíme a névből készül; módosíthatod.',
            'Válaszd ki a **pénznemet** és az **ÁFA-kulcsot**. A beírt árak tartalmazzák az ÁFÁ-t; 0, ha nem számolsz fel ÁFÁ-t.',
            'Kövesd az **Áttekintés** listáját: egy termék, egy fizetési mód, szállítás, az eladó adatai, aztán **nyisd meg a boltot** a Beállításokban.',
          ],
        },
        {
          tip: 'Amíg a bolt zárva van, csak te látod: nyisd meg az Áttekintésből, hogy lásd, hogyan fogják látni a vásárlók.',
        },
      ],
    },
    {
      id: 'products',
      title: '2. Termékek, változatok és akciók',
      blocks: [
        {
          p: 'Egy terméknek van neve, rövid leírása a listákhoz, hosszabb leírása, kategóriája és legfeljebb nyolc **fotója**; az első a fő fotó.',
        },
        {
          list: [
            '**Változatok**: méretek, színek… mindegyik saját árral, cikkszámmal és készlettel. Egy egyszerű terméknek egy név nélküli változata van.',
            'A **készletet** akkor számolja, ha kitöltöd: a rendelés levonja, a lemondott rendelés visszaadja, az elfogyott változatok nem vásárolhatók.',
            '**Akciós ár**: alacsonyabb az árnál, egy kezdettől egy végig (mindkettő elhagyható). A bolt áthúzva mutatja a régi árat.',
            'A **piszkozatokat** (nem „eladó”) csak te látod.',
          ],
        },
      ],
    },
    {
      id: 'payments',
      title: '3. Fizetési módok',
      blocks: [
        {
          p: 'A pénz közvetlenül a saját számláidra érkezik. A kívánt módokat a **Fizetés** alatt kapcsolod be:',
        },
        {
          list: [
            '**Kártya (Stripe)**: illeszd be a titkos kulcsodat, és add hozzá a Stripe-ban az oldalon látható webhookot az aláíró titkával. A kifizetett rendelések maguktól kifizetettnek jelölődnek.',
            '**PayPal**: az alkalmazásod client ID-ja és secretje; előbb próbáld ki a sandboxban, aztán válts élesre.',
            '**Átutalás**: az IBAN-od és a számlatulajdonos. A rendelés oldala a rendelés azonosítójával együtt mutatja; jelöld kifizetettnek, ha megérkezett a pénz.',
            '**Utánvét**: elhagyható felár; a futár szedi be, és a rendelés kifizetettnek számít, amikor kézbesítettnek jelölöd.',
          ],
        },
        {
          tip: 'A titkos kulcsokat titkosítva tároljuk, és többé nem jelennek meg. A kártyaadatok soha nem jutnak el a szerveredre: a vásárlók a Stripe vagy a PayPal saját oldalán fizetnek.',
        },
      ],
    },
    {
      id: 'shipping',
      title: '4. Szállítás',
      blocks: [
        {
          p: 'Készíts egy **zónát** minden országcsoporthoz, ahová szállítasz, rendelésenkénti átalánydíjjal és, ha szeretnéd, egy összeg feletti ingyenes szállítással. A „Minden más ország” lefedi a többit. Zóna nélküli országokból nem lehet rendelni.',
        },
      ],
    },
    {
      id: 'orders',
      title: '5. Rendelések',
      blocks: [
        {
          steps: [
            'Minden új rendelésről **e-mailt** kapsz (a kártyás és PayPal-rendelésekről a kifizetésük után).',
            'Nyisd meg a rendelést: vásárló, cím, tételek, fizetés. Jelöld **kifizetettnek** (átutalás, utánvét), majd **feladottnak**.',
            'Add meg a **futárszolgálatot** és a **követési számot**: a vásárló oldala a csomagkövetésre mutat.',
            'Jelöld **kézbesítettnek**. A lemondás visszateszi a termékeket a készletbe; a pénzt te térítsd vissza.',
          ],
        },
        {
          p: 'Az egy napon belül ki nem fizetett kártyás és PayPal-rendelések maguktól lemondódnak, így a készletük újra szabad.',
        },
      ],
    },
    {
      id: 'buyers',
      title: '6. Amit a vásárlók látnak',
      blocks: [
        {
          list: [
            'A boltot, a kategóriákat és termékeket árakkal, kampányokkal és akciókkal, bejelentkezés nélkül; a termékeket egymás mellett **összehasonlíthatják**, **megoszthatják**, vagy beolvashatják a **QR-kódjukat**.',
            'A böngészőjükben tárolt **kosarat** és a pénztárat a címmel, a szállítási díjjal, egy **kuponkóddal** és a fizetési móddal.',
            'A **rendelésük oldalát** egy titkos link mögött: állapot, fizetés és csomagkövetés. Ha a szerver tud e-mailt küldeni, a linket megerősítő e-mailben is megkapják.',
            'Választható **fiókot** a boltodban: e-mailben kapott linkkel lépnek be, látják minden rendelésüket, írnak neked és kezelik a hírlevelet. Jelszó nélkül.',
            'Amint a rendelés úton van, a rendelés oldaláról **értékelhetik**, amit vettek.',
          ],
        },
      ],
    },
    {
      id: 'legal',
      title: '7. Az eladó adatai, feltételek és keresőmotorok',
      blocks: [
        {
          p: 'A **Beállításokban** add meg, ki árul (név vagy cég, cím, cégjegyzékszám és adószám, elérhetőség), az **értékesítési feltételeket** és a **visszaküldést**. A bolt az „Eladó és feltételek” oldalon mutatja őket az uniós 14 napos elállási joggal; a romániai boltok az ANPC-linkeket is megjeleníthetik.',
        },
        {
          p: 'A nyitott boltokat és termékeiket megtalálják a keresőmotorok: minden oldalnak saját címe, leírása és áradata van, és a bolt egy oldaltérképben sorolja fel őket.',
        },
      ],
    },
    {
      id: 'catalogue',
      title: '8. Terméktípusok, beszállítók és sok termék',
      blocks: [
        {
          p: 'A **Termékek → Típusok és mezők** alatt minden terméktípusnak saját mezőket adhatsz: egy telefon memóriáját, egy ing anyagát, egy könyv szerzőjét. Kezdj egy kész típussal (elektronika, ruházat, cipők, könyvek, élelmiszer, kozmetikum, bútor, ékszer, játék, sport, kézműves) a saját nyelveden, és módosítsd tetszés szerint. Az ilyen típusú termékek kitöltik a mezőket; a bolt **Részletek** alatt és az **összehasonlításban** mutatja őket.',
        },
        {
          list: [
            'A **beszállítóknál** tartod nyilván, ki készíti vagy szállítja a termékeidet, elérhetőségekkel. A **márkaként** mutatott beszállító megjelenik a termékeinél és a keresőmotorokban.',
            'A terméklistában van **keresés** és szűrés típus, beszállító és állapot szerint. Jelölj ki több terméket, hogy egyszerre tedd eladóvá, piszkozattá vagy töröld őket; a **Másolás** piszkozatot készít egy termékből.',
          ],
        },
      ],
    },
    {
      id: 'promotions',
      title: '9. Kampányok, kuponok és közlemények',
      blocks: [
        {
          list: [
            'A **kampányok** százalékos kedvezményt adnak mindenre, egy kategóriára vagy kiválasztott termékekre, egy kezdettől egy végig. A bolt áthúzva mutatja a régi árat.',
            'A **kuponok** kódok, amelyeket a vásárlók a pénztárnál írnak be: százalékos vagy összegszerű kedvezmény a termékekből, vagy ingyenes szállítás; ha szeretnéd, minimális rendeléssel, felhasználási számmal és vásárlónként egyszer.',
            'A **közlemények** sávot mutatnak minden oldalon vagy bannert a kezdőlapon, másolható kuponkóddal vagy egy kampányra mutató linkkel.',
          ],
        },
        {
          tip: 'Ha egy akciós ár és egy kampány találkozik, az alacsonyabb ár érvényes. A kupon erre jön rá, csak a termékekre.',
        },
      ],
    },
    {
      id: 'newsletter',
      title: '10. Hírlevelek',
      blocks: [
        {
          steps: [
            'A vásárlók a bolt láblécében, a fiókjukban vagy a pénztárnál iratkoznak fel, és egy e-mailben kapott linkkel erősítik meg.',
            'A **Marketing → Hírlevelek** alatt írj tárgyat és szöveget, adj hozzá kupont, ha szeretnéd, és válassz **akciós** vagy **új** termékeket (vagy add hozzá egyszerre az összes akciósat vagy a legújabbakat).',
            'Ments, hogy lásd az e-mailt számítógépen és telefonon, küldj magadnak **tesztet**, majd küldd el minden feliratkozónak.',
          ],
        },
        {
          tip: 'Minden hírlevélben van leiratkozási link. A bolt a szerver SMTP-beállításain keresztül küld e-mailt; ezek nélkül nincs hírlevél és belépési link sem.',
        },
      ],
    },
    {
      id: 'reviews',
      title: '11. Értékelések és üzenetek',
      blocks: [
        {
          list: [
            'Az **Értékelések** alatt eldöntöd, hogy minden értékelést jóváhagysz-e, vagy az ellenőrzött vásárlók azonnal közzétehetnek. Bármelyiket közzéteheted, elrejtheted, megválaszolhatod vagy törölheted.',
            'Az **Üzenetek** alatt olvasod és válaszolod meg a fiókjukból író vásárlókat; ők e-mailt kapnak a válaszodról. Te minden új üzenetről e-mailt kapsz.',
          ],
        },
      ],
    },
    {
      id: 'design',
      title: '12. Megjelenés, keresőmotorok és követés',
      blocks: [
        {
          p: 'A **Beállítások → Megjelenés** alatt add hozzá a logódat és egy bannert, és válaszd ki a színeket, betűtípusokat, sarkokat, kártyákat és hogy hány termék legyen egy sorban; a szerkesztő figyelmeztet, ha a szöveg nehezen olvasható.',
        },
        {
          list: [
            'A **Keresőmotorok** alatt beállítod a bolt címét és leírását előnézettel, és minden termékhez pontszámot és tippeket látsz (fotók, szövegek, kategória, márka, vonalkód). Minden terméknek saját keresőmotoros szövegei is vannak.',
            'A tulajdonos hozzáadhat **Google Analytics**, **Google Ads**, **Tag Manager**, **Meta-képpont** vagy más kódot, valamint a Google Search Console és a Bing ellenőrzőkódjait. A vásárlókat előbb megkérdezzük; a címkék csak a hozzájárulásuk után töltődnek be.',
            'Minden termék **megosztható** a közösségi oldalakon, vagy letölthető és kinyomtatható **QR-kódként**.',
          ],
        },
      ],
    },
    {
      id: 'team',
      title: '13. A csapatod',
      blocks: [
        {
          list: [
            'A **Beállítások → Csapat** alatt készíts meghívólinket egy vagy több szerepkörrel, és küldd el: **Vezető** (minden, kivéve a fizetést, a követést és a csapatot), **Termékek** (termékek, készlet, típusok, beszállítók, keresőmotorok), **Marketing** (akciók, hírlevelek, értékelések, megjelenés, statisztika), **Ügyfélszolgálat** (a vásárlók üzenetei, értékelések, rendelések), **Szállítás és kézbesítés** (feladandó rendelések, szállítási zónák) vagy **Karbantartás** (megnyitás, karbantartási mód, eladói adatok, nyelvek, megjelenés).',
            'Minden tag **Áttekintése** a szerepkörei feladatait mutatja: feladandó rendeléseket egy feladottnak jelölő gombbal, megválaszolatlan üzeneteket és közzéteendő értékeléseket, elfogyott és fogyóban lévő termékeket, futó kampányokat és hírleveleket, és azt, ami még hiányzik a boltból. Bármikor módosíthatod egy tag szerepköreit vagy eltávolíthatod; a tagok az Áttekintésben léphetnek ki a csapatból.',
          ],
        },
      ],
    },
    {
      id: 'stats',
      title: '14. Statisztika',
      blocks: [
        {
          p: 'A **Statisztika** alatt látod az eladásokat, a rendeléseket, az átlagos rendelést, a termékmegtekintéseket és a konverziót 7, 30, 90 vagy 365 napra, az előző időszakhoz viszonyítva; az eladásokat, rendeléseket és megtekintéseket naponta vagy hetente; és minden termék számait, rendezhetően.',
        },
      ],
    },
    {
      id: 'rules',
      title: '15. Automatikus kedvezmények és ingyenes szállítás',
      blocks: [
        {
          p: 'A **Marketing → Akciók** alatt kód nélkül érvényes szabályokat adhatsz meg: **ingyenes szállítás** egy összegtől, vagy **százalékos kedvezmény minden termékre** egy darabszámtól (pl. 3 darab: −5 %, 5 darab: −10 %) vagy egy összegtől. Ha több is teljesül, a legnagyobb számít.',
        },
        {
          list: [
            'A vásárlók a rendelés előtt a **kosárban** és a **pénztárnál** látják a kedvezményt, és egy tippet, például „Még 2 darab, és 10 % kedvezmény mindenre” vagy „Még 3000 Ft, és ingyenes a szállítás”.',
            'A kupon erre jön rá, a maradékra; a rendelés mindkét kedvezményt megőrzi a nevével együtt.',
          ],
        },
      ],
    },
    {
      id: 'languages',
      title: '16. Karbantartási mód és nyelvek',
      blocks: [
        {
          p: 'A **Beállítások** alatt kapcsold be a **karbantartási módot** egy üzenettel: a vásárlók a bolt helyett ezt látják, és nem rendelhetnek, a csapatod viszont továbbra is mindent lát. Az Áttekintésben egy kattintással kapcsolhatod ki.',
        },
        {
          steps: [
            'A **Beállítások → Nyelvek** alatt válaszd ki a nyelvet, amelyből fordítasz, és **másold ki** a vásárlók által látott szövegeket (vagy töltsd le őket).',
            'Fordítsd le őket egy fordítóval vagy MI-vel úgy, hogy a kettőspont előtti nevek és a kapcsos zárójeles szavak változatlanok maradjanak.',
            'Illeszd vissza őket egy kóddal (fr, pl, nl…) és a nyelv nevével, majd ments. Az oldal megmondja, hány szöveget vett át, mennyi hiányzik és mennyit utasított el. A de, ro, hu, it, es vagy en kóddal egy beépített nyelv szövegeit módosítod.',
          ],
        },
        {
          tip: 'A vásárlók a bolt alján választanak nyelvet; azt is beállíthatod, hogy melyik saját nyelvedet lássák először.',
        },
      ],
    },
    {
      id: 'devquake',
      title: '17. Fiókok DevQuake-tagoknak',
      blocks: [
        {
          p: 'A DevQuake-hez tartozó oldalon a tagok a fiókoldalon a **Folytatás DevQuake-kel** gombbal lépnek be a boltodba: a DevQuake egyszer megkérdezi, használható-e az e-mail-címük, és a boltbeli fiókjuk a nevükkel és ezzel a címmel töltődik ki. Az ezzel leadott rendeléseik megjelennek, és a bolt a következő látogatásokkor felismeri őket, amíg ki nem lépnek.',
        },
        {
          list: [
            'Mindenki más továbbra is bármilyen e-mail-címmel, linkkel nyit fiókot.',
            'A vásárlók elmentik a **szállítási adataikat** a fiókjukba, és a pénztár kitölti őket; a pénztárnál az új adatokat megtarthatják a következő alkalomra.',
            'Az oldal adminisztrátorai döntik el, nyithatnak-e a tagok saját boltot, és látnak-e a látogatók rövid DevQuake-bemutatót a bolt lábléce felett.',
            'A **hozzávetőleges árak más pénznemekben** bekapcsolásával a vásárlók a bolt alján pénznemet választanak, és abban „≈” árakat látnak; továbbra is a boltod pénznemében fizetnek.',
          ],
        },
      ],
    },
    {
      id: 'interest',
      title: '18. Érdeklődési szavazás eladás előtt',
      blocks: [
        {
          p: 'Nem biztos, hogy egy termék fogyni fog? Ha az oldal adminisztrátorai bekapcsolják az **Érdeklődési szavazást**, a termék oldalán állítsd **Szavazás eladás helyett** módba. A vásárlók ekkor ár helyett szavazást látnak: szeretnék-e, mennyit fizetnének érte és melyik változatot (a típus többválasztós mezői, pl. színek és méretek). Addig senki sem rendelheti meg.',
        },
        {
          list: [
            'Add meg a termék oldalán a **darabköltséget** és egy **egyszeri befektetést**.',
            'A **Statisztika → Érdeklődési szavazások** alatt látod a keresletet, amit a szavazók fizetnének, egy javasolt árat, a várható vásárlókat, a bevételt, a nyereséget, a megtérülést és a megtérülési pontot, valamint a legkeresettebb változatokat.',
            'Az eladáshoz kapcsold ki a szavazást, és add meg a változatok valódi árát.',
          ],
        },
      ],
    },
  ],
  questions: 'Kérdésed vagy ötleted van? Írj a {email} címre.',
  back: 'Vissza a boltodhoz',
};

const it: Manual = {
  metaTitle: 'Manuale d’uso · Negozio',
  metaDescription:
    'Come gestire il tuo piccolo negozio online: prodotti con varianti e saldi, carta, PayPal, bonifico o contrassegno, zone di spedizione e ordini.',
  ogTitle: 'Negozio: manuale d’uso',
  cta: 'Questo manuale è per il titolare del negozio. {link} per gestire il tuo negozio.',
  ctaLink: 'Accedi',
  kicker: 'Negozio · Manuale d’uso',
  title: 'Come gestire il tuo negozio',
  intro:
    'Negozio è un piccolo negozio online sul tuo server: aggiungi i prodotti, scegli come pagano gli acquirenti e dove spedisci, e segui ogni ordine fino alla consegna. Gli acquirenti non hanno bisogno di un account.',
  contents: 'Indice',
  sections: [
    {
      id: 'start',
      title: '1. Aprire il negozio',
      blocks: [
        {
          steps: [
            'Accedi e dai al negozio un **nome**. Il suo indirizzo web viene creato dal nome; puoi cambiarlo.',
            'Scegli la **valuta** e l’**aliquota IVA**. I prezzi che inserisci includono l’IVA; usa 0 se non applichi l’IVA.',
            'Segui la lista di controllo nella **Panoramica**: un prodotto, un metodo di pagamento, la spedizione, i dati del venditore, poi **apri il negozio** da Impostazioni.',
          ],
        },
        {
          tip: 'Finché il negozio è chiuso, lo vedi solo tu: aprilo dalla Panoramica per controllare come lo vedranno gli acquirenti.',
        },
      ],
    },
    {
      id: 'products',
      title: '2. Prodotti, varianti e saldi',
      blocks: [
        {
          p: 'Un prodotto ha un nome, una descrizione breve per gli elenchi, una descrizione più lunga, una categoria e fino a otto **foto**; la prima foto è quella principale.',
        },
        {
          list: [
            '**Varianti**: taglie, colori… ognuna con il suo prezzo, codice e magazzino. Un prodotto semplice ha una variante senza nome.',
            'Il **magazzino** viene conteggiato quando lo compili: un ordine lo scala, un ordine annullato lo restituisce, e le varianti esaurite non si possono acquistare.',
            '**Prezzo scontato**: più basso del prezzo, da un inizio a una fine (entrambi facoltativi). Il negozio mostra il vecchio prezzo barrato.',
            'Le **bozze** (non “in vendita”) le vedi solo tu.',
          ],
        },
      ],
    },
    {
      id: 'payments',
      title: '3. Metodi di pagamento',
      blocks: [
        {
          p: 'Il denaro arriva direttamente sui tuoi conti. Attiva i metodi che vuoi in **Pagamenti**:',
        },
        {
          list: [
            '**Carta (Stripe)**: incolla la tua chiave segreta e aggiungi in Stripe l’indirizzo del webhook mostrato nella pagina, con il suo segreto di firma. Gli ordini pagati vengono segnati come pagati da soli.',
            '**PayPal**: client ID e secret della tua app; provalo prima nella sandbox, poi passa al live.',
            '**Bonifico bancario**: il tuo IBAN e l’intestatario del conto. La pagina dell’ordine li mostra con il riferimento dell’ordine; segna l’ordine come pagato quando arriva il denaro.',
            '**Contrassegno**: supplemento facoltativo; il corriere incassa e l’ordine conta come pagato quando lo segni come consegnato.',
          ],
        },
        {
          tip: 'Le chiavi segrete sono salvate cifrate e non vengono più mostrate. I dati della carta non arrivano mai al tuo server: gli acquirenti pagano sulla pagina di Stripe o di PayPal.',
        },
      ],
    },
    {
      id: 'shipping',
      title: '4. Spedizione',
      blocks: [
        {
          p: 'Crea una **zona** per ogni gruppo di paesi in cui spedisci, con una tariffa fissa per ordine e, se vuoi, la spedizione gratuita da un certo importo. “Ovunque altrove” copre tutti gli altri paesi. Gli acquirenti di paesi che non sono in nessuna zona non possono ordinare.',
        },
      ],
    },
    {
      id: 'orders',
      title: '5. Ordini',
      blocks: [
        {
          steps: [
            'Ricevi un’**email** per ogni nuovo ordine (gli ordini con carta e PayPal quando sono pagati).',
            'Apri l’ordine: acquirente, indirizzo, articoli, pagamento. Segnalo come **pagato** (bonifico, contanti), poi **spedito**.',
            'Aggiungi il **corriere** e il **numero di tracciamento**: la pagina dell’acquirente rimanda alla pagina di tracciamento del pacco.',
            'Segnalo come **consegnato**. Annullando, i prodotti tornano in magazzino; rimborsa tu il denaro.',
          ],
        },
        {
          p: 'Gli ordini con carta e PayPal non pagati entro un giorno vengono annullati da soli, così il loro magazzino torna libero.',
        },
      ],
    },
    {
      id: 'buyers',
      title: '6. Cosa vedono gli acquirenti',
      blocks: [
        {
          list: [
            'Il negozio, le sue categorie e i prodotti, con prezzi, campagne e saldi, senza accedere; possono **confrontare** i prodotti uno accanto all’altro e **condividerli** o scansionarne il **codice QR**.',
            'Un **carrello** conservato nel loro browser e il checkout con indirizzo, costo di spedizione, **codice sconto** e metodo di pagamento.',
            'La **pagina del loro ordine**, dietro un link segreto: lo stato, come pagare e il tracciamento del pacco. Quando il server può inviare email, ricevono il link anche in un’email di conferma.',
            'Un **account** facoltativo nel tuo negozio: accedono con un link inviato alla loro email, vedono tutti i loro ordini, ti scrivono e gestiscono la newsletter. Nessuna password.',
            'Quando l’ordine è in viaggio, possono **valutare** ciò che hanno comprato dalla pagina dell’ordine.',
          ],
        },
      ],
    },
    {
      id: 'legal',
      title: '7. Dati del venditore, condizioni e motori di ricerca',
      blocks: [
        {
          p: 'In **Impostazioni** indica chi vende (nome o azienda, indirizzo, numero di registrazione e partita IVA, contatti), le tue **condizioni di vendita** e i **resi**. Il negozio li mostra nella pagina “Venditore e condizioni”, con il diritto di recesso UE di 14 giorni; i negozi in Romania possono mostrare i link ANPC.',
        },
        {
          p: 'I negozi aperti e i loro prodotti si possono trovare con i motori di ricerca: ogni pagina ha il suo indirizzo, la sua descrizione e i dati sul prezzo, e il negozio li elenca in una sitemap.',
        },
      ],
    },
    {
      id: 'catalogue',
      title: '8. Tipi di prodotto, fornitori e molti prodotti',
      blocks: [
        {
          p: 'In **Prodotti → Tipi e campi** dai a ogni genere di prodotto i suoi campi: la memoria di un telefono, la composizione di una camicia, l’autore di un libro. Parti da un tipo già pronto (elettronica, abbigliamento, scarpe, libri, alimentari, cosmetici, mobili, gioielli, giocattoli, sport, fatto a mano) nella tua lingua e modificalo come vuoi. I prodotti di quel tipo compilano i campi; il negozio li mostra come **Dettagli** e nel **confronto**.',
        },
        {
          list: [
            'I **fornitori** registrano chi produce o fornisce i tuoi prodotti, con i loro contatti. Un fornitore mostrato come **marca** compare sui suoi prodotti e nei motori di ricerca.',
            'L’elenco dei prodotti ha una **ricerca** e filtri per tipo, fornitore e stato. Spunta più prodotti per metterli in vendita, renderli bozze o eliminarli in una volta; **Copia** crea una bozza da un prodotto.',
          ],
        },
      ],
    },
    {
      id: 'promotions',
      title: '9. Campagne, buoni e annunci',
      blocks: [
        {
          list: [
            'Le **campagne** applicano una percentuale di sconto su tutto, su una categoria o su prodotti scelti, da un inizio a una fine. Il negozio mostra il vecchio prezzo barrato.',
            'I **buoni sconto** sono codici che gli acquirenti scrivono al checkout: una percentuale o un importo di sconto sui prodotti, o la spedizione gratuita; con un ordine minimo, un numero di utilizzi e una volta per acquirente, se vuoi.',
            'Gli **annunci** mostrano una barra su ogni pagina o un banner nella prima pagina, con un codice sconto da copiare o un link a una campagna.',
          ],
        },
        {
          tip: 'Quando un prezzo scontato e una campagna si incontrano, vince il prezzo più basso. Un buono si aggiunge sopra, solo sui prodotti.',
        },
      ],
    },
    {
      id: 'newsletter',
      title: '10. Newsletter',
      blocks: [
        {
          steps: [
            'Gli acquirenti si iscrivono nel piè di pagina del negozio, nel loro account o al checkout, e confermano con il link in un’email.',
            'In **Marketing → Newsletter** scrivi un oggetto e un testo, aggiungi un buono se vuoi e scegli prodotti **in offerta** o **nuovi** (oppure aggiungi in una volta tutti quelli in saldo o i più recenti).',
            'Salva per vedere l’email come su un computer e su un telefono, invia a te stesso una **prova**, poi inviala a tutti gli iscritti.',
          ],
        },
        {
          tip: 'Ogni newsletter ha un link per disiscriversi. Il negozio invia email tramite le impostazioni SMTP del server; senza di esse non ci sono newsletter né link di accesso.',
        },
      ],
    },
    {
      id: 'reviews',
      title: '11. Recensioni e messaggi',
      blocks: [
        {
          list: [
            'In **Recensioni** scegli se approvare ogni recensione o lasciare che gli acquirenti verificati pubblichino subito. Pubblica, nascondi, rispondi o elimina ognuna.',
            'In **Messaggi** leggi e rispondi agli acquirenti che ti hanno scritto dal loro account; ricevono un’email con la tua risposta. Tu ricevi un’email per ogni nuovo messaggio.',
          ],
        },
      ],
    },
    {
      id: 'design',
      title: '12. Design, motori di ricerca e tracciamento',
      blocks: [
        {
          p: 'In **Impostazioni → Design** aggiungi il tuo logo e un banner e scegli colori, caratteri, angoli, schede e quanti prodotti mostrare per riga; l’editor ti avvisa quando il testo è difficile da leggere.',
        },
        {
          list: [
            'In **Motori di ricerca** imposta titolo e descrizione del negozio con un’anteprima e vedi un punteggio con consigli per ogni prodotto (foto, testi, categoria, marca, codice a barre). Anche ogni prodotto ha i suoi testi per i motori di ricerca.',
            'Il titolare può aggiungere **Google Analytics**, **Google Ads**, **Tag Manager**, il **pixel di Meta** o altro codice, e i codici di verifica per Google Search Console e Bing. Prima viene chiesto agli acquirenti; i tag si caricano solo dopo che accettano.',
            'Ogni prodotto si può **condividere** sui social network o come **codice QR** da scaricare o stampare.',
          ],
        },
      ],
    },
    {
      id: 'team',
      title: '13. Il tuo team',
      blocks: [
        {
          list: [
            'In **Impostazioni → Team** crea un link di invito con uno o più ruoli e invialo: **Responsabile** (tutto tranne pagamenti, tracciamento e team), **Prodotti** (prodotti, magazzino, tipi, fornitori, motori di ricerca), **Marketing** (promozioni, newsletter, recensioni, design, statistiche), **Assistenza** (messaggi degli acquirenti, recensioni, ordini), **Spedizione e consegna** (ordini da spedire, zone di spedizione) o **Manutenzione** (apertura, modalità manutenzione, dati del venditore, lingue, design).',
            'La **Panoramica** di ogni membro mostra le attività dei suoi ruoli: ordini da spedire con un pulsante per segnarli come spediti, messaggi senza risposta e recensioni da pubblicare, prodotti esauriti o con scorte basse, campagne e newsletter in corso, e ciò che manca ancora al negozio. Cambia i ruoli di un membro o rimuovilo quando vuoi; i membri possono lasciare il team dalla Panoramica.',
          ],
        },
      ],
    },
    {
      id: 'stats',
      title: '14. Statistiche',
      blocks: [
        {
          p: 'In **Statistiche** vedi vendite, ordini, ordine medio, visualizzazioni dei prodotti e conversione per 7, 30, 90 o 365 giorni, confrontati con il periodo precedente; vendite, ordini e visualizzazioni per giorno o settimana; e i numeri di ogni prodotto, che puoi ordinare.',
        },
      ],
    },
    {
      id: 'rules',
      title: '15. Sconti automatici e spedizione gratuita',
      blocks: [
        {
          p: 'In **Marketing → Promozioni** aggiungi regole che si applicano senza codice: **spedizione gratuita** da un importo, o una **percentuale di sconto su tutti i prodotti** da un numero di articoli (ad es. 3 articoli: −5 %, 5 articoli: −10 %) o da un importo. Quando se ne raggiungono più di una, vale la più alta.',
        },
        {
          list: [
            'Gli acquirenti vedono lo sconto nel **carrello** e al **checkout** prima di ordinare, e un suggerimento come “Aggiungi ancora 2 articoli per avere il 10 % di sconto su tutto” o “Aggiungi ancora 12 € per la spedizione gratuita”.',
            'Un buono si aggiunge sopra, su quello che resta; l’ordine conserva entrambi gli sconti con i loro nomi.',
          ],
        },
      ],
    },
    {
      id: 'languages',
      title: '16. Modalità manutenzione e lingue',
      blocks: [
        {
          p: 'In **Impostazioni** attiva la **modalità manutenzione** con un messaggio: gli acquirenti lo vedono al posto del negozio e non possono ordinare, mentre il tuo team continua a vedere tutto. Disattivala dalla Panoramica con un clic.',
        },
        {
          steps: [
            'In **Impostazioni → Lingue** scegli la lingua da cui tradurre e **copia** le etichette che vedono gli acquirenti (o scaricale).',
            'Traducile con un traduttore o un’IA, lasciando come sono i nomi prima dei due punti e le parole tra parentesi graffe.',
            'Incollale di nuovo con un codice (fr, pl, nl…) e il nome della lingua, e salva. La pagina ti dice quante etichette sono state accettate, mancano o sono state rifiutate. Usa invece de, ro, hu, it, es o en per cambiare i testi di una lingua integrata.',
          ],
        },
        {
          tip: 'Gli acquirenti scelgono la lingua in fondo al negozio; puoi anche rendere una delle tue lingue quella che vedono per prima.',
        },
      ],
    },
    {
      id: 'devquake',
      title: '17. Account per i membri di DevQuake',
      blocks: [
        {
          p: 'Su un sito che fa parte di DevQuake, i membri accedono al tuo negozio con **Continua con DevQuake** nella pagina dell’account: DevQuake chiede loro una volta di consentire l’uso del loro indirizzo email, e il loro account nel negozio viene compilato con il loro nome e quell’indirizzo. Gli ordini fatti con quell’indirizzo compaiono, e il negozio li riconosce nelle visite successive finché non escono.',
        },
        {
          list: [
            'Tutti gli altri aprono comunque un account con un indirizzo email qualsiasi, tramite un link.',
            'Gli acquirenti salvano i loro **dati di consegna** nell’account e il checkout li compila; al checkout possono conservare i nuovi dati per la volta successiva.',
            'Gli amministratori del sito decidono se i membri possono aprire negozi propri e se i visitatori vedono una breve presentazione di DevQuake sopra il piè di pagina del negozio.',
            'Con i **prezzi indicativi in altre valute** attivi, gli acquirenti scelgono una valuta in fondo al negozio e vedono i prezzi “≈” in quella valuta; pagano comunque nella valuta del tuo negozio.',
          ],
        },
      ],
    },
    {
      id: 'interest',
      title: '18. Voti di interesse prima di vendere',
      blocks: [
        {
          p: 'Non sei sicuro che un prodotto si venderà? Quando gli amministratori del sito attivano i **voti di interesse**, passa un prodotto a **Chiedi voti invece di vendere** dalla sua pagina. Gli acquirenti vedono allora un voto al posto del prezzo: se lo vogliono, quanto pagherebbero e quale versione (i campi a scelta multipla del suo tipo, come colori e taglie). Nel frattempo nessuno può ordinarlo.',
        },
        {
          list: [
            'Inserisci un **costo al pezzo** e un **investimento una tantum** nella pagina del prodotto.',
            'In **Statistiche → Voti di interesse** vedi la domanda, quanto pagherebbero i votanti, un prezzo suggerito, gli acquirenti previsti, ricavi, profitto, ritorno e pareggio, e le versioni più richieste.',
            'Per iniziare a vendere, disattiva il voto e dai alle varianti i loro prezzi reali.',
          ],
        },
      ],
    },
  ],
  questions: 'Domande o idee? Scrivi a {email}.',
  back: 'Torna al tuo negozio',
};

const es: Manual = {
  metaTitle: 'Manual de usuario · Tienda',
  metaDescription:
    'Cómo llevar tu propia tienda online pequeña: productos con variantes y rebajas, tarjeta, PayPal, transferencia o contra reembolso, zonas de envío y pedidos.',
  ogTitle: 'Tienda: manual de usuario',
  cta: 'Este manual es para el propietario de la tienda. {link} para gestionar tu tienda.',
  ctaLink: 'Inicia sesión',
  kicker: 'Tienda · Manual de usuario',
  title: 'Cómo llevar tu tienda',
  intro:
    'Tienda es una pequeña tienda online en tu propio servidor: añades productos, eliges cómo pagan los compradores y adónde envías, y sigues cada pedido hasta que se entrega. Los compradores no necesitan cuenta.',
  contents: 'Contenido',
  sections: [
    {
      id: 'start',
      title: '1. Abrir la tienda',
      blocks: [
        {
          steps: [
            'Inicia sesión y ponle un **nombre** a la tienda. Su dirección web se crea a partir del nombre; puedes cambiarla.',
            'Elige la **moneda** y el **tipo de IVA**. Los precios que escribes incluyen IVA; usa 0 si no cobras IVA.',
            'Sigue la lista del **Resumen**: un producto, un método de pago, el envío, tus datos de vendedor y luego **abre la tienda** en Ajustes.',
          ],
        },
        {
          tip: 'Mientras la tienda está cerrada, solo tú puedes verla: ábrela desde el Resumen para comprobar cómo la verán los compradores.',
        },
      ],
    },
    {
      id: 'products',
      title: '2. Productos, variantes y rebajas',
      blocks: [
        {
          p: 'Un producto tiene un nombre, una descripción breve para las listas, una descripción más larga, una categoría y hasta ocho **fotos**; la primera foto es la principal.',
        },
        {
          list: [
            '**Variantes**: tallas, colores… cada una con su propio precio, código y stock. Un producto simple tiene una variante sin nombre.',
            'El **stock** se cuenta cuando lo rellenas: un pedido lo descuenta, un pedido cancelado lo devuelve y las variantes agotadas no se pueden comprar.',
            '**Precio rebajado**: inferior al precio, desde un inicio hasta un final (ambos opcionales). La tienda muestra el precio anterior tachado.',
            'Los **borradores** (no “a la venta”) solo los ves tú.',
          ],
        },
      ],
    },
    {
      id: 'payments',
      title: '3. Métodos de pago',
      blocks: [
        {
          p: 'El dinero va directamente a tus propias cuentas. Activa los métodos que quieras en **Pagos**:',
        },
        {
          list: [
            '**Tarjeta (Stripe)**: pega tu clave secreta y añade en Stripe la dirección del webhook que se muestra en la página, con su secreto de firma. Los pedidos pagados se marcan como pagados solos.',
            '**PayPal**: el client ID y el secret de tu app; pruébalo primero en el sandbox y luego pasa a real.',
            '**Transferencia bancaria**: tu IBAN y el titular de la cuenta. La página del pedido los muestra con la referencia del pedido; marca el pedido como pagado cuando llegue el dinero.',
            '**Contra reembolso**: recargo opcional; la mensajería cobra y el pedido cuenta como pagado cuando lo marcas como entregado.',
          ],
        },
        {
          tip: 'Las claves secretas se guardan cifradas y no se vuelven a mostrar. Los datos de la tarjeta nunca llegan a tu servidor: los compradores pagan en la página de Stripe o de PayPal.',
        },
      ],
    },
    {
      id: 'shipping',
      title: '4. Envío',
      blocks: [
        {
          p: 'Crea una **zona** para cada grupo de países a los que envías, con una tarifa fija por pedido y, si quieres, envío gratis a partir de un importe. “Resto del mundo” cubre todos los demás países. Los compradores de países que no están en ninguna zona no pueden pedir.',
        },
      ],
    },
    {
      id: 'orders',
      title: '5. Pedidos',
      blocks: [
        {
          steps: [
            'Recibes un **email** por cada pedido nuevo (los pedidos con tarjeta y PayPal, cuando se pagan).',
            'Abre el pedido: comprador, dirección, artículos, pago. Márcalo como **pagado** (transferencia, efectivo) y luego como **enviado**.',
            'Añade la **mensajería** y el **número de seguimiento**: la página del comprador enlaza con la página de seguimiento del paquete.',
            'Márcalo como **entregado**. Al cancelar, los productos vuelven al stock; devuelve tú el dinero.',
          ],
        },
        {
          p: 'Los pedidos con tarjeta y PayPal que no se pagan en un día se cancelan solos, para que su stock vuelva a estar libre.',
        },
      ],
    },
    {
      id: 'buyers',
      title: '6. Lo que ven los compradores',
      blocks: [
        {
          list: [
            'La tienda, sus categorías y productos, con precios, campañas y rebajas, sin iniciar sesión; pueden **comparar** productos uno al lado de otro y **compartirlos** o escanear su **código QR**.',
            'Un **carrito** guardado en su navegador y el pago con su dirección, los gastos de envío, un **código de cupón** y el método de pago.',
            'La **página de su pedido**, tras un enlace secreto: su estado, cómo pagar y el seguimiento del paquete. Cuando el servidor puede enviar emails, también reciben el enlace en un email de confirmación.',
            'Una **cuenta** opcional en tu tienda: inician sesión con un enlace enviado a su email, ven todos sus pedidos, te escriben y gestionan la newsletter. Sin contraseña.',
            'Cuando el pedido está en camino, pueden **valorar** lo que compraron desde la página del pedido.',
          ],
        },
      ],
    },
    {
      id: 'legal',
      title: '7. Datos del vendedor, condiciones y buscadores',
      blocks: [
        {
          p: 'En **Ajustes** indica quién vende (nombre o empresa, dirección, número de registro y NIF/CIF, contacto), tus **condiciones de venta** y las **devoluciones**. La tienda los muestra en su página “Vendedor y condiciones”, con el derecho de desistimiento de 14 días de la UE; las tiendas de Rumanía pueden mostrar los enlaces de la ANPC.',
        },
        {
          p: 'Las tiendas abiertas y sus productos se pueden encontrar en los buscadores: cada página tiene su propia dirección, descripción y datos de precio, y la tienda las lista en un sitemap.',
        },
      ],
    },
    {
      id: 'catalogue',
      title: '8. Tipos de producto, proveedores y muchos productos',
      blocks: [
        {
          p: 'En **Productos → Tipos y campos** da a cada clase de producto sus propios campos: la memoria de un móvil, la composición de una camisa, el autor de un libro. Empieza con un tipo ya hecho (electrónica, ropa, calzado, libros, alimentación, cosmética, muebles, joyería, juguetes, deporte, hecho a mano) en tu idioma y cámbialo como quieras. Los productos de ese tipo rellenan los campos; la tienda los muestra como **Detalles** y en la **comparación**.',
        },
        {
          list: [
            'Los **proveedores** registran quién fabrica o suministra tus productos, con sus contactos. Un proveedor mostrado como **marca** aparece en sus productos y en los buscadores.',
            'La lista de productos tiene una **búsqueda** y filtros por tipo, proveedor y estado. Marca varios productos para ponerlos a la venta, pasarlos a borrador o eliminarlos a la vez; **Copiar** crea un borrador a partir de un producto.',
          ],
        },
      ],
    },
    {
      id: 'promotions',
      title: '9. Campañas, cupones y avisos',
      blocks: [
        {
          list: [
            'Las **campañas** aplican un porcentaje de descuento en todo, en una categoría o en productos elegidos, desde un inicio hasta un final. La tienda muestra el precio anterior tachado.',
            'Los **cupones** son códigos que los compradores escriben al pagar: un porcentaje o un importe de descuento en los productos, o envío gratis; con un pedido mínimo, un número de usos y una vez por comprador, si quieres.',
            'Los **avisos** muestran una barra en cada página o un banner en la portada, con un código de cupón para copiar o un enlace a una campaña.',
          ],
        },
        {
          tip: 'Cuando coinciden un precio rebajado y una campaña, gana el precio más bajo. Un cupón se suma encima, solo en los productos.',
        },
      ],
    },
    {
      id: 'newsletter',
      title: '10. Newsletters',
      blocks: [
        {
          steps: [
            'Los compradores se suscriben en el pie de la tienda, en su cuenta o al pagar, y confirman con el enlace de un email.',
            'En **Marketing → Newsletters** escribe un asunto y un texto, añade un cupón si quieres y elige productos **en oferta** o **nuevos** (o añade de una vez todo lo rebajado o lo más nuevo).',
            'Guarda para ver el email como en un ordenador y en un móvil, envíate una **prueba** y luego envíala a todos los suscriptores.',
          ],
        },
        {
          tip: 'Cada newsletter tiene un enlace para darse de baja. La tienda envía emails con los ajustes SMTP del servidor; sin ellos no hay newsletters ni enlaces de inicio de sesión.',
        },
      ],
    },
    {
      id: 'reviews',
      title: '11. Reseñas y mensajes',
      blocks: [
        {
          list: [
            'En **Reseñas** elige si apruebas cada reseña o dejas que los compradores verificados publiquen al momento. Publica, oculta, responde o elimina cada una.',
            'En **Mensajes** lee y responde a los compradores que te escribieron desde su cuenta; reciben un email con tu respuesta. Tú recibes un email por cada mensaje nuevo.',
          ],
        },
      ],
    },
    {
      id: 'design',
      title: '12. Diseño, buscadores y seguimiento',
      blocks: [
        {
          p: 'En **Ajustes → Diseño** añade tu logo y un banner y elige colores, tipografías, esquinas, fichas y cuántos productos se muestran por fila; el editor avisa cuando el texto se lee mal.',
        },
        {
          list: [
            'En **Buscadores** define el título y la descripción de la tienda con una vista previa, y consulta una puntuación con consejos para cada producto (fotos, textos, categoría, marca, código de barras). Cada producto tiene también sus propios textos para buscadores.',
            'El propietario puede añadir **Google Analytics**, **Google Ads**, **Tag Manager**, el **píxel de Meta** u otro código, y los códigos de verificación de Google Search Console y Bing. Primero se pregunta a los compradores; las etiquetas solo se cargan después de que acepten.',
            'Cada producto se puede **compartir** en las redes sociales o como **código QR** para descargar o imprimir.',
          ],
        },
      ],
    },
    {
      id: 'team',
      title: '13. Tu equipo',
      blocks: [
        {
          list: [
            'En **Ajustes → Equipo** crea un enlace de invitación con uno o más roles y envíalo: **Gerente** (todo menos pagos, seguimiento y el equipo), **Productos** (productos, stock, tipos, proveedores, buscadores), **Marketing** (promociones, newsletters, reseñas, diseño, estadísticas), **Atención al cliente** (mensajes de compradores, reseñas, pedidos), **Envío y entrega** (pedidos por enviar, zonas de envío) o **Mantenimiento** (apertura, modo mantenimiento, datos del vendedor, idiomas, diseño).',
            'El **Resumen** de cada miembro muestra las tareas de sus roles: pedidos por enviar con un botón para marcarlos como enviados, mensajes sin responder y reseñas por publicar, productos agotados o con poco stock, campañas y newsletters en marcha, y lo que aún le falta a la tienda. Cambia los roles de un miembro o quítalo cuando quieras; los miembros pueden dejar el equipo desde el Resumen.',
          ],
        },
      ],
    },
    {
      id: 'stats',
      title: '14. Estadísticas',
      blocks: [
        {
          p: 'En **Estadísticas** consulta ventas, pedidos, pedido medio, visitas a productos y conversión de 7, 30, 90 o 365 días, comparados con el periodo anterior; ventas, pedidos y visitas por día o semana; y las cifras de cada producto, que puedes ordenar.',
        },
      ],
    },
    {
      id: 'rules',
      title: '15. Descuentos automáticos y envío gratis',
      blocks: [
        {
          p: 'En **Marketing → Promociones** añade reglas que se aplican sin código: **envío gratis** a partir de un importe, o un **porcentaje de descuento en todos los productos** a partir de un número de artículos (p. ej. 3 artículos: −5 %, 5 artículos: −10 %) o de un importe. Cuando se alcanzan varias, cuenta la más alta.',
        },
        {
          list: [
            'Los compradores ven el descuento en el **carrito** y al **pagar** antes de hacer el pedido, y un aviso como “Añade 2 artículos más para un 10 % de descuento en todo” o “Añade 12 € más para tener envío gratis”.',
            'Un cupón se suma encima, sobre lo que queda; el pedido conserva ambos descuentos con sus nombres.',
          ],
        },
      ],
    },
    {
      id: 'languages',
      title: '16. Modo mantenimiento e idiomas',
      blocks: [
        {
          p: 'En **Ajustes** activa el **modo mantenimiento** con un mensaje: los compradores lo ven en lugar de la tienda y no pueden pedir, mientras tu equipo sigue viéndolo todo. Desactívalo desde el Resumen con un clic.',
        },
        {
          steps: [
            'En **Ajustes → Idiomas** elige el idioma desde el que traducir y **copia** las etiquetas que ven los compradores (o descárgalas).',
            'Tradúcelas con un traductor o una IA, dejando como están los nombres antes de los dos puntos y las palabras entre llaves.',
            'Vuelve a pegarlas con un código (fr, pl, nl…) y el nombre del idioma, y guarda. La página te dice cuántas etiquetas se aceptaron, faltan o se rechazaron. Usa en cambio de, ro, hu, it, es o en para cambiar los textos de un idioma integrado.',
          ],
        },
        {
          tip: 'Los compradores eligen el idioma al pie de la tienda; también puedes hacer que uno de tus idiomas sea el que vean primero.',
        },
      ],
    },
    {
      id: 'devquake',
      title: '17. Cuentas para miembros de DevQuake',
      blocks: [
        {
          p: 'En un sitio que forma parte de DevQuake, los miembros inician sesión en tu tienda con **Continuar con DevQuake** en la página de la cuenta: DevQuake les pide una vez permiso para usar su dirección de email, y su cuenta en la tienda se rellena con su nombre y esa dirección. Los pedidos que hicieron con ella aparecen, y la tienda los reconoce en sus siguientes visitas hasta que cierran sesión en ella.',
        },
        {
          list: [
            'Todos los demás siguen abriendo una cuenta con cualquier dirección de email, mediante un enlace.',
            'Los compradores guardan sus **datos de entrega** en su cuenta y el pago los rellena; al pagar pueden guardar datos nuevos para la próxima vez.',
            'Los administradores del sitio deciden si los miembros pueden abrir sus propias tiendas y si los visitantes ven una breve presentación de DevQuake encima del pie de la tienda.',
            'Con los **precios aproximados en otras monedas** activados, los compradores eligen una moneda al pie de la tienda y ven precios “≈” en ella; siguen pagando en la moneda de tu tienda.',
          ],
        },
      ],
    },
    {
      id: 'interest',
      title: '18. Votos de interés antes de vender',
      blocks: [
        {
          p: '¿No sabes si un producto se venderá? Cuando los administradores del sitio activan los **votos de interés**, cambia un producto a **Pedir votos en lugar de vender** desde su página. Los compradores ven entonces una votación en lugar del precio: si lo quieren, cuánto pagarían y qué versión (los campos de opción múltiple de su tipo, como colores y tallas). Mientras tanto nadie puede pedirlo.',
        },
        {
          list: [
            'Introduce un **coste por unidad** y una **inversión única** en la página del producto.',
            'En **Estadísticas → Votos de interés** ves la demanda, lo que pagarían los votantes, un precio sugerido, los compradores previstos, ingresos, beneficio, retorno y punto de equilibrio, y las versiones más deseadas.',
            'Para empezar a vender, desactiva la votación y da a las variantes sus precios reales.',
          ],
        },
      ],
    },
  ],
  questions: '¿Preguntas o ideas? Escribe a {email}.',
  back: 'Volver a tu tienda',
};

export const MANUAL: Record<Locale, Manual> = { en, de, ro, hu, it, es };
