import { defineMessages } from './define';
import { opsDe } from './ops-de';
import { opsEn } from './ops-en';
import { opsHu } from './ops-hu';
import { opsRo } from './ops-ro';

/** Team roles and tasks, automatic discounts, maintenance and the shop's own languages. */
export const ops = defineMessages(opsEn, { de: opsDe, ro: opsRo, hu: opsHu });
