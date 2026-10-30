import type { CSSProperties, ReactNode } from 'react';
import { DESIGN_FONT_STACK, type MenuDesign } from '../lib/design';
import { allergensOf, formatMinor } from '../lib/model';

export interface SheetMenu {
  name: string;
  currency: string;
  decimals: number;
  categories: { id: number; name: string }[];
  items: {
    id: number;
    categoryId: number;
    name: string;
    description: string | null;
    priceMinor: number;
    allergens: number;
    available: boolean;
  }[];
}

/** The page's look from the owner's design: background, font, colours and the reading panel. */
export function sheetStyle(design: MenuDesign, backgroundUrl: string | null): CSSProperties {
  return {
    fontFamily: DESIGN_FONT_STACK[design.font],
    color: design.panel === 'dark' ? '#f5f5f4' : design.textColor,
    backgroundColor: '#ffffff',
    backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}

export const panelStyle = (design: MenuDesign): CSSProperties =>
  design.panel === 'none'
    ? {}
    : {
        background: design.panel === 'dark' ? 'rgba(17,17,17,.72)' : 'rgba(255,255,255,.82)',
        borderRadius: 12,
        padding: '28px 32px',
      };

/**
 * The menu as the owner designed it: the title and subtitle, then each category with its items,
 * prices and (if chosen) allergens, on the flattened background. No hooks: used by the print
 * view, the designer's preview and the public menu.
 */
export function MenuSheet({
  menu,
  design,
  backgroundUrl,
  allergenName,
  soldOut,
  className,
  children,
}: {
  menu: SheetMenu;
  design: MenuDesign;
  backgroundUrl: string | null;
  /** The allergens' names in the page language. */
  allergenName: (code: string) => string;
  soldOut: string;
  className?: string;
  children?: ReactNode;
}) {
  const sections = menu.categories
    .map((c) => ({ c, items: menu.items.filter((i) => i.categoryId === c.id) }))
    .filter((s) => s.items.length);
  return (
    <div className={className} style={sheetStyle(design, backgroundUrl)}>
      <div style={panelStyle(design)}>
        <header style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 700, color: design.accentColor, margin: 0 }}>
            {design.title || menu.name}
          </h1>
          {design.subtitle ? (
            <p style={{ marginTop: 6, fontSize: '1.1rem' }}>{design.subtitle}</p>
          ) : null}
        </header>
        {children}
        <div style={{ columnCount: design.columns, columnGap: 36 }}>
          {sections.map(({ c, items }) => (
            <section key={c.id} style={{ breakInside: 'avoid', marginBottom: 22 }}>
              <h2
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: design.accentColor,
                  borderBottom: `2px solid ${design.accentColor}`,
                  paddingBottom: 4,
                  marginBottom: 10,
                }}
              >
                {c.name}
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {items.map((i) => (
                  <li key={i.id} style={{ marginBottom: 10, opacity: i.available ? 1 : 0.5 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>{i.name}</span>
                      <span
                        aria-hidden="true"
                        style={{ flex: 1, borderBottom: '1px dotted currentColor', opacity: 0.4 }}
                      />
                      <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {formatMinor(i.priceMinor, menu.decimals)} {menu.currency}
                      </span>
                    </div>
                    {i.description ? (
                      <p style={{ fontSize: '.92rem', opacity: 0.85, margin: '2px 0 0' }}>
                        {i.description}
                      </p>
                    ) : null}
                    {design.showAllergens && i.allergens ? (
                      <p style={{ fontSize: '.78rem', opacity: 0.7, margin: '2px 0 0' }}>
                        {allergensOf(i.allergens).map(allergenName).join(', ')}
                      </p>
                    ) : null}
                    {i.available ? null : (
                      <p style={{ fontSize: '.78rem', margin: 0 }}>{soldOut}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
