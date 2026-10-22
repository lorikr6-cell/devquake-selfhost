import { isIsoDate, type IsoDate } from './dates';
import { HttpError } from './http';
import { parseTimes } from './medical';
import type { MedicalProfile, MedicationInput, StayInput } from './medical-data';
import { longOptionalText, optionalText, requiredText, type Body } from './validate';

// Checks for the medical file's request bodies (errors are keys of errors.* in the catalogs).

const TEXT = 2000;

function optionalDayIn(value: unknown, field: string): IsoDate | null {
  if (value === undefined || value === null || value === '') return null;
  // Medical history may reach back before 2000.
  if (!isIsoDate(value, 1900)) throw new HttpError(400, 'date', { field });
  return value;
}

function requiredDayIn(value: unknown, field: string): IsoDate {
  const day = optionalDayIn(value, field);
  if (!day) throw new HttpError(400, 'required', { field });
  return day;
}

export function profileInput(body: Body): MedicalProfile {
  return {
    conditions: longOptionalText(body.conditions, 'conditions', TEXT),
    allergies: longOptionalText(body.allergies, 'allergies', TEXT),
    familyDoctor: optionalText(body.familyDoctor, 'familyDoctor', 200),
    bloodType: optionalText(body.bloodType, 'bloodType', 10),
    notes: longOptionalText(body.notes, 'notes', TEXT),
  };
}

export function medicationInput(body: Body): MedicationInput {
  const times = parseTimes(body.times);
  if (!times) throw new HttpError(400, 'medTimes');
  const startsOn = requiredDayIn(body.startsOn, 'startsOn');
  const endsOn = optionalDayIn(body.endsOn, 'endsOn');
  if (endsOn && endsOn < startsOn) throw new HttpError(400, 'endBeforeStart');
  return {
    name: requiredText(body.name, 'medName', 200),
    dose: requiredText(body.dose, 'dose', 200),
    notes: longOptionalText(body.notes, 'notes', TEXT),
    times,
    startsOn,
    endsOn,
  };
}

export function stayInput(body: Body): StayInput {
  const leftOn = requiredDayIn(body.leftOn, 'leftOn');
  const returnedOn = optionalDayIn(body.returnedOn, 'returnedOn');
  if (returnedOn && returnedOn < leftOn) throw new HttpError(400, 'endBeforeStart');
  return {
    leftOn,
    returnedOn,
    hospital: optionalText(body.hospital, 'hospital', 200),
    cause: (longOptionalText(body.cause, 'cause', TEXT) ??
      requiredText(body.cause, 'cause', TEXT)) as string,
    verdict: longOptionalText(body.verdict, 'verdict', TEXT),
    recommendations: longOptionalText(body.recommendations, 'recommendations', TEXT),
    recommendationsActive: body.recommendationsActive !== false,
  };
}
