import { loadConfig } from '../config/loader.js';
import { loadPresets, mergePhases } from '../presets/index.js';

export async function runPhases({ cwd, homeDir, flags = {} }) {
  const cfg = loadConfig({ cwd, homeDir, flags });
  const names = flags.method ? [flags.method] : cfg.numbering.presets;
  const presets = loadPresets(names);
  return { method: flags.method || null, phases: mergePhases(presets), presets };
}
