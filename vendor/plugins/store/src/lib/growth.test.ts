import { describe, expect, it } from 'vitest';
import { LOCALES } from '@devquake/ui';
import { TEMPLATE_IDS, TYPE_TEMPLATES, templateType } from '../i18n/type-templates';
import { escapeHtml, newsletterEmail, productGrid, type MailShop } from './emails';
import { fieldValue, formatValue, parseChoices, type FieldDef } from './fields';
import {
  applyVoucher,
  campaignFor,
  isLive,
  normalizeCode,
  voucherProblem,
  windowState,
  type CampaignRule,
  type VoucherRule,
} from './marketing';
import { senderAddress } from './mailer';
import { initialStatus, summarize } from './reviews';
import { can, parseRoles, taskPanels } from './roles';
import { applyRules, publicRules, type PriceRule } from './rules';
import { quote } from './checkout';
import { exportLabels, importLabels } from './store-i18n';
import { clip, isGtin, productChecks, productMeta, storeChecks } from './seo';
import { bucket, change, conversionRate, fillDays, parsePeriod, periodDays } from './stats';
import { PRESETS, contrast, mix, parseTheme, readableOn, themeVars, themeWarnings } from './theme';
import {
  gtagScript,
  needsConsent,
  parseTracking,
  storedTracking,
  verificationCode,
} from './tracking';

const now = new Date('2026-11-27T12:00:00Z');

describe('campaigns and vouchers', () => {
  const window = { active: true, startsAt: '2026-11-27T00:00:00Z', endsAt: '2026-11-30T00:00:00Z' };

  it('runs only switched on and inside its window', () => {
    expect(isLive(window, now)).toBe(true);
    expect(isLive({ ...window, active: false }, now)).toBe(false);
    expect(isLive(window, new Date('2026-11-30T00:00:00Z'))).toBe(false);
    expect(windowState(window, new Date('2026-11-26T00:00:00Z'))).toBe('scheduled');
    expect(windowState(window, new Date('2026-12-01T00:00:00Z'))).toBe('ended');
    expect(windowState({ ...window, active: false }, now)).toBe('off');
  });

  it('picks the live campaign giving a product the most off', () => {
    const base = { ...window, name: 'x', category: null, productIds: [] as number[] };
    const rules: CampaignRule[] = [
      { ...base, id: 1, percentOff: 10, scope: 'all' },
      { ...base, id: 2, percentOff: 25, scope: 'category', category: 'Mugs' },
      { ...base, id: 3, percentOff: 40, scope: 'products', productIds: [7] },
      { ...base, id: 4, percentOff: 60, scope: 'all', active: false },
    ];
    expect(campaignFor({ id: 1, category: null }, rules, now)?.id).toBe(1);
    expect(campaignFor({ id: 1, category: 'Mugs' }, rules, now)?.id).toBe(2);
    expect(campaignFor({ id: 7, category: 'Mugs' }, rules, now)?.id).toBe(3);
    expect(campaignFor({ id: 7, category: null }, [], now)).toBeNull();
  });

  it('checks vouchers and what they take off', () => {
    const v: VoucherRule = {
      ...window,
      id: 1,
      code: 'SAVE10',
      description: null,
      kind: 'percent',
      percentOff: 10,
      amountCents: null,
      minOrderCents: 5000,
      maxUses: 2,
      uses: 1,
      oncePerBuyer: false,
    };
    expect(normalizeCode(' save 10 ')).toBe('SAVE10');
    expect(voucherProblem(null, now)).toBe('unknown');
    expect(voucherProblem(v, now)).toBeNull();
    expect(voucherProblem({ ...v, uses: 2 }, now)).toBe('usedUp');
    expect(voucherProblem(v, new Date('2027-01-01T00:00:00Z'))).toBe('notLive');
    expect(applyVoucher(v, 4999)).toEqual({ ok: false, problem: 'minOrder' });
    expect(applyVoucher(v, 12345)).toEqual({ ok: true, discountCents: 1235, freeShipping: false });
    expect(
      applyVoucher({ ...v, kind: 'amount', amountCents: 9000, minOrderCents: null }, 6000),
    ).toEqual({ ok: true, discountCents: 6000, freeShipping: false });
    expect(applyVoucher({ ...v, kind: 'shipping', minOrderCents: null }, 100)).toEqual({
      ok: true,
      discountCents: 0,
      freeShipping: true,
    });
  });
});

describe('the shop’s design', () => {
  it('accepts only complete themes with known values', () => {
    expect(parseTheme(JSON.stringify(PRESETS.classic))).toEqual(PRESETS.classic);
    expect(parseTheme({ ...PRESETS.classic, accent: 'red' })).toBeNull();
    expect(parseTheme({ ...PRESETS.classic, font: 'comic' })).toBeNull();
    expect(parseTheme({ ...PRESETS.classic, columns: 5 })).toBeNull();
    // A colour is never anything but #rrggbb, so it is safe inside CSS.
    expect(parseTheme({ ...PRESETS.classic, background: '#fff;}body{x' })).toBeNull();
    expect(parseTheme('{nope')).toBeNull();
  });

  it('measures contrast and warns about unreadable colours', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(readableOn('#111827')).toBe('#ffffff');
    expect(readableOn('#f5b700')).toBe('#111111');
    expect(mix('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(themeWarnings({ ...PRESETS.classic!, text: '#eeeeee' })).toContain('textContrast');
    for (const id of Object.keys(PRESETS)) expect(themeWarnings(PRESETS[id]!), id).toEqual([]);
    expect(themeVars(PRESETS.midnight!)['--shop-on-accent']).toBe('#111111');
  });
});

describe('search engines', () => {
  it('cuts snippets at a word and fills in titles', () => {
    expect(clip('Handmade mugs from Cluj, fired twice', 20)).toBe('Handmade mugs from…');
    expect(clip('Short', 20)).toBe('Short');
    expect(
      productMeta(
        { name: 'Mug', summary: 'A mug', description: null, seoTitle: null, seoDescription: null },
        'Ana',
      ),
    ).toEqual({ title: 'Mug · Ana', description: 'A mug' });
  });

  it('scores products by what they lack', () => {
    const good = productChecks(
      {
        name: 'Handmade blue mug, 350 ml',
        summary:
          'A blue stoneware mug thrown by hand in Cluj, fired twice and safe in the dishwasher.',
        description: 'x'.repeat(200),
        seoTitle: null,
        seoDescription: null,
        published: true,
        photos: 4,
        category: 'Mugs',
        brand: 'Ana',
        gtin: '4006381333931',
      },
      'Ana’s Ceramics',
    );
    expect(good).toEqual({ score: 100, issues: [] });
    const bare = productChecks(
      {
        ...{ name: 'Mug', summary: null, description: null, seoTitle: null, seoDescription: null },
        published: false,
        photos: 0,
        category: null,
        brand: null,
        gtin: null,
      },
      'A',
    );
    expect(bare.issues).toContain('noPhoto');
    expect(bare.issues).toContain('draft');
    expect(bare.score).toBeLessThan(50);
    expect(
      storeChecks({
        published: true,
        description: 'x'.repeat(80),
        hasLogo: true,
        hasBanner: false,
        hasSeller: true,
        publishedProducts: 3,
      }),
    ).toEqual(['noBanner']);
  });

  it('checks barcodes', () => {
    expect(isGtin('4006381333931')).toBe(true);
    expect(isGtin('4006381333932')).toBe(false);
    expect(isGtin('96385074')).toBe(true);
    expect(isGtin('12345')).toBe(false);
  });
});

describe('product fields', () => {
  const field = (kind: FieldDef['kind'], extra: Partial<FieldDef> = {}): FieldDef => ({
    id: 1,
    label: 'X',
    kind,
    unit: null,
    choices: ['S', 'M', 'L'],
    required: false,
    inCompare: true,
    ...extra,
  });

  it('checks and stores values by kind', () => {
    expect(fieldValue(field('number'), '6,1')).toEqual({ ok: true, value: '6.1' });
    expect(fieldValue(field('number'), 'six')).toEqual({ ok: false, problem: 'number' });
    expect(fieldValue(field('select'), 'M')).toEqual({ ok: true, value: 'M' });
    expect(fieldValue(field('select'), 'XL')).toEqual({ ok: false, problem: 'choice' });
    expect(fieldValue(field('multiselect'), ['L', 'S'])).toEqual({ ok: true, value: 'S\nL' });
    expect(fieldValue(field('boolean'), true)).toEqual({ ok: true, value: '1' });
    expect(fieldValue(field('color'), '#ABCDEF')).toEqual({ ok: true, value: '#abcdef' });
    expect(fieldValue(field('date'), '2026-13-45')).toEqual({ ok: false, problem: 'date' });
    expect(fieldValue(field('url'), 'javascript:alert(1)')).toEqual({ ok: false, problem: 'url' });
    expect(fieldValue(field('text', { required: true }), '  ')).toEqual({
      ok: false,
      problem: 'required',
    });
    expect(fieldValue(field('text'), '')).toEqual({ ok: true, value: '' });
  });

  it('reads values in the page language', () => {
    const words = { yes: 'Ja', no: 'Nein' };
    expect(formatValue({ kind: 'number', unit: 'GB' }, '1024', words, 'de-DE')).toBe('1.024 GB');
    expect(formatValue({ kind: 'boolean', unit: null }, '1', words, 'de-DE')).toBe('Ja');
    expect(formatValue({ kind: 'multiselect', unit: null }, 'S\nL', words, 'de-DE')).toBe('S, L');
    expect(parseChoices(' a \n\nb\na ')).toEqual(['a', 'b']);
  });

  it('has every template in every language, with fields that work', () => {
    for (const id of TEMPLATE_IDS) {
      for (const locale of LOCALES) {
        const t = templateType(id, locale);
        expect(t.name, `${id} ${locale}`).toBeTruthy();
        for (const f of t.fields) {
          expect(f.label, `${id} ${locale}`).toBeTruthy();
          if (f.kind === 'select' || f.kind === 'multiselect')
            expect(f.choices.length, `${id} ${f.label}`).toBeGreaterThan(0);
        }
        expect(new Set(t.fields.map((f) => f.label)).size).toBe(t.fields.length);
      }
      expect(TYPE_TEMPLATES[id].fields.length).toBeGreaterThan(3);
    }
  });
});

describe('reviews, roles and statistics', () => {
  it('publishes only verified reviews at once, and only when the owner wants', () => {
    expect(initialStatus('verified', true)).toBe('published');
    expect(initialStatus('verified', false)).toBe('pending');
    expect(initialStatus('moderated', true)).toBe('pending');
    expect(summarize([5, 4, 4, 9, 1])).toEqual({ count: 4, average: 3.5, stars: [1, 0, 0, 2, 1] });
  });

  it('gives each role its areas only', () => {
    expect(can('owner', 'tracking')).toBe(true);
    expect(can('manager', 'tracking')).toBe(false);
    expect(can('manager', 'payments')).toBe(false);
    expect(can('manager', 'stats')).toBe(true);
    expect(can('catalog', 'products')).toBe(true);
    expect(can('catalog', 'orders')).toBe(false);
    expect(can('support', 'messages')).toBe(true);
    expect(can('shipping', 'messages')).toBe(false);
    expect(can('maintenance', 'settings')).toBe(true);
    expect(can('marketing', 'payments')).toBe(false);
  });

  it('adds up several roles and shows each its task panels', () => {
    expect(can(['catalog', 'shipping'], 'orders')).toBe(true);
    expect(can(['catalog', 'shipping'], 'marketing')).toBe(false);
    expect(can([], 'overview')).toBe(false);
    expect(parseRoles('shipping,catalog,nonsense')).toEqual(['catalog', 'shipping']);
    expect(taskPanels(['owner'])).toEqual([
      'shipping',
      'support',
      'catalog',
      'marketing',
      'maintenance',
    ]);
    expect(taskPanels(['support', 'shipping'])).toEqual(['shipping', 'support']);
  });

  it('fills empty days and computes rates', () => {
    const days = periodDays(3, now);
    expect(days).toEqual(['2026-11-25', '2026-11-26', '2026-11-27']);
    expect(fillDays([{ day: '2026-11-26', n: 4 }], days, (r) => r.n)).toEqual([0, 4, 0]);
    expect(conversionRate(3, 200)).toBe(1.5);
    expect(conversionRate(3, 0)).toBeNull();
    expect(change(150, 100)).toBe(50);
    expect(change(5, 0)).toBeNull();
    expect(parsePeriod('90')).toBe(90);
    expect(parsePeriod('13')).toBe(30);
    expect(bucket([1, 2, 3, 4, 5, 6, 7, 8], 7)).toEqual([28, 8]);
  });
});

describe('tracking tags', () => {
  it('accepts only real IDs and keeps verification codes from whole tags', () => {
    const r = parseTracking({
      ga4: 'g-abc1234',
      googleVerification: '<meta name="google-site-verification" content="abcDEF_123-xyz" />',
      headSnippet: '<script>console.log(1)</script>',
    });
    expect(r.ok && r.tracking.ga4).toBe('G-ABC1234');
    expect(r.ok && r.tracking.googleVerification).toBe('abcDEF_123-xyz');
    expect(parseTracking({ ga4: "G-1');alert(1)//" })).toEqual({ ok: false, problem: 'ga4' });
    expect(parseTracking({ metaPixel: '12ab' })).toEqual({ ok: false, problem: 'metaPixel' });
    expect(parseTracking({ headSnippet: 'x'.repeat(20_001) })).toEqual({
      ok: false,
      problem: 'snippetTooLong',
    });
    expect(verificationCode(' abc ')).toBe('abc');
  });

  it('asks for consent only for tags, and starts Google with everything denied', () => {
    const r = parseTracking({ ga4: 'G-ABCDEF1', bingVerification: '0123456789ABCDEF' });
    if (!r.ok) throw new Error('not ok');
    expect(needsConsent(r.tracking)).toBe(true);
    expect(needsConsent({ ...r.tracking, ga4: null })).toBe(false);
    expect(gtagScript(r.tracking, false)).toContain("analytics_storage: 'denied'");
    expect(gtagScript(r.tracking, true)).toContain("ad_storage: 'granted'");
    expect(storedTracking(JSON.stringify(r.tracking))).toEqual(r.tracking);
    expect(storedTracking('{"ga4":"bad"}')).toBeNull();
  });
});

describe('emails', () => {
  const shop: MailShop = {
    name: 'Ana <Ceramics>',
    url: 'https://shop.example/s/ana',
    logoUrl: null,
    accent: '#e4572e',
    sellerLine: null,
  };

  it('escapes everything from owners and buyers', () => {
    expect(escapeHtml('<b>"x" & \'y\'</b>')).toBe(
      '&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;',
    );
    const grid = productGrid(
      shop,
      [
        {
          name: '<img src=x onerror=1>',
          url: 'https://shop.example/p/1',
          imageUrl: null,
          price: '€5',
          was: null,
          badge: null,
        },
      ],
      'View',
    );
    expect(grid).not.toContain('<img src=x');
    expect(grid).toContain('&lt;img src=x onerror=1&gt;');
  });

  it('lays products out two per row and adds the unsubscribe headers', () => {
    const product = {
      name: 'Mug',
      url: 'https://shop.example/p/mug',
      imageUrl: null,
      price: '€5',
      was: '€7',
      badge: '−30%',
    };
    const grid = productGrid(shop, [product, product, product], 'View');
    // Three cards and an empty cell completing the second row.
    expect(grid.match(/class="col"/g)?.length).toBe(4);
    const mail = newsletterEmail(
      shop,
      'en',
      (key) => key,
      {
        subject: 'News',
        preheader: null,
        heading: 'Hello',
        intro: 'Line 1\n\nLine 2',
        promo: [product],
        fresh: [],
        voucher: { code: 'SAVE10', description: null },
      },
      'a@b.c',
      {
        page: 'https://shop.example/s/ana/newsletter?unsubscribe=t',
        oneClick: 'https://shop.example/api/u?token=t',
      },
    );
    expect(mail.headers?.['List-Unsubscribe']).toBe('<https://shop.example/api/u?token=t>');
    expect(mail.html).toContain('SAVE10');
    expect(mail.text).toContain('Mug');
    expect(senderAddress('Shop <no-reply@x.example>')).toBe('no-reply@x.example');
  });
});

describe('automatic discounts and free shipping', () => {
  const base = { active: true, startsAt: null, endsAt: null };
  const rules: PriceRule[] = [
    { ...base, id: 1, kind: 'quantity', threshold: 3, percentOff: 5 },
    { ...base, id: 2, kind: 'quantity', threshold: 5, percentOff: 10 },
    { ...base, id: 3, kind: 'spend', threshold: 20_000, percentOff: 8 },
    { ...base, id: 4, kind: 'free_shipping', threshold: 10_000, percentOff: null },
    { ...base, id: 5, kind: 'spend', threshold: 1, percentOff: 50, active: false },
  ];
  const live = publicRules(rules, now);

  it('keeps only live rules for buyers', () => {
    expect(live.map((r) => r.id)).toEqual([1, 2, 3, 4]);
  });

  it('gives the best discount reached, free shipping, and what is missing', () => {
    const r = applyRules(live, 9_000, 4);
    expect(r.discount).toMatchObject({ ruleId: 1, percent: 5 });
    expect(r.discountCents).toBe(450);
    expect(r.freeShipping).toBe(false);
    expect(r.freeShippingMissing).toBe(1_000);
    expect(r.next).toEqual({ kind: 'quantity', missing: 1, percent: 10 });
    const big = applyRules(live, 25_000, 2);
    expect(big.discount).toMatchObject({ ruleId: 3, percent: 8 });
    expect(big.freeShipping).toBe(true);
    expect(big.freeShippingMissing).toBeNull();
    expect(applyRules([], 100, 1)).toMatchObject({ discount: null, discountCents: 0, next: null });
  });

  it('applies rules before a voucher at checkout', () => {
    const items = [
      {
        productId: 1,
        variantId: 1,
        name: 'A',
        optionName: '',
        unitCents: 2_000,
        vatRate: 0,
        quantity: 5,
      },
    ];
    const zones = [{ id: 1, name: 'RO', countries: ['RO'], rateCents: 1_500, freeFromCents: null }];
    const q = quote({
      items,
      zones,
      country: 'RO',
      method: 'bank',
      codFeeCents: 0,
      storeVatRate: 0,
      rules: live,
      voucher: {
        code: 'X',
        description: null,
        kind: 'percent',
        percentOff: 10,
        amountCents: null,
        minOrderCents: null,
      },
    });
    if (!q.ok) throw new Error('no quote');
    // 10 000 − 10 % (5 pieces) = 9 000; − 10 % voucher = 8 100; free shipping from 10 000.
    expect(q.auto.discountCents).toBe(1_000);
    expect(q.voucherCents).toBe(900);
    expect(q.totals.shippingCents).toBe(0);
    expect(q.totals.totalCents).toBe(8_100);
  });
});

describe('the shop’s own languages', () => {
  const base = {
    shop: {
      cart: 'Cart',
      from: 'from {price}',
      fewLeft: { one: 'Only {count} left', other: 'Only {count} left' },
    },
    owner: { x: 'Secret' },
  };

  it('exports only what buyers see', () => {
    const text = exportLabels(base);
    expect(text).toContain('Cart');
    expect(text).not.toContain('Secret');
  });

  it('takes translated labels and refuses broken placeholders', () => {
    const pasted =
      '```json\n' +
      JSON.stringify({
        shop: {
          cart: 'Panier',
          from: 'dès {prix}',
          fewLeft: { one: 'Plus que {count}', other: 'Plus que {count}', few: 'Plus que {count}!' },
          nope: 'x',
        },
        owner: { x: 'pirate' },
      }) +
      '\n```';
    const r = importLabels(pasted, base);
    expect(r).not.toBeNull();
    expect(r!.messages).toEqual({
      shop: {
        cart: 'Panier',
        fewLeft: { one: 'Plus que {count}', other: 'Plus que {count}', few: 'Plus que {count}!' },
      },
    });
    expect(r!.applied).toBe(3);
    expect(r!.rejected).toEqual(['shop.from']);
    expect(importLabels('not json', base)).toBeNull();
  });
});
