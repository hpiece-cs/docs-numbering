import { describe, it, expect, afterEach } from 'vitest';
import { loadConfig } from '../../src/config/loader.js';
import { makeTmpProject } from '../helpers/tmpdir.js';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

function mk(files) {
  const p = makeTmpProject(files);
  cleanups.push(p.cleanup);
  return p.dir;
}

describe('loadConfig', () => {
  it('returns defaults when no config exists', () => {
    const cwd = mk({});
    const cfg = loadConfig({ cwd, homeDir: cwd, flags: {} });
    expect(cfg.docs_dir).toBe('docs/');
    expect(cfg.numbering.strategy).toBe('sequential');
    expect(cfg.slug.language).toBe('preserve');
  });

  it('project config overrides defaults', () => {
    const cwd = mk({
      '.docs-numbering.yaml': 'docs_dir: "specs/"\nslug:\n  language: romanize\n'
    });
    const cfg = loadConfig({ cwd, homeDir: cwd, flags: {} });
    expect(cfg.docs_dir).toBe('specs/');
    expect(cfg.slug.language).toBe('romanize');
    expect(cfg.slug.separator).toBe('-');
  });

  it('flags override project config', () => {
    const cwd = mk({
      '.docs-numbering.yaml': 'docs_dir: "specs/"\n'
    });
    const cfg = loadConfig({ cwd, homeDir: cwd, flags: { docsDir: 'notes/' } });
    expect(cfg.docs_dir).toBe('notes/');
  });

  it('global config overridden by project', () => {
    const cwd = mk({
      '.docs-numbering/config.yaml': 'docs_dir: "global-docs/"\n',
      '.docs-numbering.yaml': 'docs_dir: "project-docs/"\n'
    });
    const cfg = loadConfig({ cwd, homeDir: cwd, flags: {} });
    expect(cfg.docs_dir).toBe('project-docs/');
  });

  it('expands ~ in docs_dir', () => {
    const cwd = mk({ '.docs-numbering.yaml': 'docs_dir: "~/shared"\n' });
    const cfg = loadConfig({ cwd, homeDir: '/fake/home', flags: {} });
    expect(cfg.docs_dir).toBe('/fake/home/shared');
  });
});
