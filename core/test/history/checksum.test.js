import { describe, it, expect } from 'vitest';
import { sha256OfString, sha256OfFile } from '../../src/history/checksum.js';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('sha256OfString', () => {
  it('returns deterministic hex with prefix', () => {
    expect(sha256OfString('hello')).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(sha256OfString('hello')).toBe(sha256OfString('hello'));
  });
});

describe('sha256OfFile', () => {
  it('matches string hash for same content', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cs-'));
    const f = join(dir, 'x.md');
    writeFileSync(f, 'hello');
    expect(sha256OfFile(f)).toBe(sha256OfString('hello'));
  });
});
