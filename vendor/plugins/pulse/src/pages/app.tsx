import type { PluginPageProps } from '@devquake/plugin-sdk';
import { BackLink, Link, LOCALE_TAGS, buttonClass, formatDateTime } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { EventTypesEditor } from '../components/event-types-editor';
import { pageScope } from '../components/guard';
import { KeysPanel } from '../components/keys-panel';
import { OriginsPanel } from '../components/origins-panel';
import { Notice, Panel } from '../components/panel';
import { SettingsPanel } from '../components/settings-panel';
import { CodeBlock } from '../components/ui';
import {
  listEventTypes,
  listOrigins,
  openStreams,
  ownApp,
  securityLog,
  serverAddressesToday,
  usage,
} from '../lib/data';
import { callTotals, recentCalls } from '../lib/call-log';
import { compactCount } from '../lib/call-rules';
import { originProof } from '../lib/keys';
import { proofRecordName } from '../lib/origins';
import { browserSnippet, envelopeExample, serverSnippet, tokenSnippet } from '../lib/snippets';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.app') };
}

/** Kinds of security entries with a text (others are shown as they are). */
const SECURITY_KINDS = [
  'bad_secret',
  'bad_token',
  'origin_rejected',
  'secret_in_browser',
  'ip_not_allowed',
  'secret_rotated',
];

/** Above this many addresses a day, the secret key may be in someone else's hands. */
const ADDRESS_WARNING = 3;

/** One API service: keys, websites, event structures, settings, usage and security. */
export default async function AppPage({ ctx, params }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user, limits } = scope;
  const locale = localeOf(ctx);
  const t = translator(locale, 'app');
  const app = await ownApp(db, user.id, Number(params.id));
  if (!app) {
    return (
      <Notice title={t('notFoundTitle')}>
        <BackLink href="/" className="underline">
          {t('back')}
        </BackLink>
      </Notice>
    );
  }
  const [origins, types, days, streams, addresses, log, calls, recent] = await Promise.all([
    listOrigins(db, app.id),
    listEventTypes(db, app.id),
    usage(db, app.id),
    openStreams(db, app.id),
    serverAddressesToday(db, app.id),
    securityLog(db, app.id),
    callTotals(db, app.id),
    recentCalls(db, app.id),
  ]);
  const tz = ctx.timeZone ?? 'UTC';
  const number = new Intl.NumberFormat(LOCALE_TAGS[locale]);
  const tu = translator(locale, 'usage');
  const tq = translator(locale, 'quick');
  const tc = translator(locale, 'calls');
  const tag = LOCALE_TAGS[locale];

  return (
    <div className="space-y-6">
      <div>
        <BackLink href="/" className="text-sm underline hover:text-quake">
          {t('back')}
        </BackLink>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold break-all">{app.name}</h1>
          {app.paused ? (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-sm">
              {t('paused')}
            </span>
          ) : null}
          <Link
            href={`/apps/${app.id}/test`}
            className={buttonClass('primary', 'ml-auto min-h-11')}
          >
            {t('test')}
          </Link>
        </div>
      </div>

      <Panel title={t('keysTitle')}>
        <KeysPanel appId={app.id} publicKey={app.public_key} secretHint={app.secret_hint} />
      </Panel>

      <Panel title={t('originsTitle')}>
        <OriginsPanel
          appId={app.id}
          allowLocalhost={app.allow_localhost === 1}
          origins={origins.map((o) => ({
            id: o.id,
            origin: o.origin,
            verified: o.verifiedAt !== null,
            recordName: proofRecordName(o.origin),
            recordValue: originProof(o.verifyToken),
          }))}
        />
      </Panel>

      <Panel title={t('typesTitle')}>
        <EventTypesEditor appId={app.id} initial={types} max={limits.eventTypes} />
      </Panel>

      <Panel title={tq('title')}>
        <p className="mb-3 text-sm text-ink/70 dark:text-paper/70">{tq('intro')}</p>
        <div className="space-y-3">
          <CodeBlock label={tq('browser')} code={browserSnippet(ctx.baseUrl, app.public_key)} />
          <CodeBlock label={tq('server')} code={serverSnippet(ctx.baseUrl)} />
          <CodeBlock label={tq('token')} code={tokenSnippet(app.public_key)} />
          <p className="text-xs text-ink/60 dark:text-paper/60">{tq('tokenNote')}</p>
          <CodeBlock label={tq('received')} code={envelopeExample(app.public_key)} />
        </div>
      </Panel>

      <Panel title={tc('title')}>
        {calls.calls === 0 ? (
          <p className="text-sm text-ink/70 dark:text-paper/70">{tc('none')}</p>
        ) : (
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
            <p className="font-display text-2xl font-bold" title={number.format(calls.calls)}>
              {tc('total', { count: calls.calls, n: compactCount(calls.calls, tag) })}
            </p>
            <p className="text-sm" title={number.format(calls.refused)}>
              {tc('refused', { count: calls.refused, n: compactCount(calls.refused, tag) })}
            </p>
            <p className="text-sm text-ink/60 dark:text-paper/60">
              {calls.firstAt
                ? tc('since', { date: formatDateTime(calls.firstAt, tz, 'date', locale) })
                : null}
              {calls.lastAt
                ? ` · ${tc('last', { date: formatDateTime(calls.lastAt, tz, 'datetime', locale) })}`
                : null}
            </p>
          </div>
        )}
        <h3 className="mt-5 mb-2 font-semibold">{tc('recentTitle')}</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-ink/70 dark:text-paper/70">{tc('recentEmpty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-md text-left text-sm">
              <thead className="text-xs text-ink/60 dark:text-paper/60">
                <tr>
                  <th className="py-1 pr-3 font-medium">{tc('time')}</th>
                  <th className="py-1 pr-3 font-medium">{tc('request')}</th>
                  <th className="py-1 pr-3 font-medium">{tc('status')}</th>
                  <th className="py-1 pr-3 font-medium">{tc('source')}</th>
                  <th className="py-1 text-right font-medium">{tc('duration')}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr key={c.id} className="border-t border-ink/10 dark:border-paper/10">
                    <td className="py-1 pr-3 whitespace-nowrap tabular-nums">
                      {formatDateTime(c.at, tz, 'datetime', locale)}
                    </td>
                    <td className="py-1 pr-3 font-mono text-xs">
                      {c.method} {c.route}
                    </td>
                    <td
                      className={
                        c.status >= 400
                          ? 'py-1 pr-3 font-medium text-red-700 tabular-nums dark:text-red-400'
                          : 'py-1 pr-3 tabular-nums'
                      }
                    >
                      {c.status}
                    </td>
                    <td className="py-1 pr-3">
                      {tc(
                        `sources.${c.source === 'server' || c.source === 'browser' || c.source === 'token' ? c.source : 'unknown'}`,
                      )}
                    </td>
                    <td className="py-1 text-right tabular-nums">
                      {tc('ms', { n: number.format(c.durationMs) })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title={tu('title')}>
        <p className="text-sm">
          {tu('openNow', { count: streams, max: limits.connections })}
          {' · '}
          {tu('addresses', { count: addresses })}
        </p>
        {addresses > ADDRESS_WARNING ? (
          <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            {tu('addressesWarn', { count: addresses })}
          </p>
        ) : null}
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-md text-left text-sm">
            <thead className="text-xs text-ink/60 dark:text-paper/60">
              <tr>
                <th className="py-1 pr-3 font-medium">{tu('day')}</th>
                <th className="py-1 pr-3 text-right font-medium">{tu('events')}</th>
                <th className="py-1 pr-3 text-right font-medium">{tu('rejected')}</th>
                <th className="py-1 pr-3 text-right font-medium">{tu('streams')}</th>
                <th className="py-1 text-right font-medium">{tu('polls')}</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.day} className="border-t border-ink/10 dark:border-paper/10">
                  <td className="py-1 pr-3">
                    {formatDateTime(`${d.day}T12:00:00Z`, 'UTC', 'date', locale)}
                  </td>
                  <td className="py-1 pr-3 text-right tabular-nums">
                    {number.format(d.events)} / {number.format(limits.eventsPerDay)}
                  </td>
                  <td className="py-1 pr-3 text-right tabular-nums">{number.format(d.rejected)}</td>
                  <td className="py-1 pr-3 text-right tabular-nums">{number.format(d.streams)}</td>
                  <td className="py-1 text-right tabular-nums">{number.format(d.polls)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-1 text-xs text-ink/60 dark:text-paper/60">{tu('utcNote')}</p>
        <h3 className="mt-5 mb-2 font-semibold">{tu('securityTitle')}</h3>
        {log.length === 0 ? (
          <p className="text-sm text-ink/70 dark:text-paper/70">{tu('securityEmpty')}</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {log.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-x-2">
                <span className="text-ink/60 tabular-nums dark:text-paper/60">
                  {formatDateTime(e.at, tz, 'datetime', locale)}
                </span>
                <span>{SECURITY_KINDS.includes(e.kind) ? tu(`kinds.${e.kind}`) : e.kind}</span>
                {e.detail ? <span className="font-mono text-xs break-all">{e.detail}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title={t('settingsTitle')}>
        <SettingsPanel
          appId={app.id}
          settings={{
            name: app.name,
            browserPublish: app.browser_publish === 1,
            strictSchema: app.strict_schema === 1,
            paused: app.paused === 1,
            serverIps: (app.server_ips ?? '').split(',').filter(Boolean).join('\n'),
          }}
        />
      </Panel>
    </div>
  );
}
