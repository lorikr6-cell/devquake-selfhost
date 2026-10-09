import { PASSWORD_MAX, PASSWORD_MIN } from '@/lib/passwords';
import type { shellT } from '@/lib/texts';
import { Field, inputClass } from './instance-frame';

/** Name, email and a password typed twice: the admin's setup and joining with an invite. */
export function AccountFields({ t }: { t: ReturnType<typeof shellT> }) {
  return (
    <>
      <Field label={t('name')}>
        <input name="name" required maxLength={80} autoComplete="name" className={inputClass} />
      </Field>
      <Field label={t('email')}>
        <input
          name="email"
          type="email"
          required
          maxLength={190}
          autoComplete="email"
          className={inputClass}
        />
      </Field>
      <Field label={t('password')} hint={t('passwordHint', { min: PASSWORD_MIN })}>
        <input
          name="password"
          type="password"
          required
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          autoComplete="new-password"
          className={inputClass}
        />
      </Field>
      <Field label={t('passwordRepeat')}>
        <input
          name="repeat"
          type="password"
          required
          minLength={PASSWORD_MIN}
          maxLength={PASSWORD_MAX}
          autoComplete="new-password"
          className={inputClass}
        />
      </Field>
    </>
  );
}
