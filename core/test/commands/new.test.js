import { describe, it, expect, afterEach } from 'vitest';
import { runNew } from '../../src/commands/new.js';
import { makeTmpProject } from '../helpers/tmpdir.js';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

const baseCfg = `
docs_dir: "docs/"
naming_pattern: "{num:03d}-{method}-{phase}-{slug}.md"
numbering:
  presets: [bmad]
  phase_validation: warn
`;

describe('new', () => {
  it('creates numbered doc with Korean title preserved', async () => {
    const p = makeTmpProject({ '.docs-numbering.yaml': baseCfg });
    cleanups.push(p.cleanup);
    const result = await runNew({
      cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'prd' },
      args: { title: '사용자 인증', content: '# 본문' }
    });
    expect(result.path).toBe('docs/001-bmad-prd-사용자-인증.md');
    expect(readFileSync(join(p.dir, result.path), 'utf8')).toBe('# 본문');
  });

  it('increments number on second call', async () => {
    const p = makeTmpProject({ '.docs-numbering.yaml': baseCfg });
    cleanups.push(p.cleanup);
    await runNew({ cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'prd' }, args: { title: 'a', content: '' } });
    const r = await runNew({ cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'prd' }, args: { title: 'b', content: '' } });
    expect(r.path).toBe('docs/002-bmad-prd-b.md');
  });

  it('rejects unknown phase under strict', async () => {
    const cfg = baseCfg.replace('phase_validation: warn', 'phase_validation: strict');
    const p = makeTmpProject({ '.docs-numbering.yaml': cfg });
    cleanups.push(p.cleanup);
    await expect(runNew({
      cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'bogus' },
      args: { title: 'x', content: '' }
    })).rejects.toThrow(/phase.*bogus/i);
  });

  it('dry-run does not write file', async () => {
    const p = makeTmpProject({ '.docs-numbering.yaml': baseCfg });
    cleanups.push(p.cleanup);
    const r = await runNew({
      cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'prd', dryRun: true },
      args: { title: 'x', content: '' }
    });
    expect(existsSync(join(p.dir, r.path))).toBe(false);
  });

  it('records journal entry on success', async () => {
    const p = makeTmpProject({ '.docs-numbering.yaml': baseCfg });
    cleanups.push(p.cleanup);
    await runNew({
      cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'prd' },
      args: { title: 'auth', content: '' }
    });
    const entries = readdirSync(join(p.dir, '.docs-numbering', 'history'));
    expect(entries.length).toBe(1);
  });
});
