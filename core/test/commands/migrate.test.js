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

  const filenameCfg = `
docs_dir: "docs/"
naming_pattern: "{num:03d}-{filename}.md"
numbering:
  presets: [bmad]
`;

  it('preserves original filename with {filename} pattern', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': filenameCfg,
      'docs/README.md': '', 'docs/Design Doc.md': ''
    });
    cleanups.push(p.cleanup);
    await runMigrate({ cwd: p.dir, homeDir: p.dir,
      flags: { order: 'alpha', apply: true } });
    const files = readdirSync(join(p.dir, 'docs')).sort();
    expect(files).toEqual(['001-Design Doc.md', '002-README.md']);
  });

  it('strips leading numbers from original filename', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': filenameCfg,
      'docs/01-old-doc.md': ''
    });
    cleanups.push(p.cleanup);
    await runMigrate({ cwd: p.dir, homeDir: p.dir,
      flags: { order: 'alpha', apply: true } });
    const files = readdirSync(join(p.dir, 'docs'));
    expect(files).toEqual(['001-old-doc.md']);
  });

  it('preserves Korean filename with {filename} pattern', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': filenameCfg,
      'docs/설계서.md': ''
    });
    cleanups.push(p.cleanup);
    await runMigrate({ cwd: p.dir, homeDir: p.dir,
      flags: { order: 'alpha', apply: true } });
    const files = readdirSync(join(p.dir, 'docs'));
    expect(files).toEqual(['001-설계서.md']);
  });

  it('combines method and {filename}', async () => {
    const methodFilenameCfg = `
docs_dir: "docs/"
naming_pattern: "{num:03d}-{method}-{filename}.md"
numbering:
  presets: [bmad]
`;
    const p = makeTmpProject({
      '.docs-numbering.yaml': methodFilenameCfg,
      'docs/My-Doc.md': ''
    });
    cleanups.push(p.cleanup);
    const r = await runMigrate({ cwd: p.dir, homeDir: p.dir,
      flags: { order: 'alpha' } });
    // method is empty during migrate, so pattern collapses to 001-My-Doc.md
    expect(r.plan[0].to).toBe('docs/001-My-Doc.md');
  });
});
