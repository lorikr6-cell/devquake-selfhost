import { api } from '../lib/api';
import { HttpError } from '../lib/http';
import { assessmentAnswers } from '../lib/social';
import { personSocial, saveAssessment } from '../lib/social-data';
import { id, readBody } from '../lib/validate';

// GET /api/orgs/:id/people/:personId/social: the person's questionnaires and visits.
export const GET = api(async ({ params, db, user }) =>
  personSocial(db, id(params.id), user.id, id(params.personId)),
);

// POST /api/orgs/:id/people/:personId/social { answers, visitId? }: a filled questionnaire.
export const POST = api(async ({ request, params, db, user }) => {
  const body = await readBody(request);
  const answers = assessmentAnswers(body.answers);
  if (!answers) throw new HttpError(400, 'assessmentEmpty');
  const visitId = body.visitId === undefined || body.visitId === null ? null : id(body.visitId);
  return {
    id: await saveAssessment(db, id(params.id), user.id, id(params.personId), answers, visitId),
  };
});
