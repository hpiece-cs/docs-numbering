import { describe, it, expect, afterEach } from 'vitest';
import { runPhases } from '../../src/commands/phases.js';
import { makeTmpProject } from '../helpers/tmpdir.js';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

describe('phases', () => {
  it('returns phases for configured presets', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': 'numbering:\n  presets: [bmad, gsd]\n'
    });
    cleanups.push(p.cleanup);
    const result = await runPhases({ cwd: p.dir, homeDir: p.dir, flags: {} });
    expect(result.phases).toContain('prd');
    expect(result.phases).toContain('plan-phase');
  });

  it('filters by --method', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': 'numbering:\n  presets: [bmad, gsd]\n'
    });
    cleanups.push(p.cleanup);
    const result = await runPhases({
      cwd: p.dir, homeDir: p.dir, flags: { method: 'gsd' }
    });
    expect(result.phases).toContain('plan-phase');
    expect(result.phases).not.toContain('prd');
  });
});
