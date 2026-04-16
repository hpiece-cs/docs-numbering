import { describe, it, expect } from 'vitest';
import { renderPattern } from '../../src/naming/template.js';

describe('renderPattern', () => {
  it('interpolates simple variables', () => {
    expect(renderPattern('{num}-{slug}.md', { num: 1, slug: 'auth' }))
      .toBe('1-auth.md');
  });

  it('pads num with format spec', () => {
    expect(renderPattern('{num:03d}-{slug}.md', { num: 4, slug: 'auth' }))
      .toBe('004-auth.md');
  });

  it('omits empty method/phase gracefully', () => {
    expect(renderPattern('{num:03d}-{method}-{phase}-{slug}.md',
      { num: 1, method: '', phase: '', slug: 'x' }))
      .toBe('001-x.md');
  });

  it('keeps method/phase when provided', () => {
    expect(renderPattern('{num:03d}-{method}-{phase}-{slug}.md',
      { num: 2, method: 'bmad', phase: 'prd', slug: 'auth' }))
      .toBe('002-bmad-prd-auth.md');
  });

  it('supports {date}', () => {
    expect(renderPattern('{date}-{slug}.md',
      { date: '2026-04-15', slug: 'x' }))
      .toBe('2026-04-15-x.md');
  });

  it('interpolates {filename} preserving original name', () => {
    expect(renderPattern('{num:03d}-{filename}.md',
      { num: 1, filename: 'README' }))
      .toBe('001-README.md');
  });

  it('preserves dashes inside {filename}', () => {
    expect(renderPattern('{num:03d}-{filename}.md',
      { num: 2, filename: 'My-Design-Doc' }))
      .toBe('002-My-Design-Doc.md');
  });

  it('preserves Korean in {filename}', () => {
    expect(renderPattern('{num:03d}-{filename}.md',
      { num: 3, filename: '설계서' }))
      .toBe('003-설계서.md');
  });

  it('omits empty {filename} gracefully', () => {
    expect(renderPattern('{num:03d}-{method}-{filename}.md',
      { num: 1, method: 'bmad', filename: '' }))
      .toBe('001-bmad.md');
  });

  it('combines {method} and {filename}', () => {
    expect(renderPattern('{num:03d}-{method}-{filename}.md',
      { num: 1, method: 'bmad', filename: 'My Doc' }))
      .toBe('001-bmad-My Doc.md');
  });
});
