import { describe, expect, it } from 'vitest';
import { paymentEmail } from './payment-email';

const email = {
  billId: 42,
  userId: 7,
  utilityName: 'Flat electricity',
  category: 'electricity',
  currency: 'RON',
  unit: 'kWh',
  period: '2026-09',
  total: 254.63,
  billConsumption: 245,
  unitPrice: 0.8734,
  consumption: 110,
  share: 110.5,
  carry: 10,
  due: 100.5,
  paid: 120,
  difference: 19.5,
  method: 'cash' as const,
  hasPdf: true,
};

describe('paymentEmail', () => {
  it('shows the bill, the person’s part and a link to the bill in their language', () => {
    const en = paymentEmail(email, 'en', 'https://utilities.devquake.com');
    expect(en.subject).toContain('Flat electricity');
    expect(en.button?.url).toBe('https://utilities.devquake.com/bills/42');
    const labels = en.rows?.map(([label]) => label);
    expect(labels).toEqual([
      'Bill',
      'Bill total',
      'Consumption on the bill',
      'Unit price',
      'Your consumption',
      'Your share',
      'From earlier bills',
      'To pay',
      'Paid',
    ]);
    expect(en.paragraphs.join(' ')).toContain('more than your part');
    expect(en.paragraphs.join(' ')).toContain('PDF');

    const ro = paymentEmail(email, 'ro', 'https://utilities.devquake.com');
    expect(ro.button?.url).toBe('https://utilities.devquake.com/ro/bills/42');
    expect(ro.heading).toBe('Plata ta este confirmată');
  });

  it('says when the part is paid in full, without optional rows', () => {
    const e = paymentEmail(
      {
        ...email,
        difference: 0,
        carry: 0,
        billConsumption: null,
        unitPrice: null,
        consumption: null,
        hasPdf: false,
      },
      'de',
      'https://x',
    );
    expect(e.paragraphs.join(' ')).toContain('vollständig bezahlt');
    expect(e.rows?.map(([l]) => l)).not.toContain('Dein Verbrauch');
  });
});
