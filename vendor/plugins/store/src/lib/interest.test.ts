import { describe, expect, it } from 'vitest';
import { cleanChoices, interestOptions, interestReport, type InterestVote } from './interest';

const vote = (min: number | null, max: number | null, choices = {}): InterestVote => ({
  interested: true,
  minCents: min,
  maxCents: max,
  choices,
});

describe('interestOptions and cleanChoices', () => {
  const fields = [
    { id: 1, label: 'Colour', kind: 'multiselect' },
    { id: 2, label: 'Print', kind: 'text' },
    { id: 3, label: 'Size', kind: 'multiselect' },
  ];
  const options = interestOptions(fields, { 1: 'Black\nWhite', 2: 'Logo', 3: 'One size' });

  it('offers multi-choice fields with at least two values', () => {
    expect(options).toEqual([{ label: 'Colour', values: ['Black', 'White'] }]);
  });

  it('keeps only offered choices', () => {
    expect(cleanChoices({ Colour: 'Black', Size: 'XL', Other: 'x' }, options)).toEqual({
      Colour: 'Black',
    });
    expect(cleanChoices({ Colour: 'Pink' }, options)).toEqual({});
    expect(cleanChoices('nope', options)).toEqual({});
  });
});

describe('interestReport', () => {
  it('is too early with few votes', () => {
    const r = interestReport([vote(1000, 2000)], { unitCents: 500, setupCents: 0 }, 0);
    expect(r.verdict).toBe('early');
    expect(r.interested).toBe(1);
  });

  it('suggests the price that earns most from the stated limits', () => {
    // Limits 20, 30, 30, 30 and 40: 30 × 4 = 120 beats 20 × 5 and 40 × 1.
    const votes = [
      vote(1500, 2000),
      vote(null, 3000),
      vote(2000, 3000),
      vote(3000, null),
      vote(2500, 4000),
    ];
    const r = interestReport(votes, { unitCents: null, setupCents: null }, 0);
    expect(r.suggestedCents).toBe(3000);
    expect(r.units).toBe(4);
    expect(r.revenueCents).toBe(12000);
    expect(r.medianMaxCents).toBe(3000);
    expect(r.medianMinCents).toBe(2500);
    expect(r.verdict).toBe('early');
  });

  it('counts interested voters without a price in the same share', () => {
    const votes = [vote(2000, 2000), vote(1000, 1000), vote(null, null), vote(null, null)];
    const r = interestReport(votes, { unitCents: null, setupCents: null }, 0);
    // 20 × 1 = 20 vs 10 × 2 = 20: the first (lower) price wins ties; 2 of 2 priced buy at 10.
    expect(r.suggestedCents).toBe(1000);
    expect(r.units).toBe(4);
  });

  it('works out profit, return and break-even with costs and VAT', () => {
    const votes = Array.from({ length: 10 }, () => vote(null, 2380));
    const r = interestReport(votes, { unitCents: 1000, setupCents: 5000 }, 19);
    // 23.80 gross is 20.00 net; 10 pieces: 200.00 revenue, 150.00 invested.
    expect(r.revenueCents).toBe(20000);
    expect(r.investmentCents).toBe(15000);
    expect(r.profitCents).toBe(5000);
    expect(r.roiPercent).toBe(33.3);
    expect(r.breakEvenUnits).toBe(5);
    expect(r.verdict).toBe('good');
  });

  it('flags a loss and pieces that never pay off', () => {
    const votes = Array.from({ length: 10 }, () => vote(null, 800));
    const r = interestReport(votes, { unitCents: 1000, setupCents: 0 }, 0);
    expect(r.verdict).toBe('loss');
    expect(r.breakEvenUnits).toBeNull();
  });

  it('asks for costs before judging', () => {
    const votes = Array.from({ length: 12 }, () => vote(1000, 1500));
    expect(interestReport(votes, { unitCents: null, setupCents: null }, 0).verdict).toBe('noCosts');
  });

  it('counts not-interested votes and the preferred options', () => {
    const votes: InterestVote[] = [
      vote(null, null, { Colour: 'Black', Size: 'L' }),
      vote(null, null, { Colour: 'Black' }),
      vote(null, null, { Colour: 'Red' }),
      { interested: false, minCents: null, maxCents: null, choices: { Colour: 'Red' } },
    ];
    const r = interestReport(votes, { unitCents: null, setupCents: null }, 0);
    expect(r.notInterested).toBe(1);
    expect(r.suggestedCents).toBeNull();
    expect(r.preferences).toEqual([
      {
        label: 'Colour',
        counts: [
          { value: 'Black', count: 2 },
          { value: 'Red', count: 1 },
        ],
      },
      { label: 'Size', counts: [{ value: 'L', count: 1 }] },
    ]);
  });
});
