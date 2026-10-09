import type { PluginPageProps } from '@devquake/plugin-sdk';
import { Link } from '@devquake/ui';
import { localeOf, translator } from '../i18n';
import { pageScope } from '../components/guard';
import { LiveTest } from '../components/live-test';
import { Notice, Panel } from '../components/panel';
import { CodeBlock } from '../components/ui';
import { listEventTypes, ownApp } from '../lib/data';
import { serverSnippet } from '../lib/snippets';

export function generateMetadata({ ctx }: PluginPageProps) {
  return { title: translator(localeOf(ctx))('meta.test') };
}

/**
 * The live test: listen to channels and send events from this page (as the owner), open it on a
 * second device to watch events arrive, and send from a terminal with the secret key.
 */
export default async function TestPage({ ctx, params }: PluginPageProps) {
  const scope = await pageScope(ctx);
  if (!scope.ok) return scope.notice;
  const { db, user, limits, plan } = scope;
  const locale = localeOf(ctx);
  const t = translator(locale, 'test');
  const app = await ownApp(db, user.id, Number(params.id));
  if (!app) {
    return (
      <Notice title={translator(locale, 'app')('notFoundTitle')}>
        <Link href="/" className="underline">
          {translator(locale, 'app')('back')}
        </Link>
      </Notice>
    );
  }
  const types = await listEventTypes(db, app.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/apps/${app.id}`} className="text-sm underline hover:text-quake">
          {t('back', { name: app.name })}
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold">{t('title')}</h1>
        <p className="mt-1 max-w-prose text-sm text-ink/70 dark:text-paper/70">{t('intro')}</p>
        {plan === 'trial' ? (
          <p className="mt-2 text-sm">
            {t('trialNote', { seconds: limits.deliveryDelayMs / 1000 })}
          </p>
        ) : null}
      </div>
      <LiveTest
        appId={app.id}
        publicKey={app.public_key}
        maxChannels={limits.channelsPerConnection}
        eventTypes={types}
      />
      <Panel title={t('secondTitle')}>
        <ol className="list-decimal space-y-2 pl-5 text-sm">
          <li>{t('second1')}</li>
          <li>{t('second2')}</li>
          <li>{t('second3')}</li>
        </ol>
        <div className="mt-3">
          <CodeBlock label={t('curlTitle')} code={serverSnippet(ctx.baseUrl)} />
        </div>
      </Panel>
    </div>
  );
}
