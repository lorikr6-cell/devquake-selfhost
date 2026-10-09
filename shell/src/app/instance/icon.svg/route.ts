import { iconSvg } from '@/lib/icon';

export function GET() {
  return new Response(iconSvg(), {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
  });
}
