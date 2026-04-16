import { describe, it, expect } from 'vitest';
import { makeSlug } from '../../src/naming/slug.js';

describe('makeSlug', () => {
  it('preserves Korean by default', () => {
    expect(makeSlug('사용자 인증 설계', { language: 'preserve' }))
      .toBe('사용자-인증-설계');
  });

  it('romanizes Korean when language=romanize', () => {
    const out = makeSlug('사용자 인증', { language: 'romanize' });
    expect(out).toMatch(/^[a-z0-9-]+$/);
  });

  it('lowercases Latin letters only', () => {
    expect(makeSlug('User Auth 설계', { language: 'preserve', lowercase: true }))
      .toBe('user-auth-설계');
  });

  it('strips filesystem-forbidden chars', () => {
    expect(makeSlug('a/b\\c:d*e?f"g<h>i|j', { language: 'preserve' }))
      .not.toMatch(/[\/\\:*?"<>|]/);
  });

  it('respects max_length', () => {
    const long = 'a'.repeat(100);
    expect(makeSlug(long, { language: 'preserve', max_length: 20 }).length)
      .toBeLessThanOrEqual(20);
  });

  it('applies custom separator', () => {
    expect(makeSlug('hello world test', { language: 'preserve', separator: '_' }))
      .toBe('hello_world_test');
  });
});
