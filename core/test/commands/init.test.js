import { describe, it, expect, afterEach } from 'vitest';
import { runInit } from '../../src/commands/init.js';
import { makeTmpProject } from '../helpers/tmpdir.js';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

describe('init', () => {
  it('creates project config', async () => {
    const p = makeTmpProject({}); cleanups.push(p.cleanup);
    await runInit({ cwd: p.dir, homeDir: p.dir, flags: {} });
    const path = join(p.dir, '.docs-numbering.yaml');
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, 'utf8')).toMatch(/docs_dir:/);
  });

  it('creates global config with --global', async () => {
    const p = makeTmpProject({}); cleanups.push(p.cleanup);
    await runInit({ cwd: p.dir, homeDir: p.dir, flags: { global: true } });
    const path = join(p.dir, '.docs-numbering', 'config.yaml');
    expect(existsSync(path)).toBe(true);
  });

  it('refuses to overwrite existing without force', async () => {
    const p = makeTmpProject({ '.docs-numbering.yaml': 'docs_dir: keep/' });
    cleanups.push(p.cleanup);
    await expect(
      runInit({ cwd: p.dir, homeDir: p.dir, flags: {} })
    ).rejects.toThrow(/exists/);
  });
});
