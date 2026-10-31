import { describe, expect, it } from 'vitest';
import { ACTIVITY_NAMES, AREAS, activityOf, areaOf, showsPerson } from './activity';

describe('activity of an API call', () => {
  it('names a change from its route', () => {
    expect(activityOf('POST', '/api/orgs/7/visits', { id: '7' })).toBe('social.visitPlan');
    expect(
      activityOf('PUT', '/api/orgs/7/routes/2026-10-23/stops/41', {
        id: '7',
        day: '2026-10-23',
        personId: '41',
      }),
    ).toBe('routes.delivery');
    expect(activityOf('PATCH', '/orgs/7/people/41', { id: '7', personId: '41' })).toBe(
      'people.edit',
    );
  });

  it('keeps the word of /areas/:action', () => {
    expect(activityOf('POST', '/api/orgs/7/areas/build', { id: '7', action: 'build' })).toBe(
      'routes.plan',
    );
    expect(activityOf('POST', '/api/orgs/7/areas/propose', { id: '7', action: 'propose' })).toBe(
      null,
    );
  });

  it('works when an id equals the organisation id', () => {
    expect(activityOf('PATCH', '/api/orgs/7/visits/7', { id: '7', visitId: '7' })).toBe(
      'social.visitUpdate',
    );
  });

  it('ignores reads, calls outside an organisation and unknown routes', () => {
    expect(activityOf('GET', '/api/orgs/7/social', { id: '7' })).toBe(null);
    expect(activityOf('POST', '/api/demo', {})).toBe(null);
    expect(activityOf('PUT', '/api/orgs/7/demo-role', { id: '7' })).toBe(null);
  });

  it('puts every activity in a known area and hides people in the medical one', () => {
    for (const a of ACTIVITY_NAMES) expect(AREAS).toContain(areaOf(a));
    expect(showsPerson('medical.dose')).toBe(false);
    expect(showsPerson('social.assessment')).toBe(true);
  });
});
