import type { PluginAbout } from '@devquake/plugin-sdk';

/**
 * The app's public front page and search engines (ADR 0032): what visitors who may not use it
 * yet see on its subdomain. At most 160 characters per description.
 */
export const about: PluginAbout = {
  category: 'BusinessApplication',
  description: {
    en: 'For organisations that care for elderly people: profiles, meal plans, delivery routes and medical files, each role seeing only what it needs.',
    de: 'Für Organisationen, die ältere Menschen versorgen: Profile, Speisepläne, Lieferrouten und medizinische Akten, jede Rolle sieht nur das Nötige.',
    ro: 'Pentru organizațiile care îngrijesc vârstnici: profiluri, meniuri, trasee de livrare și dosare medicale, fiecare rol vede doar ce îi trebuie.',
    hu: 'Időseket gondozó szervezeteknek: profilok, étrendek, kiszállítási útvonalak és egészségügyi lapok, minden szerep csak a szükségeset látja.',
    it: 'Per le organizzazioni che si prendono cura degli anziani: profili, menù, giri di consegna e cartelle mediche, ogni ruolo vede solo il necessario.',
    es: 'Para organizaciones que cuidan de personas mayores: perfiles, menús, rutas de reparto y fichas médicas; cada función ve solo lo necesario.',
  },
  features: {
    en: [
      'Profiles with photo, ID card read on your device and birthdays; personal data encrypted',
      'Menus by diet and a kitchen sheet that counts the portions',
      'Delivery routes by driver area, ordered on the map, with a phone view for drivers',
      'The medical file with medications, doses and hospital stays',
      'A waiting list, social work visits and questionnaires, and reports on the whole team',
    ],
    de: [
      'Profile mit Foto, auf dem Gerät gelesenem Ausweis und Geburtstagen; persönliche Daten verschlüsselt',
      'Speisepläne nach Kostform und ein Küchenzettel, der die Portionen zählt',
      'Lieferrouten nach Fahrergebiet, per Karte geordnet, mit Handyansicht für Fahrer',
      'Die medizinische Akte mit Medikamenten, Gaben und Krankenhausaufenthalten',
      'Warteliste, Besuche und Fragebögen der Sozialarbeit und Berichte über das ganze Team',
    ],
    ro: [
      'Profiluri cu fotografie, buletin citit pe dispozitiv și zile de naștere; date personale criptate',
      'Meniuri pe regimuri și o fișă a bucătăriei care numără porțiile',
      'Trasee de livrare pe zone de șoferi, ordonate pe hartă, cu vedere pe telefon pentru șoferi',
      'Dosarul medical cu medicație, doze și internări',
      'Listă de așteptare, vizite și chestionare de asistență socială și rapoarte despre toată echipa',
    ],
    hu: [
      'Profilok fotóval, eszközön beolvasott igazolvánnyal és születésnapokkal; titkosított személyes adatok',
      'Diéták szerinti étlapok és adagokat számoló konyhai lap',
      'Kiszállítási útvonalak sofőrkörzetenként, térképen rendezve, telefonos nézettel a sofőröknek',
      'Egészségügyi lap gyógyszerekkel, adagokkal és kórházi tartózkodásokkal',
      'Várólista, szociális látogatások és kérdőívek, valamint jelentések az egész csapatról',
    ],
    it: [
      'Profili con foto, carta d’identità letta sul dispositivo e compleanni; dati personali cifrati',
      'Menù per dieta e un foglio della cucina che conta le porzioni',
      'Giri di consegna per zona, ordinati sulla mappa, con una vista sul telefono per gli autisti',
      'La cartella medica con farmaci, dosi e ricoveri',
      'Lista d’attesa, visite e questionari del servizio sociale e rapporti su tutto il personale',
    ],
    es: [
      'Perfiles con foto, documento leído en tu dispositivo y cumpleaños; datos personales cifrados',
      'Menús por dieta y una hoja de cocina que cuenta las raciones',
      'Rutas de reparto por zona, ordenadas en el mapa, con vista en el móvil para los conductores',
      'La ficha médica con medicación, dosis e ingresos',
      'Lista de espera, visitas y cuestionarios de trabajo social e informes de todo el equipo',
    ],
  },
};
