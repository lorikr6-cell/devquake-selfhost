'use client';

import { useState, type FormEvent } from 'react';
import { Button, trackEvent, useT } from '@devquake/ui';
import { BULL } from '../lib/engine/darts';
import { FAVORITE_DOUBLES, type Profile } from '../lib/model';
import { callApi } from './call-api';
import { useFeedback } from './feedback';
import { ErrorText, Field, Input, Segmented, Select } from './ui';
import { useAction } from './use-action';

/** The player's profile: name at the board, hand, level, how they enter scores. */
export function ProfileForm({ initial, setup }: { initial: Profile; setup: boolean }) {
  const t = useT('profile');
  const { busy, error, act, router } = useAction();
  const [p, setP] = useState<Profile>(initial);
  const tToast = useT('toasts');
  const { toast } = useFeedback();

  function save(event: FormEvent) {
    event.preventDefault();
    act(
      async () => {
        await callApi('/profile', 'PUT', p);
        if (setup) trackEvent('profile_created', { level: p.level });
      },
      () => {
        toast(tToast(setup ? 'profileCreated' : 'profileSaved'));
        if (setup) router.push('/');
        else router.refresh();
      },
    );
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <Field label={t('nickname')} hint={t('nicknameHint')}>
        <Input
          required
          minLength={2}
          maxLength={40}
          value={p.nickname}
          onChange={(e) => setP({ ...p, nickname: e.target.value })}
        />
      </Field>
      <Segmented
        name="hand"
        label={t('hand')}
        value={p.hand}
        options={[
          { value: 'right', label: t('right') },
          { value: 'left', label: t('left') },
        ]}
        onChange={(hand) => setP({ ...p, hand })}
      />
      <Segmented
        name="level"
        label={t('level')}
        value={p.level}
        options={(['beginner', 'intermediate', 'advanced'] as const).map((l) => ({
          value: l,
          label: t(`levels.${l}`),
        }))}
        onChange={(level) => setP({ ...p, level })}
      />
      <Segmented
        name="entryMode"
        label={t('entryMode')}
        value={p.entryMode}
        options={[
          { value: 'board', label: t('entryBoard') },
          { value: 'keypad', label: t('entryKeypad') },
        ]}
        onChange={(entryMode) => setP({ ...p, entryMode })}
      />
      <Field label={t('favorite')} hint={t('favoriteHint')} className="max-w-xs">
        <Select
          value={p.favoriteDouble ?? ''}
          onChange={(e) =>
            setP({ ...p, favoriteDouble: e.target.value === '' ? null : Number(e.target.value) })
          }
        >
          <option value="">{t('noFavorite')}</option>
          {FAVORITE_DOUBLES.map((n) => (
            <option key={n} value={n}>
              {n === BULL ? t('bull') : `D${n}`}
            </option>
          ))}
        </Select>
      </Field>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" disabled={busy} className="min-h-11">
        {setup ? t('create') : t('save')}
      </Button>
    </form>
  );
}
