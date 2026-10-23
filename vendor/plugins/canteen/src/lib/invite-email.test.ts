import { describe, expect, it } from 'vitest';
import { maskAddress } from './invite-email';

describe('invitation emails', () => {
  it('keep only a masked form of the address', () => {
    expect(maskAddress(' Ana.Pop@Gmail.com ')).toBe('a***@gmail.com');
    expect(maskAddress('x@y.ro')).toBe('x***@y.ro');
    expect(maskAddress('nonsense')).toBe('***');
  });
});
