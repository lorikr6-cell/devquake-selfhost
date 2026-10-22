import type { PluginAbout } from '@devquake/plugin-sdk';

/**
 * The app's public front page and search engines (ADR 0032): what visitors who may not use it
 * yet see on its subdomain. At most 160 characters per description.
 */
export const about: PluginAbout = {
  category: 'BusinessApplication',
  description: {
    en: 'For organisations that feed elderly people: profiles, meal plans, delivery routes and medical files, each role seeing only what it needs.',
    de: 'Für Organisationen, die ältere Menschen versorgen: Profile, Speisepläne, Lieferrouten und medizinische Akten, jede Rolle sieht nur das Nötige.',
    ro: 'Pentru organizațiile care hrănesc vârstnici: profiluri, meniuri, trasee de livrare și dosare medicale, fiecare rol vede doar ce îi trebuie.',
    hu: 'Időseket étkeztető szervezeteknek: profilok, étrendek, kiszállítási útvonalak és egészségügyi lapok, minden szerep csak a szükségeset látja.',
    it: 'Per le organizzazioni che danno da mangiare agli anziani: profili, menù, giri di consegna e cartelle mediche, ogni ruolo vede solo il necessario.',
    es: 'Para organizaciones que dan de comer a personas mayores: perfiles, menús, rutas de reparto y fichas médicas; cada función ve solo lo necesario.',
  },
  features: {
    en: [
      'Profiles with photo, ID card and birthdays',
      'Personal numbers and papers stored encrypted, every view recorded',
      'Roles for organisers, coordinators, kitchen, drivers and medical staff',
    ],
    de: [
      'Profile mit Foto, Ausweis und Geburtstagen',
      'Persönliche Nummern und Dokumente verschlüsselt, jedes Öffnen festgehalten',
      'Rollen für Organisation, Koordination, Küche, Fahrer und medizinisches Personal',
    ],
    ro: [
      'Profiluri cu fotografie, buletin și zile de naștere',
      'Date de identificare și documente păstrate criptat, fiecare deschidere înregistrată',
      'Roluri pentru organizatori, coordonatori, bucătărie, șoferi și personal medical',
    ],
    hu: [
      'Profilok fotóval, személyi igazolvánnyal és születésnapokkal',
      'Titkosítva tárolt azonosítók és iratok, minden megnyitás rögzítve',
      'Szerepek szervezőknek, koordinátoroknak, konyhának, sofőröknek és egészségügyi személyzetnek',
    ],
    it: [
      'Profili con foto, carta d’identità e compleanni',
      'Numeri personali e documenti cifrati, ogni apertura registrata',
      'Ruoli per organizzatori, coordinatori, cucina, autisti e personale sanitario',
    ],
    es: [
      'Perfiles con foto, documento de identidad y cumpleaños',
      'Números personales y documentos cifrados, cada apertura registrada',
      'Funciones para organizadores, coordinadores, cocina, repartidores y personal sanitario',
    ],
  },
};
