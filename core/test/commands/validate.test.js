import { describe, it, expect, afterEach } from 'vitest';
import { runValidate } from '../../src/commands/validate.js';
import { makeTmpProject } from '../helpers/tmpdir.js';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

describe('validate', () => {
  it('reports no issues on clean setup', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': 'numbering:\n  presets: [bmad]\n',
      'docs/001-bmad-prd-auth.md': ''
    });
    cleanups.push(p.cleanup);
    const r = await runValidate({ cwd: p.dir, homeDir: p.dir, flags: {} });
    expect(r.issues).toEqual([]);
  });

  it('detects duplicate numbers', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': 'numbering:\n  presets: [bmad]\n',
      'docs/001-bmad-prd-a.md': '',
      'docs/001-bmad-prd-b.md': ''
    });
    cleanups.push(p.cleanup);
    const r = await runValidate({ cwd: p.dir, homeDir: p.dir, flags: {} });
    expect(r.issues.some(i => i.type === 'duplicate_number')).toBe(true);
  });

  it('detects unknown phase', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': 'numbering:\n  presets: [bmad]\n',
      'docs/001-bmad-bogus-x.md': ''
    });
    cleanups.push(p.cleanup);
    const r = await runValidate({ cwd: p.dir, homeDir: p.dir, flags: {} });
    expect(r.issues.some(i => i.type === 'unknown_phase')).toBe(true);
  });
});
