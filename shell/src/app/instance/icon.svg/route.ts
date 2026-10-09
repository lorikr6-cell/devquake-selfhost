import { PLUGIN_IDS } from '@/generated/app';
import { iconSvg } from '@/lib/icon';
import { manifests } from '@/lib/links';

// /instance/icon.svg: the instance's icon; ?app=<id>: a bundled app's (ADR 0056).
export async function GET(request: Request) {
  const app = new URL(request.url).searchParams.get('app');
  const index = app ? PLUGIN_IDS.indexOf(app) : -1;
  const svg =
    index >= 0 ? iconSvg((await manifests()).get(app!)!.manifest.name, index + 1) : iconSvg();
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
  });
}
