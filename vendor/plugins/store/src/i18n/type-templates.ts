import type { Locale } from '@devquake/ui';
import type { FieldKind } from '../lib/fields';

// Ready-made product types the owner starts from (ADR 0058), in every language (ADR 0011). A
// template becomes the store's own type in the owner's language; they change it as they like.
// A test checks that every language has every text.

type L = Record<Locale, string>;
const l = (en: string, de: string, ro: string, hu: string): L => ({ en, de, ro, hu });

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

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => l(s, s, s, s));

const COLOURS = [
  l('Black', 'Schwarz', 'Negru', 'Fekete'),
  l('White', 'Weiß', 'Alb', 'Fehér'),
  l('Grey', 'Grau', 'Gri', 'Szürke'),
  l('Blue', 'Blau', 'Albastru', 'Kék'),
  l('Red', 'Rot', 'Roșu', 'Piros'),
  l('Green', 'Grün', 'Verde', 'Zöld'),
  l('Beige', 'Beige', 'Bej', 'Bézs'),
  l('Brown', 'Braun', 'Maro', 'Barna'),
  l('Multicolour', 'Mehrfarbig', 'Multicolor', 'Többszínű'),
];

const COLOUR: TemplateField = {
  kind: 'select',
  label: l('Colour', 'Farbe', 'Culoare', 'Szín'),
  choices: COLOURS,
};

const MATERIAL: TemplateField = {
  kind: 'text',
  label: l('Material', 'Material', 'Material', 'Anyag'),
};

const DIMENSIONS: TemplateField = {
  kind: 'text',
  label: l(
    'Dimensions (W × H × D)',
    'Maße (B × H × T)',
    'Dimensiuni (L × Î × A)',
    'Méretek (Sz × M × M)',
  ),
  unit: 'cm',
};

const WEIGHT: TemplateField = {
  kind: 'number',
  label: l('Weight', 'Gewicht', 'Greutate', 'Tömeg'),
  unit: 'kg',
};

const WARRANTY: TemplateField = {
  kind: 'number',
  label: l('Warranty', 'Garantie', 'Garanție', 'Garancia'),
  unit: l('months', 'Monate', 'luni', 'hónap'),
};

const DAYS = l('days', 'Tage', 'zile', 'nap');

const ORIGIN: TemplateField = {
  kind: 'text',
  label: l('Made in', 'Hergestellt in', 'Fabricat în', 'Gyártás helye'),
};

export const TYPE_TEMPLATES = {
  electronics: {
    icon: '💻',
    name: l('Electronics', 'Elektronik', 'Electronice', 'Elektronika'),
    fields: [
      { kind: 'text', label: l('Model', 'Modell', 'Model', 'Modell') },
      {
        kind: 'number',
        label: l('Screen size', 'Bildschirmdiagonale', 'Diagonală ecran', 'Képátló'),
        unit: '″',
      },
      { kind: 'text', label: l('Processor', 'Prozessor', 'Procesor', 'Processzor') },
      {
        kind: 'number',
        label: l('Memory (RAM)', 'Arbeitsspeicher (RAM)', 'Memorie (RAM)', 'Memória (RAM)'),
        unit: 'GB',
      },
      { kind: 'number', label: l('Storage', 'Speicher', 'Stocare', 'Tárhely'), unit: 'GB' },
      { kind: 'number', label: l('Battery', 'Akku', 'Baterie', 'Akkumulátor'), unit: 'mAh' },
      {
        kind: 'multiselect',
        label: l('Connectivity', 'Verbindungen', 'Conectivitate', 'Csatlakozás'),
        choices: [
          l('Wi-Fi', 'WLAN', 'Wi-Fi', 'Wi-Fi'),
          l('Bluetooth', 'Bluetooth', 'Bluetooth', 'Bluetooth'),
          l('5G', '5G', '5G', '5G'),
          l('USB-C', 'USB-C', 'USB-C', 'USB-C'),
          l('NFC', 'NFC', 'NFC', 'NFC'),
          l('HDMI', 'HDMI', 'HDMI', 'HDMI'),
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
    ),
    fields: [
      { kind: 'multiselect', label: l('Sizes', 'Größen', 'Mărimi', 'Méretek'), choices: SIZES },
      { ...COLOUR },
      {
        kind: 'text',
        label: l('Composition', 'Zusammensetzung', 'Compoziție', 'Összetétel'),
        required: true,
      },
      {
        kind: 'select',
        label: l('Fit', 'Passform', 'Croială', 'Szabás'),
        choices: [
          l('Slim', 'Schmal', 'Slim', 'Karcsúsított'),
          l('Regular', 'Normal', 'Regular', 'Normál'),
          l('Loose', 'Weit', 'Lejer', 'Bő'),
          l('Oversized', 'Oversized', 'Oversized', 'Oversized'),
        ],
      },
      {
        kind: 'select',
        label: l('For', 'Für', 'Pentru', 'Kinek'),
        choices: [
          l('Women', 'Damen', 'Femei', 'Nők'),
          l('Men', 'Herren', 'Bărbați', 'Férfiak'),
          l('Unisex', 'Unisex', 'Unisex', 'Uniszex'),
          l('Children', 'Kinder', 'Copii', 'Gyerekek'),
        ],
      },
      {
        kind: 'textarea',
        label: l('Care', 'Pflege', 'Întreținere', 'Ápolás'),
      },
      { ...ORIGIN },
    ],
  },
  shoes: {
    icon: '👟',
    name: l('Shoes', 'Schuhe', 'Încălțăminte', 'Cipők'),
    fields: [
      { kind: 'text', label: l('Sizes (EU)', 'Größen (EU)', 'Mărimi (EU)', 'Méretek (EU)') },
      { ...COLOUR },
      { kind: 'text', label: l('Upper', 'Obermaterial', 'Material exterior', 'Felsőrész') },
      { kind: 'text', label: l('Sole', 'Sohle', 'Talpă', 'Talp') },
      yes(l('Waterproof', 'Wasserdicht', 'Impermeabil', 'Vízálló')),
      { ...ORIGIN },
    ],
  },
  books: {
    icon: '📚',
    name: l('Books', 'Bücher', 'Cărți', 'Könyvek'),
    fields: [
      { kind: 'text', label: l('Author', 'Autor', 'Autor', 'Szerző'), required: true },
      { kind: 'text', label: l('Publisher', 'Verlag', 'Editură', 'Kiadó') },
      { kind: 'text', label: l('ISBN', 'ISBN', 'ISBN', 'ISBN') },
      { kind: 'number', label: l('Pages', 'Seiten', 'Pagini', 'Oldalak') },
      { kind: 'text', label: l('Language', 'Sprache', 'Limbă', 'Nyelv') },
      {
        kind: 'select',
        label: l('Binding', 'Einband', 'Copertă', 'Kötés'),
        choices: [
          l('Paperback', 'Taschenbuch', 'Broșată', 'Puhatáblás'),
          l('Hardcover', 'Gebunden', 'Cartonată', 'Keménytáblás'),
          l('E-book', 'E-Book', 'E-book', 'E-könyv'),
        ],
      },
      { kind: 'number', label: l('Year', 'Jahr', 'An', 'Év') },
    ],
  },
  food: {
    icon: '🍯',
    name: l(
      'Food and drink',
      'Lebensmittel und Getränke',
      'Alimente și băuturi',
      'Élelmiszer és ital',
    ),
    fields: [
      {
        kind: 'text',
        label: l('Net quantity', 'Nettofüllmenge', 'Cantitate netă', 'Nettó mennyiség'),
        required: true,
      },
      {
        kind: 'textarea',
        label: l('Ingredients', 'Zutaten', 'Ingrediente', 'Összetevők'),
        required: true,
      },
      {
        kind: 'multiselect',
        label: l('Allergens', 'Allergene', 'Alergeni', 'Allergének'),
        choices: [
          l('Gluten', 'Gluten', 'Gluten', 'Glutén'),
          l('Milk', 'Milch', 'Lapte', 'Tej'),
          l('Eggs', 'Eier', 'Ouă', 'Tojás'),
          l('Nuts', 'Schalenfrüchte', 'Fructe cu coajă', 'Diófélék'),
          l('Peanuts', 'Erdnüsse', 'Arahide', 'Földimogyoró'),
          l('Soy', 'Soja', 'Soia', 'Szója'),
          l('Sesame', 'Sesam', 'Susan', 'Szezám'),
          l('Fish', 'Fisch', 'Pește', 'Hal'),
        ],
      },
      {
        kind: 'textarea',
        label: l(
          'Nutrition per 100 g',
          'Nährwerte je 100 g',
          'Valori nutriționale la 100 g',
          'Tápérték 100 g-ban',
        ),
      },
      { kind: 'text', label: l('Storage', 'Lagerung', 'Păstrare', 'Tárolás') },
      {
        kind: 'number',
        label: l(
          'Best before',
          'Mindestens haltbar',
          'Termen de valabilitate',
          'Minőségét megőrzi',
        ),
        unit: DAYS,
      },
      yes(l('Organic', 'Bio', 'Bio', 'Bio')),
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
    ),
    fields: [
      { kind: 'text', label: l('Volume', 'Inhalt', 'Volum', 'Kiszerelés'), unit: 'ml' },
      {
        kind: 'select',
        label: l('Skin type', 'Hauttyp', 'Tip de ten', 'Bőrtípus'),
        choices: [
          l('All', 'Alle', 'Toate', 'Minden'),
          l('Dry', 'Trocken', 'Uscat', 'Száraz'),
          l('Oily', 'Fettig', 'Gras', 'Zsíros'),
          l('Combination', 'Mischhaut', 'Mixt', 'Vegyes'),
          l('Sensitive', 'Empfindlich', 'Sensibil', 'Érzékeny'),
        ],
      },
      {
        kind: 'textarea',
        label: l(
          'Ingredients (INCI)',
          'Inhaltsstoffe (INCI)',
          'Ingrediente (INCI)',
          'Összetevők (INCI)',
        ),
      },
      { kind: 'textarea', label: l('How to use', 'Anwendung', 'Mod de utilizare', 'Használat') },
      yes(l('Vegan', 'Vegan', 'Vegan', 'Vegán')),
      yes(l('Cruelty free', 'Tierversuchsfrei', 'Netestat pe animale', 'Állatkísérletmentes')),
      {
        kind: 'number',
        label: l('After opening', 'Nach dem Öffnen', 'După deschidere', 'Felbontás után'),
        unit: l('months', 'Monate', 'luni', 'hónap'),
      },
    ],
  },
  furniture: {
    icon: '🛋️',
    name: l('Furniture and home', 'Möbel und Wohnen', 'Mobilă și casă', 'Bútor és otthon'),
    fields: [
      { ...DIMENSIONS, required: true },
      { ...MATERIAL },
      { ...COLOUR },
      { ...WEIGHT },
      {
        kind: 'number',
        label: l('Max. load', 'Max. Belastung', 'Sarcină max.', 'Max. terhelés'),
        unit: 'kg',
      },
      yes(l('Assembly needed', 'Montage nötig', 'Necesită montaj', 'Összeszerelést igényel')),
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
    ),
    fields: [
      {
        kind: 'select',
        label: l('Metal', 'Metall', 'Metal', 'Fém'),
        choices: [
          l('Gold', 'Gold', 'Aur', 'Arany'),
          l('Silver 925', 'Silber 925', 'Argint 925', 'Ezüst 925'),
          l('Stainless steel', 'Edelstahl', 'Oțel inoxidabil', 'Nemesacél'),
          l('Brass', 'Messing', 'Alamă', 'Sárgaréz'),
          l('Other', 'Andere', 'Altul', 'Egyéb'),
        ],
      },
      { kind: 'text', label: l('Stone', 'Stein', 'Piatră', 'Kő') },
      {
        kind: 'text',
        label: l('Size or length', 'Größe oder Länge', 'Mărime sau lungime', 'Méret vagy hossz'),
      },
      { kind: 'number', label: l('Weight', 'Gewicht', 'Greutate', 'Tömeg'), unit: 'g' },
      yes(l('Nickel free', 'Nickelfrei', 'Fără nichel', 'Nikkelmentes')),
      yes(l('Gift box included', 'Mit Geschenkbox', 'Cutie cadou inclusă', 'Díszdobozzal')),
    ],
  },
  toys: {
    icon: '🧸',
    name: l('Toys and games', 'Spielzeug und Spiele', 'Jucării și jocuri', 'Játékok'),
    fields: [
      {
        kind: 'number',
        label: l('Age from', 'Alter ab', 'Vârsta de la', 'Életkor'),
        unit: '+',
        required: true,
      },
      { kind: 'text', label: l('Players', 'Spieler', 'Jucători', 'Játékosok') },
      { ...MATERIAL },
      yes(l('Batteries needed', 'Batterien nötig', 'Necesită baterii', 'Elem szükséges')),
      {
        kind: 'text',
        label: l('Safety warnings', 'Warnhinweise', 'Avertismente', 'Figyelmeztetések'),
      },
      { ...DIMENSIONS },
    ],
  },
  sports: {
    icon: '⚽',
    name: l('Sports and outdoor', 'Sport und Outdoor', 'Sport și outdoor', 'Sport és szabadidő'),
    fields: [
      { kind: 'text', label: l('Sport', 'Sportart', 'Sport', 'Sportág') },
      { kind: 'text', label: l('Size', 'Größe', 'Mărime', 'Méret') },
      { ...MATERIAL },
      { ...WEIGHT },
      {
        kind: 'select',
        label: l('Level', 'Niveau', 'Nivel', 'Szint'),
        choices: [
          l('Beginner', 'Einsteiger', 'Începător', 'Kezdő'),
          l('Intermediate', 'Fortgeschritten', 'Intermediar', 'Haladó'),
          l('Professional', 'Profi', 'Profesionist', 'Profi'),
        ],
      },
      yes(l('Waterproof', 'Wasserdicht', 'Impermeabil', 'Vízálló')),
    ],
  },
  handmade: {
    icon: '🎨',
    name: l(
      'Handmade and art',
      'Handgemacht und Kunst',
      'Handmade și artă',
      'Kézműves és művészet',
    ),
    fields: [
      { kind: 'text', label: l('Technique', 'Technik', 'Tehnică', 'Technika') },
      { ...MATERIAL },
      { ...DIMENSIONS },
      yes(l('One of a kind', 'Einzelstück', 'Unicat', 'Egyedi darab')),
      {
        kind: 'number',
        label: l(
          'Made to order in',
          'Auf Bestellung in',
          'Realizat la comandă în',
          'Rendelésre elkészül',
        ),
        unit: DAYS,
      },
      { kind: 'textarea', label: l('Care', 'Pflege', 'Întreținere', 'Ápolás') },
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
