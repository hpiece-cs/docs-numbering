import { describe, it, expect } from 'vitest';
import { parsePickerInput } from '../../src/commands/install-picker.js';

const pool = [
  { name: 'claude-code', label: 'Claude Code' },
  { name: 'opencode', label: 'OpenCode' },
  { name: 'gemini', label: 'Gemini CLI' },
  { name: 'copilot', label: 'Copilot CLI' }
];

describe('parsePickerInput', () => {
  it('empty input returns detected set', () => {
    const detected = new Set(['claude-code', 'gemini']);
    expect(parsePickerInput('', { pool, detected })).toEqual(['claude-code', 'gemini']);
  });

  it('"d" / "default" returns detected set', () => {
    const detected = new Set(['copilot']);
    expect(parsePickerInput('d', { pool, detected })).toEqual(['copilot']);
    expect(parsePickerInput('default', { pool, detected })).toEqual(['copilot']);
  });

  it('"a" / "all" returns all names', () => {
    expect(parsePickerInput('a', { pool, detected: new Set() })).toEqual(
      pool.map((a) => a.name)
    );
    expect(parsePickerInput('ALL', { pool, detected: new Set() })).toEqual(
      pool.map((a) => a.name)
    );
  });

  it('"q" / "quit" returns empty', () => {
    expect(parsePickerInput('q', { pool, detected: new Set() })).toEqual([]);
    expect(parsePickerInput('cancel', { pool, detected: new Set() })).toEqual([]);
  });

  it('parses numbers', () => {
    expect(parsePickerInput('1,3', { pool, detected: new Set() })).toEqual([
      'claude-code',
      'gemini'
    ]);
  });

  it('parses names', () => {
    expect(parsePickerInput('opencode,copilot', { pool, detected: new Set() })).toEqual([
      'opencode',
      'copilot'
    ]);
  });

  it('mixes numbers and names', () => {
    expect(parsePickerInput('1, copilot', { pool, detected: new Set() })).toEqual([
      'claude-code',
      'copilot'
    ]);
  });

  it('ignores invalid tokens', () => {
    expect(parsePickerInput('1,99,bogus,gemini', { pool, detected: new Set() })).toEqual([
      'claude-code',
      'gemini'
    ]);
  });

  it('dedupes', () => {
    expect(parsePickerInput('1,1,gemini,gemini', { pool, detected: new Set() })).toEqual([
      'claude-code',
      'gemini'
    ]);
  });

  it('handles space-separated input', () => {
    expect(parsePickerInput('1 2 3', { pool, detected: new Set() })).toEqual([
      'claude-code',
      'opencode',
      'gemini'
    ]);
  });
});
