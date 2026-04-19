import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { listAdapters, listUserAdapters, getAdapter } from '../adapters/registry.js';
import { detectAgents } from '../adapters/detect.js';
import { installAdapter, uninstallAdapter } from '../adapters/install.js';
import { runInit } from './init.js';
import { promptAgentSelection } from './install-picker.js';
import { t } from '../i18n/index.js';

function parseAgentList(agent) {
  if (agent == null || agent === '') return null;
  const arr = Array.isArray(agent) ? agent : String(agent).split(',');
  const cleaned = arr.map((s) => String(s).trim()).filter(Boolean);
  return cleaned.length ? [...new Set(cleaned)] : null;
}

function resolveTargets({ baseDir, scope, agent, all }) {
  const list = parseAgentList(agent);
  if (list) {
    for (const name of list) {
      if (!getAdapter(name)) throw new Error(t('errors.unknown_adapter', { name }));
    }
    return list;
  }
  if (all) {
    const pool = scope === 'user' ? listUserAdapters() : listAdapters();
    return pool.map((a) => a.name);
  }
  return detectAgents(baseDir, scope).map((a) => a.name);
}

async function maybeAutoInit({ cwd, homeDir, flags }) {
  if (flags.noInit || flags.dryRun || flags.user) return null;
  const configPath = join(cwd, '.docs-numbering.yaml');
  if (existsSync(configPath)) return null;
  const r = await runInit({ cwd, homeDir, flags: {} });
  return r.path;
}

function shouldPrompt(flags) {
  if (flags.agent || flags.all) return false;
  if (flags.json || flags.noInteractive) return false;
  return Boolean(process.stdin?.isTTY && process.stdout?.isTTY);
}

async function maybeInteractiveSelect({ baseDir, scope, flags }) {
  if (!shouldPrompt(flags)) return null;
  const pool = scope === 'user' ? listUserAdapters() : listAdapters();
  const detected = new Set(detectAgents(baseDir, scope).map((a) => a.name));
  return promptAgentSelection({ pool, detected });
}

export async function runInstall({ cwd, homeDir, flags = {} }) {
  const scope = flags.user ? 'user' : 'project';
  const baseDir = flags.user ? homeDir : cwd;
  const initialized = await maybeAutoInit({ cwd, homeDir, flags });

  let agent = flags.agent;
  let interactive = false;
  if (!agent && !flags.all) {
    const picked = await maybeInteractiveSelect({ baseDir, scope, flags });
    if (picked !== null) {
      interactive = true;
      agent = picked;
    }
  }

  const targets = resolveTargets({ baseDir, scope, agent, all: flags.all });
  if (!targets.length) {
    return {
      initialized,
      scope,
      detected: [],
      available: (scope === 'user' ? listUserAdapters() : listAdapters()).map((a) => ({ name: a.name, label: a.label })),
      results: [],
      interactive,
      message: interactive ? t('install.picker_no_selection') : t('install.no_detection')
    };
  }
  const results = [];
  for (const name of targets) {
    const r = await installAdapter({
      cwd,
      baseDir,
      scope,
      agent: name,
      mode: flags.mode,
      force: !!flags.force,
      dryRun: !!flags.dryRun
    });
    results.push(r);
  }
  return { initialized, scope, targets, results, interactive, dryRun: !!flags.dryRun };
}

export async function runUninstall({ cwd, homeDir, flags = {} }) {
  const scope = flags.user ? 'user' : 'project';
  const baseDir = flags.user ? homeDir : cwd;
  const targets = resolveTargets({ baseDir, scope, agent: flags.agent, all: flags.all });
  const results = [];
  for (const name of targets) {
    const r = await uninstallAdapter({ cwd, baseDir, scope, agent: name, dryRun: !!flags.dryRun });
    results.push(r);
  }
  return { scope, targets, results, dryRun: !!flags.dryRun };
}
