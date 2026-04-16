import { describe, it, expect } from 'vitest';
import { nextNumber, parseNumberFromFilename } from '../../src/numbering/next.js';

describe('parseNumberFromFilename', () => {
  it('extracts leading number', () => {
    expect(parseNumberFromFilename('001-bmad-prd-auth.md')).toBe(1);
    expect(parseNumberFromFilename('042-notes.md')).toBe(42);
  });
  it('returns null when no number', () => {
    expect(parseNumberFromFilename('readme.md')).toBeNull();
  });
});

describe('nextNumber', () => {
  it('returns start when no files', () => {
    expect(nextNumber([], { start: 1 })).toBe(1);
  });
  it('returns max+1', () => {
    expect(nextNumber(['001-a.md', '003-b.md', '002-c.md'], { start: 1 }))
      .toBe(4);
  });
  it('respects start > max', () => {
    expect(nextNumber(['001-a.md'], { start: 100 })).toBe(100);
  });
});
