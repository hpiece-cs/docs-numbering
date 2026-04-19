import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { runInstall, runUninstall } from '../../src/commands/install.js';
import { runInit } from '../../src/commands/init.js';
import { makeTmpProject } from '../helpers/tmpdir.js';
import {
  existsSync,
  readFileSync,
  writeFileSync,
  lstatSync,
  mkdirSync
} from 'node:fs';
import { join } from 'node:path';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

function mkProject(initial = {}) {
  const p = makeTmpProject(initial);
  cleanups.push(p.cleanup);
  return p;
}

describe('install: detection', () => {
  it('detects claude-code when .claude/ exists', async () => {
    const p = mkProject();
    mkdirSync(join(p.dir, '.claude'), { recursive: true });
    const r = await runInstall({ cwd: p.dir, flags: { dryRun: true } });
    expect(r.targets).toContain('claude-code');
  });

  it('returns no_detection message when nothing matches', async () => {
    const p = mkProject();
    const r = await runInstall({ cwd: p.dir, flags: {} });
    expect(r.targets).toBeUndefined();
    expect(r.message).toBeTruthy();
    expect(r.available.length).toBeGreaterThan(0);
  });
});

describe('install: multi-agent --agent list', () => {
  it('accepts comma-separated --agent list', async () => {
    const p = mkProject();
    const r = await runInstall({ cwd: p.dir, flags: { agent: 'claude-code,opencode' } });
    expect(r.targets).toEqual(['claude-code', 'opencode']);
    expect(existsSync(join(p.dir, '.claude/commands/docs-new.md'))).toBe(true);
    expect(existsSync(join(p.dir, '.opencode/commands/docs-new.md'))).toBe(true);
  });

  it('trims whitespace around names', async () => {
    const p = mkProject();
    const r = await runInstall({ cwd: p.dir, flags: { agent: ' opencode , gemini ' } });
    expect(r.targets).toEqual(['opencode', 'gemini']);
  });

  it('dedupes repeated names', async () => {
    const p = mkProject();
    const r = await runInstall({ cwd: p.dir, flags: { agent: 'opencode,opencode' } });
    expect(r.targets).toEqual(['opencode']);
  });

  it('throws on unknown adapter in list', async () => {
    const p = mkProject();
    await expect(runInstall({ cwd: p.dir, flags: { agent: 'claude-code,bogus' } }))
      .rejects.toThrow(/bogus/);
  });

  it('accepts array form of agent', async () => {
    const p = mkProject();
    const r = await runInstall({ cwd: p.dir, flags: { agent: ['opencode', 'copilot'] } });
    expect(r.targets).toEqual(['opencode', 'copilot']);
  });

  it('uninstall also accepts comma-separated --agent', async () => {
    const p = mkProject();
    await runInstall({ cwd: p.dir, flags: { agent: 'opencode,gemini' } });
    const r = await runUninstall({ cwd: p.dir, flags: { agent: 'opencode,gemini' } });
    expect(r.targets).toEqual(['opencode', 'gemini']);
    expect(existsSync(join(p.dir, '.opencode/commands/docs-new.md'))).toBe(false);
  });
});

describe('install: interactive picker gating', () => {
  it('does not prompt in non-TTY (test env) — falls back to detection', async () => {
    const p = mkProject();
    mkdirSync(join(p.dir, '.claude'), { recursive: true });
    const r = await runInstall({ cwd: p.dir, flags: {} });
    expect(r.targets).toEqual(['claude-code']);
    expect(r.interactive).toBe(false);
  });
});

describe('install: claude-code (link mode)', () => {
  it('creates symlinks for skills and commands', async () => {
    const p = mkProject();
    mkdirSync(join(p.dir, '.claude'), { recursive: true });
    await runInstall({ cwd: p.dir, flags: { agent: 'claude-code' } });

    const skill = join(p.dir, '.claude/skills/docs-numbering');
    const cmd = join(p.dir, '.claude/commands/docs-new.md');
    expect(lstatSync(skill).isSymbolicLink()).toBe(true);
    expect(lstatSync(cmd).isSymbolicLink()).toBe(true);
  });

  it('auto-replaces stale symlinks in link mode without --force', async () => {
    const p = mkProject();
    // Pre-existing symlink pointing somewhere bogus (simulates repo relocation)
    mkdirSync(join(p.dir, '.claude/commands'), { recursive: true });
    const { symlinkSync } = await import('node:fs');
    symlinkSync('/nonexistent/old/path/docs-new.md', join(p.dir, '.claude/commands/docs-new.md'));

    const r = await runInstall({ cwd: p.dir, flags: { agent: 'claude-code' } });

    // Should have been relinked automatically (not skipped)
    const relinked = r.results[0].actions.find(
      (a) => a.to.endsWith('docs-new.md') && a.status === 'relinked'
    );
    expect(relinked).toBeTruthy();
    expect(existsSync(join(p.dir, '.claude/commands/docs-new.md'))).toBe(true);
  });

  it('preserves copy-mode files without --force (does not auto-replace)', async () => {
    const p = mkProject();
    mkdirSync(join(p.dir, '.opencode/commands'), { recursive: true });
    writeFileSync(join(p.dir, '.opencode/commands/docs-new.md'), 'user edit', 'utf8');

    const r = await runInstall({ cwd: p.dir, flags: { agent: 'opencode' } });

    // copy mode: must NOT auto-replace without --force
    const skipped = r.results[0].actions.find(
      (a) => a.to.endsWith('docs-new.md') && a.action === 'skip'
    );
    expect(skipped).toBeTruthy();
    expect(readFileSync(join(p.dir, '.opencode/commands/docs-new.md'), 'utf8')).toBe('user edit');
  });

  it('skips existing files without --force', async () => {
    const p = mkProject();
    mkdirSync(join(p.dir, '.claude/commands'), { recursive: true });
    writeFileSync(join(p.dir, '.claude/commands/docs-new.md'), 'custom', 'utf8');
    const r = await runInstall({ cwd: p.dir, flags: { agent: 'claude-code' } });
    const skipped = r.results[0].actions.find(
      (a) => a.to.endsWith('docs-new.md') && a.action === 'skip'
    );
    expect(skipped).toBeTruthy();
    expect(readFileSync(join(p.dir, '.claude/commands/docs-new.md'), 'utf8')).toBe('custom');
  });

  it('overwrites with --force', async () => {
    const p = mkProject();
    mkdirSync(join(p.dir, '.claude/commands'), { recursive: true });
    writeFileSync(join(p.dir, '.claude/commands/docs-new.md'), 'custom', 'utf8');
    await runInstall({ cwd: p.dir, flags: { agent: 'claude-code', force: true } });
    expect(lstatSync(join(p.dir, '.claude/commands/docs-new.md')).isSymbolicLink()).toBe(true);
  });
});

describe('install: opencode (copy mode)', () => {
  it('copies command markdown files', async () => {
    const p = mkProject();
    await runInstall({ cwd: p.dir, flags: { agent: 'opencode' } });
    const cmd = join(p.dir, '.opencode/commands/docs-new.md');
    expect(existsSync(cmd)).toBe(true);
    expect(lstatSync(cmd).isSymbolicLink()).toBe(false);
  });
});

describe('install: merge mode (GEMINI.md)', () => {
  it('creates file with start/end markers when missing', async () => {
    const p = mkProject();
    await runInstall({ cwd: p.dir, flags: { agent: 'gemini' } });
    const content = readFileSync(join(p.dir, 'GEMINI.md'), 'utf8');
    expect(content).toMatch(/docs-numbering:start/);
    expect(content).toMatch(/docs-numbering:end/);
  });

  it('appends block to existing file without clobbering content', async () => {
    const p = mkProject({ 'GEMINI.md': '# My project\n\nPre-existing content.\n' });
    await runInstall({ cwd: p.dir, flags: { agent: 'gemini' } });
    const content = readFileSync(join(p.dir, 'GEMINI.md'), 'utf8');
    expect(content).toMatch(/Pre-existing content/);
    expect(content).toMatch(/docs-numbering:start/);
  });

  it('updates existing block on reinstall without duplication', async () => {
    const p = mkProject();
    await runInstall({ cwd: p.dir, flags: { agent: 'gemini' } });
    await runInstall({ cwd: p.dir, flags: { agent: 'gemini' } });
    const content = readFileSync(join(p.dir, 'GEMINI.md'), 'utf8');
    const startCount = content.match(/docs-numbering:start/g).length;
    expect(startCount).toBe(1);
  });
});

describe('uninstall', () => {
  it('removes claude-code symlinks', async () => {
    const p = mkProject();
    mkdirSync(join(p.dir, '.claude'), { recursive: true });
    await runInstall({ cwd: p.dir, flags: { agent: 'claude-code' } });
    await runUninstall({ cwd: p.dir, flags: { agent: 'claude-code' } });
    expect(existsSync(join(p.dir, '.claude/skills/docs-numbering'))).toBe(false);
    expect(existsSync(join(p.dir, '.claude/commands/docs-new.md'))).toBe(false);
  });

  it('removes merge block while preserving other content', async () => {
    const p = mkProject({ 'GEMINI.md': '# Keep me\n' });
    await runInstall({ cwd: p.dir, flags: { agent: 'gemini' } });
    await runUninstall({ cwd: p.dir, flags: { agent: 'gemini' } });
    const content = readFileSync(join(p.dir, 'GEMINI.md'), 'utf8');
    expect(content).toMatch(/Keep me/);
    expect(content).not.toMatch(/docs-numbering:start/);
  });

  it('removes file entirely when block was the only content', async () => {
    const p = mkProject();
    await runInstall({ cwd: p.dir, flags: { agent: 'gemini' } });
    expect(existsSync(join(p.dir, 'GEMINI.md'))).toBe(true);
    await runUninstall({ cwd: p.dir, flags: { agent: 'gemini' } });
    expect(existsSync(join(p.dir, 'GEMINI.md'))).toBe(false);
  });
});

describe('init integration', () => {
  it('returns detected agents from init result', async () => {
    const p = mkProject();
    mkdirSync(join(p.dir, '.claude'), { recursive: true });
    const r = await runInit({ cwd: p.dir, homeDir: p.dir, flags: {} });
    expect(r.detected.map((d) => d.name)).toContain('claude-code');
  });

  it('auto-creates .docs-numbering.yaml when install runs without config', async () => {
    const p = mkProject();
    mkdirSync(join(p.dir, '.claude'), { recursive: true });
    const cfg = join(p.dir, '.docs-numbering.yaml');
    expect(existsSync(cfg)).toBe(false);
    const r = await runInstall({ cwd: p.dir, homeDir: p.dir, flags: { agent: 'claude-code' } });
    expect(existsSync(cfg)).toBe(true);
    expect(r.initialized).toBe(cfg);
  });

  it('leaves existing config untouched', async () => {
    const p = mkProject({ '.docs-numbering.yaml': 'custom: true\n' });
    const r = await runInstall({ cwd: p.dir, homeDir: p.dir, flags: { agent: 'claude-code' } });
    expect(r.initialized).toBeNull();
    expect(readFileSync(join(p.dir, '.docs-numbering.yaml'), 'utf8')).toBe('custom: true\n');
  });

  it('skips auto-init with --no-init', async () => {
    const p = mkProject();
    mkdirSync(join(p.dir, '.claude'), { recursive: true });
    const r = await runInstall({ cwd: p.dir, homeDir: p.dir, flags: { agent: 'claude-code', noInit: true } });
    expect(r.initialized).toBeNull();
    expect(existsSync(join(p.dir, '.docs-numbering.yaml'))).toBe(false);
  });

  it('skips auto-init on dry-run', async () => {
    const p = mkProject();
    mkdirSync(join(p.dir, '.claude'), { recursive: true });
    const r = await runInstall({ cwd: p.dir, homeDir: p.dir, flags: { agent: 'claude-code', dryRun: true } });
    expect(r.initialized).toBeNull();
    expect(existsSync(join(p.dir, '.docs-numbering.yaml'))).toBe(false);
  });
});

describe('install: --user scope', () => {
  it('installs claude-code adapter into homeDir, not cwd', async () => {
    const project = mkProject();
    const home = mkProject();
    mkdirSync(join(home.dir, '.claude'), { recursive: true });
    const r = await runInstall({
      cwd: project.dir,
      homeDir: home.dir,
      flags: { user: true, agent: 'claude-code' }
    });
    expect(r.scope).toBe('user');
    expect(lstatSync(join(home.dir, '.claude/skills/docs-numbering')).isSymbolicLink()).toBe(true);
    expect(lstatSync(join(home.dir, '.claude/commands/docs-new.md')).isSymbolicLink()).toBe(true);
    expect(existsSync(join(project.dir, '.claude/skills/docs-numbering'))).toBe(false);
  });

  it('skips auto-init under user scope', async () => {
    const project = mkProject();
    const home = mkProject();
    mkdirSync(join(home.dir, '.claude'), { recursive: true });
    const r = await runInstall({
      cwd: project.dir,
      homeDir: home.dir,
      flags: { user: true, agent: 'claude-code' }
    });
    expect(r.initialized).toBeNull();
    expect(existsSync(join(project.dir, '.docs-numbering.yaml'))).toBe(false);
  });

  it('detects user-scope agents against homeDir', async () => {
    const project = mkProject();
    const home = mkProject();
    mkdirSync(join(home.dir, '.claude'), { recursive: true });
    const r = await runInstall({
      cwd: project.dir,
      homeDir: home.dir,
      flags: { user: true }
    });
    expect(r.targets).toContain('claude-code');
  });

  it('uninstalls from homeDir under --user', async () => {
    const project = mkProject();
    const home = mkProject();
    mkdirSync(join(home.dir, '.claude'), { recursive: true });
    await runInstall({
      cwd: project.dir, homeDir: home.dir,
      flags: { user: true, agent: 'claude-code' }
    });
    await runUninstall({
      cwd: project.dir, homeDir: home.dir,
      flags: { user: true, agent: 'claude-code' }
    });
    let present = false;
    try { lstatSync(join(home.dir, '.claude/skills/docs-numbering')); present = true; } catch {}
    expect(present).toBe(false);
  });

  it('installs opencode docs-install command at user scope', async () => {
    const project = mkProject();
    const home = mkProject();
    mkdirSync(join(home.dir, '.opencode'), { recursive: true });
    await runInstall({
      cwd: project.dir, homeDir: home.dir,
      flags: { user: true, agent: 'opencode' }
    });
    expect(existsSync(join(home.dir, '.opencode/commands/docs-install.md'))).toBe(true);
  });

  it('installs gemini TOML commands at user scope (not GEMINI.md)', async () => {
    const project = mkProject();
    const home = mkProject();
    await runInstall({
      cwd: project.dir, homeDir: home.dir,
      flags: { user: true, agent: 'gemini' }
    });
    expect(existsSync(join(home.dir, '.gemini/commands/docs-install.toml'))).toBe(true);
    expect(existsSync(join(home.dir, 'GEMINI.md'))).toBe(false);
  });

  it('--user --all installs supported CLI agents (claude-code, opencode, gemini, copilot)', async () => {
    const project = mkProject();
    const home = mkProject();
    const r = await runInstall({
      cwd: project.dir, homeDir: home.dir,
      flags: { user: true, all: true }
    });
    expect(r.targets).toEqual(['claude-code', 'opencode', 'gemini', 'copilot']);
    // No project-level merge files should appear at home
    expect(existsSync(join(home.dir, 'GEMINI.md'))).toBe(false);
  });

  it('installs copilot CLI skills at user scope', async () => {
    const project = mkProject();
    const home = mkProject();
    await runInstall({
      cwd: project.dir, homeDir: home.dir,
      flags: { user: true, agent: 'copilot' }
    });
    expect(existsSync(join(home.dir, '.copilot/skills/docs-install/SKILL.md'))).toBe(true);
    expect(existsSync(join(home.dir, '.copilot/skills/docs-new/SKILL.md'))).toBe(true);
  });

  it('gemini project scope still installs GEMINI.md (merge)', async () => {
    const project = mkProject();
    await runInstall({
      cwd: project.dir, homeDir: project.dir,
      flags: { agent: 'gemini' }
    });
    expect(existsSync(join(project.dir, 'GEMINI.md'))).toBe(true);
  });
});
