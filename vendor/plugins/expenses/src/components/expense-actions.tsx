'use client';

import { useState, type FormEvent } from 'react';
import { Button, useT } from '@devquake/ui';
import { LIMITS } from '../lib/model';
import { callApi } from './call-api';
import { ExpenseForm, type ExpenseDraft, type FormMember } from './expense-form';
import { ErrorText, Panel, TextArea } from './ui';
import { useAction } from './use-action';

interface FormProps {
  groupId: number;
  currency: string;
  members: FormMember[];
  me: number;
  today: string;
}

/** "Add an expense": the form opens in place, and closes again with Cancel. */
export function AddExpense(props: FormProps & { startOpen?: boolean }) {
  const t = useT('expenses');
  const [open, setOpen] = useState(props.startOpen ?? false);
  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)}>
        + {t('add')}
      </Button>
    );
  }
  return (
    <Panel className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">{t('addTitle')}</h2>
        <Button
          type="button"
          variant="ghost"
          className="px-2 py-1 text-sm"
          onClick={() => setOpen(false)}
        >
          {t('close')}
        </Button>
      </div>
      <ExpenseForm {...props} />
    </Panel>
  );
}

/** Correct or delete an expense (any member; the feed says who). */
export function ExpenseEditor(props: FormProps & { expense: ExpenseDraft }) {
  const t = useT('expenses');
  const [editing, setEditing] = useState(false);
  const { busy, act, confirm, router } = useAction();

  async function remove() {
    const ok = await confirm({
      title: t('deleteTitle', { title: props.expense.title }),
      body: t('deleteBody'),
      confirmLabel: t('delete'),
      danger: true,
    });
    if (!ok) return;
    act(() => callApi(`/groups/${props.groupId}/expenses/${props.expense.id}`, 'DELETE'), {
      success: t('deleted'),
      after: () => router.push(`/groups/${props.groupId}`),
    });
  }

  if (editing) {
    return (
      <Panel className="space-y-3">
        <h2 className="font-display text-lg font-semibold">{t('editTitle')}</h2>
        <ExpenseForm {...props} onDone={() => setEditing(false)} />
      </Panel>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
        {t('edit')}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="text-red-700 dark:text-red-400"
        disabled={busy}
        onClick={() => void remove()}
      >
        {t('delete')}
      </Button>
    </div>
  );
}

/** Writing a comment on an expense. */
export function CommentForm({ groupId, expenseId }: { groupId: number; expenseId: number }) {
  const t = useT('comments');
  const [body, setBody] = useState('');
  const { busy, error, act } = useAction();
  function submit(event: FormEvent) {
    event.preventDefault();
    act(
      async () => {
        await callApi(`/groups/${groupId}/expenses/${expenseId}/comments`, 'POST', { body });
        setBody('');
      },
      { success: t('sent') },
    );
  }
  return (
    <form onSubmit={submit} className="space-y-2">
      <TextArea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={LIMITS.comment}
        placeholder={t('placeholder')}
        aria-label={t('placeholder')}
        required
      />
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy || !body.trim()}>
        {t('send')}
      </Button>
    </form>
  );
}

/** The author or the group's owner removes a comment. */
export function DeleteComment({ groupId, commentId }: { groupId: number; commentId: number }) {
  const t = useT('comments');
  const { busy, act, confirm } = useAction();
  return (
    <Button
      type="button"
      variant="ghost"
      className="px-2 py-1 text-xs text-red-700 dark:text-red-400"
      disabled={busy}
      onClick={async () => {
        const ok = await confirm({
          title: t('deleteTitle'),
          confirmLabel: t('delete'),
          danger: true,
        });
        if (ok)
          act(() => callApi(`/groups/${groupId}/comments/${commentId}`, 'DELETE'), {
            success: t('deleted'),
          });
      }}
    >
      {t('delete')}
    </Button>
  );
}
