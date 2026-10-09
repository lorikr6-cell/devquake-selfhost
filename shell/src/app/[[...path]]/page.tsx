import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { matchRoute, type SearchParams } from '@devquake/plugin-sdk';
import { localizePath } from '@devquake/ui';
import { loadPlugin } from '@/generated/app';
import { InstanceBar } from '@/components/instance-bar';
import { NotReady } from '@/components/not-ready';
import { buildContext, getLocale } from '@/lib/context';
import { instanceState } from '@/lib/gate';
import { isOpenRoute, isPublicPage } from '@/lib/routes';
import { getSessionUser } from '@/lib/session';

// Every page of the app, served at the root of the instance's address. Members only, except the
// app's public pages (its manual) and the links members shared publicly.

type Props = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<SearchParams>;
};

async function resolve(props: Props) {
  const { path = [] } = await props.params;
  const route = `/${path.join('/')}`;
  const plugin = await loadPlugin();
  const match = matchRoute(Object.keys(plugin.pages), route);
  if (!match) return null;
  const mod = await plugin.pages[match.pattern]!();
  const pageProps = {
    params: match.params,
    searchParams: await props.searchParams,
    ctx: await buildContext(plugin.manifest),
  };
  return { plugin, mod, pageProps, route };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const state = await instanceState();
  if (!state.ok) return {};
  const resolved = await resolve(props).catch(() => null);
  if (!resolved) return {};
  const { mod, pageProps, plugin } = resolved;
  return mod.generateMetadata
    ? await mod.generateMetadata(pageProps)
    : (mod.metadata ?? { title: plugin.manifest.name });
}

function queryString(searchParams: SearchParams) {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    for (const v of Array.isArray(value) ? value : [value]) q.append(key, v);
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export default async function AppPage(props: Props) {
  const state = await instanceState();
  if (!state.ok) {
    if (state.reason === 'setup') redirect('/instance/setup');
    return <NotReady reason={state.reason} />;
  }
  const resolved = await resolve(props);
  if (!resolved) notFound();
  const { plugin, mod, pageProps, route } = resolved;
  const locale = await getLocale();
  const user = await getSessionUser();
  const open = isPublicPage(plugin.manifest, route) || isOpenRoute(plugin.manifest, 'pages', route);
  if (!user && !open) {
    const back = `${localizePath(route, locale)}${queryString(pageProps.searchParams)}`;
    redirect(`${localizePath('/instance/sign-in', locale)}?next=${encodeURIComponent(back)}`);
  }

  const Page = mod.default;
  const content = await Page(pageProps);
  const page = plugin.layout
    ? await (async () => {
        const { default: Layout } = await plugin.layout!();
        return <Layout ctx={pageProps.ctx}>{content}</Layout>;
      })()
    : content;
  return (
    <>
      {user ? <InstanceBar user={user} locale={locale} /> : null}
      {page}
    </>
  );
}
