import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { listAdapters, listUserAdapters, getAdapter } from '../adapters/registry.js';
import { detectAgents } from '../adapters/detect.js';
import { installAdapter, uninstallAdapter } from '../adapters/install.js';
import { runInit } from './init.js';
import { t } from '../i18n/index.js';

function resolveTargets({ baseDir, scope, agent, all }) {
  if (agent) {
    const a = getAdapter(agent);
    if (!a) throw new Error(t('errors.unknown_adapter', { name: agent }));
    return [a.name];
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

export async function runInstall({ cwd, homeDir, flags = {} }) {
  const scope = flags.user ? 'user' : 'project';
  const baseDir = flags.user ? homeDir : cwd;
  const initialized = await maybeAutoInit({ cwd, homeDir, flags });
  const targets = resolveTargets({ baseDir, scope, agent: flags.agent, all: flags.all });
  if (!targets.length) {
    return {
      initialized,
      scope,
      detected: [],
      available: (scope === 'user' ? listUserAdapters() : listAdapters()).map((a) => ({ name: a.name, label: a.label })),
      results: [],
      message: t('install.no_detection')
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
  return { initialized, scope, targets, results, dryRun: !!flags.dryRun };
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
