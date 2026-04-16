import { describe, it, expect, afterEach } from 'vitest';
import { runNew } from '../../src/commands/new.js';
import { runRollback } from '../../src/commands/rollback.js';
import { makeTmpProject } from '../helpers/tmpdir.js';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

const cfg = `
docs_dir: "docs/"
naming_pattern: "{num:03d}-{method}-{phase}-{slug}.md"
numbering:
  presets: [bmad]
`;

describe('rollback', () => {
  it('dry-run describes inverse operations', async () => {
    const p = makeTmpProject({ '.docs-numbering.yaml': cfg });
    cleanups.push(p.cleanup);
    await runNew({ cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'prd' },
      args: { title: 'auth', content: '' } });
    const r = await runRollback({ cwd: p.dir, homeDir: p.dir,
      flags: { last: true } });
    expect(r.applied).toBe(false);
    expect(r.plan[0].type).toBe('delete');
  });

  it('apply removes created file', async () => {
    const p = makeTmpProject({ '.docs-numbering.yaml': cfg });
    cleanups.push(p.cleanup);
    const created = await runNew({ cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'prd' },
      args: { title: 'auth', content: '' } });
    await runRollback({ cwd: p.dir, homeDir: p.dir,
      flags: { last: true, apply: true } });
    expect(existsSync(join(p.dir, created.path))).toBe(false);
  });

  it('rollback records its own journal entry', async () => {
    const p = makeTmpProject({ '.docs-numbering.yaml': cfg });
    cleanups.push(p.cleanup);
    await runNew({ cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'prd' },
      args: { title: 'x', content: '' } });
    await runRollback({ cwd: p.dir, homeDir: p.dir,
      flags: { last: true, apply: true } });
    const entries = readdirSync(join(p.dir, '.docs-numbering', 'history'));
    expect(entries.length).toBe(2);
  });
});
