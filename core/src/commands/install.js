import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { listAdapters, getAdapter } from '../adapters/registry.js';
import { detectAgents } from '../adapters/detect.js';
import { installAdapter, uninstallAdapter } from '../adapters/install.js';
import { runInit } from './init.js';
import { t } from '../i18n/index.js';

function resolveTargets({ cwd, agent, all }) {
  if (agent) {
    const a = getAdapter(agent);
    if (!a) throw new Error(t('errors.unknown_adapter', { name: agent }));
    return [a.name];
  }
  if (all) return listAdapters().map((a) => a.name);
  return detectAgents(cwd).map((a) => a.name);
}

async function maybeAutoInit({ cwd, homeDir, flags }) {
  if (flags.noInit || flags.dryRun) return null;
  const configPath = join(cwd, '.docs-numbering.yaml');
  if (existsSync(configPath)) return null;
  const r = await runInit({ cwd, homeDir, flags: {} });
  return r.path;
}

export async function runInstall({ cwd, homeDir, flags = {} }) {
  const initialized = await maybeAutoInit({ cwd, homeDir, flags });
  const targets = resolveTargets({ cwd, agent: flags.agent, all: flags.all });
  if (!targets.length) {
    return {
      initialized,
      detected: [],
      available: listAdapters().map((a) => ({ name: a.name, label: a.label })),
      results: [],
      message: t('install.no_detection')
    };
  }
  const results = [];
  for (const name of targets) {
    const r = await installAdapter({
      cwd,
      agent: name,
      mode: flags.mode,
      force: !!flags.force,
      dryRun: !!flags.dryRun
    });
    results.push(r);
  }
  return { initialized, targets, results, dryRun: !!flags.dryRun };
}

export async function runUninstall({ cwd, flags = {} }) {
  const targets = resolveTargets({ cwd, agent: flags.agent, all: flags.all });
  const results = [];
  for (const name of targets) {
    const r = await uninstallAdapter({ cwd, agent: name, dryRun: !!flags.dryRun });
    results.push(r);
  }
  return { targets, results, dryRun: !!flags.dryRun };
}
