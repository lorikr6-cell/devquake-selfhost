import type { Locale } from '@devquake/ui';
import type { FieldKind } from '../lib/fields';

// Ready-made product types the owner starts from (ADR 0058), in every language (ADR 0011). A
// template becomes the store's own type in the owner's language; they change it as they like.
// A test checks that every language has every text.

type L = Record<Locale, string>;
const l = (en: string, de: string, ro: string, hu: string, it: string, es: string): L => ({
  en,
  de,
  ro,
  hu,
  it,
  es,
});

export interface TemplateField {
  kind: FieldKind;
  label: L;
  /** A symbol ("cm") or a word in every language. */
  unit?: string | L;
  choices?: L[];
  required?: boolean;
}

export interface TypeTemplate {
  icon: string;
  name: L;
  fields: TemplateField[];
}

const yes = (label: L): TemplateField => ({ kind: 'boolean', label });

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => l(s, s, s, s, s, s));

const COLOURS = [
  l('Black', 'Schwarz', 'Negru', 'Fekete', 'Nero', 'Negro'),
  l('White', 'Weiß', 'Alb', 'Fehér', 'Bianco', 'Blanco'),
  l('Grey', 'Grau', 'Gri', 'Szürke', 'Grigio', 'Gris'),
  l('Blue', 'Blau', 'Albastru', 'Kék', 'Blu', 'Azul'),
  l('Red', 'Rot', 'Roșu', 'Piros', 'Rosso', 'Rojo'),
  l('Green', 'Grün', 'Verde', 'Zöld', 'Verde', 'Verde'),
  l('Beige', 'Beige', 'Bej', 'Bézs', 'Beige', 'Beis'),
  l('Brown', 'Braun', 'Maro', 'Barna', 'Marrone', 'Marrón'),
  l('Multicolour', 'Mehrfarbig', 'Multicolor', 'Többszínű', 'Multicolore', 'Multicolor'),
];

const COLOUR: TemplateField = {
  kind: 'select',
  label: l('Colour', 'Farbe', 'Culoare', 'Szín', 'Colore', 'Color'),
  choices: COLOURS,
};

const MATERIAL: TemplateField = {
  kind: 'text',
  label: l('Material', 'Material', 'Material', 'Anyag', 'Materiale', 'Material'),
};

const DIMENSIONS: TemplateField = {
  kind: 'text',
  label: l(
    'Dimensions (W × H × D)',
    'Maße (B × H × T)',
    'Dimensiuni (L × Î × A)',
    'Méretek (Sz × M × M)',
    'Dimensioni (L × A × P)',
    'Medidas (An × Al × F)',
  ),
  unit: 'cm',
};

const WEIGHT: TemplateField = {
  kind: 'number',
  label: l('Weight', 'Gewicht', 'Greutate', 'Tömeg', 'Peso', 'Peso'),
  unit: 'kg',
};

const WARRANTY: TemplateField = {
  kind: 'number',
  label: l('Warranty', 'Garantie', 'Garanție', 'Garancia', 'Garanzia', 'Garantía'),
  unit: l('months', 'Monate', 'luni', 'hónap', 'mesi', 'meses'),
};

const DAYS = l('days', 'Tage', 'zile', 'nap', 'giorni', 'días');

const ORIGIN: TemplateField = {
  kind: 'text',
  label: l(
    'Made in',
    'Hergestellt in',
    'Fabricat în',
    'Gyártás helye',
    'Prodotto in',
    'Fabricado en',
  ),
};

export const TYPE_TEMPLATES = {
  electronics: {
    icon: '💻',
    name: l(
      'Electronics',
      'Elektronik',
      'Electronice',
      'Elektronika',
      'Elettronica',
      'Electrónica',
    ),
    fields: [
      { kind: 'text', label: l('Model', 'Modell', 'Model', 'Modell', 'Modello', 'Modelo') },
      {
        kind: 'number',
        label: l(
          'Screen size',
          'Bildschirmdiagonale',
          'Diagonală ecran',
          'Képátló',
          'Dimensione dello schermo',
          'Tamaño de pantalla',
        ),
        unit: '″',
      },
      {
        kind: 'text',
        label: l('Processor', 'Prozessor', 'Procesor', 'Processzor', 'Processore', 'Procesador'),
      },
      {
        kind: 'number',
        label: l(
          'Memory (RAM)',
          'Arbeitsspeicher (RAM)',
          'Memorie (RAM)',
          'Memória (RAM)',
          'Memoria (RAM)',
          'Memoria (RAM)',
        ),
        unit: 'GB',
      },
      {
        kind: 'number',
        label: l('Storage', 'Speicher', 'Stocare', 'Tárhely', 'Archiviazione', 'Almacenamiento'),
        unit: 'GB',
      },
      {
        kind: 'number',
        label: l('Battery', 'Akku', 'Baterie', 'Akkumulátor', 'Batteria', 'Batería'),
        unit: 'mAh',
      },
      {
        kind: 'multiselect',
        label: l(
          'Connectivity',
          'Verbindungen',
          'Conectivitate',
          'Csatlakozás',
          'Connettività',
          'Conectividad',
        ),
        choices: [
          l('Wi-Fi', 'WLAN', 'Wi-Fi', 'Wi-Fi', 'Wi-Fi', 'Wi-Fi'),
          l('Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth'),
          l('5G', '5G', '5G', '5G', '5G', '5G'),
          l('USB-C', 'USB-C', 'USB-C', 'USB-C', 'USB-C', 'USB-C'),
          l('NFC', 'NFC', 'NFC', 'NFC', 'NFC', 'NFC'),
          l('HDMI', 'HDMI', 'HDMI', 'HDMI', 'HDMI', 'HDMI'),
        ],
      },
      { ...COLOUR },
      { ...WEIGHT },
      { ...WARRANTY, required: true },
    ],
  },
  clothing: {
    icon: '👕',
    name: l(
      'Clothing and textiles',
      'Kleidung und Textilien',
      'Îmbrăcăminte și textile',
      'Ruházat és textil',
      'Abbigliamento e tessili',
      'Ropa y textiles',
    ),
    fields: [
      {
        kind: 'multiselect',
        label: l('Sizes', 'Größen', 'Mărimi', 'Méretek', 'Taglie', 'Tallas'),
        choices: SIZES,
      },
      { ...COLOUR },
      {
        kind: 'text',
        label: l(
          'Composition',
          'Zusammensetzung',
          'Compoziție',
          'Összetétel',
          'Composizione',
          'Composición',
        ),
        required: true,
      },
      {
        kind: 'select',
        label: l('Fit', 'Passform', 'Croială', 'Szabás', 'Vestibilità', 'Corte'),
        choices: [
          l('Slim', 'Schmal', 'Slim', 'Karcsúsított', 'Slim', 'Entallado'),
          l('Regular', 'Normal', 'Regular', 'Normál', 'Regular', 'Regular'),
          l('Loose', 'Weit', 'Lejer', 'Bő', 'Ampia', 'Holgado'),
          l('Oversized', 'Oversized', 'Oversized', 'Oversized', 'Oversize', 'Oversize'),
        ],
      },
      {
        kind: 'select',
        label: l('For', 'Für', 'Pentru', 'Kinek', 'Per', 'Para'),
        choices: [
          l('Women', 'Damen', 'Femei', 'Nők', 'Donna', 'Mujer'),
          l('Men', 'Herren', 'Bărbați', 'Férfiak', 'Uomo', 'Hombre'),
          l('Unisex', 'Unisex', 'Unisex', 'Uniszex', 'Unisex', 'Unisex'),
          l('Children', 'Kinder', 'Copii', 'Gyerekek', 'Bambini', 'Niños'),
        ],
      },
      {
        kind: 'textarea',
        label: l('Care', 'Pflege', 'Întreținere', 'Ápolás', 'Cura', 'Cuidados'),
      },
      { ...ORIGIN },
    ],
  },
  shoes: {
    icon: '👟',
    name: l('Shoes', 'Schuhe', 'Încălțăminte', 'Cipők', 'Scarpe', 'Calzado'),
    fields: [
      {
        kind: 'text',
        label: l(
          'Sizes (EU)',
          'Größen (EU)',
          'Mărimi (EU)',
          'Méretek (EU)',
          'Taglie (EU)',
          'Tallas (UE)',
        ),
      },
      { ...COLOUR },
      {
        kind: 'text',
        label: l(
          'Upper',
          'Obermaterial',
          'Material exterior',
          'Felsőrész',
          'Tomaia',
          'Parte superior',
        ),
      },
      { kind: 'text', label: l('Sole', 'Sohle', 'Talpă', 'Talp', 'Suola', 'Suela') },
      yes(l('Waterproof', 'Wasserdicht', 'Impermeabil', 'Vízálló', 'Impermeabile', 'Impermeable')),
      { ...ORIGIN },
    ],
  },
  books: {
    icon: '📚',
    name: l('Books', 'Bücher', 'Cărți', 'Könyvek', 'Libri', 'Libros'),
    fields: [
      {
        kind: 'text',
        label: l('Author', 'Autor', 'Autor', 'Szerző', 'Autore', 'Autor'),
        required: true,
      },
      { kind: 'text', label: l('Publisher', 'Verlag', 'Editură', 'Kiadó', 'Editore', 'Editorial') },
      { kind: 'text', label: l('ISBN', 'ISBN', 'ISBN', 'ISBN', 'ISBN', 'ISBN') },
      { kind: 'number', label: l('Pages', 'Seiten', 'Pagini', 'Oldalak', 'Pagine', 'Páginas') },
      { kind: 'text', label: l('Language', 'Sprache', 'Limbă', 'Nyelv', 'Lingua', 'Idioma') },
      {
        kind: 'select',
        label: l('Binding', 'Einband', 'Copertă', 'Kötés', 'Rilegatura', 'Encuadernación'),
        choices: [
          l('Paperback', 'Taschenbuch', 'Broșată', 'Puhatáblás', 'Tascabile', 'Tapa blanda'),
          l('Hardcover', 'Gebunden', 'Cartonată', 'Keménytáblás', 'Copertina rigida', 'Tapa dura'),
          l('E-book', 'E-Book', 'E-book', 'E-könyv', 'E-book', 'E-book'),
        ],
      },
      { kind: 'number', label: l('Year', 'Jahr', 'An', 'Év', 'Anno', 'Año') },
    ],
  },
  food: {
    icon: '🍯',
    name: l(
      'Food and drink',
      'Lebensmittel und Getränke',
      'Alimente și băuturi',
      'Élelmiszer és ital',
      'Alimenti e bevande',
      'Alimentación y bebidas',
    ),
    fields: [
      {
        kind: 'text',
        label: l(
          'Net quantity',
          'Nettofüllmenge',
          'Cantitate netă',
          'Nettó mennyiség',
          'Quantità netta',
          'Cantidad neta',
        ),
        required: true,
      },
      {
        kind: 'textarea',
        label: l(
          'Ingredients',
          'Zutaten',
          'Ingrediente',
          'Összetevők',
          'Ingredienti',
          'Ingredientes',
        ),
        required: true,
      },
      {
        kind: 'multiselect',
        label: l('Allergens', 'Allergene', 'Alergeni', 'Allergének', 'Allergeni', 'Alérgenos'),
        choices: [
          l('Gluten', 'Gluten', 'Gluten', 'Glutén', 'Glutine', 'Gluten'),
          l('Milk', 'Milch', 'Lapte', 'Tej', 'Latte', 'Leche'),
          l('Eggs', 'Eier', 'Ouă', 'Tojás', 'Uova', 'Huevos'),
          l(
            'Nuts',
            'Schalenfrüchte',
            'Fructe cu coajă',
            'Diófélék',
            'Frutta a guscio',
            'Frutos de cáscara',
          ),
          l('Peanuts', 'Erdnüsse', 'Arahide', 'Földimogyoró', 'Arachidi', 'Cacahuetes'),
          l('Soy', 'Soja', 'Soia', 'Szója', 'Soia', 'Soja'),
          l('Sesame', 'Sesam', 'Susan', 'Szezám', 'Sesamo', 'Sésamo'),
          l('Fish', 'Fisch', 'Pește', 'Hal', 'Pesce', 'Pescado'),
        ],
      },
      {
        kind: 'textarea',
        label: l(
          'Nutrition per 100 g',
          'Nährwerte je 100 g',
          'Valori nutriționale la 100 g',
          'Tápérték 100 g-ban',
          'Valori nutrizionali per 100 g',
          'Información nutricional por 100 g',
        ),
      },
      {
        kind: 'text',
        label: l('Storage', 'Lagerung', 'Păstrare', 'Tárolás', 'Conservazione', 'Conservación'),
      },
      {
        kind: 'number',
        label: l(
          'Best before',
          'Mindestens haltbar',
          'Termen de valabilitate',
          'Minőségét megőrzi',
          'Da consumarsi preferibilmente entro',
          'Consumo preferente',
        ),
        unit: DAYS,
      },
      yes(l('Organic', 'Bio', 'Bio', 'Bio', 'Bio', 'Ecológico')),
      { ...ORIGIN },
    ],
  },
  cosmetics: {
    icon: '🧴',
    name: l(
      'Cosmetics and care',
      'Kosmetik und Pflege',
      'Cosmetice și îngrijire',
      'Kozmetikum és ápolás',
      'Cosmetici e cura',
      'Cosmética y cuidado',
    ),
    fields: [
      {
        kind: 'text',
        label: l('Volume', 'Inhalt', 'Volum', 'Kiszerelés', 'Contenuto', 'Contenido'),
        unit: 'ml',
      },
      {
        kind: 'select',
        label: l('Skin type', 'Hauttyp', 'Tip de ten', 'Bőrtípus', 'Tipo di pelle', 'Tipo de piel'),
        choices: [
          l('All', 'Alle', 'Toate', 'Minden', 'Tutti', 'Todas'),
          l('Dry', 'Trocken', 'Uscat', 'Száraz', 'Secca', 'Seca'),
          l('Oily', 'Fettig', 'Gras', 'Zsíros', 'Grassa', 'Grasa'),
          l('Combination', 'Mischhaut', 'Mixt', 'Vegyes', 'Mista', 'Mixta'),
          l('Sensitive', 'Empfindlich', 'Sensibil', 'Érzékeny', 'Sensibile', 'Sensible'),
        ],
      },
      {
        kind: 'textarea',
        label: l(
          'Ingredients (INCI)',
          'Inhaltsstoffe (INCI)',
          'Ingrediente (INCI)',
          'Összetevők (INCI)',
          'Ingredienti (INCI)',
          'Ingredientes (INCI)',
        ),
      },
      {
        kind: 'textarea',
        label: l(
          'How to use',
          'Anwendung',
          'Mod de utilizare',
          'Használat',
          'Modo d’uso',
          'Modo de empleo',
        ),
      },
      yes(l('Vegan', 'Vegan', 'Vegan', 'Vegán', 'Vegano', 'Vegano')),
      yes(
        l(
          'Cruelty free',
          'Tierversuchsfrei',
          'Netestat pe animale',
          'Állatkísérletmentes',
          'Non testato su animali',
          'No testado en animales',
        ),
      ),
      {
        kind: 'number',
        label: l(
          'After opening',
          'Nach dem Öffnen',
          'După deschidere',
          'Felbontás után',
          'Dopo l’apertura',
          'Tras la apertura',
        ),
        unit: l('months', 'Monate', 'luni', 'hónap', 'mesi', 'meses'),
      },
    ],
  },
  furniture: {
    icon: '🛋️',
    name: l(
      'Furniture and home',
      'Möbel und Wohnen',
      'Mobilă și casă',
      'Bútor és otthon',
      'Mobili e casa',
      'Muebles y hogar',
    ),
    fields: [
      { ...DIMENSIONS, required: true },
      { ...MATERIAL },
      { ...COLOUR },
      { ...WEIGHT },
      {
        kind: 'number',
        label: l(
          'Max. load',
          'Max. Belastung',
          'Sarcină max.',
          'Max. terhelés',
          'Carico max.',
          'Carga máx.',
        ),
        unit: 'kg',
      },
      yes(
        l(
          'Assembly needed',
          'Montage nötig',
          'Necesită montaj',
          'Összeszerelést igényel',
          'Montaggio necessario',
          'Requiere montaje',
        ),
      ),
      { ...WARRANTY },
    ],
  },
  jewellery: {
    icon: '💍',
    name: l(
      'Jewellery and accessories',
      'Schmuck und Accessoires',
      'Bijuterii și accesorii',
      'Ékszer és kiegészítő',
      'Gioielli e accessori',
      'Joyería y accesorios',
    ),
    fields: [
      {
        kind: 'select',
        label: l('Metal', 'Metall', 'Metal', 'Fém', 'Metallo', 'Metal'),
        choices: [
          l('Gold', 'Gold', 'Aur', 'Arany', 'Oro', 'Oro'),
          l('Silver 925', 'Silber 925', 'Argint 925', 'Ezüst 925', 'Argento 925', 'Plata 925'),
          l(
            'Stainless steel',
            'Edelstahl',
            'Oțel inoxidabil',
            'Nemesacél',
            'Acciaio inossidabile',
            'Acero inoxidable',
          ),
          l('Brass', 'Messing', 'Alamă', 'Sárgaréz', 'Ottone', 'Latón'),
          l('Other', 'Andere', 'Altul', 'Egyéb', 'Altro', 'Otro'),
        ],
      },
      { kind: 'text', label: l('Stone', 'Stein', 'Piatră', 'Kő', 'Pietra', 'Piedra') },
      {
        kind: 'text',
        label: l(
          'Size or length',
          'Größe oder Länge',
          'Mărime sau lungime',
          'Méret vagy hossz',
          'Misura o lunghezza',
          'Talla o longitud',
        ),
      },
      {
        kind: 'number',
        label: l('Weight', 'Gewicht', 'Greutate', 'Tömeg', 'Peso', 'Peso'),
        unit: 'g',
      },
      yes(
        l('Nickel free', 'Nickelfrei', 'Fără nichel', 'Nikkelmentes', 'Senza nichel', 'Sin níquel'),
      ),
      yes(
        l(
          'Gift box included',
          'Mit Geschenkbox',
          'Cutie cadou inclusă',
          'Díszdobozzal',
          'Confezione regalo inclusa',
          'Caja de regalo incluida',
        ),
      ),
    ],
  },
  toys: {
    icon: '🧸',
    name: l(
      'Toys and games',
      'Spielzeug und Spiele',
      'Jucării și jocuri',
      'Játékok',
      'Giocattoli e giochi',
      'Juguetes y juegos',
    ),
    fields: [
      {
        kind: 'number',
        label: l('Age from', 'Alter ab', 'Vârsta de la', 'Életkor', 'Età da', 'Edad desde'),
        unit: '+',
        required: true,
      },
      {
        kind: 'text',
        label: l('Players', 'Spieler', 'Jucători', 'Játékosok', 'Giocatori', 'Jugadores'),
      },
      { ...MATERIAL },
      yes(
        l(
          'Batteries needed',
          'Batterien nötig',
          'Necesită baterii',
          'Elem szükséges',
          'Batterie necessarie',
          'Requiere pilas',
        ),
      ),
      {
        kind: 'text',
        label: l(
          'Safety warnings',
          'Warnhinweise',
          'Avertismente',
          'Figyelmeztetések',
          'Avvertenze',
          'Advertencias',
        ),
      },
      { ...DIMENSIONS },
    ],
  },
  sports: {
    icon: '⚽',
    name: l(
      'Sports and outdoor',
      'Sport und Outdoor',
      'Sport și outdoor',
      'Sport és szabadidő',
      'Sport e outdoor',
      'Deporte y aire libre',
    ),
    fields: [
      { kind: 'text', label: l('Sport', 'Sportart', 'Sport', 'Sportág', 'Sport', 'Deporte') },
      { kind: 'text', label: l('Size', 'Größe', 'Mărime', 'Méret', 'Misura', 'Talla') },
      { ...MATERIAL },
      { ...WEIGHT },
      {
        kind: 'select',
        label: l('Level', 'Niveau', 'Nivel', 'Szint', 'Livello', 'Nivel'),
        choices: [
          l('Beginner', 'Einsteiger', 'Începător', 'Kezdő', 'Principiante', 'Principiante'),
          l('Intermediate', 'Fortgeschritten', 'Intermediar', 'Haladó', 'Intermedio', 'Intermedio'),
          l('Professional', 'Profi', 'Profesionist', 'Profi', 'Professionista', 'Profesional'),
        ],
      },
      yes(l('Waterproof', 'Wasserdicht', 'Impermeabil', 'Vízálló', 'Impermeabile', 'Impermeable')),
    ],
  },
  handmade: {
    icon: '🎨',
    name: l(
      'Handmade and art',
      'Handgemacht und Kunst',
      'Handmade și artă',
      'Kézműves és művészet',
      'Fatto a mano e arte',
      'Hecho a mano y arte',
    ),
    fields: [
      {
        kind: 'text',
        label: l('Technique', 'Technik', 'Tehnică', 'Technika', 'Tecnica', 'Técnica'),
      },
      { ...MATERIAL },
      { ...DIMENSIONS },
      yes(
        l('One of a kind', 'Einzelstück', 'Unicat', 'Egyedi darab', 'Pezzo unico', 'Pieza única'),
      ),
      {
        kind: 'number',
        label: l(
          'Made to order in',
          'Auf Bestellung in',
          'Realizat la comandă în',
          'Rendelésre elkészül',
          'Realizzato su ordinazione in',
          'Hecho por encargo en',
        ),
        unit: DAYS,
      },
      { kind: 'textarea', label: l('Care', 'Pflege', 'Întreținere', 'Ápolás', 'Cura', 'Cuidados') },
    ],
  },
} satisfies Record<string, TypeTemplate>;

export type TemplateId = keyof typeof TYPE_TEMPLATES;
export const TEMPLATE_IDS = Object.keys(TYPE_TEMPLATES) as TemplateId[];
export const isTemplateId = (v: unknown): v is TemplateId =>
  typeof v === 'string' && v in TYPE_TEMPLATES;

/** A template as the store's type in `locale`. */
export function templateType(id: TemplateId, locale: Locale) {
  const t: TypeTemplate = TYPE_TEMPLATES[id];
  return {
    name: t.name[locale],
    fields: t.fields.map((f) => ({
      id: null,
      label: f.label[locale],
      kind: f.kind,
      unit: f.unit === undefined ? null : typeof f.unit === 'string' ? f.unit : f.unit[locale],
      choices: (f.choices ?? []).map((c) => c[locale]),
      required: f.required ?? false,
      inCompare: f.kind !== 'textarea',
    })),
  };
}
