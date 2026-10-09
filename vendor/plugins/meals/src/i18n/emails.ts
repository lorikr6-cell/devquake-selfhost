import { defineMessages } from './define';

/** The evening-before reminder email (lib/reminder-email.ts). */
export const emails = defineMessages(
  {
    reminderEmail: {
      subject: 'For tomorrow: {remind}',
      intro: 'A reminder for {slot}: {title}.',
      meal: 'Meal',
      when: 'Day',
      household: 'Household',
      button: 'Open the week',
      footer:
        'You get this email because you are in this household in DevQuake’s Meal planner. Whoever planned the meal added the reminder.',
    },
    commentEmail: {
      subject: '{name} commented on your meal “{title}”',
      heading: 'A comment on “{title}”',
      intro: '{name} wrote on your public meal “{title}”:',
      meal: 'Meal',
      from: 'From',
      button: 'Open the meal',
      footer: 'You get this because your meal is public in DevQuake’s Meal planner.',
    },
  },
  {
    de: {
      reminderEmail: {
        subject: 'Für morgen: {remind}',
        intro: 'Eine Erinnerung zum {slot}: {title}.',
        meal: 'Mahlzeit',
        when: 'Tag',
        household: 'Haushalt',
        button: 'Woche öffnen',
        footer:
          'Du bekommst diese E-Mail, weil du in diesem Haushalt im Essensplaner von DevQuake bist. Wer die Mahlzeit geplant hat, hat die Erinnerung hinzugefügt.',
      },
      commentEmail: {
        subject: '{name} hat deine Mahlzeit „{title}“ kommentiert',
        heading: 'Ein Kommentar zu „{title}“',
        intro: '{name} hat zu deiner öffentlichen Mahlzeit „{title}“ geschrieben:',
        meal: 'Mahlzeit',
        from: 'Von',
        button: 'Mahlzeit öffnen',
        footer: 'Du bekommst das, weil deine Mahlzeit im Essensplaner von DevQuake öffentlich ist.',
      },
    },
    ro: {
      reminderEmail: {
        subject: 'Pentru mâine: {remind}',
        intro: 'Un memento pentru {slot}: {title}.',
        meal: 'Masa',
        when: 'Ziua',
        household: 'Gospodăria',
        button: 'Deschide săptămâna',
        footer:
          'Primești acest e-mail pentru că ești în această gospodărie în Planificatorul de mese de pe DevQuake. Cine a planificat masa a adăugat mementoul.',
      },
      commentEmail: {
        subject: '{name} a comentat la masa ta „{title}”',
        heading: 'Un comentariu la „{title}”',
        intro: '{name} a scris la masa ta publică „{title}”:',
        meal: 'Masa',
        from: 'De la',
        button: 'Deschide masa',
        footer:
          'Primești asta pentru că masa ta e publică în Planificatorul de mese de pe DevQuake.',
      },
    },
    hu: {
      reminderEmail: {
        subject: 'Holnapra: {remind}',
        intro: 'Emlékeztető ehhez: {slot}, {title}.',
        meal: 'Étkezés',
        when: 'Nap',
        household: 'Háztartás',
        button: 'A hét megnyitása',
        footer:
          'Azért kapod ezt az e-mailt, mert tagja vagy ennek a háztartásnak a DevQuake Étkezéstervezőjében. Aki az étkezést megtervezte, hozzáadta az emlékeztetőt.',
      },
      commentEmail: {
        subject: '{name} hozzászólt az étkezésedhez: „{title}”',
        heading: 'Hozzászólás: „{title}”',
        intro: '{name} ezt írta a nyilvános étkezésedhez („{title}”):',
        meal: 'Étkezés',
        from: 'Feladó',
        button: 'Az étkezés megnyitása',
        footer: 'Azért kapod, mert az étkezésed nyilvános a DevQuake Étkezéstervezőjében.',
      },
    },
  },
);
