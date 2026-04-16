import { readdirSync, existsSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { loadConfig } from '../config/loader.js';
import { loadPresets, AVAILABLE_PRESETS } from '../presets/index.js';

function buildPhaseMap() {
  const presets = loadPresets(AVAILABLE_PRESETS);
  const map = {};
  for (const [method, preset] of Object.entries(presets)) {
    // sort phases longest-first so we match multi-word phases before short prefixes
    map[method] = [...preset.phases].sort((a, b) => b.length - a.length);
  }
  return map;
}

function parseItem(name, phaseMap) {
  // <num>(-<method>(-<phase>(-<slug>)?)?)?.md
  const base = name.replace(/\.md$/, '');
  const numMatch = base.match(/^(\d+)(?:-(.*))?$/);
  if (!numMatch) return null;
  const num = parseInt(numMatch[1], 10);
  const rest = numMatch[2] || '';
  if (!rest) {
    return { num, method: null, phase: null, slug: null, filename: name };
  }

  // try to match method (first token, alpha only, no dashes within)
  const methodMatch = rest.match(/^([a-z][a-z0-9]*)(?:-(.*))?$/);
  if (!methodMatch) {
    return { num, method: null, phase: null, slug: rest, filename: name };
  }
  const method = methodMatch[1];
  const afterMethod = methodMatch[2] || '';

  if (!afterMethod) {
    return { num, method, phase: null, slug: null, filename: name };
  }

  // try to match a known phase (longest match from preset list)
  let phase = null;
  let slug = afterMethod;
  const knownPhases = phaseMap[method] || [];
  for (const ph of knownPhases) {
    if (afterMethod === ph) {
      phase = ph;
      slug = null;
      break;
    }
    if (afterMethod.startsWith(ph + '-')) {
      phase = ph;
      slug = afterMethod.slice(ph.length + 1);
      break;
    }
  }
  // fallback: treat first token as phase
  if (phase === null) {
    const phMatch = afterMethod.match(/^([a-z][a-z0-9]*)(?:-(.*))?$/);
    if (phMatch) {
      phase = phMatch[1];
      slug = phMatch[2] || null;
    }
  }

  return { num, method, phase, slug, filename: name };
}

function resolveDocsDir(cfg, cwd) {
  return isAbsolute(cfg.docs_dir) ? cfg.docs_dir : join(cwd, cfg.docs_dir);
}

export async function runList({ cwd, homeDir, flags = {} }) {
  const cfg = loadConfig({ cwd, homeDir, flags });
  const dir = resolveDocsDir(cfg, cwd);
  if (!existsSync(dir)) return { items: [] };
  const phaseMap = buildPhaseMap();
  const files = readdirSync(dir).filter(f => f.endsWith('.md'));
  let items = files
    .map(f => parseItem(f, phaseMap))
    .filter(i => i && Number.isFinite(i.num))
    .sort((a, b) => a.num - b.num);
  if (flags.method) items = items.filter(i => i.method === flags.method);
  if (flags.phase) items = items.filter(i => i.phase === flags.phase);
  if (flags.range) {
    const [lo, hi] = flags.range.split('-').map(Number);
    items = items.filter(i => i.num >= lo && i.num <= hi);
  }
  return { items };
}
