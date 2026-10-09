import path from 'node:path';
import type { NextConfig } from 'next';
import { PLUGIN_PACKAGES } from './src/generated/plugin-package';

const repoRoot = path.resolve(process.cwd(), '..');

const nextConfig: NextConfig = {
  // One self-contained server for the Docker image (Dockerfile) or any Node host.
  output: 'standalone',
  outputFileTracingRoot: repoRoot,
  turbopack: { root: repoRoot },
  // The shared packages and the plugin ship TypeScript source; Next compiles them.
  transpilePackages: ['@devquake/plugin-sdk', '@devquake/ui', ...PLUGIN_PACKAGES],
  serverExternalPackages: ['mysql2', 'nodemailer'],
  experimental: { serverActions: { bodySizeLimit: '2mb' } },
  poweredByHeader: false,
  async headers() {
    const site = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    ];
    const instance = [
      { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
      { key: 'Cache-Control', value: 'private, no-store' },
      // same-origin, not no-referrer: Server Actions reject "Origin: null" form posts.
      { key: 'Referrer-Policy', value: 'same-origin' },
    ];
    return [
      { source: '/:path*', headers: site },
      { source: '/instance/:path*', headers: instance },
    ];
  },
};

export default nextConfig;
