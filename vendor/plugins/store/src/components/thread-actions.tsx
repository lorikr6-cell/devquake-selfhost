'use client';

import { useState, type FormEvent } from 'react';
import { Button, useT } from '@devquake/ui';
import { MESSAGE_LIMITS } from '../lib/buyers-data-limits';
import { callApi } from './call-api';
import { useFeedback } from './feedback';
import { ErrorText, TextArea } from './ui';
import { useAction } from './use-action';

/** The team's answer to a buyer (they get an email) and closing or reopening the conversation. */
export function ThreadActions({
  threadId,
  status,
}: {
  threadId: number;
  status: 'open' | 'closed';
}) {
  const t = useT('inbox');
  const { toast } = useFeedback();
  const { busy, error, act } = useAction();
  const [body, setBody] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();
    void act(
      async () => {
        const res = await callApi<{ mailed: boolean }>(`/messages/${threadId}`, 'POST', { body });
        setBody('');
        if (res && !res.mailed) toast(t('notMailed'), 'info');
      },
      { success: t('sent') },
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <label className="block text-sm font-medium" htmlFor="answer">
        {t('answer')}
      </label>
      <TextArea
        id="answer"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MESSAGE_LIMITS.body}
        rows={5}
        required
      />
      <ErrorText>{error}</ErrorText>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={busy}>
          {t('send')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() =>
            act(
              () =>
                callApi(`/messages/${threadId}`, 'PATCH', {
                  status: status === 'open' ? 'closed' : 'open',
                }),
              { success: status === 'open' ? t('closedDone') : t('reopened') },
            )
          }
        >
          {status === 'open' ? t('close') : t('reopen')}
        </Button>
      </div>
    </form>
  );
}
