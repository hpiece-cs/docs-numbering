import { describe, it, expect } from 'vitest';
import { loadPresets, mergePhases } from '../../src/presets/index.js';

describe('loadPresets', () => {
  it('loads bmad preset', () => {
    const p = loadPresets(['bmad']);
    expect(p.bmad.phases).toContain('prd');
    expect(p.bmad.phases).toContain('stories');
  });

  it('loads multiple presets', () => {
    const p = loadPresets(['bmad', 'gsd']);
    expect(Object.keys(p).sort()).toEqual(['bmad', 'gsd']);
  });

  it('throws on unknown preset', () => {
    expect(() => loadPresets(['bogus'])).toThrow(/unknown preset/i);
  });
});

describe('mergePhases', () => {
  it('returns union of all phases across loaded presets', () => {
    const phases = mergePhases(loadPresets(['bmad', 'gsd']));
    expect(phases).toContain('prd');
    expect(phases).toContain('plan-phase');
  });
});
