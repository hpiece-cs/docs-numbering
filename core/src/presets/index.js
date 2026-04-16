import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { parse } from 'yaml';
import { t } from '../i18n/index.js';

const HERE = dirname(fileURLToPath(import.meta.url));

const AVAILABLE = ['bmad', 'gsd', 'wds', 'superpowers'];

export function loadPresets(names = []) {
  const out = {};
  for (const name of names) {
    if (!AVAILABLE.includes(name)) {
      throw new Error(t('errors.unknown_preset', { name }));
    }
    const path = join(HERE, `${name}.yaml`);
    out[name] = parse(readFileSync(path, 'utf8'));
  }
  return out;
}

export function mergePhases(presetsObj) {
  const set = new Set();
  for (const p of Object.values(presetsObj)) {
    for (const ph of p.phases) set.add(ph);
  }
  return [...set];
}

export const AVAILABLE_PRESETS = AVAILABLE;
