import type { PersonKind, PersonStatus } from './model';

// Social work (migration 0019): who takes a place, whether there is room, visits, and the social
// assessment questionnaire. Pure: tested in social.test.ts.

/** Active and paused people take a place; waiting and ended ones do not. */
export const takesPlace = (status: PersonStatus) => status === 'active' || status === 'paused';

/** Places left of a kind: null when the organisation set no limit. */
export function placesLeft(limit: number | null, used: number): number | null {
  return limit === null ? null : Math.max(0, limit - used);
}

/** Whether one more person of a kind fits. */
export const hasPlace = (limit: number | null, used: number) => limit === null || used < limit;

export const VISIT_KINDS = ['assessment', 'home_visit', 'follow_up', 'other'] as const;
export type VisitKind = (typeof VISIT_KINDS)[number];
export const isVisitKind = (v: unknown): v is VisitKind => VISIT_KINDS.includes(v as VisitKind);

export const VISIT_STATUSES = ['planned', 'done', 'cancelled'] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

// ---------------------------------------------------------------------------------------------
// The social assessment questionnaire. Choices are codes (their labels are in the catalog,
// assessment.<question>.<code>); free texts are short. Stored encrypted as JSON.

export const QUESTIONS = [
  { id: 'livesWith', type: 'choice', options: ['alone', 'partner', 'family', 'carer', 'other'] },
  { id: 'housing', type: 'choice', options: ['own', 'rented', 'social', 'family', 'none'] },
  { id: 'income', type: 'choice', options: ['pension', 'benefits', 'work', 'family', 'none'] },
  { id: 'mobility', type: 'choice', options: ['independent', 'aid', 'house', 'bedridden'] },
  { id: 'cooking', type: 'choice', options: ['yes', 'partly', 'no'] },
  { id: 'support', type: 'choice', options: ['daily', 'weekly', 'rarely', 'none'] },
  { id: 'health', type: 'text', max: 600 },
  { id: 'needs', type: 'choice', options: ['delivery', 'resident', 'both', 'other'] },
  { id: 'priority', type: 'choice', options: ['low', 'medium', 'high', 'urgent'] },
  { id: 'notes', type: 'text', max: 2000 },
] as const;

export type QuestionId = (typeof QUESTIONS)[number]['id'];
export type Answers = Partial<Record<QuestionId, string>>;

/**
 * The answers sent from the form, checked: a known code for each choice, trimmed short texts.
 * Unanswered questions are left out; null when nothing at all was answered.
 */
export function assessmentAnswers(body: unknown): Answers | null {
  const raw = (body ?? {}) as Record<string, unknown>;
  const out: Answers = {};
  for (const q of QUESTIONS) {
    const v = raw[q.id];
    if (typeof v !== 'string' || !v.trim()) continue;
    if (q.type === 'choice') {
      if (!(q.options as readonly string[]).includes(v)) return null;
      out[q.id] = v;
    } else {
      out[q.id] = v.trim().slice(0, q.max);
    }
  }
  return Object.keys(out).length ? out : null;
}
