import type { PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { cnpChecksum } from './cnp';
import { addIncident, createOrg, createPerson, requireCan, saveIdentity } from './data';
import { addDays, mondayOf, type IsoDate } from './dates';
import { HttpError } from './http';
import { saveLicence } from './licence-data';
import { saveMealTime, saveMenu } from './meals-data';
import { addMedNote, saveMedication, saveProfile, saveStay } from './medical-data';
import type { Diet } from './model';
import { saveDescription } from './org-page';
import { isRole, type Role } from './roles';
import { saveDriver, setKitchenAddress, setMinutesPerStop, setRoute } from './routes-data';
import type { PersonInput } from './validate';

// Demo organisations (migration 0013): anyone with the app makes one (just one each; asking
// again opens it) filled with sample people,
// personal numbers, menus, drivers, today's routes and medical files, through the app's own
// functions (so everything is stored, encrypted and logged as usual), and may then view it in
// any role. Sample data only: invented names, addresses and numbers.

type Db = Omit<PluginDatabase, 'transaction'>;

const cnp = (first12: string) => first12 + cnpChecksum(first12);
const time = (h: number, m = 0) => h * 60 + m;

/** A 1 × 1 PNG standing in for the demo driver's licence picture. */
const PIXEL = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  ),
  (c) => c.charCodeAt(0),
);

function person(
  first: string,
  last: string,
  over: Partial<PersonInput> & { birthDate: IsoDate },
): PersonInput {
  return {
    firstName: first,
    lastName: last,
    kind: 'delivery',
    status: 'active',
    address: null,
    phone: null,
    contactName: null,
    contactPhone: null,
    diet: 'normal',
    allergies: null,
    observation: null,
    deliveryDays: [1, 2, 3, 4, 5, 6, 7],
    windowFromMin: time(11),
    windowToMin: time(13, 30),
    ...over,
  };
}

/** Same month and day as `day`, `years` earlier: a birthday on that day. */
const yearsBefore = (day: IsoDate, years: number) =>
  `${Number(day.slice(0, 4)) - years}${day.slice(4)}`;

/** The visitor's demo organisation, made now unless they have one already; returns its id. */
export async function createDemoOrg(
  db: PluginDatabase,
  user: PluginUser,
  today: IsoDate,
): Promise<number> {
  const [mine] = await db.query<{ id: number }>(
    `SELECT o.id FROM canteen_orgs o JOIN canteen_staff s ON s.org_id = o.id AND s.user_id = ?
      WHERE o.is_demo = 1 AND o.created_by = ? ORDER BY o.id LIMIT 1`,
    [user.id, user.id],
  );
  if (mine) return Number(mine.id);
  const orgId = await createOrg(db, user, { name: 'Demo · Cantina Speranța' });
  await db.execute('UPDATE canteen_orgs SET is_demo = 1 WHERE id = ?', [orgId]);
  const me = user.id;

  await saveDescription(
    db,
    orgId,
    me,
    'Cantina socială din cartierul Mărăști: prânz cald pentru vârstnici, livrat acasă sau servit în cămin.',
  );
  await setKitchenAddress(db, orgId, me, 'Str. Memorandumului 28, Cluj-Napoca');
  await setMinutesPerStop(db, orgId, me, 6);

  // People: home deliveries with windows, residents of the home, birthdays this week.
  const people: { id: number; diet: Diet; kind: 'delivery' | 'resident' }[] = [];
  const add = async (p: PersonInput, id?: { series: string; number: string; cnp12: string }) => {
    const personId = await createPerson(db, orgId, me, p);
    people.push({ id: personId, diet: p.diet, kind: p.kind });
    if (id) {
      await saveIdentity(db, orgId, personId, me, {
        idSeries: id.series,
        idNumber: id.number,
        cnp: cnp(id.cnp12),
        idExpiresOn: addDays(today, 400),
      });
    }
    return personId;
  };
  const maria = await add(
    person('Maria', 'Popescu', {
      birthDate: yearsBefore(today, 81),
      address: 'Str. Lalelelor 12, ap. 4, Cluj-Napoca',
      phone: '0740 123 456',
      contactName: 'Ioana Popescu (fiică)',
      contactPhone: '0741 222 333',
      diet: 'diabetic',
      observation: 'Sunați de două ori, aude greu.',
    }),
    { series: 'CJ', number: '123456', cnp12: '243022412345' },
  );
  const ion = await add(
    person('Ion', 'Moldovan', {
      birthDate: yearsBefore(addDays(today, 3), 77),
      address: 'Str. Fabricii 7, Cluj-Napoca',
      phone: '0752 987 654',
      diet: 'low_salt',
      allergies: 'nuci',
      windowFromMin: time(11, 30),
      windowToMin: time(12, 30),
    }),
    { series: 'KX', number: '654321', cnp12: '149051912345' },
  );
  await add(
    person('Elena', 'Varga', {
      birthDate: '1939-11-02',
      address: 'Calea Dorobanților 45, Cluj-Napoca',
      diet: 'soft',
      windowFromMin: time(12),
      windowToMin: time(14),
    }),
  );
  await add(
    person('Gheorghe', 'Pop', {
      birthDate: '1944-06-20',
      address: 'Str. Aurel Vlaicu 3, Cluj-Napoca',
      diet: 'vegetarian',
    }),
  );
  await add(
    person('Ana', 'Kovács', {
      birthDate: '1946-01-15',
      address: 'Str. Bucium 18, Cluj-Napoca',
      status: 'paused',
      observation: 'La fiica ei până la sfârșitul lunii.',
    }),
  );
  const ileana = await add(
    person('Ileana', 'Rus', {
      birthDate: '1935-03-08',
      kind: 'resident',
      deliveryDays: [],
      windowFromMin: null,
      windowToMin: null,
      diet: 'pureed',
      allergies: 'lactoză',
    }),
    { series: 'CJ', number: '222333', cnp12: '235030812345' },
  );
  const vasile = await add(
    person('Vasile', 'Mureșan', {
      birthDate: '1941-09-30',
      kind: 'resident',
      deliveryDays: [],
      windowFromMin: null,
      windowToMin: null,
    }),
  );
  // More people, so lists, the kitchen sheet and the routes look like a real week.
  const streets = [
    'Str. Horea',
    'Str. Observatorului',
    'Bd. 21 Decembrie 1989',
    'Str. Republicii',
    'Calea Florești',
    'Str. Donath',
    'Str. Teodor Mihali',
    'Str. Plopilor',
    'Str. Dâmboviței',
    'Str. Albac',
    'Calea Turzii',
    'Str. Moților',
    'Str. Constanța',
    'Aleea Peana',
  ];
  const firsts = [
    'Aurelia',
    'Petru',
    'Viorica',
    'Nicolae',
    'Floarea',
    'Dumitru',
    'Margareta',
    'Ioan',
    'Silvia',
    'Traian',
    'Rozalia',
    'Emil',
    'Valeria',
    'Grigore',
    'Lucreția',
    'Alexandru',
    'Cornelia',
    'Teodor',
    'Iuliana',
  ];
  const lasts = [
    'Sabău',
    'Cîmpean',
    'Bogdan',
    'Lazăr',
    'Nagy',
    'Oltean',
    'Crișan',
    'Muntean',
    'Szabó',
    'Toma',
    'Bălan',
    'Hodiș',
    'Pintea',
    'Fărcaș',
    'Dragomir',
    'Szilágyi',
    'Ardelean',
    'Cozma',
    'Rațiu',
  ];
  const diets: Diet[] = [
    'normal',
    'diabetic',
    'low_salt',
    'soft',
    'normal',
    'vegetarian',
    'normal',
    'pureed',
  ];
  const allergies = [null, 'gluten', null, null, 'lactoză', null, 'ouă', null];
  for (let i = 0; i < 19; i++) {
    const resident = i >= 14;
    const from = time(10, 30) + (i % 4) * 30;
    await add(
      person(firsts[i]!, lasts[i]!, {
        birthDate: `${1932 + ((i * 3) % 18)}-${String((i % 12) + 1).padStart(2, '0')}-${String(((i * 7) % 27) + 1).padStart(2, '0')}`,
        kind: resident ? 'resident' : 'delivery',
        address: resident
          ? null
          : `${streets[i % streets.length]} ${((i * 5) % 60) + 2}, Cluj-Napoca`,
        phone: resident
          ? null
          : `07${(40 + i) % 90} ${String(100 + i * 37).slice(0, 3)} ${String(400 + i * 53).slice(0, 3)}`,
        diet: diets[i % diets.length]!,
        allergies: allergies[i % allergies.length] ?? null,
        // Some on weekdays only, one paused.
        deliveryDays: resident ? [] : i % 3 === 0 ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7],
        windowFromMin: resident ? null : from,
        windowToMin: resident ? null : from + 120,
        status: i === 9 ? 'paused' : 'active',
      }),
    );
  }

  await addIncident(db, orgId, ion, me, {
    occurredAt: new Date(Date.now() - 2 * 86_400_000),
    note: 'Nu a răspuns la ușă; vecina a preluat pachetul.',
  });

  // Meals: the residents' meal times and five weeks of menus (more than a month).
  const breakfast = await saveMealTime(db, orgId, me, {
    name: 'Mic dejun',
    startsMin: time(8),
    endsMin: time(8, 45),
  });
  const lunch = await saveMealTime(db, orgId, me, {
    name: 'Prânz',
    startsMin: time(12, 30),
    endsMin: time(13, 15),
  });
  const dinner = await saveMealTime(db, orgId, me, {
    name: 'Cină',
    startsMin: time(18),
    endsMin: time(18, 45),
  });
  const soups = [
    'Ciorbă de legume',
    'Ciorbă de văcuță',
    'Supă de găluște',
    'Ciorbă de cartofi',
    'Supă de pui cu tăiței',
    'Ciorbă de fasole',
    'Supă cremă de dovleac',
    'Ciorbă de perișoare',
    'Supă de roșii',
    'Borș de legume',
  ];
  const mains = [
    'Pui cu orez',
    'Iahnie de fasole cu cârnați',
    'Chiftele cu piure',
    'Pilaf cu legume',
    'Tocăniță de cartofi',
    'Pește la cuptor cu piure',
    'Musaca',
    'Sarmale cu mămăligă',
    'Paste cu sos de roșii',
    'Friptură de porc cu varză',
  ];
  const start = mondayOf(today);
  for (let i = 0; i < 35; i++) {
    const day = addDays(start, i);
    const d = i % soups.length;
    const m = (i * 3) % mains.length;
    await saveMenu(db, orgId, me, {
      day,
      meal: 0,
      dishes: `${soups[d]}\n${mains[m]}\nCompot de mere`,
      variants: {
        diabetic: `${soups[d]}\n${mains[m]} (fără zahăr)\nMăr copt fără zahăr`,
        soft: `${soups[d]}\nPiure de cartofi cu perișoare fierte\nBudincă`,
        pureed: `Supă cremă\nPiure de legume cu carne\nPiure de fructe`,
        vegetarian: `${soups[d]}\nTocăniță de legume\nCompot de mere`,
      },
    });
    await saveMenu(db, orgId, me, {
      day,
      meal: breakfast,
      dishes: 'Ceai\nPâine cu unt și gem\nOu fiert',
      variants: {},
    });
    await saveMenu(db, orgId, me, {
      day,
      meal: lunch,
      dishes: `${soups[d]}\n${mains[m]}`,
      variants: { pureed: 'Supă cremă\nPiure de legume cu carne' },
    });
    await saveMenu(db, orgId, me, {
      day,
      meal: dinner,
      dishes: 'Iaurt\nBrânză cu roșii și pâine',
      variants: {},
    });
  }

  // Drivers: one linked to the admin's own account (the driver's phone view and the app),
  // with a licence that expires within three months; three more drivers (a valid licence, none,
  // one inactive); this week's routes from today, one stop delivered.
  const drivers = {
    weekdays: [1, 2, 3, 4, 5, 6, 7],
    shiftFromMin: time(10, 30),
    shiftToMin: time(14),
    active: true,
  };
  const andrei = await saveDriver(db, orgId, me, {
    name: user.displayName,
    phone: '0744 555 666',
    userId: null,
    ...drivers,
  });
  const mihai = await saveDriver(db, orgId, me, {
    name: 'Mihai Rusu',
    phone: '0755 111 222',
    userId: null,
    ...drivers,
  });
  const daniela = await saveDriver(db, orgId, me, {
    name: 'Daniela Pop',
    phone: '0766 333 444',
    userId: null,
    ...drivers,
    weekdays: [1, 2, 3, 4, 5],
  });
  await saveDriver(db, orgId, me, {
    name: 'Sorin Câmpean',
    phone: '0733 999 000',
    userId: null,
    ...drivers,
    active: false,
  });
  await saveLicence(
    db,
    orgId,
    mihai,
    me,
    today,
    { mime: 'image/png', data: PIXEL, thumb: null },
    { expiresOn: addDays(today, 700), number: 'B7654321', nameChecked: true },
  );
  await db.execute('UPDATE canteen_drivers SET user_id = ? WHERE id = ?', [me, andrei]);
  await saveLicence(
    db,
    orgId,
    andrei,
    me,
    today,
    { mime: 'image/png', data: PIXEL, thumb: null },
    { expiresOn: addDays(today, 40), number: 'B1234567', nameChecked: true },
  );
  for (let d = 0; d < 7; d++) {
    const day = addDays(today, d);
    const weekday = ((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
    // Who gets a delivery that day: active, at home, and it is one of their days.
    const due = (
      await db.query<{ id: number }>(
        `SELECT p.id FROM canteen_people p
           JOIN canteen_delivery_days w ON w.person_id = p.id AND w.weekday = ?
          WHERE p.org_id = ? AND p.kind = 'delivery' AND p.status = 'active' ORDER BY p.id`,
        [weekday, orgId],
      )
    ).map((r) => Number(r.id));
    const team = weekday >= 6 ? [andrei, mihai] : [andrei, mihai, daniela];
    const size = Math.ceil(due.length / team.length);
    for (let k = 0; k < team.length; k++) {
      const stops = due.slice(k * size, (k + 1) * size);
      if (stops.length) await setRoute(db, orgId, me, day, team[k]!, stops);
    }
  }
  await db.execute(
    `UPDATE canteen_route_stops SET delivered_at = UTC_TIMESTAMP(), delivery_note = ?
      WHERE org_id = ? AND day = ? AND person_id = ?`,
    ['Predat personal, totul în regulă.', orgId, today, maria],
  );

  // The medical file is the medical staff's alone: written in that role, then back.
  await setOwnRole(db, orgId, me, 'medical');
  try {
    await saveProfile(db, orgId, maria, me, {
      conditions: 'Diabet tip 2, hipertensiune',
      allergies: null,
      familyDoctor: 'Dr. Ana Ilieș, 0264 400 500',
      bloodType: 'A+',
      notes: 'Glicemia se măsoară dimineața.',
    });
    await saveMedication(db, orgId, maria, me, {
      name: 'Metformin',
      dose: '500 mg',
      notes: 'După masă',
      times: [time(8, 30), time(19)],
      startsOn: addDays(today, -60),
      endsOn: null,
    });
    await saveMedication(db, orgId, ileana, me, {
      name: 'Paracetamol',
      dose: '500 mg',
      notes: 'La nevoie, maxim 3 pe zi',
      times: [time(9), time(15), time(21)],
      startsOn: addDays(today, -3),
      endsOn: addDays(today, 4),
    });
    await addMedNote(db, orgId, ileana, me, {
      occurredAt: new Date(Date.now() - 86_400_000),
      note: 'Febră ușoară seara (37,8 °C); se urmărește.',
    });
    await saveStay(db, orgId, vasile, me, {
      leftOn: addDays(today, -2),
      returnedOn: null,
      hospital: 'Spitalul Clinic Județean Cluj',
      cause: 'Căzătură, suspiciune de fractură de șold',
      verdict: null,
      recommendations: null,
      recommendationsActive: false,
    });
  } finally {
    await setOwnRole(db, orgId, me, 'organiser');
  }
  return orgId;
}

/** Whether the visitor made this demo organisation (only they may switch their role in it). */
async function ownDemo(db: Db, orgId: number, userId: number): Promise<boolean> {
  const [row] = await db.query<{ n: number }>(
    'SELECT COUNT(*) AS n FROM canteen_orgs WHERE id = ? AND is_demo = 1 AND created_by = ?',
    [orgId, userId],
  );
  return Number(row?.n ?? 0) > 0;
}

async function setOwnRole(db: Db, orgId: number, userId: number, role: Role) {
  await db.execute('UPDATE canteen_staff SET role = ? WHERE org_id = ? AND user_id = ?', [
    role,
    orgId,
    userId,
  ]);
}

/** "View as": the demo's maker takes another role in it (any role, also the last organiser). */
export async function switchDemoRole(db: Db, orgId: number, userId: number, role: unknown) {
  await requireCan(db, orgId, userId, 'org.view');
  if (!isRole(role)) throw new HttpError(400, 'invalidRequest');
  if (!(await ownDemo(db, orgId, userId))) throw new HttpError(403, 'notAllowed');
  await setOwnRole(db, orgId, userId, role);
}
