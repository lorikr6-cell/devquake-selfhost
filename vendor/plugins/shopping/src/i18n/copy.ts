import { defineMessages } from './define';

/** "Copy lists" in the New tab (components/home-forms.tsx, api/copy.ts). */
export const copyTexts = defineMessages(
  {
    copy: {
      what: 'What to copy',
      modeList: 'One list',
      modeWeek: 'A whole week, to every week of its month',
      modeMonth: 'A whole month, to every month of its year',
      list: 'List',
      to: 'Copy it to',
      toDay: 'One day',
      toWeek: 'Every day of a week',
      toMonth: 'Every day of a month',
      day: 'Day',
      dayInWeek: 'Any day of the week',
      dayInMonth: 'Any day of the month',
      month: 'Month',
      weekHint: 'Its lists are copied to the same weekdays of the other weeks of that month.',
      monthHint:
        'Its lists are copied to the same day of every other month of that year (the 31st becomes the last day of shorter months).',
      confirmWeek: 'Copy every list of this week to the other weeks of the month?',
      confirmMonth: 'Copy every list of this month to the other months of the year?',
      done: {
        one: '{count} list created ({skipped} already there).',
        other: '{count} lists created ({skipped} already there).',
      },
      copying: 'Copying…',
      copy: 'Copy',
    },
  },
  {
    de: {
      copy: {
        what: 'Was kopiert werden soll',
        modeList: 'Eine Liste',
        modeWeek: 'Eine ganze Woche, in jede Woche ihres Monats',
        modeMonth: 'Einen ganzen Monat, in jeden Monat seines Jahres',
        list: 'Liste',
        to: 'Kopieren nach',
        toDay: 'Ein Tag',
        toWeek: 'Jeder Tag einer Woche',
        toMonth: 'Jeder Tag eines Monats',
        day: 'Tag',
        dayInWeek: 'Ein beliebiger Tag der Woche',
        dayInMonth: 'Ein beliebiger Tag des Monats',
        month: 'Monat',
        weekHint:
          'Ihre Listen werden auf dieselben Wochentage der anderen Wochen dieses Monats kopiert.',
        monthHint:
          'Seine Listen werden auf denselben Tag jedes anderen Monats dieses Jahres kopiert (der 31. wird in kürzeren Monaten zum letzten Tag).',
        confirmWeek: 'Jede Liste dieser Woche in die anderen Wochen des Monats kopieren?',
        confirmMonth: 'Jede Liste dieses Monats in die anderen Monate des Jahres kopieren?',
        done: {
          one: '{count} Liste erstellt ({skipped} schon vorhanden).',
          other: '{count} Listen erstellt ({skipped} schon vorhanden).',
        },
        copying: 'Wird kopiert …',
        copy: 'Kopieren',
      },
    },
    ro: {
      copy: {
        what: 'Ce copiezi',
        modeList: 'O listă',
        modeWeek: 'O săptămână întreagă, în fiecare săptămână a lunii',
        modeMonth: 'O lună întreagă, în fiecare lună a anului',
        list: 'Lista',
        to: 'Copiaz-o în',
        toDay: 'O zi',
        toWeek: 'Fiecare zi a unei săptămâni',
        toMonth: 'Fiecare zi a unei luni',
        day: 'Ziua',
        dayInWeek: 'Orice zi din săptămână',
        dayInMonth: 'Orice zi din lună',
        month: 'Luna',
        weekHint:
          'Listele ei sunt copiate în aceleași zile ale săptămânii din celelalte săptămâni ale lunii.',
        monthHint:
          'Listele ei sunt copiate în aceeași zi din fiecare altă lună a anului (ziua de 31 devine ultima zi în lunile mai scurte).',
        confirmWeek:
          'Copiezi fiecare listă din această săptămână în celelalte săptămâni ale lunii?',
        confirmMonth: 'Copiezi fiecare listă din această lună în celelalte luni ale anului?',
        done: {
          one: '{count} listă creată ({skipped} existau deja).',
          few: '{count} liste create ({skipped} existau deja).',
          other: '{count} de liste create ({skipped} existau deja).',
        },
        copying: 'Se copiază…',
        copy: 'Copiază',
      },
    },
    hu: {
      copy: {
        what: 'Mit másolsz',
        modeList: 'Egy listát',
        modeWeek: 'Egy teljes hetet, a hónap minden hetére',
        modeMonth: 'Egy teljes hónapot, az év minden hónapjára',
        list: 'Lista',
        to: 'Másolás ide',
        toDay: 'Egy napra',
        toWeek: 'Egy hét minden napjára',
        toMonth: 'Egy hónap minden napjára',
        day: 'Nap',
        dayInWeek: 'A hét bármelyik napja',
        dayInMonth: 'A hónap bármelyik napja',
        month: 'Hónap',
        weekHint: 'A listái a hónap többi hetének ugyanazon napjaira kerülnek.',
        monthHint:
          'A listái az év minden többi hónapjának ugyanazon napjára kerülnek (a 31-e a rövidebb hónapokban az utolsó nap lesz).',
        confirmWeek: 'Átmásolod ennek a hétnek minden listáját a hónap többi hetére?',
        confirmMonth: 'Átmásolod ennek a hónapnak minden listáját az év többi hónapjára?',
        done: {
          one: '{count} lista létrehozva ({skipped} már megvolt).',
          other: '{count} lista létrehozva ({skipped} már megvolt).',
        },
        copying: 'Másolás…',
        copy: 'Másolás',
      },
    },
  },
);
