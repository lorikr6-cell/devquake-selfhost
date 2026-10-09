import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { matchRoute, type SearchParams } from '@devquake/plugin-sdk';
import { localizePath } from '@devquake/ui';
import { loadPlugin } from '@/generated/app';
import { HomePage } from '@/components/home';
import { InstanceBar, ReturnBar } from '@/components/instance-bar';
import { NotReady } from '@/components/not-ready';
import { buildContext, getLocale } from '@/lib/context';
import { instanceState } from '@/lib/gate';
import { getPlace } from '@/lib/place';
import { isOpenRoute, isPublicPage } from '@/lib/routes';
import { getSessionUser } from '@/lib/session';

// Every page of the app the request's hostname is for (ADR 0056): one app at the root of the
// instance's address, or with several apps the home on the domain and each app on its own name.
// Members only, except the app's public pages (its manual) and links members shared publicly.

type Props = {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<SearchParams>;
};

async function resolve(props: Props) {
  const { path = [] } = await props.params;
  const route = `/${path.join('/')}`;
  const place = await getPlace();
  if (place.kind !== 'app') return null;
  const plugin = await loadPlugin(place.id);
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
  const place = await getPlace();
  if (place.kind === 'home') {
    const { path = [] } = await props.params;
    if (path.length > 0) notFound();
    return <HomePage />;
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

  // Opened from another bundled app: the way back (ADR 0035).
  const back = await pageProps.ctx.links?.returnFrom(pageProps.searchParams).catch(() => null);
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
      {back ? <ReturnBar back={back} locale={locale} /> : null}
      {page}
    </>
  );
}
