import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('CLI --version', () => {
  it('prints package version', () => {
    const out = execSync('node bin/docs-numbering.js --version', {
      cwd: new URL('../..', import.meta.url).pathname,
      encoding: 'utf8'
    });
    expect(out.trim()).toBe('0.1.0');
  });
});
