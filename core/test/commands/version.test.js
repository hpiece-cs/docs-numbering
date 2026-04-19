import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

describe('CLI --version', () => {
  it('prints package version', () => {
    const root = new URL('../..', import.meta.url).pathname;
    const pkg = JSON.parse(readFileSync(`${root}/package.json`, 'utf8'));
    const out = execSync('node bin/docs-numbering.js --version', {
      cwd: root,
      encoding: 'utf8'
    });
    expect(out.trim()).toBe(pkg.version);
  });
});
