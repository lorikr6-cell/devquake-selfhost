'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import { useT } from '@devquake/ui';
import { formatTime } from '../lib/meals';
import type { DayRoute, StopPosition } from '../lib/routes-data';
import { callApi } from './call-api';

interface Positions {
  stops: StopPosition[];
  kitchen: StopPosition | null;
  missing: number;
}

const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

/**
 * The driver's stops as numbered pins on an OpenStreetMap map (Leaflet; the tiles come from
 * openstreetmap.org, which sees the area viewed). Pins turn green once delivered; the kitchen is
 * a house. Positions are asked for only when the map is opened.
 */
export function RouteMap({ orgId, day, route }: { orgId: number; day: string; route: DayRoute }) {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  const [positions, setPositions] = useState<Positions | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let stopped = false;
    callApi<Positions>(`/orgs/${orgId}/my-route/positions?day=${day}`)
      .then((p) => !stopped && setPositions(p))
      .catch(() => !stopped && setError(t('myRoute.mapFailed')));
    return () => {
      stopped = true;
    };
  }, [orgId, day, t]);

  useEffect(() => {
    if (!positions || !box.current) return;
    let map: import('leaflet').Map | null = null;
    let cancelled = false;
    void import('leaflet').then((L) => {
      if (cancelled || !box.current) return;
      map = L.map(box.current, { scrollWheelZoom: false });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const points: [number, number][] = [];
      route.stops.forEach((s, i) => {
        const at = positions.stops.find((p) => p.personId === s.id);
        if (!at) return;
        points.push([at.lat, at.lng]);
        const done = Boolean(s.deliveredAt);
        L.marker([at.lat, at.lng], {
          icon: L.divIcon({
            className: '',
            html: `<span style="display:grid;place-items:center;width:30px;height:30px;border-radius:9999px;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);font:600 13px system-ui;color:white;background:${done ? '#059669' : '#ff5a1f'}">${i + 1}</span>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          }),
        })
          .addTo(map!)
          .bindPopup(
            `<strong>${i + 1}. ${esc(s.name)}</strong><br>${esc(s.address ?? '')}<br>${formatTime(s.etaMin)}${done ? ` · ✓ ${esc(t('myRoute.delivered'))}` : ''}`,
          );
      });
      if (positions.kitchen) {
        const k = positions.kitchen;
        points.push([k.lat, k.lng]);
        L.marker([k.lat, k.lng], {
          icon: L.divIcon({
            className: '',
            html: '<span style="font-size:24px">🏠</span>',
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
        }).addTo(map);
      }
      if (points.length) map.fitBounds(points, { padding: [30, 30], maxZoom: 16 });
      else map.setView([45.9, 24.97], 6); // Romania, when nothing could be placed
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [positions, route]);

  return (
    <div>
      {error ? <p className="mb-2 text-sm text-red-700 dark:text-red-400">{error}</p> : null}
      {!positions && !error ? <p className="mb-2 text-sm">{t('myRoute.mapLoading')}</p> : null}
      {positions?.missing ? (
        <p className="mb-2 text-sm text-amber-800 dark:text-amber-300">
          {t('myRoute.mapMissing', { count: positions.missing })}
        </p>
      ) : null}
      <div
        ref={box}
        className="h-[65vh] min-h-80 w-full overflow-hidden rounded-xl border border-ink/10 dark:border-paper/10"
      />
    </div>
  );
}
