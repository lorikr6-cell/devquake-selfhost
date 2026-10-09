import type { ReactNode } from 'react';
import { cn, thumbUrl } from '@devquake/ui';
import { FOOD_ICONS, isFoodIcon, isHexColour, type FoodIcon } from '../lib/food-icons';
import type { FoodThumb } from '../lib/food-model';

// Small drawn thumbnails for ingredients (lib/food-icons.ts lists the shapes). Flat shapes on a
// 32 × 32 grid, in the food's colour, with a thin outline so pale foods (eggs, flour) stay
// visible on light and dark backgrounds. No hooks: works in server and client components.

const STEM = '#6b4a2a';
const GREEN = '#4f9a3f';
const DARK_GREEN = '#3f7a2f';
const LIGHT = '#ffffff';
const SHADE = '#000000';
const METAL = '#6b6f76';
const BONE = '#f4efe4';

const hi = (props: Record<string, number>) => <ellipse {...props} fill={LIGHT} opacity={0.35} />;

const SHAPES: Record<FoodIcon, (c: string) => ReactNode> = {
  round: (c) => (
    <>
      <path
        d="M16 9c-3-2-9-1.5-9 6 0 6 4 11 7 11 1 0 1.5-.5 2-.5s1 .5 2 .5c3 0 7-5 7-11 0-7.5-6-8-9-6z"
        fill={c}
      />
      <path
        d="M16 9c0-2 .5-4 2-5"
        stroke={STEM}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M17.5 7c1-3 4-3.5 6-3-1 2.5-3 3.5-6 3z" fill={GREEN} />
      {hi({ cx: 11.5, cy: 14.5, rx: 1.6, ry: 3 })}
    </>
  ),
  citrus: (c) => (
    <>
      <circle cx={16} cy={16} r={11} fill={c} />
      <circle cx={16} cy={16} r={8.5} fill={LIGHT} opacity={0.4} stroke="none" />
      <path d="M16 7.5v17M8.6 11.75l14.8 8.5M8.6 20.25l14.8-8.5" stroke={c} strokeWidth={1.4} />
    </>
  ),
  pear: (c) => (
    <>
      <path
        d="M16 6c-2 0-3 2-3 4.5 0 2-4 4.5-4 9.5 0 4 3 6.5 7 6.5s7-2.5 7-6.5c0-5-4-7.5-4-9.5C19 8 18 6 16 6z"
        fill={c}
      />
      <path d="M16 6V3.5" stroke={STEM} strokeWidth={1.6} strokeLinecap="round" />
      <path d="M16.5 5c1.5-2 3.5-2.5 5-2-1 2-2.5 2.5-5 2z" fill={GREEN} />
      {hi({ cx: 12.5, cy: 19, rx: 1.4, ry: 2.6 })}
    </>
  ),
  cherry: (c) => (
    <>
      <path
        d="M10 20c1-7 4-12 9-15M22 19c-1-6-2-10-3-14"
        stroke={DARK_GREEN}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={10} cy={23} r={5} fill={c} />
      <circle cx={22} cy={22} r={5} fill={c} />
      {hi({ cx: 8.3, cy: 21.5, rx: 1.1, ry: 1.6 })}
      {hi({ cx: 20.3, cy: 20.5, rx: 1.1, ry: 1.6 })}
    </>
  ),
  berry: (c) => (
    <>
      {[
        [11, 13],
        [20, 12],
        [15.5, 20],
        [23, 20],
        [8.5, 21],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r={4.6} fill={c} />
          <circle cx={x! - 1.4} cy={y! - 1.4} r={1} fill={LIGHT} opacity={0.4} stroke="none" />
        </g>
      ))}
    </>
  ),
  grapes: (c) => (
    <>
      <path d="M16 8V3.5" stroke={STEM} strokeWidth={1.6} strokeLinecap="round" />
      <path d="M16.5 5.5c2-2 4.5-2.5 6.5-1.5-1.5 2-4 2.5-6.5 1.5z" fill={GREEN} />
      {[
        [10, 11],
        [16, 11],
        [22, 11],
        [13, 16.5],
        [19, 16.5],
        [10, 21.5],
        [16, 22],
        [22, 21.5],
        [16, 27],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={3.4} fill={c} />
      ))}
    </>
  ),
  strawberry: (c) => (
    <>
      <path d="M16 28c-5-3-9-9-9-13 0-3 3-4.5 9-4.5s9 1.5 9 4.5c0 4-4 10-9 13z" fill={c} />
      <path
        d="M9 11c2-1 4-1.5 7-1.5s5 .5 7 1.5l-3-3.5-2 1.5L16 5.5 14 9l-2-1.5z"
        fill={DARK_GREEN}
      />
      {[
        [12, 15],
        [16, 14.5],
        [20, 15],
        [14, 19],
        [18, 19],
        [16, 23],
      ].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={0.7} ry={1} fill="#f6e27a" stroke="none" />
      ))}
    </>
  ),
  banana: (c) => (
    <>
      <path d="M6 8c1 10 6 16 15 17 3 .3 5-.5 6-2-6 0-12-3-15-9-1-2-2-4-2-6z" fill={c} />
      <path d="M6 8L5 5.5l2.5.8z" fill={STEM} />
      <path
        d="M9 11c1.5 6 6 11 13 12.5"
        stroke={SHADE}
        strokeOpacity={0.15}
        strokeWidth={1.3}
        fill="none"
      />
    </>
  ),
  pineapple: (c) => (
    <>
      <path d="M16 13l-3.5-7 3 2.5 .5-5 .5 5 3-2.5z" fill={GREEN} />
      <ellipse cx={16} cy={20} rx={7} ry={8} fill={c} />
      <path
        d="M11 15l10 10M10 20l7 7M14 13l8 8M21 15L11 25M22 20l-7 7M18 13l-8 8"
        stroke={SHADE}
        strokeOpacity={0.18}
        strokeWidth={0.9}
      />
    </>
  ),
  melon: (c) => (
    <>
      <path d="M3 12h26a13 13 0 0 1-26 0z" fill={GREEN} />
      <path d="M5.5 12h21a10.5 10.5 0 0 1-21 0z" fill={c} stroke="none" />
      {[
        [11, 16],
        [16, 18],
        [21, 16],
        [13.5, 20.5],
        [18.5, 20.5],
      ].map(([x, y]) => (
        <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={0.8} ry={1.3} fill="#2a2a2a" stroke="none" />
      ))}
    </>
  ),
  avocado: (c) => (
    <>
      <path
        d="M16 3c-3 0-4.5 3-5 6-.5 3-4 5.5-4 11 0 5 4 8 9 8s9-3 9-8c0-5.5-3.5-8-4-11-.5-3-2-6-5-6z"
        fill="#3f6b2a"
      />
      <path
        d="M16 5.5c-2 0-3 2.5-3.3 4.8-.4 2.7-3.7 5-3.7 9.7 0 4 3 6 7 6s7-2 7-6c0-4.7-3.3-7-3.7-9.7C19 8 18 5.5 16 5.5z"
        fill={c}
        stroke="none"
      />
      <circle cx={16} cy={19.5} r={3.8} fill="#8a5a32" />
    </>
  ),
  tomato: (c) => (
    <>
      <ellipse cx={16} cy={18} rx={11} ry={9.5} fill={c} />
      <path
        d="M16 8.5l1.5 2.5 3.5-1.2-1.8 2.7 3.3 1.3h-4.3L16 15.5l-2.2-1.7H9.5l3.3-1.3-1.8-2.7 3.5 1.2z"
        fill={DARK_GREEN}
      />
      {hi({ cx: 10, cy: 17, rx: 1.6, ry: 3 })}
    </>
  ),
  pepper: (c) => (
    <>
      <path
        d="M9 13c0-2 2-3 4-3 1 0 2 .5 3 .5s2-.5 3-.5c2 0 4 1 4 3 0 6-1 14-4 14-1 0-2-1-3-1s-2 1-3 1c-3 0-4-8-4-14z"
        fill={c}
      />
      <path
        d="M16 10.5c0-2 .5-4 2.5-5.5"
        stroke={DARK_GREEN}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M16 12v13" stroke={SHADE} strokeOpacity={0.15} strokeWidth={1.2} />
      {hi({ cx: 11.5, cy: 17, rx: 1.3, ry: 3.5 })}
    </>
  ),
  chili: (c) => (
    <>
      <path d="M8 8c2 0 3 2 4 4 2 5 6 10 14 13-6 2.5-15-1.5-18-9-1-3-1-6 0-8z" fill={c} />
      <path
        d="M8.5 8.5C7 7 7 5 9 3.5"
        stroke={DARK_GREEN}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M10 12c1 5 5 9 11 11.5"
        stroke={LIGHT}
        strokeOpacity={0.35}
        strokeWidth={1.2}
        fill="none"
      />
    </>
  ),
  carrot: (c) => (
    <>
      <path
        d="M15 10c0-3-1-5-3-7M16 10c1-3 3-5 6-6M17 11c2-2 5-3 8-2"
        stroke={GREEN}
        strokeWidth={1.8}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M11 9.5c3-1 7 0 9 2-2 6-7 13-11 17-.8.3-1.3 0-1.2-.8C8.5 21.5 9 14.5 11 9.5z"
        fill={c}
      />
      <path
        d="M11 14l3 1M10.3 19l2.7.8M9.7 23.5l2 .5"
        stroke={SHADE}
        strokeOpacity={0.2}
        strokeWidth={1}
        strokeLinecap="round"
      />
    </>
  ),
  tuber: (c) => (
    <>
      <path d="M6 17c0-5 4.5-9 10.5-9S26 11 26 16s-4.5 9-10.5 9S6 22 6 17z" fill={c} />
      {[
        [11, 14],
        [18, 12.5],
        [21, 19],
        [13, 20],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={0.8} fill={SHADE} opacity={0.3} stroke="none" />
      ))}
      {hi({ cx: 11, cy: 12, rx: 2.5, ry: 1.2 })}
    </>
  ),
  bulb: (c) => (
    <>
      <path
        d="M16 4c1 3 3 4.5 6 7.5s4 6 4 9-3 6.5-10 6.5S6 23.5 6 20.5s1-6 4-9 5-4.5 6-7.5z"
        fill={c}
      />
      <path
        d="M16 6c-1 5-5 9-5 15M16 6c1 5 5 9 5 15M16 6v20"
        stroke={SHADE}
        strokeOpacity={0.15}
        strokeWidth={1}
        fill="none"
      />
      <path
        d="M13 27l-1 2.5M16 27v3M19 27l1 2.5"
        stroke="#8a6a4a"
        strokeWidth={1}
        strokeLinecap="round"
      />
    </>
  ),
  leafy: (c) => (
    <>
      <circle cx={16} cy={17} r={10.5} fill={c} />
      <path
        d="M16 27.5c-3-4-3-14 0-19.5M16 27.5c4-3 7.5-9 6.5-15.5M16 27.5c-4-3-7.5-9-6.5-15.5"
        stroke={SHADE}
        strokeOpacity={0.2}
        strokeWidth={1.1}
        fill="none"
      />
      {hi({ cx: 11, cy: 13, rx: 2.2, ry: 1.3 })}
    </>
  ),
  floret: (c) => (
    <>
      <path d="M13 18h6l-1 10h-4z" fill="#9cc46a" />
      {[
        [10.5, 14, 5],
        [16, 9.5, 5.5],
        [21.5, 14, 5],
        [16, 15.5, 5],
      ].map(([x, y, r]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={c} />
      ))}
    </>
  ),
  long: (c) => (
    <>
      <path d="M7 24c-2-2-1-5 2-8l7-7c3-3 6-4 8-2s1 5-2 8l-7 7c-3 3-6 4-8 2z" fill={c} />
      <path d="M23.5 6.5L26.5 3.5" stroke={DARK_GREEN} strokeWidth={2.4} strokeLinecap="round" />
      <path
        d="M9.5 19.5l9-9"
        stroke={LIGHT}
        strokeOpacity={0.35}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </>
  ),
  corn: (c) => (
    <>
      <path d="M10 26c-3-3 0-11 5-16s9.5-6 10.5-5-.5 8.5-5.5 13.5-7 10.5-10 7.5z" fill={c} />
      <path
        d="M13 19l7-7M11.5 16.5l7-7M14.5 21.5l7-7"
        stroke={SHADE}
        strokeOpacity={0.15}
        strokeWidth={1.2}
      />
      <path
        d="M7.5 28.5c0-6 2-10 6-12-2 4-3 8-2 12zM7.5 28.5c4-1 8-3 10-7-4 1-7 3-10 7z"
        fill="#6aa84f"
      />
    </>
  ),
  pod: (c) => (
    <>
      <path d="M4 21c4-8 13.5-13.5 23-12.5-3 9.5-12.5 14.5-23 12.5z" fill={c} />
      {[
        [10.5, 17.5],
        [15, 15],
        [19.5, 12.8],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={2.3} fill={LIGHT} opacity={0.35} stroke="none" />
      ))}
    </>
  ),
  mushroom: (c) => (
    <>
      <path d="M12 16h8l-1 11h-6z" fill="#efe6d6" />
      <path d="M4.5 16.5c0-6.5 5-11 11.5-11s11.5 4.5 11.5 11z" fill={c} />
      {hi({ cx: 11, cy: 10.5, rx: 2.4, ry: 1.2 })}
    </>
  ),
  leaf: (c) => (
    <>
      <path d="M6 26C6 14.5 13.5 7 26.5 6c0 12.5-7.5 20-20.5 20z" fill={c} />
      <path
        d="M6 26L21.5 10.5M11 21l-.5-5M15 17l-.3-5M11 21l5 .3M15 17l5 .3"
        stroke={SHADE}
        strokeOpacity={0.2}
        strokeWidth={1.1}
        strokeLinecap="round"
      />
    </>
  ),
  sprig: (c) => (
    <g stroke={c} strokeWidth={1.8} strokeLinecap="round" fill="none">
      <path d="M8 28C12 20 17 12.5 24 5" />
      <path d="M11 22l-4.5-2M11 22l1-4.8M14 17l-4.5-2M14 17l1-4.8M17.5 12.5l-4.3-1.8M17.5 12.5l1-4.7M21 8.5l-3.8-1.5M21 8.5l.8-4.2" />
    </g>
  ),
  seeds: (c) => (
    <>
      {[
        [9.5, 23, -20],
        [15, 24, 10],
        [20.5, 23, -10],
        [25, 24.5, 30],
        [12, 18.5, 25],
        [17.5, 18.5, -15],
        [23, 18.5, 15],
        [14.5, 13.5, -5],
        [20, 13.5, 20],
      ].map(([x, y, a]) => (
        <ellipse
          key={`${x}-${y}`}
          cx={x}
          cy={y}
          rx={2.6}
          ry={1.7}
          fill={c}
          transform={`rotate(${a} ${x} ${y})`}
        />
      ))}
    </>
  ),
  jar: (c) => (
    <>
      <rect x={8} y={11} width={16} height={17} rx={3} fill={c} />
      <rect x={9} y={6} width={14} height={5} rx={1.5} fill={METAL} />
      <rect
        x={10.5}
        y={16}
        width={11}
        height={6.5}
        rx={1}
        fill={LIGHT}
        opacity={0.6}
        stroke="none"
      />
    </>
  ),
  stick: (c) => (
    <>
      <path d="M5 21L19 7l3.5 3.5-14 14z" fill={c} />
      <path d="M10 26L24 12l3.5 3.5-14 14z" fill={c} />
      <path d="M7 21.5l13-13M12 26.5l13-13" stroke={SHADE} strokeOpacity={0.22} strokeWidth={1} />
    </>
  ),
  nut: (c) => (
    <>
      <path d="M16 4c5 4 8.5 10 8.5 15a8.5 8.5 0 0 1-17 0C7.5 14 11 8 16 4z" fill={c} />
      <path
        d="M16 6.5c-1.5 5-1.5 13 0 19.5M12 12c-.5 4 0 9 1.5 12M20 12c.5 4 0 9-1.5 12"
        stroke={SHADE}
        strokeOpacity={0.18}
        strokeWidth={1}
        fill="none"
      />
    </>
  ),
  grain: (c) => (
    <>
      <path d="M6.5 17c1-5.5 5-8.5 9.5-8.5s8.5 3 9.5 8.5z" fill={c} />
      <path d="M4.5 17h23a11.5 9.5 0 0 1-23 0z" fill="#8a9aa6" />
      <path
        d="M11 13.5l1.5-.5M15.5 11.5l1.5.3M19.5 13.5l1.5.6M13.5 15.5l1.4-.2"
        stroke={SHADE}
        strokeOpacity={0.25}
        strokeWidth={1}
        strokeLinecap="round"
      />
    </>
  ),
  bread: (c) => (
    <>
      <path
        d="M5 15c0-5 5-8 11-8s11 3 11 8c0 1-1 2-2 2v8c0 1-1 2-2 2H9c-1 0-2-1-2-2v-8c-1 0-2-1-2-2z"
        fill={c}
      />
      <path
        d="M11 11l2 3M15 10l2 3M19 10.5l2 3"
        stroke={SHADE}
        strokeOpacity={0.2}
        strokeWidth={1.3}
        strokeLinecap="round"
      />
    </>
  ),
  pasta: (c) => (
    <>
      <g stroke={c} strokeWidth={1.7} strokeLinecap="round">
        <path d="M6 26L24 6M8 27L26 7M10 28L28 8M5 24L22 5M11.5 29L28 10.5" />
      </g>
      <path d="M12 19.5l4.5 4 3-3.3-4.5-4z" fill="#d94b3b" />
    </>
  ),
  bottle: (c) => (
    <>
      <path
        d="M13 6h6v3c3 1.5 4 3.5 4 6v11a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V15c0-2.5 1-4.5 4-6z"
        fill={c}
      />
      <rect x={13} y={3} width={6} height={3.5} rx={1} fill={METAL} />
      <rect
        x={10.5}
        y={17}
        width={11}
        height={6.5}
        rx={1}
        fill={LIGHT}
        opacity={0.6}
        stroke="none"
      />
    </>
  ),
  drop: (c) => (
    <>
      <path d="M16 3.5c4 6.5 9.5 11.5 9.5 16.5a9.5 9.5 0 0 1-19 0c0-5 5.5-10 9.5-16.5z" fill={c} />
      {hi({ cx: 12, cy: 20, rx: 1.6, ry: 3 })}
    </>
  ),
  block: (c) => (
    <>
      <path d="M5 13v11l11 5V18z" fill={c} />
      <path d="M27 13v11l-11 5V18z" fill={c} />
      <path d="M27 13v11l-11 5V18z" fill={SHADE} opacity={0.15} stroke="none" />
      <path d="M5 13l11-5 11 5-11 5z" fill={c} />
      <path d="M5 13l11-5 11 5-11 5z" fill={LIGHT} opacity={0.3} stroke="none" />
    </>
  ),
  egg: (c) => (
    <>
      <path d="M16 4c5 0 9 8 9 14a9 9 0 0 1-18 0c0-6 4-14 9-14z" fill={c} />
      {hi({ cx: 12.5, cy: 15, rx: 1.6, ry: 3 })}
    </>
  ),
  meat: (c) => (
    <>
      <path d="M6 14c0-5 6-8 12-8 6 0 9 4 9 9 0 6-5 11-12 11-5 0-9-3-9-7 0-2 1-3 0-5z" fill={c} />
      <path
        d="M8 13.5C9 9.5 13.5 7.5 18 7.5"
        stroke="#f4e3d7"
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <circle cx={19} cy={16} r={2.6} fill={BONE} />
    </>
  ),
  drumstick: (c) => (
    <>
      <path d="M11.5 20.5l-4.5 4.5" stroke={BONE} strokeWidth={3} strokeLinecap="round" />
      <circle cx={5.8} cy={23.8} r={2} fill={BONE} />
      <circle cx={8.2} cy={26.2} r={2} fill={BONE} />
      <path
        d="M20 4.5c4.5 0 8 3.5 7.5 8.5-.5 4.5-5 8-9.5 7.5l-4 3-3-3 3-4c-.5-4 1.5-12 6-12z"
        fill={c}
      />
      {hi({ cx: 21, cy: 9, rx: 1.4, ry: 2.4 })}
    </>
  ),
  fish: (c) => (
    <>
      <path
        d="M3.5 16c4-6 10-8 16-6 2 .7 3.5 2 4.5 3L28.5 9v14L24 19c-1 1-2.5 2.3-4.5 3-6 2-12 0-16-6z"
        fill={c}
      />
      <circle cx={9} cy={15} r={1.3} fill="#1f2937" stroke="none" />
      <path
        d="M13 11.5c1.5 3 1.5 6 0 9"
        stroke={SHADE}
        strokeOpacity={0.2}
        strokeWidth={1.1}
        fill="none"
      />
    </>
  ),
  shrimp: (c) => (
    <>
      <path
        d="M22 7c-7 0-13 5-13 12 0 4 3 7 7 7 3 0 5-2 5-4.5S19 18 17 18c-1.5 0-2.5 1-2.5 2"
        stroke={c}
        strokeWidth={5}
        fill="none"
        strokeLinecap="round"
      />
      <path d="M22 4.5l5.5-1-2 3.5 2 3.5-5.5-1z" fill={c} />
      <path
        d="M12 13l3 2M10.5 18h3.5M12 23l2.5-2"
        stroke={SHADE}
        strokeOpacity={0.2}
        strokeWidth={1}
        strokeLinecap="round"
      />
    </>
  ),
  can: (c) => (
    <>
      <rect x={8} y={7} width={16} height={20} rx={2} fill={c} />
      <ellipse cx={16} cy={7.5} rx={8} ry={2.5} fill={METAL} />
      <rect x={8} y={12} width={16} height={9} fill={LIGHT} opacity={0.55} stroke="none" />
    </>
  ),
  cube: (c) => (
    <>
      <path d="M4 15v9l9 4v-9z" fill={c} />
      <path d="M22 15v9l-9 4v-9z" fill={c} />
      <path d="M22 15v9l-9 4v-9z" fill={SHADE} opacity={0.12} stroke="none" />
      <path d="M4 15l9-4 9 4-9 4z" fill={c} />
      <path d="M18 9v6l6 2.7V12z" fill={c} />
      <path d="M30 9v6l-6 2.7V12z" fill={c} />
      <path d="M18 9l6-2.7L30 9l-6 3z" fill={c} />
    </>
  ),
  shaker: (c) => (
    <>
      <path d="M10 12h12l-1.5 15h-9z" fill={c} />
      <path d="M10 12c0-4 2.5-6.5 6-6.5s6 2.5 6 6.5z" fill={METAL} />
      {[
        [14, 9],
        [16, 8],
        [18, 9],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={0.6} fill="#1f2937" stroke="none" />
      ))}
    </>
  ),
};

/**
 * An ingredient's thumbnail. Unknown icons (or none) draw nothing, so callers can show it
 * without checking; `title` is the food's name for screen readers, or empty when the name is
 * written next to it.
 */
export function FoodIconImage({
  icon,
  colour,
  title,
  className,
}: {
  icon: string | null | undefined;
  colour?: string | null;
  title?: string;
  className?: string;
}) {
  if (!isFoodIcon(icon)) return null;
  const fill = isHexColour(colour) ? colour : FOOD_ICONS[icon];
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn('size-6 shrink-0', className)}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title || undefined}
    >
      <g stroke="rgba(0, 0, 0, 0.22)" strokeWidth={0.7} strokeLinejoin="round">
        {SHAPES[icon](fill)}
      </g>
    </svg>
  );
}

/**
 * A food's thumbnail for this viewer: its picture (theirs, or the one chosen for everyone) when
 * there is one, otherwise the drawing. Same size either way.
 */
export function FoodThumbImage({
  thumb,
  title,
  className,
}: {
  thumb: FoodThumb | null | undefined;
  title?: string;
  className?: string;
}) {
  if (!thumb) return null;
  if (thumb.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- served by the app's own API
      <img
        src={thumbUrl(thumb.photo)}
        alt={title ?? ''}
        loading="lazy"
        className={cn('size-6 shrink-0 rounded-md object-cover', className)}
      />
    );
  }
  return (
    <FoodIconImage icon={thumb.icon} colour={thumb.colour} title={title} className={className} />
  );
}
