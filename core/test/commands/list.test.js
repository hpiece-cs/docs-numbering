import { describe, it, expect, afterEach } from 'vitest';
import { runList } from '../../src/commands/list.js';
import { makeTmpProject } from '../helpers/tmpdir.js';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

describe('list', () => {
  it('lists numbered docs parsed into method/phase/title', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': 'docs_dir: "docs/"\n',
      'docs/001-bmad-prd-auth.md': '',
      'docs/002-gsd-plan-phase-api.md': '',
      'docs/readme.md': ''
    });
    cleanups.push(p.cleanup);
    const r = await runList({ cwd: p.dir, homeDir: p.dir, flags: {} });
    expect(r.items.length).toBe(2);
    expect(r.items[0].num).toBe(1);
    expect(r.items[0].method).toBe('bmad');
    expect(r.items[0].phase).toBe('prd');
  });

  it('filters by method', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': 'docs_dir: "docs/"\n',
      'docs/001-bmad-prd-auth.md': '',
      'docs/002-gsd-plan-phase-api.md': ''
    });
    cleanups.push(p.cleanup);
    const r = await runList({ cwd: p.dir, homeDir: p.dir, flags: { method: 'gsd' } });
    expect(r.items.length).toBe(1);
    expect(r.items[0].method).toBe('gsd');
  });
});
