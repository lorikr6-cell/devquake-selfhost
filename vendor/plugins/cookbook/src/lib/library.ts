// The DevQuake starter library: recipes written for DevQuake (never copied from websites or
// books), in every language (ADR 0011). Ingredients point to lib/foods.ts, so nutrition,
// allergens and diet checks are worked out. Ids are used in links and favourites: add freely,
// never rename or remove one.

import type { Locale } from '@devquake/ui';
import type { Allergen } from './foods';
import { foodById } from './foods';
import {
  defaultScaling,
  type Difficulty,
  type Ingredient,
  type Scaling,
  type Stage,
  type Step,
  type Tag,
  type Unit,
} from './recipe';

type L<T = string> = Record<Locale, T>;

interface LibraryIngredient {
  food: string;
  qty: number | null;
  unit: Unit;
  scaling?: Scaling;
}

export interface LibraryRecipe {
  id: string;
  icon: string;
  title: L;
  intro: L;
  tips: L | null;
  cuisine: L;
  servings: number;
  prepMin: number;
  cookMin: number;
  difficulty: Difficulty;
  tags: Tag[];
  allergens?: Allergen[];
  ingredients: LibraryIngredient[];
  steps: (L & { timer?: number; stage?: Stage })[];
}

const i = (food: string, qty: number | null, unit: Unit, scaling?: Scaling): LibraryIngredient => ({
  food,
  qty,
  unit,
  scaling,
});

export const LIBRARY: LibraryRecipe[] = [
  {
    id: 'shakshuka',
    icon: '🍳',
    title: { en: 'Shakshuka', de: 'Shakshuka', ro: 'Shakshuka', hu: 'Shakshuka' },
    intro: {
      en: 'Eggs poached in a spiced tomato and pepper sauce: one pan, ready in half an hour.',
      de: 'In würziger Tomaten-Paprika-Sauce pochierte Eier: eine Pfanne, in einer halben Stunde fertig.',
      ro: 'Ouă poșate într-un sos condimentat de roșii și ardei: o singură tigaie, gata în jumătate de oră.',
      hu: 'Fűszeres paradicsomos-paprikás szószban buggyantott tojás: egy serpenyő, fél óra alatt kész.',
    },
    tips: {
      en: 'Serve with bread to dip in the sauce. A pinch of chili flakes makes it hotter.',
      de: 'Mit Brot zum Tunken servieren. Eine Prise Chiliflocken macht es schärfer.',
      ro: 'Servește cu pâine pentru sos. Un vârf de cuțit de fulgi de chili îl face mai iute.',
      hu: 'Kenyérrel tálald, hogy a szószt is ki lehessen tunkolni. Egy csipet chilipehely csípősebbé teszi.',
    },
    cuisine: {
      en: 'Middle Eastern',
      de: 'Nahöstlich',
      ro: 'Orientul Mijlociu',
      hu: 'Közel-keleti',
    },
    servings: 2,
    prepMin: 10,
    cookMin: 20,
    difficulty: 'easy',
    tags: ['vegetarian', 'mediterranean', 'gluten-free'],
    ingredients: [
      i('olive-oil', 2, 'tbsp'),
      i('onion', 1, 'pcs'),
      i('bell-pepper', 1, 'pcs'),
      i('garlic', 2, 'clove'),
      i('cumin', 1, 'tsp'),
      i('paprika', 1, 'tsp'),
      i('canned-tomatoes', 1, 'can'),
      i('egg', 4, 'pcs'),
      i('salt', 0.5, 'tsp'),
      i('black-pepper', 1, 'pinch'),
      i('feta', 50, 'g'),
      i('parsley', 2, 'tbsp'),
    ],
    steps: [
      {
        en: 'Heat the oil in a wide pan. Add the chopped onion and pepper and soften them over medium heat.',
        de: 'Das Öl in einer weiten Pfanne erhitzen. Gehackte Zwiebel und Paprika darin bei mittlerer Hitze weich dünsten.',
        ro: 'Încălzește uleiul într-o tigaie largă. Adaugă ceapa și ardeiul tocate și călește-le la foc mediu.',
        hu: 'Egy széles serpenyőben hevítsd fel az olajat. Add hozzá az apróra vágott hagymát és paprikát, és közepes lángon párold puhára.',
        timer: 360,
      },
      {
        en: 'Add the crushed garlic, cumin and paprika and stir for one minute.',
        de: 'Zerdrückten Knoblauch, Kreuzkümmel und Paprikapulver zugeben und eine Minute rühren.',
        ro: 'Adaugă usturoiul zdrobit, chimionul și boiaua și amestecă un minut.',
        hu: 'Add hozzá a zúzott fokhagymát, a római köményt és a fűszerpaprikát, és kevergesd egy percig.',
        timer: 60,
      },
      {
        en: 'Pour in the tomatoes, season with salt and pepper and simmer until the sauce thickens.',
        de: 'Die Tomaten zugießen, mit Salz und Pfeffer würzen und köcheln lassen, bis die Sauce eindickt.',
        ro: 'Toarnă roșiile, condimentează cu sare și piper și lasă să fiarbă încet până se îngroașă sosul.',
        hu: 'Öntsd hozzá a paradicsomot, sózd, borsozd, és főzd, amíg a szósz besűrűsödik.',
        timer: 600,
      },
      {
        en: 'Make small hollows in the sauce, crack an egg into each, cover and cook until the whites have set.',
        de: 'Kleine Mulden in die Sauce drücken, in jede ein Ei schlagen, zudecken und garen, bis das Eiweiß gestockt ist.',
        ro: 'Fă mici adâncituri în sos, sparge câte un ou în fiecare, acoperă și gătește până se închegă albușurile.',
        hu: 'Készíts kis mélyedéseket a szószba, üss mindegyikbe egy tojást, fedd le, és főzd, amíg a fehérje megszilárdul.',
        timer: 360,
      },
      {
        stage: 'serve',
        en: 'Crumble the cheese over the top, sprinkle with parsley and serve straight from the pan.',
        de: 'Den Käse darüberbröseln, mit Petersilie bestreuen und direkt aus der Pfanne servieren.',
        ro: 'Sfărâmă brânza deasupra, presară pătrunjel și servește direct din tigaie.',
        hu: 'Morzsold rá a sajtot, szórd meg petrezselyemmel, és tálald egyenesen a serpenyőből.',
      },
    ],
  },
  {
    id: 'greek-salad',
    icon: '🥗',
    title: {
      en: 'Greek salad',
      de: 'Griechischer Salat',
      ro: 'Salată grecească',
      hu: 'Görög saláta',
    },
    intro: {
      en: 'Ripe tomatoes, cucumber, olives and a slab of white cheese: no cooking, just good ingredients.',
      de: 'Reife Tomaten, Gurke, Oliven und ein Stück Schafskäse: ohne Kochen, nur gute Zutaten.',
      ro: 'Roșii coapte, castraveți, măsline și o felie de telemea: fără gătit, doar ingrediente bune.',
      hu: 'Érett paradicsom, uborka, olajbogyó és egy szelet fehér sajt: főzés nélkül, csak jó alapanyagokból.',
    },
    tips: {
      en: 'Salt the tomatoes a few minutes before serving to bring out their juice.',
      de: 'Die Tomaten einige Minuten vor dem Servieren salzen, damit sie Saft ziehen.',
      ro: 'Sărează roșiile cu câteva minute înainte de servire ca să-și lase sucul.',
      hu: 'Néhány perccel tálalás előtt sózd meg a paradicsomot, hogy levet eresszen.',
    },
    cuisine: { en: 'Greek', de: 'Griechisch', ro: 'Grecească', hu: 'Görög' },
    servings: 2,
    prepMin: 15,
    cookMin: 0,
    difficulty: 'easy',
    tags: ['vegetarian', 'mediterranean', 'gluten-free'],
    ingredients: [
      i('tomato', 3, 'pcs'),
      i('cucumber', 1, 'pcs'),
      i('bell-pepper', 1, 'pcs'),
      i('onion', 50, 'g'),
      i('olives', 60, 'g'),
      i('feta', 150, 'g'),
      i('olive-oil', 3, 'tbsp'),
      i('oregano', 1, 'tsp'),
      i('salt', 1, 'pinch'),
    ],
    steps: [
      {
        stage: 'prepare',
        en: 'Cut the tomatoes and the cucumber into chunks, the pepper into strips and the onion into thin rings.',
        de: 'Tomaten und Gurke in Stücke, die Paprika in Streifen und die Zwiebel in dünne Ringe schneiden.',
        ro: 'Taie roșiile și castravetele bucăți, ardeiul fâșii și ceapa în rondele subțiri.',
        hu: 'Vágd darabokra a paradicsomot és az uborkát, csíkokra a paprikát, vékony karikákra a hagymát.',
      },
      {
        stage: 'prepare',
        en: 'Put everything in a wide bowl with the olives and season with a pinch of salt.',
        de: 'Alles mit den Oliven in eine weite Schüssel geben und mit einer Prise Salz würzen.',
        ro: 'Pune totul într-un bol larg cu măslinele și condimentează cu un praf de sare.',
        hu: 'Tedd az egészet az olajbogyóval egy széles tálba, és egy csipet sóval ízesítsd.',
      },
      {
        stage: 'serve',
        en: 'Lay the cheese on top in one piece, drizzle with the oil, sprinkle with oregano and serve.',
        de: 'Den Käse im Ganzen darauflegen, mit dem Öl beträufeln, mit Oregano bestreuen und servieren.',
        ro: 'Așază brânza deasupra într-o bucată, stropește cu ulei, presară oregano și servește.',
        hu: 'Tedd a sajtot egyben a tetejére, locsold meg olajjal, szórd meg oregánóval, és tálald.',
      },
    ],
  },
  {
    id: 'lentil-soup',
    icon: '🥣',
    title: {
      en: 'Red lentil soup',
      de: 'Rote Linsensuppe',
      ro: 'Supă de linte roșie',
      hu: 'Vöröslencse-leves',
    },
    intro: {
      en: 'A thick, warming soup from the pantry: lentils, carrots and tomatoes with cumin and lemon.',
      de: 'Eine sämige, wärmende Suppe aus dem Vorrat: Linsen, Karotten und Tomaten mit Kreuzkümmel und Zitrone.',
      ro: 'O supă groasă și caldă din cămară: linte, morcovi și roșii cu chimion și lămâie.',
      hu: 'Sűrű, melengető leves a kamrából: lencse, sárgarépa és paradicsom római köménnyel és citrommal.',
    },
    tips: {
      en: 'It thickens as it stands: add a little water when you warm it up again.',
      de: 'Sie dickt beim Stehen nach: beim Aufwärmen etwas Wasser zugeben.',
      ro: 'Se îngroașă pe măsură ce stă: adaugă puțină apă când o încălzești din nou.',
      hu: 'Állás közben besűrűsödik: újramelegítéskor adj hozzá egy kevés vizet.',
    },
    cuisine: { en: 'Turkish', de: 'Türkisch', ro: 'Turcească', hu: 'Török' },
    servings: 4,
    prepMin: 10,
    cookMin: 30,
    difficulty: 'easy',
    tags: ['vegan', 'vegetarian', 'lactose-free', 'mediterranean', 'budget'],
    ingredients: [
      i('olive-oil', 2, 'tbsp'),
      i('onion', 1, 'pcs'),
      i('carrot', 2, 'pcs'),
      i('garlic', 2, 'clove'),
      i('cumin', 1, 'tsp'),
      i('red-lentils', 250, 'g'),
      i('canned-tomatoes', 1, 'can'),
      i('vegetable-stock', 1.2, 'l'),
      i('lemon-juice', 2, 'tbsp'),
      i('salt', 1, 'tsp'),
      i('black-pepper', 1, 'pinch'),
    ],
    steps: [
      {
        en: 'Soften the chopped onion and the diced carrots in the oil in a large pot.',
        de: 'Gehackte Zwiebel und gewürfelte Karotten in einem großen Topf im Öl andünsten.',
        ro: 'Călește ceapa tocată și morcovii tăiați cubulețe în ulei, într-o oală mare.',
        hu: 'Egy nagy fazékban párold meg az olajon az apróra vágott hagymát és a felkockázott répát.',
        timer: 300,
      },
      {
        en: 'Add the garlic and cumin and stir for a minute.',
        de: 'Knoblauch und Kreuzkümmel zugeben und eine Minute rühren.',
        ro: 'Adaugă usturoiul și chimionul și amestecă un minut.',
        hu: 'Add hozzá a fokhagymát és a római köményt, és kevergesd egy percig.',
        timer: 60,
      },
      {
        en: 'Add the rinsed lentils, the tomatoes and the stock. Simmer, stirring now and then, until the lentils fall apart.',
        de: 'Abgespülte Linsen, Tomaten und Brühe zugeben. Unter gelegentlichem Rühren köcheln, bis die Linsen zerfallen.',
        ro: 'Adaugă lintea clătită, roșiile și supa. Fierbe la foc mic, amestecând din când în când, până se destramă lintea.',
        hu: 'Add hozzá a megmosott lencsét, a paradicsomot és az alaplét. Időnként megkeverve főzd, amíg a lencse szétfő.',
        timer: 1200,
      },
      {
        stage: 'serve',
        en: 'Blend part of the soup for a creamy texture, then season with salt, pepper and lemon juice.',
        de: 'Einen Teil der Suppe pürieren, damit sie cremig wird, dann mit Salz, Pfeffer und Zitronensaft abschmecken.',
        ro: 'Pasează o parte din supă ca să fie cremoasă, apoi potrivește de sare, piper și suc de lămâie.',
        hu: 'Turmixold le a leves egy részét, hogy krémes legyen, majd ízesítsd sóval, borssal és citromlével.',
      },
    ],
  },
  {
    id: 'chicken-stir-fry',
    icon: '🥢',
    title: {
      en: 'Chicken and broccoli stir-fry',
      de: 'Hähnchen-Brokkoli-Pfanne',
      ro: 'Pui cu broccoli la wok',
      hu: 'Csirkés-brokkolis wokos pirítás',
    },
    intro: {
      en: 'Tender chicken, crisp broccoli and pepper in a garlic, ginger and soy glaze, over rice.',
      de: 'Zartes Hähnchen, knackiger Brokkoli und Paprika in einer Knoblauch-Ingwer-Soja-Glasur, auf Reis.',
      ro: 'Pui fraged, broccoli și ardei crocanți într-un glazurat de usturoi, ghimbir și soia, cu orez.',
      hu: 'Puha csirke, roppanós brokkoli és paprika fokhagymás-gyömbéres-szójás mázban, rizzsel.',
    },
    tips: {
      en: 'Have everything cut before you start: stir-frying goes fast.',
      de: 'Alles vorher schneiden: In der Pfanne geht es schnell.',
      ro: 'Taie totul înainte să începi: la wok merge repede.',
      hu: 'Mindent vágj fel előre: a pirítás gyorsan megy.',
    },
    cuisine: { en: 'Asian', de: 'Asiatisch', ro: 'Asiatică', hu: 'Ázsiai' },
    servings: 2,
    prepMin: 15,
    cookMin: 15,
    difficulty: 'easy',
    tags: ['lactose-free'],
    ingredients: [
      i('rice', 150, 'g'),
      i('chicken-breast', 300, 'g'),
      i('broccoli', 250, 'g'),
      i('bell-pepper', 1, 'pcs'),
      i('garlic', 2, 'clove'),
      i('ginger', 10, 'g'),
      i('sunflower-oil', 1, 'tbsp'),
      i('soy-sauce', 2, 'tbsp'),
      i('honey', 1, 'tsp'),
    ],
    steps: [
      {
        stage: 'prepare',
        en: 'Cook the rice as the packet says.',
        de: 'Den Reis nach Packungsangabe kochen.',
        ro: 'Fierbe orezul după instrucțiunile de pe ambalaj.',
        hu: 'Főzd meg a rizst a csomagoláson leírtak szerint.',
        timer: 900,
      },
      {
        en: 'Cut the chicken into strips. Fry it in the hot oil until golden, then take it out of the pan.',
        de: 'Das Hähnchen in Streifen schneiden, im heißen Öl goldbraun braten und aus der Pfanne nehmen.',
        ro: 'Taie puiul fâșii. Prăjește-l în uleiul încins până se rumenește, apoi scoate-l din tigaie.',
        hu: 'Vágd csíkokra a csirkét. Forró olajon süsd aranybarnára, majd vedd ki a serpenyőből.',
        timer: 300,
      },
      {
        en: 'Stir-fry the broccoli florets and the pepper strips with two spoons of water until bright green.',
        de: 'Brokkoliröschen und Paprikastreifen mit zwei Löffeln Wasser unter Rühren braten, bis sie leuchtend grün sind.',
        ro: 'Călește buchețelele de broccoli și fâșiile de ardei cu două linguri de apă, până devin verde aprins.',
        hu: 'Pirítsd a brokkoli rózsáit és a paprikacsíkokat két kanál vízzel, amíg élénkzöldek lesznek.',
        timer: 240,
      },
      {
        en: 'Add the garlic and grated ginger for half a minute, return the chicken, add soy sauce and honey and toss for a minute. Serve over the rice.',
        de: 'Knoblauch und geriebenen Ingwer eine halbe Minute mitbraten, Hähnchen zurückgeben, Sojasauce und Honig zugeben und eine Minute schwenken. Auf dem Reis servieren.',
        ro: 'Adaugă usturoiul și ghimbirul ras pentru o jumătate de minut, pune puiul înapoi, adaugă sosul de soia și mierea și amestecă un minut. Servește cu orezul.',
        hu: 'Add hozzá a fokhagymát és a reszelt gyömbért fél percre, tedd vissza a csirkét, öntsd hozzá a szójaszószt és a mézet, és forgasd át egy percig. Rizzsel tálald.',
        timer: 60,
      },
    ],
  },
  {
    id: 'salmon-tray-bake',
    icon: '🐟',
    title: {
      en: 'Salmon and potato tray bake',
      de: 'Lachs mit Ofenkartoffeln',
      ro: 'Somon cu cartofi la tavă',
      hu: 'Tepsis lazac burgonyával',
    },
    intro: {
      en: 'Crisp potato wedges, zucchini and salmon from one tray, with lemon and dill.',
      de: 'Knusprige Kartoffelspalten, Zucchini und Lachs von einem Blech, mit Zitrone und Dill.',
      ro: 'Cartofi crocanți, dovlecei și somon dintr-o singură tavă, cu lămâie și mărar.',
      hu: 'Ropogós burgonyacikkek, cukkini és lazac egy tepsiből, citrommal és kaporral.',
    },
    tips: null,
    cuisine: { en: 'Mediterranean', de: 'Mediterran', ro: 'Mediteraneeană', hu: 'Mediterrán' },
    servings: 2,
    prepMin: 10,
    cookMin: 27,
    difficulty: 'easy',
    tags: ['pescatarian', 'mediterranean', 'gluten-free', 'lactose-free'],
    ingredients: [
      i('potato', 400, 'g'),
      i('zucchini', 1, 'pcs'),
      i('olive-oil', 2, 'tbsp'),
      i('salmon', 260, 'g'),
      i('lemon-juice', 1, 'tbsp'),
      i('dill', 1, 'tbsp'),
      i('salt', 0.5, 'tsp'),
      i('black-pepper', 1, 'pinch'),
    ],
    steps: [
      {
        stage: 'prepare',
        en: 'Heat the oven to 200 °C. Cut the potatoes into wedges, toss them with half the oil and the salt, and bake.',
        de: 'Den Ofen auf 200 °C vorheizen. Kartoffeln in Spalten schneiden, mit der Hälfte des Öls und dem Salz mischen und backen.',
        ro: 'Încălzește cuptorul la 200 °C. Taie cartofii felii lungi, amestecă-i cu jumătate din ulei și sarea și coace-i.',
        hu: 'Melegítsd elő a sütőt 200 °C-ra. Vágd cikkekre a burgonyát, forgasd össze az olaj felével és a sóval, és süsd.',
        timer: 900,
      },
      {
        en: 'Add the sliced zucchini and the salmon, drizzle with the rest of the oil and the lemon juice, season with pepper and bake until the fish flakes.',
        de: 'Zucchinischeiben und Lachs dazulegen, mit dem restlichen Öl und dem Zitronensaft beträufeln, pfeffern und backen, bis der Fisch zerfällt.',
        ro: 'Adaugă dovleceii feliați și somonul, stropește cu restul uleiului și cu suc de lămâie, piperează și coace până se desface peștele în fulgi.',
        hu: 'Tedd mellé a felkarikázott cukkinit és a lazacot, locsold meg a maradék olajjal és a citromlével, borsozd, és süsd, amíg a hal szétválik.',
        timer: 720,
      },
      {
        stage: 'serve',
        en: 'Sprinkle with chopped dill and serve.',
        de: 'Mit gehacktem Dill bestreuen und servieren.',
        ro: 'Presară mărar tocat și servește.',
        hu: 'Szórd meg apróra vágott kaporral, és tálald.',
      },
    ],
  },
  {
    id: 'overnight-oats',
    icon: '🥛',
    title: {
      en: 'Overnight oats with berries',
      de: 'Overnight Oats mit Beeren',
      ro: 'Ovăz peste noapte cu fructe de pădure',
      hu: 'Éjszakai zabkása bogyós gyümölccsel',
    },
    intro: {
      en: 'Five minutes in the evening, breakfast ready in the morning.',
      de: 'Fünf Minuten am Abend, morgens ist das Frühstück fertig.',
      ro: 'Cinci minute seara, micul dejun gata dimineața.',
      hu: 'Este öt perc, reggel kész a reggeli.',
    },
    tips: {
      en: 'Keeps for two days in the fridge: make several jars at once.',
      de: 'Hält zwei Tage im Kühlschrank: gleich mehrere Gläser machen.',
      ro: 'Se păstrează două zile la frigider: pregătește mai multe borcane deodată.',
      hu: 'Hűtőben két napig eláll: készíts egyszerre több üveggel.',
    },
    cuisine: { en: 'Breakfast', de: 'Frühstück', ro: 'Mic dejun', hu: 'Reggeli' },
    servings: 1,
    prepMin: 5,
    cookMin: 0,
    difficulty: 'easy',
    tags: ['vegetarian', 'breakfast'],
    ingredients: [
      i('oats', 50, 'g'),
      i('milk', 120, 'ml'),
      i('greek-yogurt', 60, 'g'),
      i('honey', 1, 'tsp'),
      i('cinnamon', 1, 'pinch'),
      i('berries', 70, 'g'),
    ],
    steps: [
      {
        stage: 'prepare',
        en: 'Stir the oats, milk, yogurt, honey and cinnamon together in a jar.',
        de: 'Haferflocken, Milch, Joghurt, Honig und Zimt in einem Glas verrühren.',
        ro: 'Amestecă într-un borcan fulgii de ovăz, laptele, iaurtul, mierea și scorțișoara.',
        hu: 'Egy üvegben keverd össze a zabpelyhet, a tejet, a joghurtot, a mézet és a fahéjat.',
      },
      {
        stage: 'prepare',
        en: 'Close the jar and leave it in the fridge overnight (at least four hours).',
        de: 'Das Glas verschließen und über Nacht (mindestens vier Stunden) in den Kühlschrank stellen.',
        ro: 'Închide borcanul și lasă-l la frigider peste noapte (cel puțin patru ore).',
        hu: 'Zárd le az üveget, és tedd a hűtőbe egy éjszakára (legalább négy órára).',
      },
      {
        stage: 'serve',
        en: 'In the morning, stir and top with the berries.',
        de: 'Am Morgen umrühren und die Beeren darauf geben.',
        ro: 'Dimineața, amestecă și pune fructele de pădure deasupra.',
        hu: 'Reggel keverd meg, és tedd a tetejére a bogyós gyümölcsöt.',
      },
    ],
  },
  {
    id: 'spaghetti-bolognese',
    icon: '🍝',
    title: {
      en: 'Spaghetti bolognese',
      de: 'Spaghetti Bolognese',
      ro: 'Spaghete bolognese',
      hu: 'Bolognai spagetti',
    },
    intro: {
      en: 'A family favourite: a slow-simmered beef and tomato sauce with spaghetti and Parmesan.',
      de: 'Ein Familienliebling: eine lange geköchelte Sauce aus Rindfleisch und Tomaten mit Spaghetti und Parmesan.',
      ro: 'Preferata familiei: un sos de vită și roșii fiert încet, cu spaghete și parmezan.',
      hu: 'A család kedvence: lassan főtt marhahúsos-paradicsomos szósz spagettivel és parmezánnal.',
    },
    tips: {
      en: 'The sauce is even better the next day and freezes well.',
      de: 'Die Sauce schmeckt am nächsten Tag noch besser und lässt sich gut einfrieren.',
      ro: 'Sosul e și mai bun a doua zi și se poate congela.',
      hu: 'A szósz másnap még jobb, és jól fagyasztható.',
    },
    cuisine: { en: 'Italian', de: 'Italienisch', ro: 'Italiană', hu: 'Olasz' },
    servings: 4,
    prepMin: 15,
    cookMin: 45,
    difficulty: 'medium',
    tags: [],
    ingredients: [
      i('olive-oil', 2, 'tbsp'),
      i('onion', 1, 'pcs'),
      i('carrot', 1, 'pcs'),
      i('garlic', 2, 'clove'),
      i('minced-beef', 400, 'g'),
      i('tomato-paste', 2, 'tbsp'),
      i('canned-tomatoes', 1, 'can'),
      i('oregano', 1, 'tsp'),
      i('salt', 1, 'tsp'),
      i('black-pepper', 1, 'pinch'),
      i('spaghetti', 400, 'g'),
      i('parmesan', 40, 'g'),
    ],
    steps: [
      {
        en: 'Soften the finely chopped onion and carrot in the oil, then add the garlic for a minute.',
        de: 'Fein gehackte Zwiebel und Karotte im Öl andünsten, dann den Knoblauch eine Minute mitdünsten.',
        ro: 'Călește ceapa și morcovul tocate mărunt în ulei, apoi adaugă usturoiul pentru un minut.',
        hu: 'Párold meg olajon az apróra vágott hagymát és répát, majd egy percre add hozzá a fokhagymát.',
        timer: 360,
      },
      {
        en: 'Add the beef and brown it, breaking it up with a spoon. Stir in the tomato paste.',
        de: 'Das Hackfleisch zugeben und krümelig anbraten. Das Tomatenmark einrühren.',
        ro: 'Adaugă carnea și rumenește-o, sfărâmând-o cu lingura. Amestecă pasta de roșii.',
        hu: 'Add hozzá a húst, és pirítsd meg, kanállal szétnyomkodva. Keverd bele a paradicsompürét.',
        timer: 420,
      },
      {
        en: 'Add the tomatoes, oregano, salt and pepper. Cover and simmer gently, stirring now and then.',
        de: 'Tomaten, Oregano, Salz und Pfeffer zugeben. Zugedeckt sanft köcheln lassen und ab und zu umrühren.',
        ro: 'Adaugă roșiile, oregano, sare și piper. Acoperă și fierbe încet, amestecând din când în când.',
        hu: 'Add hozzá a paradicsomot, az oregánót, a sót és a borsot. Lefedve, lassú tűzön főzd, időnként megkeverve.',
        timer: 1800,
      },
      {
        en: 'Meanwhile, cook the spaghetti in plenty of salted water as the packet says. Serve with the sauce and grated Parmesan.',
        de: 'Inzwischen die Spaghetti in reichlich Salzwasser nach Packungsangabe kochen. Mit der Sauce und geriebenem Parmesan servieren.',
        ro: 'Între timp, fierbe spaghetele în multă apă cu sare, după instrucțiuni. Servește cu sosul și parmezan ras.',
        hu: 'Közben főzd ki a spagettit bő sós vízben a csomagolás szerint. A szósszal és reszelt parmezánnal tálald.',
        timer: 600,
      },
    ],
  },
  {
    id: 'spinach-omelette',
    icon: '🥚',
    title: {
      en: 'Spinach and feta omelette',
      de: 'Omelett mit Spinat und Feta',
      ro: 'Omletă cu spanac și telemea',
      hu: 'Spenótos-fetás omlett',
    },
    intro: {
      en: 'A quick, filling breakfast or dinner for one, full of protein.',
      de: 'Ein schnelles, sättigendes Frühstück oder Abendessen für eine Person, voller Eiweiß.',
      ro: 'Un mic dejun sau o cină rapidă și sățioasă pentru o persoană, plină de proteine.',
      hu: 'Gyors, laktató reggeli vagy vacsora egy főre, sok fehérjével.',
    },
    tips: null,
    cuisine: { en: 'Everyday', de: 'Alltagsküche', ro: 'De zi cu zi', hu: 'Hétköznapi' },
    servings: 1,
    prepMin: 3,
    cookMin: 6,
    difficulty: 'easy',
    tags: ['vegetarian', 'gluten-free', 'breakfast'],
    ingredients: [
      i('egg', 3, 'pcs'),
      i('salt', 1, 'pinch'),
      i('black-pepper', 1, 'pinch'),
      i('butter', 1, 'tsp'),
      i('spinach', 30, 'g'),
      i('feta', 40, 'g'),
    ],
    steps: [
      {
        stage: 'prepare',
        en: 'Beat the eggs with the salt and pepper.',
        de: 'Die Eier mit Salz und Pfeffer verquirlen.',
        ro: 'Bate ouăle cu sare și piper.',
        hu: 'Verd fel a tojásokat sóval és borssal.',
      },
      {
        en: 'Melt the butter in a pan and wilt the spinach in it.',
        de: 'Die Butter in einer Pfanne schmelzen und den Spinat darin zusammenfallen lassen.',
        ro: 'Topește untul într-o tigaie și lasă spanacul să se înmoaie în el.',
        hu: 'Olvaszd fel a vajat egy serpenyőben, és fonnyaszd meg rajta a spenótot.',
        timer: 60,
      },
      {
        en: 'Pour in the eggs and cook over low heat until almost set.',
        de: 'Die Eier hineingießen und bei schwacher Hitze stocken lassen, bis sie fast fest sind.',
        ro: 'Toarnă ouăle și gătește la foc mic până aproape se închegă.',
        hu: 'Öntsd rá a tojást, és alacsony lángon süsd, amíg majdnem megdermed.',
        timer: 180,
      },
      {
        en: 'Crumble the cheese over one half, fold the omelette and cook for one more minute.',
        de: 'Den Käse über eine Hälfte bröseln, das Omelett zusammenklappen und noch eine Minute garen.',
        ro: 'Sfărâmă brânza pe o jumătate, împăturește omleta și mai gătește un minut.',
        hu: 'Morzsold a sajtot az egyik felére, hajtsd félbe az omlettet, és süsd még egy percig.',
        timer: 60,
      },
    ],
  },
  {
    id: 'mamaliga',
    icon: '🌽',
    title: {
      en: 'Polenta with cheese and sour cream',
      de: 'Polenta mit Käse und saurer Sahne',
      ro: 'Mămăligă cu brânză și smântână',
      hu: 'Puliszka sajttal és tejföllel',
    },
    intro: {
      en: 'Romania’s comfort food: soft cornmeal polenta with salty white cheese and sour cream.',
      de: 'Rumänisches Wohlfühlessen: weiche Maispolenta mit salzigem Weißkäse und saurer Sahne.',
      ro: 'Mâncarea de suflet a românilor: mămăligă moale cu brânză sărată și smântână.',
      hu: 'A román konyha kedvence: puha kukoricapuliszka sós fehér sajttal és tejföllel.',
    },
    tips: {
      en: 'Add a fried egg on top for a heartier meal.',
      de: 'Mit einem Spiegelei obendrauf wird es noch sättigender.',
      ro: 'Cu un ou ochi deasupra devine și mai sățioasă.',
      hu: 'Egy tükörtojással a tetején még laktatóbb.',
    },
    cuisine: { en: 'Romanian', de: 'Rumänisch', ro: 'Românească', hu: 'Román' },
    servings: 4,
    prepMin: 5,
    cookMin: 25,
    difficulty: 'easy',
    tags: ['vegetarian', 'gluten-free', 'budget'],
    ingredients: [
      i('water', 1, 'l'),
      i('salt', 1, 'tsp'),
      i('cornmeal', 250, 'g'),
      i('butter', 30, 'g'),
      i('feta', 200, 'g'),
      i('sour-cream', 200, 'g'),
    ],
    steps: [
      {
        stage: 'prepare',
        en: 'Bring the salted water to the boil.',
        de: 'Das gesalzene Wasser zum Kochen bringen.',
        ro: 'Adu apa cu sare la fiert.',
        hu: 'Forrald fel a sós vizet.',
      },
      {
        en: 'Pour in the cornmeal in a thin stream while whisking, so no lumps form.',
        de: 'Den Maisgrieß in dünnem Strahl unter ständigem Rühren einrieseln lassen, damit keine Klumpen entstehen.',
        ro: 'Toarnă mălaiul în ploaie, amestecând continuu, ca să nu facă cocoloașe.',
        hu: 'Folyamatos kevergetés mellett vékony sugárban szórd bele a kukoricadarát, hogy ne legyen csomós.',
      },
      {
        en: 'Cook over low heat, stirring often, until it comes away from the sides of the pot. Stir in the butter.',
        de: 'Bei schwacher Hitze unter häufigem Rühren garen, bis sie sich vom Topfrand löst. Die Butter einrühren.',
        ro: 'Gătește la foc mic, amestecând des, până se desprinde de pereții vasului. Amestecă untul.',
        hu: 'Alacsony lángon, gyakran kevergetve főzd, amíg elválik az edény falától. Keverd bele a vajat.',
        timer: 1200,
      },
      {
        stage: 'serve',
        en: 'Serve hot with the crumbled cheese and the sour cream.',
        de: 'Heiß mit dem zerbröselten Käse und der sauren Sahne servieren.',
        ro: 'Servește fierbinte cu brânza sfărâmată și smântâna.',
        hu: 'Forrón tálald a morzsolt sajttal és a tejföllel.',
      },
    ],
  },
  {
    id: 'goulash-soup',
    icon: '🍲',
    title: {
      en: 'Hungarian goulash soup',
      de: 'Ungarische Gulaschsuppe',
      ro: 'Supă gulaș',
      hu: 'Gulyásleves',
    },
    intro: {
      en: 'The real goulash is a soup: beef, paprika, potatoes and peppers, simmered slowly.',
      de: 'Das echte Gulasch ist eine Suppe: Rindfleisch, Paprika, Kartoffeln und Paprikaschoten, langsam geköchelt.',
      ro: 'Gulașul adevărat e o supă: vită, boia, cartofi și ardei, fierte încet.',
      hu: 'Az igazi gulyás leves: marhahús, fűszerpaprika, burgonya és paprika, lassan főzve.',
    },
    tips: {
      en: 'Take the pot off the heat before adding the paprika: it turns bitter when it burns.',
      de: 'Den Topf vom Herd nehmen, bevor das Paprikapulver hineinkommt: Verbrannt wird es bitter.',
      ro: 'Ia oala de pe foc înainte să pui boiaua: dacă se arde, devine amară.',
      hu: 'Vedd le a fazekat a tűzről, mielőtt a fűszerpaprikát hozzáadod: ha megég, megkeseredik.',
    },
    cuisine: { en: 'Hungarian', de: 'Ungarisch', ro: 'Maghiară', hu: 'Magyar' },
    servings: 4,
    prepMin: 20,
    cookMin: 100,
    difficulty: 'medium',
    tags: ['lactose-free', 'gluten-free'],
    ingredients: [
      i('sunflower-oil', 2, 'tbsp'),
      i('onion', 2, 'pcs'),
      i('beef', 500, 'g'),
      i('paprika', 1, 'tbsp'),
      i('caraway', 1, 'tsp'),
      i('garlic', 2, 'clove'),
      i('water', 1.5, 'l'),
      i('carrot', 2, 'pcs'),
      i('potato', 500, 'g'),
      i('bell-pepper', 1, 'pcs'),
      i('tomato', 1, 'pcs'),
      i('bay-leaf', 1, 'pcs', 'fixed'),
      i('salt', 1.5, 'tsp'),
      i('black-pepper', 1, 'pinch'),
    ],
    steps: [
      {
        en: 'Fry the chopped onions in the oil in a large pot until golden.',
        de: 'Die gehackten Zwiebeln in einem großen Topf im Öl goldgelb braten.',
        ro: 'Călește ceapa tocată în ulei, într-o oală mare, până se aurește.',
        hu: 'Egy nagy fazékban az olajon pirítsd aranysárgára az apróra vágott hagymát.',
        timer: 480,
      },
      {
        en: 'Add the beef cut into small cubes and brown it on all sides.',
        de: 'Das in kleine Würfel geschnittene Rindfleisch zugeben und rundum anbraten.',
        ro: 'Adaugă carnea tăiată cuburi mici și rumenește-o pe toate părțile.',
        hu: 'Add hozzá a kis kockákra vágott marhahúst, és minden oldalát pirítsd meg.',
        timer: 300,
      },
      {
        en: 'Take the pot off the heat, stir in the paprika, caraway and garlic, then add 1 litre of the water. Cover and simmer.',
        de: 'Den Topf vom Herd nehmen, Paprikapulver, Kümmel und Knoblauch einrühren, dann 1 Liter des Wassers zugießen. Zugedeckt köcheln lassen.',
        ro: 'Ia oala de pe foc, amestecă boiaua, chimenul și usturoiul, apoi adaugă 1 litru din apă. Acoperă și fierbe încet.',
        hu: 'Vedd le a fazekat a tűzről, keverd bele a fűszerpaprikát, a köménymagot és a fokhagymát, majd öntsd hozzá a víz 1 literét. Lefedve főzd.',
        timer: 3600,
      },
      {
        en: 'Add the diced carrots, potatoes, pepper and tomato, the rest of the water, the salt and the bay leaf. Cook until the potatoes are tender, season and serve.',
        de: 'Gewürfelte Karotten, Kartoffeln, Paprika und Tomate, das restliche Wasser, das Salz und das Lorbeerblatt zugeben. Garen, bis die Kartoffeln weich sind, abschmecken und servieren.',
        ro: 'Adaugă morcovii, cartofii, ardeiul și roșia tăiate cuburi, restul apei, sarea și foaia de dafin. Fierbe până se înmoaie cartofii, potrivește de gust și servește.',
        hu: 'Add hozzá a felkockázott répát, burgonyát, paprikát és paradicsomot, a maradék vizet, a sót és a babérlevelet. Főzd, amíg a burgonya megpuhul, ízesítsd, és tálald.',
        timer: 1500,
      },
    ],
  },
];

const BY_ID = new Map(LIBRARY.map((r) => [r.id, r]));
export const libraryRecipe = (id: string) => BY_ID.get(id);

/** A library recipe's ingredients in `locale` (names from the foods, default scaling). */
export function libraryIngredients(r: LibraryRecipe, locale: Locale): Ingredient[] {
  return r.ingredients.map((x) => {
    const food = foodById(x.food);
    return {
      name: food?.name[locale] ?? x.food,
      qty: x.qty,
      unit: x.unit,
      foodId: x.food,
      scaling: x.scaling ?? defaultScaling(x.unit, food),
      note: null,
    };
  });
}

export function librarySteps(r: LibraryRecipe, locale: Locale): Step[] {
  return r.steps.map((s) => ({
    text: s[locale],
    timerSec: s.timer ?? null,
    stage: s.stage ?? 'cook',
    uses: null,
  }));
}
