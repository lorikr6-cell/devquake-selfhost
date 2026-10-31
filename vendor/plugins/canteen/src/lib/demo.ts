import type { PluginDatabase, PluginUser } from '@devquake/plugin-sdk';
import { cnpChecksum } from './cnp';
import {
  addIncident,
  createOrg,
  createPerson,
  requireCan,
  saveDocument,
  saveIdentity,
} from './data';
import { demoIdCard, demoPdf, demoPortrait } from './demo-files';
import { addDays, mondayOf, type IsoDate } from './dates';
import { HttpError } from './http';
import { saveLicence } from './licence-data';
import { saveMealTime, saveMenu } from './meals-data';
import { addMedNote, saveMedication, saveProfile, saveStay } from './medical-data';
import { addPaper } from './med-papers';
import type { Diet } from './model';
import { saveDescription, saveHeaderLook } from './org-page';
import { isRole, type Role } from './roles';
import { buildRoutes, proposeAreas, saveAreas } from './areas-data';
import { saveDriver, setKitchenAddress, setMinutesPerStop } from './routes-data';
import {
  addApplicant,
  assignSocialWorker,
  planVisit,
  saveAssessment,
  saveLimits,
  updateVisit,
} from './social-data';
import type { PersonInput } from './validate';

// Demo organisations (migration 0013): anyone with the app makes one (just one each; asking
// again opens it) filled with sample people,
// personal numbers, menus, drivers, today's routes and medical files, through the app's own
// functions (so everything is stored, encrypted and logged as usual), and may then view it in
// any role. Sample data only: invented names, addresses and numbers.

type Db = Omit<PluginDatabase, 'transaction'>;

/**
 * Account numbers of the demo's invented staff: far above any real DevQuake account, so they
 * never meet one; they are deleted with the demo organisation.
 */
const DEMO_STAFF_IDS = 4_290_000_000;

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
  // A header in the organisation's own colours, as on every printout.
  await saveHeaderLook(db, orgId, me, {
    font: 'rounded',
    bg: '#0f5e4b',
    text: 'auto',
    align: 'left',
  });
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
  // Map positions around the kitchen (invented, so the map, the areas and the routes work
  // without a map key), the areas proposed from them, and the routes of the days around today
  // built from the areas: past days delivered with the drivers' comments, today half done.
  const KITCHEN = { lat: 46.7712, lng: 23.6236 };
  await db.execute(
    `UPDATE canteen_orgs SET kitchen_lat = ?, kitchen_lng = ?, kitchen_geo_address = kitchen_address
      WHERE id = ?`,
    [KITCHEN.lat, KITCHEN.lng, orgId],
  );
  const homes = await db.query<{ id: number }>(
    "SELECT id FROM canteen_people WHERE org_id = ? AND kind = 'delivery' ORDER BY id",
    [orgId],
  );
  for (const [i, h] of homes.entries()) {
    // A ring of streets 1 to 4 km out, spread all around the kitchen.
    const turn = (i * 137.5 * Math.PI) / 180;
    const dist = 0.01 + (i % 5) * 0.006;
    await db.execute(
      `UPDATE canteen_people SET geo_lat = ?, geo_lng = ?, geo_address = address WHERE id = ?`,
      [
        KITCHEN.lat + dist * Math.sin(turn),
        KITCHEN.lng + dist * 1.45 * Math.cos(turn),
        Number(h.id),
      ],
    );
  }
  const proposal = await proposeAreas(db, orgId, me);
  await saveAreas(db, orgId, me, proposal);
  await buildRoutes(db, orgId, me, addDays(today, -3), addDays(today, 6));
  const notes = [
    'Predat personal, totul în regulă.',
    'Lăsat la vecina de la etajul 2, cum s-a cerut.',
    'A cerut încă o porție de supă pentru mâine.',
    null,
    null,
  ];
  for (let d = -3; d < 0; d++) {
    const day = addDays(today, d);
    const stops = await db.query<{ person_id: number }>(
      'SELECT person_id FROM canteen_route_stops WHERE org_id = ? AND day = ? ORDER BY driver_id, position',
      [orgId, day],
    );
    for (const [i, stop] of stops.entries()) {
      await db.execute(
        `UPDATE canteen_route_stops SET delivered_at = ? , delivery_note = ?
          WHERE org_id = ? AND day = ? AND person_id = ?`,
        [
          `${day} ${String(10 + Math.floor(i / 4)).padStart(2, '0')}:${String((i * 13) % 60).padStart(2, '0')}:00`,
          notes[i % notes.length],
          orgId,
          day,
          Number(stop.person_id),
        ],
      );
    }
  }
  // Today: the demo driver's first two stops are already handed over.
  const firstStops = await db.query<{ person_id: number }>(
    'SELECT person_id FROM canteen_route_stops WHERE org_id = ? AND day = ? AND driver_id = ? ORDER BY position LIMIT 2',
    [orgId, today, andrei],
  );
  for (const [i, stop] of firstStops.entries()) {
    await db.execute(
      `UPDATE canteen_route_stops SET delivered_at = UTC_TIMESTAMP(), delivery_note = ?
        WHERE org_id = ? AND day = ? AND person_id = ?`,
      [notes[i], orgId, today, Number(stop.person_id)],
    );
  }

  // The rest of the team, to see each role's view of the staff page (invented: they are not
  // DevQuake accounts, and go with the demo).
  for (const [k, [name, role]] of (
    [
      ['Ioana Rus', 'coordinator'],
      ['Elena Kovács', 'kitchen'],
      ['Dr. Radu Pop', 'medical'],
      ['Mihai Rusu', 'driver'],
    ] as const
  ).entries()) {
    await db.execute(
      `INSERT INTO canteen_staff (org_id, user_id, display_name, role, roles) VALUES (?, ?, ?, ?, ?)`,
      [orgId, DEMO_STAFF_IDS + k, name, role, role],
    );
  }

  // Social work: the maker and an invented colleague share it; the residents' places are full,
  // so applicants wait; visits planned, one done, questionnaires filled in.
  const colleague = DEMO_STAFF_IDS + 4;
  await db.execute(
    `INSERT INTO canteen_staff (org_id, user_id, display_name, role, roles, social_worker)
     VALUES (?, ?, 'Andreea Matei', 'coordinator', 'coordinator', 1)`,
    [orgId, colleague],
  );
  await db.execute('UPDATE canteen_staff SET social_worker = 1 WHERE org_id = ? AND user_id = ?', [
    orgId,
    me,
  ]);
  const residents = people.filter((p) => p.kind === 'resident').length;
  await saveLimits(db, orgId, me, {
    maxResidents: residents,
    maxDelivery: people.length - residents + 3,
  });
  const applicant = async (p: PersonInput, waitingDays: number, worker: number) => {
    const id = await addApplicant(db, orgId, me, p);
    await db.execute('UPDATE canteen_people SET waiting_since = ? WHERE id = ?', [
      addDays(today, -waitingDays),
      id,
    ]);
    await assignSocialWorker(db, orgId, me, id, worker);
    return id;
  };
  const elisabeta = await applicant(
    person('Elisabeta', 'Crișan', {
      birthDate: '1939-04-12',
      kind: 'resident',
      address: 'Str. Fabricii 14, Cluj-Napoca',
      phone: '0744 555 101',
    }),
    21,
    me,
  );
  const gavril = await applicant(
    person('Gavril', 'Morar', {
      birthDate: '1948-11-30',
      address: 'Str. Oașului 52, Cluj-Napoca',
      phone: '0745 555 102',
      diet: 'diabetic',
    }),
    9,
    colleague,
  );
  await applicant(
    person('Rozalia', 'Szabó', {
      birthDate: '1944-06-02',
      address: 'Str. Bucium 7, Cluj-Napoca',
    }),
    2,
    me,
  );
  const at = (day: IsoDate, h: number) => new Date(`${day}T${String(h).padStart(2, '0')}:00:00Z`);
  const firstVisit = await planVisit(db, orgId, me, {
    personId: elisabeta,
    plannedAt: at(addDays(today, -14), 9),
    kind: 'assessment',
    assignedTo: me,
  });
  await updateVisit(db, orgId, me, firstVisit, {
    status: 'done',
    notes: 'Locuiește singură la etajul 3 fără lift; fiica vine o dată pe săptămână.',
  });
  await saveAssessment(
    db,
    orgId,
    me,
    elisabeta,
    {
      livesWith: 'alone',
      housing: 'own',
      income: 'pension',
      mobility: 'aid',
      cooking: 'no',
      support: 'weekly',
      health: 'Artroză, vede slab.',
      needs: 'resident',
      priority: 'high',
    },
    firstVisit,
  );
  await planVisit(db, orgId, me, {
    personId: gavril,
    plannedAt: at(addDays(today, 1), 8),
    kind: 'assessment',
    assignedTo: colleague,
  });
  await planVisit(db, orgId, me, {
    personId: maria,
    plannedAt: at(addDays(today, 3), 10),
    kind: 'follow_up',
    assignedTo: me,
  });
  await saveAssessment(
    db,
    orgId,
    me,
    maria,
    {
      livesWith: 'partner',
      housing: 'own',
      income: 'pension',
      mobility: 'independent',
      cooking: 'partly',
      support: 'daily',
      needs: 'delivery',
      priority: 'medium',
    },
    null,
  );

  // A fortnight of activity for the reports: each role's usual work (invented, like the staff).
  const usual: [number, string[]][] = [
    [me, ['people.edit', 'social.visitPlan', 'social.assessment', 'staff.invite']],
    [DEMO_STAFF_IDS, ['routes.plan', 'people.edit', 'routes.driver']],
    [DEMO_STAFF_IDS + 1, ['meals.menu', 'meals.menu', 'meals.dish']],
    [DEMO_STAFF_IDS + 2, ['medical.dose', 'medical.dose', 'medical.note']],
    [DEMO_STAFF_IDS + 3, ['routes.delivery', 'routes.delivery', 'routes.delivery']],
    [colleague, ['social.visitUpdate', 'social.applicant', 'social.service']],
  ];
  const lines: unknown[] = [];
  for (let day = 13; day >= 0; day--) {
    for (const [who, actions] of usual) {
      actions.forEach((action, k) => {
        if ((day + k) % 3 === 2) return; // not every task every day
        const hour = 7 + ((k * 3 + day) % 9);
        lines.push(
          orgId,
          who,
          action,
          `${addDays(today, -day)} ${String(hour).padStart(2, '0')}:${String((k * 17 + day * 7) % 60).padStart(2, '0')}:00`,
        );
      });
    }
  }
  // sql-safe: marks — only "(?, ?, ?, ?)" groups, one per row.
  const marks = Array(lines.length / 4)
    .fill('(?, ?, ?, ?)')
    .join(', ');
  await db.execute(
    `INSERT INTO canteen_activity (org_id, user_id, action, created_at) VALUES ${marks}`,
    lines,
  );

  // A photo and an ID card (sample pictures), sealed like real ones; skipped without the
  // server's master key (CANTEEN_MASTER_KEY), as uploads are.
  try {
    const portrait = demoPortrait();
    await saveDocument(db, orgId, maria, 'photo', me, {
      mime: 'image/png',
      data: portrait,
      thumb: { mime: 'image/png', data: demoPortrait(64) },
    });
    await saveDocument(db, orgId, maria, 'id_card', me, {
      mime: 'image/png',
      data: demoIdCard(),
      thumb: null,
    });
  } catch (err) {
    if (!(err instanceof HttpError)) throw err;
  }

  // The medical file is the medical staff's alone: written in that role, then back.
  await setOwnRole(db, orgId, me, 'medical');
  try {
    // Medical papers (sample PDFs), as the medical staff upload them.
    try {
      await addPaper(db, orgId, maria, me, {
        title: 'Analize de sânge (exemplu)',
        mime: 'application/pdf',
        data: demoPdf('Analize de sange - exemplu', [
          'Glicemie a jeun: 128 mg/dl',
          'HbA1c: 6,9 %',
          'Document de exemplu pentru organizatia demo.',
        ]),
      });
      await addPaper(db, orgId, vasile, me, {
        title: 'Bilet de externare (exemplu)',
        mime: 'application/pdf',
        data: demoPdf('Bilet de externare - exemplu', [
          'Diagnostic: contuzie sold drept',
          'Recomandari: repaus, control peste 14 zile',
          'Document de exemplu pentru organizatia demo.',
        ]),
      });
    } catch (err) {
      if (!(err instanceof HttpError)) throw err;
    }
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
  await db.execute(
    'UPDATE canteen_staff SET role = ?, roles = ? WHERE org_id = ? AND user_id = ?',
    [role, role, orgId, userId],
  );
}

/** "View as": the demo's maker takes another role in it (any role, also the last organiser). */
export async function switchDemoRole(db: Db, orgId: number, userId: number, role: unknown) {
  await requireCan(db, orgId, userId, 'org.view');
  if (!isRole(role)) throw new HttpError(400, 'invalidRequest');
  if (!(await ownDemo(db, orgId, userId))) throw new HttpError(403, 'notAllowed');
  await setOwnRole(db, orgId, userId, role);
}
