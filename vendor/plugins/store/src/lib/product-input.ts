import type { PluginDatabase } from '@devquake/plugin-sdk';
import { checkProductLinks, fieldsOfTypes } from './catalog-data';
import type { ProductInput } from './data';
import { checkValues, productInput, readBody } from './validate';

/**
 * A product from the form: its texts and options checked, its type and vendor this store's own,
 * and its field values checked against the type's fields.
 */
export async function readProduct(
  db: PluginDatabase,
  storeId: number,
  request: Request,
  timeZone: string,
): Promise<ProductInput> {
  const { rawValues, ...input } = productInput(await readBody(request), timeZone);
  await checkProductLinks(db, storeId, input.typeId, input.vendorId);
  const fields =
    input.typeId === null
      ? []
      : ((await fieldsOfTypes(db, storeId, [input.typeId])).get(input.typeId) ?? []);
  return { ...input, values: checkValues(fields, rawValues) };
}
