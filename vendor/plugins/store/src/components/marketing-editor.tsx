'use client';

import { useId, useState, type ReactNode } from 'react';
import { Button, Link, Sheet, cn, useT } from '@devquake/ui';
import {
  ANNOUNCEMENT_PLACEMENTS,
  ANNOUNCEMENT_TONES,
  CAMPAIGN_SCOPES,
  VOUCHER_KINDS,
  type AnnouncementPlacement,
  type AnnouncementTone,
  type CampaignScope,
  type VoucherKind,
} from '../lib/marketing';
import { callApi } from './call-api';
import { ErrorText, Field, Input, Panel, Select, TextArea } from './ui';
import { useAction } from './use-action';

type State = 'off' | 'scheduled' | 'live' | 'ended';

interface Timed {
  startsAt: string;
  endsAt: string;
  active: boolean;
}

export interface CampaignValue extends Timed {
  id: number | null;
  name: string;
  description: string;
  percentOff: string;
  scope: CampaignScope;
  category: string;
  productIds: number[];
  state?: State;
}

export interface VoucherValue extends Timed {
  id: number | null;
  code: string;
  description: string;
  kind: VoucherKind;
  percentOff: string;
  amount: string;
  minOrder: string;
  maxUses: string;
  oncePerBuyer: boolean;
  uses?: number;
  state?: State;
  summary?: string;
}

export interface AnnouncementValue extends Timed {
  id: number | null;
  message: string;
  details: string;
  tone: AnnouncementTone;
  placement: AnnouncementPlacement;
  linkUrl: string;
  linkLabel: string;
  voucherId: string;
  campaignId: string;
  state?: State;
}

const STATE_TONE: Record<State, string> = {
  live: 'bg-green-100 text-green-900 dark:bg-green-500/15 dark:text-green-200',
  scheduled: 'bg-sky-100 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200',
  ended: 'bg-ink/10 text-ink/70 dark:bg-paper/10 dark:text-paper/70',
  off: 'bg-ink/10 text-ink/70 dark:bg-paper/10 dark:text-paper/70',
};

function StateBadge({ state }: { state: State }) {
  const t = useT('marketing.state');
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', STATE_TONE[state])}>
      {t(state)}
    </span>
  );
}

/** Start, end and "switched on", shared by the three editors. */
function TimeFields<T extends Timed>({
  value,
  set,
}: {
  value: T;
  set: (change: Partial<T>) => void;
}) {
  const t = useT('marketing');
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('startsAt')} hint={t('startsHint')}>
          <Input
            type="datetime-local"
            value={value.startsAt}
            onChange={(e) => set({ startsAt: e.target.value } as Partial<T>)}
          />
        </Field>
        <Field label={t('endsAt')} hint={t('endsHint')}>
          <Input
            type="datetime-local"
            value={value.endsAt}
            onChange={(e) => set({ endsAt: e.target.value } as Partial<T>)}
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.active}
          onChange={(e) => set({ active: e.target.checked } as Partial<T>)}
          className="accent-quake"
        />
        <span className="font-medium">{t('active')}</span>
      </label>
    </>
  );
}

function Section({
  title,
  hint,
  onNew,
  newLabel,
  children,
}: {
  title: string;
  hint: string;
  onNew: () => void;
  newLabel: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          <p className="text-sm text-ink/60 dark:text-paper/60">{hint}</p>
        </div>
        <Button type="button" variant="secondary" onClick={onNew}>
          {newLabel}
        </Button>
      </div>
      {children}
    </section>
  );
}

function Editor({
  open,
  title,
  onClose,
  onSave,
  busy,
  error,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  busy: boolean;
  error: string;
  children: ReactNode;
}) {
  const t = useT('marketing');
  const heading = useId();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      labelledBy={heading}
      className="sm:max-w-xl"
      header={
        <h2 id={heading} className="font-display text-lg font-semibold">
          {title}
        </h2>
      }
      footer={
        <div className="flex gap-2">
          <Button type="button" disabled={busy} onClick={onSave}>
            {t('save')}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
        </div>
      }
      bodyClassName="space-y-3"
    >
      {children}
      <ErrorText>{error}</ErrorText>
    </Sheet>
  );
}

export function MarketingEditor({
  shopPath,
  products,
  categories,
  campaigns,
  vouchers,
  announcements,
}: {
  shopPath: string;
  products: Array<{ id: number; name: string }>;
  categories: string[];
  campaigns: CampaignValue[];
  vouchers: VoucherValue[];
  announcements: AnnouncementValue[];
}) {
  const t = useT('marketing');
  const { busy, error, setError, act, confirm } = useAction();
  const [campaign, setCampaign] = useState<CampaignValue | null>(null);
  const [voucher, setVoucher] = useState<VoucherValue | null>(null);
  const [notice, setNotice] = useState<AnnouncementValue | null>(null);
  const [productFilter, setProductFilter] = useState('');

  const save = async (path: string, id: number | null, body: unknown, close: () => void) => {
    const ok = await act(
      () => (id === null ? callApi(path, 'POST', body) : callApi(`${path}/${id}`, 'PUT', body)),
      { success: id === null ? t('created') : t('saved') },
    );
    if (ok) close();
  };

  const remove = async (path: string, id: number, name: string) => {
    const ok = await confirm({
      title: t('deleteTitle', { name }),
      body: t('deleteBody'),
      confirmLabel: t('delete'),
      danger: true,
    });
    if (ok) await act(() => callApi(`${path}/${id}`, 'DELETE'), { success: t('deleted') });
  };

  const row = (
    key: number,
    title: string,
    sub: string,
    state: State | undefined,
    onEdit: () => void,
    onDelete: () => void,
    extra?: ReactNode,
  ) => (
    <li key={key} className="flex flex-wrap items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium">{title}</p>
        <p className="truncate text-xs text-ink/60 dark:text-paper/60">{sub}</p>
      </div>
      {extra}
      {state ? <StateBadge state={state} /> : null}
      <Button type="button" variant="secondary" onClick={onEdit}>
        {t('edit')}
      </Button>
      <Button type="button" variant="ghost" disabled={busy} onClick={onDelete}>
        {t('delete')}
      </Button>
    </li>
  );
  const list =
    'divide-y divide-ink/10 rounded-xl border border-ink/10 dark:divide-paper/10 dark:border-paper/10';
  const blankTime = { startsAt: '', endsAt: '', active: true };

  return (
    <div className="space-y-8">
      <Section
        title={t('campaigns')}
        hint={t('campaignsHint')}
        newLabel={t('newCampaign')}
        onNew={() => {
          setError('');
          setCampaign({
            id: null,
            name: '',
            description: '',
            percentOff: '10',
            scope: 'all',
            category: categories[0] ?? '',
            productIds: [],
            ...blankTime,
          });
        }}
      >
        {campaigns.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('noCampaigns')}</p>
        ) : (
          <ul className={list}>
            {campaigns.map((c) =>
              row(
                c.id!,
                `${c.name} · −${c.percentOff}%`,
                c.scope === 'all'
                  ? t('scopeAllShort')
                  : c.scope === 'category'
                    ? t('scopeCategoryShort', { category: c.category })
                    : t('scopeProductsShort', { count: c.productIds.length }),
                c.state,
                () => {
                  setError('');
                  setCampaign(c);
                },
                () => remove('/campaigns', c.id!, c.name),
                c.state === 'live' ? (
                  <Link
                    href={`${shopPath}?campaign=${c.id}`}
                    className="text-sm underline hover:text-quake"
                  >
                    {t('view')}
                  </Link>
                ) : null,
              ),
            )}
          </ul>
        )}
      </Section>

      <Section
        title={t('vouchers')}
        hint={t('vouchersHint')}
        newLabel={t('newVoucher')}
        onNew={() => {
          setError('');
          setVoucher({
            id: null,
            code: '',
            description: '',
            kind: 'percent',
            percentOff: '10',
            amount: '',
            minOrder: '',
            maxUses: '',
            oncePerBuyer: false,
            ...blankTime,
          });
        }}
      >
        {vouchers.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('noVouchers')}</p>
        ) : (
          <ul className={list}>
            {vouchers.map((v) =>
              row(
                v.id!,
                v.code,
                [v.summary, v.description, t('uses', { count: v.uses ?? 0, max: v.maxUses || '∞' })]
                  .filter(Boolean)
                  .join(' · '),
                v.state,
                () => {
                  setError('');
                  setVoucher(v);
                },
                () => remove('/vouchers', v.id!, v.code),
              ),
            )}
          </ul>
        )}
      </Section>

      <Section
        title={t('announcements')}
        hint={t('announcementsHint')}
        newLabel={t('newAnnouncement')}
        onNew={() => {
          setError('');
          setNotice({
            id: null,
            message: '',
            details: '',
            tone: 'info',
            placement: 'bar',
            linkUrl: '',
            linkLabel: '',
            voucherId: '',
            campaignId: '',
            ...blankTime,
          });
        }}
      >
        {announcements.length === 0 ? (
          <p className="text-sm text-ink/60 dark:text-paper/60">{t('noAnnouncements')}</p>
        ) : (
          <ul className={list}>
            {announcements.map((a) =>
              row(
                a.id!,
                a.message,
                `${t(`placement.${a.placement}`)} · ${t(`tone.${a.tone}`)}`,
                a.state,
                () => {
                  setError('');
                  setNotice(a);
                },
                () => remove('/announcements', a.id!, a.message),
              ),
            )}
          </ul>
        )}
      </Section>

      <Editor
        open={campaign !== null}
        title={campaign?.id === null ? t('newCampaign') : t('editCampaign')}
        onClose={() => setCampaign(null)}
        busy={busy}
        error={error}
        onSave={() =>
          campaign && save('/campaigns', campaign.id, campaign, () => setCampaign(null))
        }
      >
        {campaign ? (
          <>
            <Field label={t('campaignName')} hint={t('campaignNameHint')}>
              <Input
                value={campaign.name}
                onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                maxLength={80}
                required
              />
            </Field>
            <Field label={t('description')}>
              <Input
                value={campaign.description}
                onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
                maxLength={300}
              />
            </Field>
            <Field label={t('percentOff')} hint={t('percentHint')}>
              <Input
                type="number"
                min={1}
                max={90}
                value={campaign.percentOff}
                onChange={(e) => setCampaign({ ...campaign, percentOff: e.target.value })}
                required
              />
            </Field>
            <fieldset className="space-y-2 text-sm">
              <legend className="mb-1 font-medium">{t('scope')}</legend>
              {CAMPAIGN_SCOPES.map((s) => (
                <label key={s} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="campaign-scope"
                    checked={campaign.scope === s}
                    onChange={() => setCampaign({ ...campaign, scope: s })}
                    className="accent-quake"
                  />
                  {t(`scopeName.${s}`)}
                </label>
              ))}
            </fieldset>
            {campaign.scope === 'category' ? (
              <Field label={t('category')}>
                <Select
                  value={campaign.category}
                  onChange={(e) => setCampaign({ ...campaign, category: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
            {campaign.scope === 'products' ? (
              <div className="space-y-2">
                <Input
                  type="search"
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  placeholder={t('findProduct')}
                  aria-label={t('findProduct')}
                />
                <ul className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-ink/10 p-2 text-sm dark:border-paper/10">
                  {products
                    .filter((p) => p.name.toLowerCase().includes(productFilter.toLowerCase()))
                    .map((p) => (
                      <li key={p.id}>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={campaign.productIds.includes(p.id)}
                            onChange={(e) =>
                              setCampaign({
                                ...campaign,
                                productIds: e.target.checked
                                  ? [...campaign.productIds, p.id]
                                  : campaign.productIds.filter((x) => x !== p.id),
                              })
                            }
                            className="accent-quake"
                          />
                          {p.name}
                        </label>
                      </li>
                    ))}
                </ul>
                <p className="text-xs text-ink/60 dark:text-paper/60">
                  {t('chosen', { count: campaign.productIds.length })}
                </p>
              </div>
            ) : null}
            <TimeFields value={campaign} set={(c) => setCampaign({ ...campaign, ...c })} />
            <p className="text-xs text-ink/60 dark:text-paper/60">{t('campaignNote')}</p>
          </>
        ) : null}
      </Editor>

      <Editor
        open={voucher !== null}
        title={voucher?.id === null ? t('newVoucher') : t('editVoucher')}
        onClose={() => setVoucher(null)}
        busy={busy}
        error={error}
        onSave={() => voucher && save('/vouchers', voucher.id, voucher, () => setVoucher(null))}
      >
        {voucher ? (
          <>
            <Field label={t('code')} hint={t('codeHint')}>
              <Input
                value={voucher.code}
                onChange={(e) =>
                  setVoucher({ ...voucher, code: e.target.value.toUpperCase().replace(/\s/g, '') })
                }
                maxLength={30}
                pattern="[A-Z0-9_\-]{3,30}"
                required
              />
            </Field>
            <Field label={t('description')} hint={t('voucherDescriptionHint')}>
              <Input
                value={voucher.description}
                onChange={(e) => setVoucher({ ...voucher, description: e.target.value })}
                maxLength={160}
              />
            </Field>
            <Field label={t('kind')}>
              <Select
                value={voucher.kind}
                onChange={(e) => setVoucher({ ...voucher, kind: e.target.value as VoucherKind })}
              >
                {VOUCHER_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(`kindName.${k}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              {voucher.kind === 'percent' ? (
                <Field label={t('percentOff')}>
                  <Input
                    type="number"
                    min={1}
                    max={90}
                    value={voucher.percentOff}
                    onChange={(e) => setVoucher({ ...voucher, percentOff: e.target.value })}
                    required
                  />
                </Field>
              ) : null}
              {voucher.kind === 'amount' ? (
                <Field label={t('amount')}>
                  <Input
                    inputMode="decimal"
                    value={voucher.amount}
                    onChange={(e) => setVoucher({ ...voucher, amount: e.target.value })}
                    pattern="\d+([.,]\d{1,2})?"
                    required
                  />
                </Field>
              ) : null}
              <Field label={t('minOrder')} hint={t('minOrderHint')}>
                <Input
                  inputMode="decimal"
                  value={voucher.minOrder}
                  onChange={(e) => setVoucher({ ...voucher, minOrder: e.target.value })}
                  pattern="\d+([.,]\d{1,2})?"
                />
              </Field>
              <Field label={t('maxUses')} hint={t('maxUsesHint')}>
                <Input
                  type="number"
                  min={1}
                  value={voucher.maxUses}
                  onChange={(e) => setVoucher({ ...voucher, maxUses: e.target.value })}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={voucher.oncePerBuyer}
                onChange={(e) => setVoucher({ ...voucher, oncePerBuyer: e.target.checked })}
                className="accent-quake"
              />
              {t('oncePerBuyer')}
            </label>
            <TimeFields value={voucher} set={(c) => setVoucher({ ...voucher, ...c })} />
          </>
        ) : null}
      </Editor>

      <Editor
        open={notice !== null}
        title={notice?.id === null ? t('newAnnouncement') : t('editAnnouncement')}
        onClose={() => setNotice(null)}
        busy={busy}
        error={error}
        onSave={() =>
          notice &&
          save(
            '/announcements',
            notice.id,
            {
              ...notice,
              voucherId: notice.voucherId || null,
              campaignId: notice.campaignId || null,
            },
            () => setNotice(null),
          )
        }
      >
        {notice ? (
          <>
            <Field label={t('message')}>
              <Input
                value={notice.message}
                onChange={(e) => setNotice({ ...notice, message: e.target.value })}
                maxLength={200}
                required
              />
            </Field>
            <Field label={t('details')} hint={t('detailsHint')}>
              <TextArea
                value={notice.details}
                onChange={(e) => setNotice({ ...notice, details: e.target.value })}
                maxLength={500}
                rows={2}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t('placementLabel')}>
                <Select
                  value={notice.placement}
                  onChange={(e) =>
                    setNotice({ ...notice, placement: e.target.value as AnnouncementPlacement })
                  }
                >
                  {ANNOUNCEMENT_PLACEMENTS.map((p) => (
                    <option key={p} value={p}>
                      {t(`placement.${p}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('toneLabel')}>
                <Select
                  value={notice.tone}
                  onChange={(e) =>
                    setNotice({ ...notice, tone: e.target.value as AnnouncementTone })
                  }
                >
                  {ANNOUNCEMENT_TONES.map((x) => (
                    <option key={x} value={x}>
                      {t(`tone.${x}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('showVoucher')}>
                <Select
                  value={notice.voucherId}
                  onChange={(e) => setNotice({ ...notice, voucherId: e.target.value })}
                >
                  <option value="">{t('none')}</option>
                  {vouchers.map((v) => (
                    <option key={v.id} value={v.id!}>
                      {v.code}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('linkCampaign')}>
                <Select
                  value={notice.campaignId}
                  onChange={(e) => setNotice({ ...notice, campaignId: e.target.value })}
                >
                  <option value="">{t('none')}</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id!}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            {!notice.campaignId ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t('linkUrl')} hint={t('linkUrlHint')}>
                  <Input
                    value={notice.linkUrl}
                    onChange={(e) => setNotice({ ...notice, linkUrl: e.target.value })}
                    maxLength={500}
                    placeholder={`${shopPath}?category=…`}
                  />
                </Field>
                <Field label={t('linkLabel')}>
                  <Input
                    value={notice.linkLabel}
                    onChange={(e) => setNotice({ ...notice, linkLabel: e.target.value })}
                    maxLength={40}
                  />
                </Field>
              </div>
            ) : null}
            <TimeFields value={notice} set={(c) => setNotice({ ...notice, ...c })} />
          </>
        ) : null}
      </Editor>
    </div>
  );
}
