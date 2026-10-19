import { defineMessages } from './define';
import { opsDe } from './ops-de';
import { opsEn } from './ops-en';
import { opsHu } from './ops-hu';
import { opsIt } from './ops-it';
import { opsEs } from './ops-es';
import { opsRo } from './ops-ro';

/** Team roles and tasks, automatic discounts, maintenance and the shop's own languages. */
export const ops = defineMessages(opsEn, { de: opsDe, ro: opsRo, hu: opsHu, it: opsIt, es: opsEs });
