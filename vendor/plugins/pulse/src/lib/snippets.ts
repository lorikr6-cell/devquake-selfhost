// Ready-to-copy code with the app's own address and public key (dashboard and manual). Pure.

export function browserSnippet(baseUrl: string, publicKey: string, channel = 'demo'): string {
  return [
    `<script src="${baseUrl}/api/v1/client"></script>`,
    '<script>',
    '  var pulse = DevQuakePulse.connect({',
    `    key: '${publicKey}',`,
    `    channels: ['${channel}'],`,
    '    onEvent: function (e) { console.log(e.event, e.data); },',
    "    onStatus: function (s) { console.log('pulse:', s); }",
    '  });',
    '  // Only when "Browsers may send events" is on:',
    `  // pulse.send('${channel}', 'hello', { text: 'Hi' });`,
    '</script>',
  ].join('\n');
}

export function serverSnippet(baseUrl: string, channel = 'demo'): string {
  const nl = ' \\\n';
  return [
    `curl -X POST ${baseUrl}/api/v1/events`,
    '  -H "Authorization: Bearer $PULSE_SECRET_KEY"',
    '  -H "Content-Type: application/json"',
    `  -d '{"channel":"${channel}","event":"hello","data":{"text":"Hi","count":1}}'`,
  ].join(nl);
}

export function tokenSnippet(publicKey: string): string {
  return [
    '// Your server (Node.js): a client token for one of your users, valid for one hour.',
    "import { createHmac } from 'node:crypto';",
    '',
    "const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');",
    '',
    'export function pulseToken(userId, channels, canSend) {',
    '  const now = Math.floor(Date.now() / 1000);',
    "  const head = b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({",
    `    app: '${publicKey}', ch: channels, pub: canSend,`,
    '    sub: String(userId), iat: now, exp: now + 3600,',
    '  });',
    "  const sig = createHmac('sha256', process.env.PULSE_SECRET_KEY).update(head).digest('base64url');",
    "  return head + '.' + sig;",
    '}',
    '',
    '// In the page: DevQuakePulse.connect({ token: () => fetch("/my/pulse-token").then((r) => r.text()), … })',
  ].join('\n');
}

export function envelopeExample(publicKey: string): string {
  return JSON.stringify(
    {
      id: '812',
      app: publicKey,
      channel: 'orders',
      event: 'order.created',
      data: { orderId: 'A-17', total: 42.5, paid: true },
      source: 'server',
      at: '2026-09-26T10:00:00.000Z',
    },
    null,
    2,
  );
}
