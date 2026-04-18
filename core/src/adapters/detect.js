import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ADAPTERS } from './registry.js';

export function detectAgents(cwd) {
  const detected = [];
  for (const adapter of Object.values(ADAPTERS)) {
    const hit = adapter.detect.find((hint) => existsSync(join(cwd, hint)));
    if (hit) detected.push({ name: adapter.name, label: adapter.label, hint: hit });
  }
  return detected;
}
