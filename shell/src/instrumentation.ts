// Runs once when the server starts: secrets, database migrations, background work (lib/boot).
// Never during `next build`: secrets made there would end up in every Docker image.
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NEXT_PHASE === 'phase-production-build') return;
  const { ready } = await import('./lib/boot');
  await ready();
}
