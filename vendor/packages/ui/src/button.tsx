import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'secondary' | 'ghost';

// Brand colours (docs/brand.md): Ink / Paper surfaces, Quake orange for focus.
const variants: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:bg-ink/85 dark:bg-paper dark:text-ink dark:hover:bg-paper/85',
  secondary: 'border border-ink/20 hover:bg-ink/5 dark:border-paper/20 dark:hover:bg-paper/10',
  ghost: 'hover:bg-ink/5 dark:hover:bg-paper/10',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/**
 * The button look, for links that act as buttons (<Link className={buttonClass()}>). Always use
 * this instead of copying the classes: every variant needs its dark-mode hover too, or the label
 * disappears on hover in the dark theme.
 */
export function buttonClass(variant: Variant = 'primary', className?: string) {
  return cn(
    'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
    'focus-visible:ring-2 focus-visible:ring-quake focus-visible:ring-offset-2 focus-visible:ring-offset-paper focus-visible:outline-none dark:focus-visible:ring-offset-ink',
    variants[variant],
    className,
  );
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return <button className={buttonClass(variant, className)} {...props} />;
}
