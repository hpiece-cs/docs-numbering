import { runList } from './list.js';
import { loadConfig } from '../config/loader.js';
import { loadPresets, mergePhases } from '../presets/index.js';

export async function runValidate({ cwd, homeDir, flags = {} }) {
  const cfg = loadConfig({ cwd, homeDir, flags });
  const { items } = await runList({ cwd, homeDir, flags: {} });
  const issues = [];

  const seen = new Map();
  for (const it of items) {
    if (seen.has(it.num)) {
      issues.push({ type: 'duplicate_number', num: it.num, files: [seen.get(it.num).filename, it.filename] });
    } else {
      seen.set(it.num, it);
    }
  }

  const allowed = new Set(mergePhases(loadPresets(cfg.numbering.presets)));
  for (const it of items) {
    if (it.phase && !allowed.has(it.phase)) {
      issues.push({ type: 'unknown_phase', phase: it.phase, filename: it.filename });
    }
  }

  return { issues };
}
