import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ADAPTERS } from './registry.js';

export function detectAgents(baseDir, scope = 'project') {
  const detected = [];
  for (const adapter of Object.values(ADAPTERS)) {
    if (scope === 'user' && adapter.userScope === false) continue;
    const hit = adapter.detect.find((hint) => existsSync(join(baseDir, hint)));
    if (hit) detected.push({ name: adapter.name, label: adapter.label, hint: hit });
  }
  return detected;
}
