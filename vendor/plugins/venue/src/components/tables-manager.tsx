'use client';

import { useState } from 'react';
import { Link, useT } from '@devquake/ui';
import { call, dangerLink, errorText, fieldClass, primaryButton } from './client';
import { Status } from './status';

interface TableRow {
  id: number;
  name: string;
  seats: number;
  code: string;
  waiterId: number | null;
  /** The sticker's QR (SVG made on the server from the table's address). */
  qr: string;
  url: string;
}

/**
 * The venue's tables: add, rename, remove, a new sticker code for a lost one, and the stickers to
 * print (each QR opens the table on a staff device and the menu for guests). With a search bar.
 */
export function TablesManager({
  initial,
  waiters,
}: {
  initial: TableRow[];
  /** Who can have a section (waiters and managers). */
  waiters: { id: number; name: string }[];
}) {
  const t = useT('tables');
  const [tables, setTables] = useState(initial);
  const [name, setName] = useState('');
  const [seats, setSeats] = useState(4);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function run(url: string, method: 'POST' | 'PUT' | 'DELETE', body: unknown, ok: string) {
    setBusy(true);
    setMessage(null);
    try {
      await call(url, method, body, t('failed'));
      // Codes and QR images are made on the server: reload to show them.
      window.location.reload();
      setMessage({ text: ok, ok: true });
    } catch (err) {
      setMessage({ text: errorText(err, t('failed')), ok: false });
      setBusy(false);
    }
  }

  const query = q.trim().toLowerCase();
  const shown = tables.filter((x) => !query || x.name.toLowerCase().includes(query));

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run('/api/tables', 'POST', { name, seats }, t('added'));
        }}
        className="flex flex-wrap items-end gap-3 print:hidden"
      >
        <label className="text-sm font-medium">
          {t('name')}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={40}
            placeholder={t('namePlaceholder')}
            className={fieldClass}
          />
        </label>
        <label className="w-24 text-sm font-medium">
          {t('seats')}
          <input
            type="number"
            min={1}
            max={99}
            value={seats}
            onChange={(e) => setSeats(Number(e.target.value))}
            className={fieldClass}
          />
        </label>
        <button type="submit" disabled={busy} className={primaryButton}>
          {t('add')}
        </button>
        <button type="button" onClick={() => window.print()} className="text-sm underline">
          🖨️ {t('printStickers')}
        </button>
        <Link href="/floor" className="text-sm underline">
          {t('toFloor')}
        </Link>
      </form>
      {tables.length > 4 ? (
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('search')}
          aria-label={t('search')}
          className={`${fieldClass} max-w-xs print:hidden`}
        />
      ) : null}
      <Status message={message} />
      {tables.length ? (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 print:grid-cols-3">
          {shown.map((x) => (
            <li
              key={x.id}
              className="break-inside-avoid rounded-xl border border-ink/15 p-3 text-center dark:border-paper/20 print:border-black"
            >
              <p className="text-lg font-bold">{x.name}</p>
              <div
                className="mx-auto my-2 w-36 bg-white"
                // Our own SVG from the table's address (no user content).
                dangerouslySetInnerHTML={{ __html: x.qr }}
              />
              <p className="text-xs">{t('stickerHint')}</p>
              <label className="mt-2 block text-xs print:hidden">
                {t('section')}
                <select
                  value={x.waiterId ?? ''}
                  onChange={async (e) => {
                    const value = e.target.value;
                    const before = x.waiterId;
                    setTables((all) =>
                      all.map((r) =>
                        r.id === x.id ? { ...r, waiterId: value ? Number(value) : null } : r,
                      ),
                    );
                    try {
                      await call(
                        `/api/tables/${x.id}`,
                        'PUT',
                        { waiterId: value ? Number(value) : null },
                        t('failed'),
                      );
                      setMessage({ text: t('sectionSaved', { name: x.name }), ok: true });
                    } catch (err) {
                      setTables((all) =>
                        all.map((r) => (r.id === x.id ? { ...r, waiterId: before } : r)),
                      );
                      setMessage({ text: errorText(err, t('failed')), ok: false });
                    }
                  }}
                  className={`${fieldClass} mt-0.5 py-1 text-sm`}
                >
                  <option value="">{t('noSection')}</option>
                  {waiters.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mt-2 flex flex-wrap justify-center gap-3 text-sm print:hidden">
                <span>{t('seatsCount', { count: x.seats })}</span>
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    const n = window.prompt(t('renamePrompt'), x.name);
                    if (n)
                      void run(
                        `/api/tables/${x.id}`,
                        'PUT',
                        { name: n, seats: x.seats },
                        t('saved'),
                      );
                  }}
                >
                  {t('rename')}
                </button>
                <button
                  type="button"
                  className="underline"
                  onClick={() => {
                    if (window.confirm(t('newCodeConfirm', { name: x.name })))
                      void run(`/api/tables/${x.id}`, 'PUT', { newCode: true }, t('saved'));
                  }}
                >
                  {t('newCode')}
                </button>
                <button
                  type="button"
                  className={dangerLink}
                  onClick={() => {
                    if (window.confirm(t('removeConfirm', { name: x.name })))
                      void run(`/api/tables/${x.id}`, 'DELETE', undefined, t('removed'));
                  }}
                >
                  {t('remove')}
                </button>
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-ink/70 dark:text-paper/70">{t('empty')}</p>
      )}
    </div>
  );
}
