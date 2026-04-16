import { describe, it, expect, afterEach } from 'vitest';
import { runMigrate } from '../../src/commands/migrate.js';
import { makeTmpProject } from '../helpers/tmpdir.js';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

const cfg = `
docs_dir: "docs/"
naming_pattern: "{num:03d}-{slug}.md"
numbering:
  presets: [bmad]
`;

describe('migrate', () => {
  it('dry-run reports plan without renaming', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': cfg,
      'docs/beta.md': '', 'docs/alpha.md': ''
    });
    cleanups.push(p.cleanup);
    const r = await runMigrate({ cwd: p.dir, homeDir: p.dir,
      flags: { order: 'alpha' } });
    expect(r.applied).toBe(false);
    expect(r.plan.length).toBe(2);
    expect(existsSync(join(p.dir, 'docs/alpha.md'))).toBe(true);
  });

  it('apply renames in alpha order', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': cfg,
      'docs/beta.md': '', 'docs/alpha.md': ''
    });
    cleanups.push(p.cleanup);
    await runMigrate({ cwd: p.dir, homeDir: p.dir,
      flags: { order: 'alpha', apply: true } });
    const files = readdirSync(join(p.dir, 'docs')).sort();
    expect(files).toEqual(['001-alpha.md', '002-beta.md']);
  });

  it('records single journal entry for migration', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': cfg,
      'docs/x.md': ''
    });
    cleanups.push(p.cleanup);
    await runMigrate({ cwd: p.dir, homeDir: p.dir,
      flags: { order: 'alpha', apply: true } });
    const entries = readdirSync(join(p.dir, '.docs-numbering', 'history'));
    expect(entries.length).toBe(1);
  });
});
