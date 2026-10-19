import type { PluginAbout } from '@devquake/plugin-sdk';

/** The app's public front page and search engines (ADR 0032), in every language. */
export const about: PluginAbout = {
  category: 'LifestyleApplication',
  description: {
    en: 'Recipes for any number of people: quantities and nutrition per portion adapt, cooking mode reads the steps aloud.',
    de: 'Rezepte für beliebig viele Personen: Mengen und Nährwerte pro Portion passen sich an, der Kochmodus liest die Schritte vor.',
    ro: 'Rețete pentru oricâte persoane: cantitățile și valorile pe porție se adaptează, modul de gătit citește pașii.',
    hu: 'Receptek bármennyi főre: a mennyiségek és az adagonkénti tápérték igazodik, a főzőmód felolvassa a lépéseket.',
    it: 'Ricette per quante persone vuoi: quantità e valori nutrizionali per porzione si adattano, la modalità cucina legge i passaggi ad alta voce.',
    es: 'Recetas para las personas que quieras: las cantidades y los valores por ración se adaptan, el modo cocina lee los pasos en voz alta.',
  },
  features: {
    en: [
      'Choose the servings: every quantity is recalculated, eggs stay whole',
      'Nutrition per portion, diet tags with the reason they fit, and the 14 allergens',
      'Cooking mode: one step per screen, timers and a voice',
      'Your own recipes with a photo, private or shared by link',
    ],
    de: [
      'Portionen wählen: Jede Menge wird neu berechnet, Eier bleiben ganz',
      'Nährwerte pro Portion, Ernährungsformen mit Begründung und die 14 Allergene',
      'Kochmodus: ein Schritt pro Bildschirm, Timer und eine Stimme',
      'Eigene Rezepte mit Foto, privat oder per Link geteilt',
    ],
    ro: [
      'Alege porțiile: fiecare cantitate se recalculează, ouăle rămân întregi',
      'Valori nutritive pe porție, diete cu motivul și cei 14 alergeni',
      'Mod de gătit: un pas pe ecran, cronometre și o voce',
      'Rețetele tale cu fotografie, private sau partajate prin link',
    ],
    hu: [
      'Válaszd ki az adagokat: minden mennyiség újraszámolódik, a tojás egész marad',
      'Tápérték adagonként, étrendek indoklással és a 14 allergén',
      'Főzőmód: lépésenként egy képernyő, időzítők és felolvasás',
      'Saját receptek fotóval, privátan vagy linkkel megosztva',
    ],
    it: [
      'Scegli le porzioni: ogni quantità viene ricalcolata, le uova restano intere',
      'Valori nutrizionali per porzione, diete con il motivo per cui sono adatte e i 14 allergeni',
      'Modalità cucina: un passaggio per schermata, timer e una voce',
      'Le tue ricette con una foto, private o condivise con un link',
    ],
    es: [
      'Elige las raciones: cada cantidad se recalcula, los huevos siguen enteros',
      'Valores nutricionales por ración, dietas con el motivo por el que encajan y los 14 alérgenos',
      'Modo cocina: un paso por pantalla, temporizadores y una voz',
      'Tus propias recetas con foto, privadas o compartidas con un enlace',
    ],
  },
};
