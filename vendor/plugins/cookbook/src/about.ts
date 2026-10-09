import type { PluginAbout } from '@devquake/plugin-sdk';

/** The app's public front page and search engines (ADR 0032), in every language. */
export const about: PluginAbout = {
  category: 'LifestyleApplication',
  description: {
    en: 'Recipes for any number of people: quantities and nutrition per portion adapt, cooking mode reads the steps aloud.',
    de: 'Rezepte für beliebig viele Personen: Mengen und Nährwerte pro Portion passen sich an, der Kochmodus liest die Schritte vor.',
    ro: 'Rețete pentru oricâte persoane: cantitățile și valorile pe porție se adaptează, modul de gătit citește pașii.',
    hu: 'Receptek bármennyi főre: a mennyiségek és az adagonkénti tápérték igazodik, a főzőmód felolvassa a lépéseket.',
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
  },
};
