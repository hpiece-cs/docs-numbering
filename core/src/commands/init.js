import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { t } from '../i18n/index.js';
import { detectAgents } from '../adapters/detect.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = join(HERE, '..', '..', 'templates', 'default-config.yaml');

export async function runInit({ cwd, homeDir, flags = {} }) {
  const target = flags.global
    ? join(homeDir, '.docs-numbering', 'config.yaml')
    : join(cwd, '.docs-numbering.yaml');

  if (existsSync(target) && !flags.force) {
    throw new Error(t('errors.config_exists', { path: target }));
  }

  mkdirSync(dirname(target), { recursive: true });
  const tpl = readFileSync(TEMPLATE, 'utf8');
  writeFileSync(target, tpl, 'utf8');
  const detected = flags.global ? [] : detectAgents(cwd);
  return { path: target, detected };
}
