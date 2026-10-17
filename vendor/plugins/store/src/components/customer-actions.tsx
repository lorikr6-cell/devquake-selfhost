'use client';

import { Button, useT } from '@devquake/ui';
import { callApi, errorMessage } from './call-api';
import { useFeedback } from './feedback';
import { useAppRouter } from './use-app-router';

/**
 * Blocking a buyer (no sign-in, reviews, messages, votes or favourites) or deleting their account
 * (orders stay); for a member without an account, removing their votes and favourites (ADR 0064).
 * Both ask first in the shop's own dialog.
 */
export function CustomerActions({
  customerKey,
  name,
  blocked,
  account,
}: {
  customerKey: string;
  name: string;
  blocked: boolean;
  account: boolean;
}) {
  const t = useT('customers');
  const tErrors = useT('errors');
  const { toast, confirm } = useFeedback();
  const router = useAppRouter();

  async function run(call: () => Promise<unknown>, done: string, after?: string) {
    try {
      await call();
      toast(done);
      if (after) router.push(after);
      else router.refresh();
    } catch (err) {
      toast(errorMessage(err, tErrors), 'error');
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {account ? (
        <Button
          variant="secondary"
          onClick={async () => {
            const ok = await confirm({
              title: t(blocked ? 'unblockTitle' : 'blockTitle', { name }),
              body: t(blocked ? 'unblockBody' : 'blockBody'),
              confirmLabel: t(blocked ? 'unblock' : 'block'),
              danger: !blocked,
            });
            if (ok) {
              await run(
                () => callApi(`/customers/${customerKey}`, 'PATCH', { blocked: !blocked }),
                t(blocked ? 'unblocked' : 'blockedDone'),
              );
            }
          }}
        >
          {t(blocked ? 'unblock' : 'block')}
        </Button>
      ) : null}
      <Button
        variant="secondary"
        className="border-red-300 text-red-800 dark:border-red-800 dark:text-red-300"
        onClick={async () => {
          const ok = await confirm({
            title: t(account ? 'deleteTitle' : 'forgetTitle', { name }),
            body: t(account ? 'deleteBody' : 'forgetBody'),
            confirmLabel: t(account ? 'delete' : 'forget'),
            danger: true,
          });
          if (ok) {
            await run(
              () => callApi(`/customers/${customerKey}`, 'DELETE'),
              t(account ? 'deleted' : 'forgotten'),
              '/customers',
            );
          }
        }}
      >
        {t(account ? 'delete' : 'forget')}
      </Button>
    </div>
  );
}
