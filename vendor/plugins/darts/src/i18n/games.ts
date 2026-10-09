import { defineMessages } from './define';

/** The games, their options and rules, events while playing, suggestions, skills and drills. */
export const gameTexts = defineMessages(
  {
    games: {
      names: {
        x01: '501 / 301',
        cricket: 'Cricket',
        shanghai: 'Shanghai',
        atc: 'Around the Clock',
        killer: 'Killer',
        countup: 'Count-Up',
        targets: 'Target drill',
        checkout: 'Finishing drill',
      },
      short: {
        x01: 'Count down to zero',
        cricket: 'Close 15–20 and the bull',
        shanghai: 'One number per round',
        atc: '1 to 20, then the bull',
        killer: 'Take the others’ lives',
        countup: 'Most points wins',
        targets: 'Hit chosen targets',
        checkout: 'Practise finishes',
      },
      rules: {
        x01: 'Everyone starts at the same score (301, 501, 701 or 1001) and takes off what each visit scores. You must reach exactly zero, with the last dart in a double or the bull (double-out). Going below zero, to 1, or to zero without a double is a bust: the score goes back to where the visit started.',
        cricket:
          'Only 15 to 20 and the bull count. Three marks close a number (a single is one mark, a double two, a treble three). Once you have closed a number, hitting it scores points as long as an opponent still has it open. Close everything with at least as many points as the others to win. In cut-throat, your points go to the opponents and the lowest score wins.',
        shanghai:
          'Round 1 counts only the 1, round 2 only the 2, and so on (7 or 20 rounds). Hitting the single, double and treble of the round’s number in one visit is a Shanghai and wins at once. Otherwise the highest score wins; a tie is played off on the bull.',
        atc: 'Hit 1, 2, 3 … up to 20 in order, then the bull. The first to hit the bull wins. In doubles mode only the double of each number (and the inner bull) counts.',
        killer:
          'Every player gets a random number. Hit the double of your number to become a killer, then hit the doubles of the others’ numbers to take their lives. Whoever runs out of lives is out; the last player standing wins.',
        countup:
          'Every dart scores what it hits, for a fixed number of rounds. The most points wins. Good for practising scoring and consistency.',
        targets:
          'A drill: a number of darts at each chosen target (a double, a treble, a number or the bull). Every hit counts, and the statistics learn how accurate you are on each.',
        checkout:
          'A drill: finish each score (for example 40, 81, 100) ending on a double, with a few visits per score. A bust ends the visit; an exact finish moves to the next score.',
      },
      options: {
        start: 'Start score',
        inLabel: 'Start',
        in: { straight: 'Straight in', double: 'Double in' },
        inDouble: 'Double in',
        outLabel: 'Finish',
        out: { double: 'Double out', single: 'Single out', master: 'Master out' },
        legs: 'Legs',
        firstTo: { one: 'First to {count} leg', other: 'First to {count} legs' },
        variantLabel: 'Variant',
        variant: { standard: 'Standard', cutthroat: 'Cut-throat' },
        rounds: 'Rounds',
        roundsCount: { one: '{count} round', other: '{count} rounds' },
        hitLabel: 'What counts',
        hit: { any: 'Any part of the number', doubles: 'Doubles only' },
        lives: 'Lives',
        livesCount: { one: '{count} life', other: '{count} lives' },
        dartsEach: { one: '{count} dart each', other: '{count} darts each' },
        dartsPerTarget: 'Darts per target',
        dartsPerFinish: 'Darts per finish',
        finishes: 'Scores to finish',
        finishesHint: 'Between 2 and 170, separated by commas (up to 10).',
        targets: 'Targets (tap one to remove it)',
        removeTarget: 'Remove {target}',
        ring: 'Ring',
        ringAny: 'Any part',
        ringSingle: 'Single',
        ringDouble: 'Double',
        ringTreble: 'Treble',
        number: 'Number',
        bull: 'Bull',
        addTarget: 'Add target',
        help: {
          start: {
            '301': 'A short game: good for beginners or a quick match.',
            '501': 'The standard match game, as in the tournaments on TV.',
            '701': 'A longer game, often played in pairs or teams.',
            '1001': 'A long game for teams, where scoring power matters most.',
          },
          in: {
            straight: 'Every dart counts from the very first one.',
            double:
              'Your score only starts going down once you hit a double (or the bull); darts before that score nothing.',
          },
          out: {
            double:
              'The last dart must be a double (or the bull) that takes you to exactly zero. This is the usual rule.',
            single:
              'Any dart that takes you to exactly zero wins. The easiest finish, good for beginners.',
            master:
              'The last dart must be a double or a treble (or the bull) that takes you to exactly zero.',
          },
          legs: {
            one: 'One leg: whoever finishes first wins the match.',
            other:
              'A leg is one game played to the end. The first to win {count} legs wins the match; who throws first changes every leg.',
          },
          variant: {
            standard:
              'Once you have closed a number, your hits on it score points for you while an opponent still has it open. Most points wins.',
            cutthroat:
              'Your hits on a number you have closed give points to every opponent who has not closed it. Fewest points wins.',
          },
          shanghaiRounds: {
            '7': 'Numbers 1 to 7, one per round: a quick game.',
            '20': 'Every number from 1 to 20, one per round: a long game.',
          },
          hit: {
            any: 'The single, double or treble of the number all count. At the end, either bull counts.',
            doubles:
              'Only the double of each number counts, and the inner bull at the end. Much harder: good practice for finishing.',
          },
          lives: {
            one: 'Each player has {count} life: one hit on their double by a killer knocks them out.',
            other:
              'Each player has {count} lives; every hit on their double by a killer takes one. More lives make a longer game.',
          },
          countupRounds: {
            one: 'Each player throws {count} visit of three darts; the highest total wins.',
            other: 'Each player throws {count} visits of three darts; the highest total wins.',
          },
          dartsPerFinish:
            'You have {count} darts ({visits} visits) to finish each score; if you do not, the next score comes.',
          dartsPerTarget:
            'You throw {count} darts ({visits} visits) at each target, then move to the next. Total: {total} darts.',
          targets:
            'Each target is a number with a ring. Your hits on it are counted, so you see how accurate you are on each one.',
          ring: {
            '0': 'Any part: the single, double or treble of the number all count as a hit.',
            '1': 'Single: only the single areas of the number count, not its double or treble ring.',
            '2': 'Double: only the outer ring of the number counts, the one you finish on.',
            '3': 'Treble: only the narrow inner ring of the number counts.',
          },
        },
      },
    },
    events: {
      bust: 'Bust!',
      leg: 'Leg won!',
      win: 'Game won!',
      shanghai: 'Shanghai!',
      killer: 'Killer!',
      eliminated: 'Player out!',
      checkout: 'Finished!',
      missed: 'Next score',
      tiebreak: 'Tie-break',
    },
    suggest: {
      title: 'Where to aim next',
      intro:
        'Suggestions for the darts left in this visit. The first one is also lit up on the dartboard.',
      option: 'Option {n}',
      bull: 'the bull',
      explain: {
        checkout: {
          one: 'Finishes your {score} with one dart.',
          other: 'Finishes your {score} with {count} darts, thrown in this order.',
        },
        setup:
          'You cannot finish with the darts left. This leaves {left}, which you can finish next visit.',
        far: '{left} is too far to finish in this visit: score as many points as you can.',
        doubleIn: 'Double in: your score only starts counting once you hit a double.',
        close: 'Close {n}: an opponent already scores points on it.',
        scoreOn: 'You have closed {n} and an opponent has not: every extra hit scores.',
        stillOpen: '{n} is still open for you: three marks close it.',
        shanghai:
          'Only {n} counts this round. Hit its single, double and treble in this visit, in any order, to win at once.',
        tiebreak: 'Tie-break: only the bull counts.',
        sequence: 'Hit the numbers in order; any ring counts. Your next number is {target}.',
        sequenceDoubles:
          'Hit only the doubles, in order (the inner bull last). Your next target is {target}.',
        becomeKiller: 'Your number is {n}: hit its double to become a killer.',
        takeLife: 'Double {n} takes a life from {name} (lives left: {lives}).',
        lastLife: '{name} has one life left: double {n} knocks them out.',
        points: 'Count-Up: this is worth {points} points.',
        drill: 'The current target of this drill.',
      },
      none: 'No suggestion for this dart.',
    },
    skills: {
      scoring: 'Scoring',
      doubles: 'Doubles',
      trebles: 'Trebles',
      bull: 'Bull',
      accuracy: 'Accuracy',
      consistency: 'Consistency',
      starter: 'Getting started',
    },
    drills: {
      none: 'No drills yet. Make some: they are based on your statistics and only you see them.',
      titles: {
        x01: 'X01 practice',
        cricket: 'Cricket practice',
        shanghai: 'Shanghai practice',
        atc: 'Around the Clock',
        killer: 'Killer practice',
        countup: 'Count-Up scoring',
        targets: 'Target drill',
        checkout: 'Finishing drill',
      },
      why: {
        doubles: 'You miss these doubles most: aim at them until they feel easy.',
        scoring: 'Group your darts in the treble 20 and 19 to raise your average.',
        trebles: 'Trebles make the big scores: practise the top of the board.',
        bull: 'The bull finishes 50 and wins tie-breaks.',
        accuracy: 'Hitting the number you aim at: the base of every game.',
        consistency: 'Steady visits, round after round.',
        starter: 'A first set to learn where your darts go.',
      },
      played: {
        one: 'Played {count} time',
        other: 'Played {count} times',
      },
      play: 'Play',
      remove: 'Remove',
      removeConfirm: 'Remove this drill?',
      generate: 'Make drills for me',
      regenerate: 'Make new drills',
      removeBody: 'You can make new drills any time from your statistics.',
    },
  },
  {
    de: {
      games: {
        names: {
          x01: '501 / 301',
          cricket: 'Cricket',
          shanghai: 'Shanghai',
          atc: 'Rund um die Uhr',
          killer: 'Killer',
          countup: 'Count-Up',
          targets: 'Zielübung',
          checkout: 'Finish-Übung',
        },
        short: {
          x01: 'Auf null herunterspielen',
          cricket: '15–20 und Bull schließen',
          shanghai: 'Eine Zahl pro Runde',
          atc: '1 bis 20, dann das Bull',
          killer: 'Den anderen Leben nehmen',
          countup: 'Die meisten Punkte gewinnen',
          targets: 'Gewählte Ziele treffen',
          checkout: 'Finishes üben',
        },
        rules: {
          x01: 'Alle beginnen mit derselben Punktzahl (301, 501, 701 oder 1001) und ziehen ab, was jede Aufnahme erzielt. Du musst genau null erreichen, mit dem letzten Pfeil in einem Doppel oder dem Bull (Double-out). Unter null, auf 1 oder auf null ohne Doppel ist ein Bust: Die Punkte gehen auf den Stand vor der Aufnahme zurück.',
          cricket:
            'Nur 15 bis 20 und das Bull zählen. Drei Treffer schließen eine Zahl (Single eins, Doppel zwei, Triple drei). Hast du eine Zahl geschlossen, bringen Treffer darauf Punkte, solange ein Gegner sie noch offen hat. Schließe alles mit mindestens so vielen Punkten wie die anderen, um zu gewinnen. Bei Cut-throat gehen deine Punkte an die Gegner und die wenigsten Punkte gewinnen.',
          shanghai:
            'In Runde 1 zählt nur die 1, in Runde 2 nur die 2 und so weiter (7 oder 20 Runden). Single, Doppel und Triple der Rundenzahl in einer Aufnahme sind ein Shanghai und gewinnen sofort. Sonst gewinnt die höchste Punktzahl; ein Gleichstand wird auf dem Bull entschieden.',
          atc: 'Triff 1, 2, 3 … bis 20 der Reihe nach, dann das Bull. Wer zuerst das Bull trifft, gewinnt. Im Doppel-Modus zählt nur das Doppel jeder Zahl (und das innere Bull).',
          killer:
            'Jeder bekommt eine zufällige Zahl. Triff das Doppel deiner Zahl, um Killer zu werden, dann triff die Doppel der Zahlen der anderen, um ihnen Leben zu nehmen. Wer keine Leben mehr hat, scheidet aus; wer zuletzt übrig ist, gewinnt.',
          countup:
            'Jeder Pfeil zählt, was er trifft, über eine feste Zahl von Runden. Die meisten Punkte gewinnen. Gut, um Punkten und Beständigkeit zu üben.',
          targets:
            'Eine Übung: eine Anzahl Pfeile auf jedes gewählte Ziel (ein Doppel, ein Triple, eine Zahl oder das Bull). Jeder Treffer zählt, und die Statistik lernt, wie genau du bei jedem bist.',
          checkout:
            'Eine Übung: Beende jede Punktzahl (zum Beispiel 40, 81, 100) mit einem Doppel, mit einigen Aufnahmen pro Punktzahl. Ein Bust beendet die Aufnahme; ein genaues Finish geht zur nächsten Punktzahl.',
        },
        options: {
          start: 'Startpunktzahl',
          inLabel: 'Start',
          in: { straight: 'Straight in', double: 'Double in' },
          inDouble: 'Double in',
          outLabel: 'Finish',
          out: { double: 'Double out', single: 'Single out', master: 'Master out' },
          legs: 'Legs',
          firstTo: {
            one: 'Wer zuerst {count} Leg gewinnt',
            other: 'Wer zuerst {count} Legs gewinnt',
          },
          variantLabel: 'Variante',
          variant: { standard: 'Standard', cutthroat: 'Cut-throat' },
          rounds: 'Runden',
          roundsCount: { one: '{count} Runde', other: '{count} Runden' },
          hitLabel: 'Was zählt',
          hit: { any: 'Jeder Teil der Zahl', doubles: 'Nur Doppel' },
          lives: 'Leben',
          livesCount: { one: '{count} Leben', other: '{count} Leben' },
          dartsEach: { one: 'je {count} Pfeil', other: 'je {count} Pfeile' },
          dartsPerTarget: 'Pfeile pro Ziel',
          dartsPerFinish: 'Pfeile pro Finish',
          finishes: 'Zu beendende Punktzahlen',
          finishesHint: 'Zwischen 2 und 170, durch Kommas getrennt (bis zu 10).',
          targets: 'Ziele (zum Entfernen antippen)',
          removeTarget: '{target} entfernen',
          ring: 'Ring',
          ringAny: 'Jeder Teil',
          ringSingle: 'Single',
          ringDouble: 'Doppel',
          ringTreble: 'Triple',
          number: 'Zahl',
          bull: 'Bull',
          addTarget: 'Ziel hinzufügen',
          help: {
            start: {
              '301': 'Ein kurzes Spiel: gut für Anfänger oder ein schnelles Match.',
              '501': 'Das übliche Matchspiel, wie bei den Turnieren im Fernsehen.',
              '701': 'Ein längeres Spiel, oft zu zweit oder im Team gespielt.',
              '1001': 'Ein langes Teamspiel, bei dem vor allem das Punkten zählt.',
            },
            in: {
              straight: 'Jeder Pfeil zählt vom ersten an.',
              double:
                'Deine Punkte zählen erst herunter, wenn du ein Doppel (oder das Bull) getroffen hast; Pfeile davor zählen nichts.',
            },
            out: {
              double:
                'Der letzte Pfeil muss ein Doppel (oder das Bull) sein, das dich genau auf null bringt. Das ist die übliche Regel.',
              single:
                'Jeder Pfeil, der dich genau auf null bringt, gewinnt. Das einfachste Finish, gut für Anfänger.',
              master:
                'Der letzte Pfeil muss ein Doppel oder Triple (oder das Bull) sein, das dich genau auf null bringt.',
            },
            legs: {
              one: 'Ein Leg: Wer zuerst beendet, gewinnt das Match.',
              other:
                'Ein Leg ist ein Spiel bis zum Ende. Wer zuerst {count} Legs gewinnt, gewinnt das Match; wer beginnt, wechselt mit jedem Leg.',
            },
            variant: {
              standard:
                'Hast du eine Zahl geschlossen, bringen deine Treffer darauf dir Punkte, solange ein Gegner sie noch offen hat. Die meisten Punkte gewinnen.',
              cutthroat:
                'Deine Treffer auf eine geschlossene Zahl geben jedem Gegner Punkte, der sie noch nicht geschlossen hat. Die wenigsten Punkte gewinnen.',
            },
            shanghaiRounds: {
              '7': 'Die Zahlen 1 bis 7, eine pro Runde: ein schnelles Spiel.',
              '20': 'Jede Zahl von 1 bis 20, eine pro Runde: ein langes Spiel.',
            },
            hit: {
              any: 'Single, Doppel und Triple der Zahl zählen alle. Am Ende zählt jedes Bull.',
              doubles:
                'Nur das Doppel jeder Zahl zählt, am Ende das innere Bull. Viel schwerer: gutes Training für Finishes.',
            },
            lives: {
              one: 'Jeder Spieler hat {count} Leben: Ein Treffer eines Killers auf sein Doppel wirft ihn raus.',
              other:
                'Jeder Spieler hat {count} Leben; jeder Treffer eines Killers auf sein Doppel nimmt eins. Mehr Leben machen das Spiel länger.',
            },
            countupRounds: {
              one: 'Jeder Spieler wirft {count} Aufnahme mit drei Pfeilen; die höchste Summe gewinnt.',
              other:
                'Jeder Spieler wirft {count} Aufnahmen mit drei Pfeilen; die höchste Summe gewinnt.',
            },
            dartsPerFinish:
              'Du hast {count} Pfeile ({visits} Aufnahmen), um jede Punktzahl zu beenden; schaffst du es nicht, kommt die nächste.',
            dartsPerTarget:
              'Du wirfst {count} Pfeile ({visits} Aufnahmen) auf jedes Ziel, dann geht es zum nächsten. Insgesamt: {total} Pfeile.',
            targets:
              'Jedes Ziel ist eine Zahl mit einem Ring. Deine Treffer werden gezählt, so siehst du, wie genau du bei jedem bist.',
            ring: {
              '0': 'Jeder Teil: Single, Doppel und Triple der Zahl zählen alle als Treffer.',
              '1': 'Single: Nur die Single-Felder der Zahl zählen, nicht ihr Doppel- oder Triple-Ring.',
              '2': 'Doppel: Nur der äußere Ring der Zahl zählt, der, mit dem du beendest.',
              '3': 'Triple: Nur der schmale innere Ring der Zahl zählt.',
            },
          },
        },
      },
      events: {
        bust: 'Bust!',
        leg: 'Leg gewonnen!',
        win: 'Spiel gewonnen!',
        shanghai: 'Shanghai!',
        killer: 'Killer!',
        eliminated: 'Spieler raus!',
        checkout: 'Beendet!',
        missed: 'Nächste Punktzahl',
        tiebreak: 'Stechen',
      },
      suggest: {
        title: 'Wohin du als Nächstes zielst',
        intro:
          'Vorschläge für die restlichen Pfeile dieser Aufnahme. Der erste leuchtet auch auf der Dartscheibe auf.',
        option: 'Möglichkeit {n}',
        bull: 'das Bull',
        explain: {
          checkout: {
            one: 'Beendet deine {score} mit einem Pfeil.',
            other: 'Beendet deine {score} mit {count} Pfeilen, in dieser Reihenfolge geworfen.',
          },
          setup:
            'Mit den restlichen Pfeilen kannst du nicht beenden. So bleiben {left}, die du in der nächsten Aufnahme beenden kannst.',
          far: '{left} ist zu weit, um es in dieser Aufnahme zu beenden: Punkte so viel wie möglich.',
          doubleIn: 'Double in: Deine Punkte zählen erst, wenn du ein Doppel getroffen hast.',
          close: 'Schließe die {n}: Ein Gegner punktet bereits darauf.',
          scoreOn:
            'Du hast die {n} geschlossen, ein Gegner nicht: Jeder weitere Treffer bringt Punkte.',
          stillOpen: 'Die {n} ist für dich noch offen: Drei Treffer schließen sie.',
          shanghai:
            'In dieser Runde zählt nur die {n}. Triff in dieser Aufnahme Single, Doppel und Triple davon, in beliebiger Reihenfolge, um sofort zu gewinnen.',
          tiebreak: 'Stechen: Nur das Bull zählt.',
          sequence:
            'Triff die Zahlen der Reihe nach; jeder Ring zählt. Deine nächste Zahl ist {target}.',
          sequenceDoubles:
            'Triff nur die Doppel, der Reihe nach (das innere Bull zuletzt). Dein nächstes Ziel ist {target}.',
          becomeKiller: 'Deine Zahl ist die {n}: Triff ihr Doppel, um Killer zu werden.',
          takeLife: 'Doppel {n} nimmt {name} ein Leben (übrige Leben: {lives}).',
          lastLife: '{name} hat nur noch ein Leben: Doppel {n} wirft sie raus.',
          points: 'Count-Up: Das bringt {points} Punkte.',
          drill: 'Das aktuelle Ziel dieser Übung.',
        },
        none: 'Kein Vorschlag für diesen Pfeil.',
      },
      skills: {
        scoring: 'Punkten',
        doubles: 'Doppel',
        trebles: 'Triple',
        bull: 'Bull',
        accuracy: 'Genauigkeit',
        consistency: 'Beständigkeit',
        starter: 'Einstieg',
      },
      drills: {
        none: 'Noch keine Übungen. Lass dir welche erstellen: Sie beruhen auf deiner Statistik und nur du siehst sie.',
        titles: {
          x01: 'X01-Training',
          cricket: 'Cricket-Training',
          shanghai: 'Shanghai-Training',
          atc: 'Rund um die Uhr',
          killer: 'Killer-Training',
          countup: 'Count-Up-Punkten',
          targets: 'Zielübung',
          checkout: 'Finish-Übung',
        },
        why: {
          doubles: 'Diese Doppel verfehlst du am häufigsten: Ziele darauf, bis sie leicht fallen.',
          scoring: 'Bring deine Pfeile in Triple 20 und 19, um deinen Schnitt zu erhöhen.',
          trebles: 'Triple bringen die großen Punktzahlen: Übe den oberen Teil der Scheibe.',
          bull: 'Das Bull beendet 50 und entscheidet das Stechen.',
          accuracy: 'Die Zahl treffen, auf die du zielst: die Grundlage jedes Spiels.',
          consistency: 'Gleichmäßige Aufnahmen, Runde für Runde.',
          starter: 'Ein erster Satz, um zu sehen, wohin deine Pfeile gehen.',
        },
        played: { one: '{count}-mal gespielt', other: '{count}-mal gespielt' },
        play: 'Spielen',
        remove: 'Entfernen',
        removeConfirm: 'Diese Übung entfernen?',
        generate: 'Übungen für mich erstellen',
        regenerate: 'Neue Übungen erstellen',
        removeBody: 'Neue Übungen kannst du jederzeit aus deiner Statistik erstellen.',
      },
    },
    ro: {
      games: {
        names: {
          x01: '501 / 301',
          cricket: 'Cricket',
          shanghai: 'Shanghai',
          atc: 'În jurul ceasului',
          killer: 'Killer',
          countup: 'Count-Up',
          targets: 'Exercițiu pe ținte',
          checkout: 'Exercițiu de închidere',
        },
        short: {
          x01: 'Coboară până la zero',
          cricket: 'Închide 15–20 și centrul',
          shanghai: 'Un număr pe rundă',
          atc: 'De la 1 la 20, apoi centrul',
          killer: 'Ia viețile celorlalți',
          countup: 'Câștigă cele mai multe puncte',
          targets: 'Lovește ținte alese',
          checkout: 'Exersează închiderile',
        },
        rules: {
          x01: 'Toți încep de la același scor (301, 501, 701 sau 1001) și scad ce realizează la fiecare tură. Trebuie să ajungi exact la zero, cu ultima săgeată într-un dublu sau în centru (double-out). Sub zero, la 1 sau la zero fără dublu este bust: scorul revine la cel de la începutul turei.',
          cricket:
            'Contează doar 15–20 și centrul. Trei marcaje închid un număr (simplul e un marcaj, dublul două, triplul trei). După ce ai închis un număr, loviturile în el aduc puncte cât timp un adversar îl are încă deschis. Închide tot cu cel puțin tot atâtea puncte ca ceilalți ca să câștigi. La cut-throat, punctele tale merg la adversari și câștigă scorul cel mai mic.',
          shanghai:
            'În runda 1 contează doar 1, în runda 2 doar 2 și tot așa (7 sau 20 de runde). Simplul, dublul și triplul numărului rundei într-o singură tură înseamnă Shanghai și câștigi pe loc. Altfel câștigă scorul cel mai mare; egalitatea se decide pe centru.',
          atc: 'Lovește 1, 2, 3 … până la 20, în ordine, apoi centrul. Primul care lovește centrul câștigă. În modul dubluri contează doar dublul fiecărui număr (și centrul interior).',
          killer:
            'Fiecare jucător primește un număr la întâmplare. Lovește dublul numărului tău ca să devii killer, apoi lovește dublurile numerelor celorlalți ca să le iei viețile. Cine rămâne fără vieți iese; ultimul rămas câștigă.',
          countup:
            'Fiecare săgeată aduce ce lovește, pe un număr fix de runde. Câștigă cele mai multe puncte. Bun pentru exersarea punctajului și a constanței.',
          targets:
            'Un exercițiu: un număr de săgeți spre fiecare țintă aleasă (un dublu, un triplu, un număr sau centrul). Fiecare lovitură contează, iar statisticile află cât de precis ești la fiecare.',
          checkout:
            'Un exercițiu: închide fiecare scor (de exemplu 40, 81, 100) terminând pe un dublu, cu câteva ture pentru fiecare. Un bust încheie tura; o închidere exactă trece la scorul următor.',
        },
        options: {
          start: 'Scor de pornire',
          inLabel: 'Început',
          in: { straight: 'Straight in', double: 'Double in' },
          inDouble: 'Double in',
          outLabel: 'Închidere',
          out: { double: 'Double out', single: 'Single out', master: 'Master out' },
          legs: 'Leg-uri',
          firstTo: {
            one: 'Primul la {count} leg',
            few: 'Primul la {count} leg-uri',
            other: 'Primul la {count} de leg-uri',
          },
          variantLabel: 'Variantă',
          variant: { standard: 'Standard', cutthroat: 'Cut-throat' },
          rounds: 'Runde',
          roundsCount: { one: '{count} rundă', few: '{count} runde', other: '{count} de runde' },
          hitLabel: 'Ce contează',
          hit: { any: 'Orice parte a numărului', doubles: 'Doar dublurile' },
          lives: 'Vieți',
          livesCount: { one: '{count} viață', few: '{count} vieți', other: '{count} de vieți' },
          dartsEach: {
            one: 'câte {count} săgeată',
            few: 'câte {count} săgeți',
            other: 'câte {count} de săgeți',
          },
          dartsPerTarget: 'Săgeți pe țintă',
          dartsPerFinish: 'Săgeți pe închidere',
          finishes: 'Scoruri de închis',
          finishesHint: 'Între 2 și 170, separate prin virgulă (cel mult 10).',
          targets: 'Ținte (atinge una ca s-o elimini)',
          removeTarget: 'Elimină {target}',
          ring: 'Inel',
          ringAny: 'Orice parte',
          ringSingle: 'Simplu',
          ringDouble: 'Dublu',
          ringTreble: 'Triplu',
          number: 'Număr',
          bull: 'Centru',
          addTarget: 'Adaugă ținta',
          help: {
            start: {
              '301': 'Un joc scurt: bun pentru începători sau pentru un meci rapid.',
              '501': 'Jocul obișnuit de meci, ca la turneele de la televizor.',
              '701': 'Un joc mai lung, jucat adesea în perechi sau în echipe.',
              '1001': 'Un joc lung pentru echipe, în care contează cel mai mult punctajul.',
            },
            in: {
              straight: 'Fiecare săgeată contează încă de la prima.',
              double:
                'Scorul tău începe să scadă abia după ce lovești un dublu (sau centrul); săgețile de dinainte nu aduc nimic.',
            },
            out: {
              double:
                'Ultima săgeată trebuie să fie un dublu (sau centrul) care te aduce exact la zero. Aceasta este regula obișnuită.',
              single:
                'Orice săgeată care te aduce exact la zero câștigă. Cea mai ușoară închidere, bună pentru începători.',
              master:
                'Ultima săgeată trebuie să fie un dublu sau un triplu (sau centrul) care te aduce exact la zero.',
            },
            legs: {
              one: 'Un singur leg: cine termină primul câștigă meciul.',
              few: 'Un leg este un joc dus până la capăt. Primul care câștigă {count} leg-uri câștigă meciul; cine începe se schimbă la fiecare leg.',
              other:
                'Un leg este un joc dus până la capăt. Primul care câștigă {count} de leg-uri câștigă meciul; cine începe se schimbă la fiecare leg.',
            },
            variant: {
              standard:
                'După ce ai închis un număr, loviturile tale în el îți aduc puncte cât timp un adversar îl are încă deschis. Câștigă cele mai multe puncte.',
              cutthroat:
                'Loviturile tale într-un număr închis dau puncte fiecărui adversar care nu l-a închis. Câștigă cele mai puține puncte.',
            },
            shanghaiRounds: {
              '7': 'Numerele de la 1 la 7, câte unul pe rundă: un joc rapid.',
              '20': 'Fiecare număr de la 1 la 20, câte unul pe rundă: un joc lung.',
            },
            hit: {
              any: 'Simplul, dublul și triplul numărului contează toate. La final contează oricare centru.',
              doubles:
                'Contează doar dublul fiecărui număr, iar la final centrul interior. Mult mai greu: antrenament bun pentru închideri.',
            },
            lives: {
              one: 'Fiecare jucător are {count} viață: o lovitură a unui killer în dublul lui îl elimină.',
              few: 'Fiecare jucător are {count} vieți; fiecare lovitură a unui killer în dublul lui îi ia una. Mai multe vieți înseamnă un joc mai lung.',
              other:
                'Fiecare jucător are {count} de vieți; fiecare lovitură a unui killer în dublul lui îi ia una. Mai multe vieți înseamnă un joc mai lung.',
            },
            countupRounds: {
              one: 'Fiecare jucător aruncă {count} tură de trei săgeți; câștigă totalul cel mai mare.',
              few: 'Fiecare jucător aruncă {count} ture de trei săgeți; câștigă totalul cel mai mare.',
              other:
                'Fiecare jucător aruncă {count} de ture de trei săgeți; câștigă totalul cel mai mare.',
            },
            dartsPerFinish:
              'Ai {count} săgeți ({visits} ture) ca să închizi fiecare scor; dacă nu reușești, urmează scorul următor.',
            dartsPerTarget:
              'Arunci {count} săgeți ({visits} ture) spre fiecare țintă, apoi treci la următoarea. Total săgeți: {total}.',
            targets:
              'Fiecare țintă este un număr cu un inel. Loviturile tale sunt numărate, ca să vezi cât de precis ești la fiecare.',
            ring: {
              '0': 'Orice parte: simplul, dublul și triplul numărului contează toate ca lovitură.',
              '1': 'Simplu: contează doar zonele simple ale numărului, nu inelul de dublu sau de triplu.',
              '2': 'Dublu: contează doar inelul exterior al numărului, cel pe care închizi.',
              '3': 'Triplu: contează doar inelul interior îngust al numărului.',
            },
          },
        },
      },
      events: {
        bust: 'Bust!',
        leg: 'Leg câștigat!',
        win: 'Joc câștigat!',
        shanghai: 'Shanghai!',
        killer: 'Killer!',
        eliminated: 'Jucător eliminat!',
        checkout: 'Închis!',
        missed: 'Scorul următor',
        tiebreak: 'Departajare',
      },
      suggest: {
        title: 'Unde să țintești acum',
        intro:
          'Sugestii pentru săgețile rămase din această tură. Prima se aprinde și pe ținta de darts.',
        option: 'Varianta {n}',
        bull: 'centrul',
        explain: {
          checkout: {
            one: 'Închide scorul tău de {score} cu o singură săgeată.',
            few: 'Închide scorul tău de {score} cu {count} săgeți, aruncate în această ordine.',
            other:
              'Închide scorul tău de {score} cu {count} de săgeți, aruncate în această ordine.',
          },
          setup:
            'Nu poți închide cu săgețile rămase. Așa rămâi cu {left}, pe care îl poți închide în tura următoare.',
          far: '{left} e prea mult ca să închizi în această tură: fă cât mai multe puncte.',
          doubleIn: 'Double in: punctele tale încep să conteze abia după ce lovești un dublu.',
          close: 'Închide {n}: un adversar punctează deja pe el.',
          scoreOn: 'Ai închis {n}, iar un adversar nu: fiecare lovitură în plus aduce puncte.',
          stillOpen: '{n} e încă deschis pentru tine: trei marcaje îl închid.',
          shanghai:
            'În această rundă contează doar {n}. Lovește-i simplul, dublul și triplul în această tură, în orice ordine, ca să câștigi pe loc.',
          tiebreak: 'Departajare: contează doar centrul.',
          sequence:
            'Lovește numerele în ordine; contează orice inel. Următorul tău număr este {target}.',
          sequenceDoubles:
            'Lovește doar dublurile, în ordine (centrul interior la final). Următoarea ta țintă este {target}.',
          becomeKiller: 'Numărul tău este {n}: lovește-i dublul ca să devii killer.',
          takeLife: 'Dublul {n} îi ia o viață lui {name} (vieți rămase: {lives}).',
          lastLife: '{name} mai are o singură viață: dublul {n} îl elimină.',
          points: 'Count-Up: asta valorează {points} de puncte.',
          drill: 'Ținta curentă a acestui exercițiu.',
        },
        none: 'Nicio sugestie pentru această săgeată.',
      },
      skills: {
        scoring: 'Punctaj',
        doubles: 'Dubluri',
        trebles: 'Tripluri',
        bull: 'Centru',
        accuracy: 'Precizie',
        consistency: 'Constanță',
        starter: 'Început',
      },
      drills: {
        none: 'Încă nu ai exerciții. Creează câteva: se bazează pe statisticile tale și doar tu le vezi.',
        titles: {
          x01: 'Antrenament X01',
          cricket: 'Antrenament Cricket',
          shanghai: 'Antrenament Shanghai',
          atc: 'În jurul ceasului',
          killer: 'Antrenament Killer',
          countup: 'Punctaj Count-Up',
          targets: 'Exercițiu pe ținte',
          checkout: 'Exercițiu de închidere',
        },
        why: {
          doubles: 'Pe aceste dubluri le ratezi cel mai des: țintește-le până devin ușoare.',
          scoring: 'Grupează săgețile în triplul 20 și 19 ca să-ți crești media.',
          trebles: 'Triplurile aduc scorurile mari: exersează partea de sus a țintei.',
          bull: 'Centrul închide 50 și câștigă departajările.',
          accuracy: 'Să lovești numărul la care țintești: baza oricărui joc.',
          consistency: 'Ture constante, rundă după rundă.',
          starter: 'Un prim set ca să vezi unde ajung săgețile tale.',
        },
        played: {
          one: 'Jucat o dată',
          few: 'Jucat de {count} ori',
          other: 'Jucat de {count} de ori',
        },
        play: 'Joacă',
        remove: 'Elimină',
        removeConfirm: 'Elimini acest exercițiu?',
        generate: 'Creează exerciții pentru mine',
        regenerate: 'Creează exerciții noi',
        removeBody: 'Poți crea oricând exerciții noi din statisticile tale.',
      },
    },
    hu: {
      games: {
        names: {
          x01: '501 / 301',
          cricket: 'Cricket',
          shanghai: 'Shanghai',
          atc: 'Körbe',
          killer: 'Killer',
          countup: 'Count-Up',
          targets: 'Célgyakorlat',
          checkout: 'Kiszálló gyakorlat',
        },
        short: {
          x01: 'Lefelé nulláig',
          cricket: 'Zárd le a 15–20-at és a bullt',
          shanghai: 'Körönként egy szám',
          atc: '1-től 20-ig, aztán a bull',
          killer: 'Vedd el a többiek életét',
          countup: 'A legtöbb pont nyer',
          targets: 'Választott célok eltalálása',
          checkout: 'Kiszállók gyakorlása',
        },
        rules: {
          x01: 'Mindenki ugyanarról a pontszámról indul (301, 501, 701 vagy 1001), és levonja, amit egy-egy körben dob. Pontosan nullára kell jutnod, az utolsó nyíllal duplába vagy a bullba (double-out). Nulla alá, 1-re vagy dupla nélkül nullára menni bust: a pontszám visszaáll a kör eleji értékre.',
          cricket:
            'Csak a 15–20 és a bull számít. Három jelölés lezár egy számot (a szimpla egy, a dupla kettő, a tripla három). Ha lezártál egy számot, a rá dobott találatok pontot érnek, amíg egy ellenfélnél még nyitva van. Zárj le mindent legalább annyi ponttal, mint a többiek, és nyersz. Cut-throatnál a pontjaid az ellenfelekhez kerülnek, és a legkevesebb pont nyer.',
          shanghai:
            'Az 1. körben csak az 1 számít, a 2.-ban csak a 2, és így tovább (7 vagy 20 kör). A kör számának szimplája, duplája és triplája egy körben Shanghai, és azonnal nyer. Különben a legtöbb pont nyer; döntetlennél a bull dönt.',
          atc: 'Dobd sorban az 1-et, 2-t, 3-at … egészen 20-ig, aztán a bullt. Aki elsőként találja el a bullt, nyer. Dupla módban csak a számok duplája (és a belső bull) számít.',
          killer:
            'Mindenki kap egy véletlen számot. Találd el a saját számod dupláját, hogy killer legyél, aztán a többiek számainak dupláival vedd el az életüket. Akinek elfogy az élete, kiesik; az utolsó játékos nyer.',
          countup:
            'Minden nyíl annyit ér, amennyit eltalál, meghatározott számú körön át. A legtöbb pont nyer. Jó a pontszerzés és az egyenletesség gyakorlására.',
          targets:
            'Gyakorlat: adott számú nyíl minden választott célra (dupla, tripla, szám vagy bull). Minden találat számít, és a statisztika megtanulja, mennyire vagy pontos az egyes célokon.',
          checkout:
            'Gyakorlat: fejezz be minden pontszámot (például 40, 81, 100) duplával, pontszámonként néhány körrel. A bust lezárja a kört; a pontos kiszálló a következő pontszámra lép.',
        },
        options: {
          start: 'Kezdő pontszám',
          inLabel: 'Kezdés',
          in: { straight: 'Straight in', double: 'Double in' },
          inDouble: 'Double in',
          outLabel: 'Kiszálló',
          out: { double: 'Double out', single: 'Single out', master: 'Master out' },
          legs: 'Legek',
          firstTo: { one: 'Aki előbb nyer {count} leget', other: 'Aki előbb nyer {count} leget' },
          variantLabel: 'Változat',
          variant: { standard: 'Normál', cutthroat: 'Cut-throat' },
          rounds: 'Körök',
          roundsCount: { one: '{count} kör', other: '{count} kör' },
          hitLabel: 'Mi számít',
          hit: { any: 'A szám bármely része', doubles: 'Csak dupla' },
          lives: 'Életek',
          livesCount: { one: '{count} élet', other: '{count} élet' },
          dartsEach: { one: 'egyenként {count} nyíl', other: 'egyenként {count} nyíl' },
          dartsPerTarget: 'Nyíl célonként',
          dartsPerFinish: 'Nyíl kiszállónként',
          finishes: 'Befejezendő pontszámok',
          finishesHint: '2 és 170 között, vesszővel elválasztva (legfeljebb 10).',
          targets: 'Célok (koppints rá a törléshez)',
          removeTarget: '{target} törlése',
          ring: 'Gyűrű',
          ringAny: 'Bármely rész',
          ringSingle: 'Szimpla',
          ringDouble: 'Dupla',
          ringTreble: 'Tripla',
          number: 'Szám',
          bull: 'Bull',
          addTarget: 'Cél hozzáadása',
          help: {
            start: {
              '301': 'Rövid játék: kezdőknek vagy egy gyors meccshez jó.',
              '501': 'A szokásos meccsjáték, mint a tévében közvetített versenyeken.',
              '701': 'Hosszabb játék, gyakran párosban vagy csapatban.',
              '1001': 'Hosszú csapatjáték, ahol leginkább a pontszerzés számít.',
            },
            in: {
              straight: 'Már az első nyíltól minden nyíl számít.',
              double:
                'A pontszámod csak akkor kezd csökkenni, ha eltaláltál egy duplát (vagy a bullt); az előtte dobott nyilak nem érnek semmit.',
            },
            out: {
              double:
                'Az utolsó nyílnak duplának (vagy bullnak) kell lennie, amely pontosan nullára visz. Ez a szokásos szabály.',
              single:
                'Bármelyik nyíl nyer, amely pontosan nullára visz. A legkönnyebb kiszálló, kezdőknek jó.',
              master:
                'Az utolsó nyílnak duplának vagy triplának (vagy bullnak) kell lennie, amely pontosan nullára visz.',
            },
            legs: {
              one: 'Egy leg: aki előbb kiszáll, megnyeri a meccset.',
              other:
                'Egy leg egy végigjátszott játék. Aki előbb nyer {count} leget, megnyeri a meccset; a kezdő minden legben változik.',
            },
            variant: {
              standard:
                'Ha lezártál egy számot, a rá dobott találataid neked hoznak pontot, amíg egy ellenfélnél még nyitva van. A legtöbb pont nyer.',
              cutthroat:
                'A lezárt számra dobott találataid minden olyan ellenfélnek pontot adnak, aki még nem zárta le. A legkevesebb pont nyer.',
            },
            shanghaiRounds: {
              '7': 'Az 1–7 számok, körönként egy: gyors játék.',
              '20': 'Minden szám 1-től 20-ig, körönként egy: hosszú játék.',
            },
            hit: {
              any: 'A szám szimplája, duplája és triplája is számít. A végén bármelyik bull jó.',
              doubles:
                'Csak a számok duplája számít, a végén a belső bull. Sokkal nehezebb: jó gyakorlás a kiszállókhoz.',
            },
            lives: {
              one: 'Minden játékosnak {count} élete van: egy killer egyetlen találata a duplájára kiejti.',
              other:
                'Minden játékosnak {count} élete van; egy killer minden találata a duplájára elvesz egyet. Több élet hosszabb játékot jelent.',
            },
            countupRounds: {
              one: 'Mindenki {count} kört dob, körönként három nyilat; a legnagyobb összeg nyer.',
              other: 'Mindenki {count} kört dob, körönként három nyilat; a legnagyobb összeg nyer.',
            },
            dartsPerFinish:
              '{count} nyilad ({visits} kör) van minden pontszám befejezésére; ha nem sikerül, jön a következő.',
            dartsPerTarget:
              'Minden célra {count} nyilat ({visits} kört) dobsz, aztán jön a következő. Összesen: {total} nyíl.',
            targets:
              'Minden cél egy szám egy gyűrűvel. A találataidat számolja, így látod, mennyire vagy pontos az egyes célokon.',
            ring: {
              '0': 'Bármely rész: a szám szimplája, duplája és triplája is találatnak számít.',
              '1': 'Szimpla: csak a szám szimpla mezői számítanak, a dupla és tripla gyűrű nem.',
              '2': 'Dupla: csak a szám külső gyűrűje számít, amelyikkel kiszállsz.',
              '3': 'Tripla: csak a szám keskeny belső gyűrűje számít.',
            },
          },
        },
      },
      events: {
        bust: 'Bust!',
        leg: 'Leg megnyerve!',
        win: 'Játék megnyerve!',
        shanghai: 'Shanghai!',
        killer: 'Killer!',
        eliminated: 'Játékos kiesett!',
        checkout: 'Kiszállva!',
        missed: 'Következő pontszám',
        tiebreak: 'Szétdobás',
      },
      suggest: {
        title: 'Hová célozz most',
        intro: 'Javaslatok a kör hátralévő nyilaira. Az első a darts-táblán is felvillan.',
        option: '{n}. lehetőség',
        bull: 'a bull',
        explain: {
          checkout: {
            one: 'Egy nyíllal kiszállsz a(z) {score} pontból.',
            other: '{count} nyíllal kiszállsz a(z) {score} pontból, ebben a sorrendben dobva.',
          },
          setup:
            'A hátralévő nyilakkal nem tudsz kiszállni. Így {left} marad, amiből a következő körben kiszállhatsz.',
          far: 'A(z) {left} túl sok ahhoz, hogy ebben a körben kiszállj: szerezz minél több pontot.',
          doubleIn:
            'Double in: a pontjaid csak akkor kezdenek számítani, ha eltaláltál egy duplát.',
          close: 'Zárd le ezt: {n}. Egy ellenfél már pontot szerez rajta.',
          scoreOn: 'Lezártad ezt: {n}, egy ellenfél még nem: minden további találat pontot ér.',
          stillOpen: 'Ez nálad még nyitva van: {n}. Három jelölés lezárja.',
          shanghai:
            'Ebben a körben csak ez számít: {n}. Dobd el a szimpláját, dupláját és tripláját ebben a körben, bármilyen sorrendben, és azonnal nyersz.',
          tiebreak: 'Szétdobás: csak a bull számít.',
          sequence: 'Dobd a számokat sorban; bármelyik gyűrű számít. A következő számod: {target}.',
          sequenceDoubles:
            'Csak a duplák számítanak, sorban (a belső bull a végén). A következő célod: {target}.',
          becomeKiller: 'A számod: {n}. Találd el a dupláját, hogy killer legyél.',
          takeLife: 'A dupla {n} elvesz egy életet tőle: {name} (hátralévő élet: {lives}).',
          lastLife: '{name} játékosnak egy élete maradt: a dupla {n} kiejti.',
          points: 'Count-Up: ez {points} pontot ér.',
          drill: 'A gyakorlat aktuális célja.',
        },
        none: 'Ehhez a nyílhoz nincs javaslat.',
      },
      skills: {
        scoring: 'Pontszerzés',
        doubles: 'Dupla',
        trebles: 'Tripla',
        bull: 'Bull',
        accuracy: 'Pontosság',
        consistency: 'Egyenletesség',
        starter: 'Kezdés',
      },
      drills: {
        none: 'Még nincsenek gyakorlatok. Készíttess néhányat: a statisztikádon alapulnak, és csak te látod őket.',
        titles: {
          x01: 'X01 gyakorlás',
          cricket: 'Cricket gyakorlás',
          shanghai: 'Shanghai gyakorlás',
          atc: 'Körbe',
          killer: 'Killer gyakorlás',
          countup: 'Count-Up pontszerzés',
          targets: 'Célgyakorlat',
          checkout: 'Kiszálló gyakorlat',
        },
        why: {
          doubles:
            'Ezeket a duplákat hibázod el a legtöbbször: célozd őket, amíg könnyűvé nem válnak.',
          scoring: 'Csoportosítsd a nyilaidat a tripla 20-ba és 19-be, hogy nőjön az átlagod.',
          trebles: 'A tripla hozza a nagy pontokat: gyakorold a tábla tetejét.',
          bull: 'A bull fejezi be az 50-et, és megnyeri a szétdobást.',
          accuracy: 'Eltalálni a számot, amit célzol: minden játék alapja.',
          consistency: 'Egyenletes körök, körről körre.',
          starter: 'Egy első sor, hogy lásd, hová mennek a nyilaid.',
        },
        played: { one: '{count} alkalommal játszva', other: '{count} alkalommal játszva' },
        play: 'Játék',
        remove: 'Törlés',
        removeConfirm: 'Törlöd ezt a gyakorlatot?',
        generate: 'Készíts gyakorlatokat nekem',
        regenerate: 'Új gyakorlatok',
        removeBody: 'A statisztikádból bármikor készíthetsz új gyakorlatokat.',
      },
    },
  },
);
