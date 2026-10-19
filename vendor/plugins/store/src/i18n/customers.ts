import { defineMessages } from './define';
import { customersDe } from './customers-de';
import { customersEn } from './customers-en';
import { customersHu } from './customers-hu';
import { customersIt } from './customers-it';
import { customersEs } from './customers-es';
import { customersRo } from './customers-ro';

/** Favourites and the shop's customers (ADR 0064). */
export const customers = defineMessages(customersEn, {
  de: customersDe,
  ro: customersRo,
  hu: customersHu,
  it: customersIt,
  es: customersEs,
});
