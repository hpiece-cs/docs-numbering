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

describe('install: merge mode (AGENTS.md)', () => {
  it('creates file with start/end markers when missing', async () => {
    const p = mkProject();
    await runInstall({ cwd: p.dir, flags: { agent: 'codex' } });
    const content = readFileSync(join(p.dir, 'AGENTS.md'), 'utf8');
    expect(content).toMatch(/docs-numbering:start/);
    expect(content).toMatch(/docs-numbering:end/);
  });

  it('appends block to existing file without clobbering content', async () => {
    const p = mkProject({ 'AGENTS.md': '# My project\n\nPre-existing content.\n' });
    await runInstall({ cwd: p.dir, flags: { agent: 'codex' } });
    const content = readFileSync(join(p.dir, 'AGENTS.md'), 'utf8');
    expect(content).toMatch(/Pre-existing content/);
    expect(content).toMatch(/docs-numbering:start/);
  });

  it('updates existing block on reinstall without duplication', async () => {
    const p = mkProject();
    await runInstall({ cwd: p.dir, flags: { agent: 'codex' } });
    await runInstall({ cwd: p.dir, flags: { agent: 'codex' } });
    const content = readFileSync(join(p.dir, 'AGENTS.md'), 'utf8');
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
    const p = mkProject({ 'AGENTS.md': '# Keep me\n' });
    await runInstall({ cwd: p.dir, flags: { agent: 'codex' } });
    await runUninstall({ cwd: p.dir, flags: { agent: 'codex' } });
    const content = readFileSync(join(p.dir, 'AGENTS.md'), 'utf8');
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

  it('--user --all installs CLI agents (claude-code, opencode, codex, cursor, gemini, copilot) but skips windsurf', async () => {
    const project = mkProject();
    const home = mkProject();
    const r = await runInstall({
      cwd: project.dir, homeDir: home.dir,
      flags: { user: true, all: true }
    });
    expect(r.targets).toEqual(expect.arrayContaining(['claude-code', 'opencode', 'codex', 'cursor', 'gemini', 'copilot']));
    expect(r.targets).not.toContain('windsurf');
    // No project-level merge files should appear at home
    expect(existsSync(join(home.dir, 'AGENTS.md'))).toBe(false);
    expect(existsSync(join(home.dir, '.github/copilot-instructions.md'))).toBe(false);
  });

  it('explicit --user --agent=windsurf is skipped with marker', async () => {
    const project = mkProject();
    const home = mkProject();
    const r = await runInstall({
      cwd: project.dir, homeDir: home.dir,
      flags: { user: true, agent: 'windsurf' }
    });
    expect(r.results[0].skipped).toBe('user-scope-unsupported');
    expect(existsSync(join(home.dir, '.windsurf/workflows'))).toBe(false);
  });

  it('installs codex prompts at user scope but not AGENTS.md', async () => {
    const project = mkProject();
    const home = mkProject();
    await runInstall({
      cwd: project.dir, homeDir: home.dir,
      flags: { user: true, agent: 'codex' }
    });
    expect(existsSync(join(home.dir, '.codex/prompts/docs-install.md'))).toBe(true);
    expect(existsSync(join(home.dir, 'AGENTS.md'))).toBe(false);
  });

  it('installs cursor commands at user scope', async () => {
    const project = mkProject();
    const home = mkProject();
    await runInstall({
      cwd: project.dir, homeDir: home.dir,
      flags: { user: true, agent: 'cursor' }
    });
    expect(existsSync(join(home.dir, '.cursor/commands/docs-install.md'))).toBe(true);
  });

  it('installs copilot CLI skills at user scope (not project files)', async () => {
    const project = mkProject();
    const home = mkProject();
    await runInstall({
      cwd: project.dir, homeDir: home.dir,
      flags: { user: true, agent: 'copilot' }
    });
    expect(existsSync(join(home.dir, '.copilot/skills/docs-install/SKILL.md'))).toBe(true);
    expect(existsSync(join(home.dir, '.copilot/skills/docs-new/SKILL.md'))).toBe(true);
    expect(existsSync(join(home.dir, '.github/copilot-instructions.md'))).toBe(false);
    expect(existsSync(join(home.dir, '.github/prompts'))).toBe(false);
  });

  it('project copilot install includes instructions, prompts, and skills', async () => {
    const project = mkProject();
    await runInstall({
      cwd: project.dir, homeDir: project.dir,
      flags: { agent: 'copilot' }
    });
    expect(existsSync(join(project.dir, '.github/copilot-instructions.md'))).toBe(true);
    expect(existsSync(join(project.dir, '.github/prompts/docs-install.prompt.md'))).toBe(true);
    expect(existsSync(join(project.dir, '.github/skills/docs-install/SKILL.md'))).toBe(true);
  });

  it('project codex install includes prompts and AGENTS.md merge', async () => {
    const project = mkProject();
    await runInstall({
      cwd: project.dir, homeDir: project.dir,
      flags: { agent: 'codex' }
    });
    expect(existsSync(join(project.dir, '.codex/prompts/docs-install.md'))).toBe(true);
    expect(readFileSync(join(project.dir, 'AGENTS.md'), 'utf8')).toMatch(/docs-numbering:start/);
  });

  it('project windsurf install creates workflows', async () => {
    const project = mkProject();
    await runInstall({
      cwd: project.dir, homeDir: project.dir,
      flags: { agent: 'windsurf' }
    });
    expect(existsSync(join(project.dir, '.windsurf/workflows/docs-install.md'))).toBe(true);
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
