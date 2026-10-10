import { shopApi } from '../lib/api';
import { HttpError } from '../lib/http';
import { VOUCHER_CODE, normalizeCode, publicVoucher, voucherProblem } from '../lib/marketing';
import { voucherByCode } from '../lib/marketing-data';
import { readBody } from '../lib/validate';

// POST /api/s/:slug/voucher { code }: whether a voucher can be used now, and what it gives (a
// key route; limited per address so codes cannot be guessed). Checkout checks it again.
export const POST = shopApi(
  async ({ request, db, store }) => {
    const code = normalizeCode(String((await readBody(request, 4096)).code ?? ''));
    const voucher = VOUCHER_CODE.test(code) ? await voucherByCode(db, store.id, code) : null;
    const problem = voucherProblem(voucher, new Date());
    if (problem || !voucher)
      throw new HttpError(problem === 'unknown' ? 404 : 409, `voucher.${problem}`);
    return { voucher: publicVoucher(voucher) };
  },
  { limit: 10, sameSite: true },
);
