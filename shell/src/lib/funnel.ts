import { APP } from '@/generated/app';
import { flag } from './env';

// Links back to DevQuake (ADR 0054): the hosted version of this app and the other apps. Only
// UTM parameters on the links; the instance never calls home.

const utm = (medium: string) =>
  `utm_source=selfhost&utm_medium=${encodeURIComponent(medium)}&utm_campaign=${encodeURIComponent(APP.id)}`;

export const hostedUrl = (medium: string) => `${APP.hostedUrl}/?${utm(medium)}`;
export const devquakeUrl = (medium: string) => `https://devquake.com/?${utm(medium)}`;
export const ISSUES_URL = 'https://github.com/lorikr6-cell/devquake-selfhost/issues';

/** SHOW_POWERED_BY=false hides the footer line. */
export const showPoweredBy = () => flag('SHOW_POWERED_BY', true);
