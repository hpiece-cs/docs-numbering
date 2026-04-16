import { readFileSync, existsSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { parse } from 'yaml';
import { DEFAULTS } from './defaults.js';
import { deepMerge } from './schema.js';
import { setLocale, detectLocale } from '../i18n/index.js';

function readYaml(path) {
  if (!existsSync(path)) return null;
  return parse(readFileSync(path, 'utf8')) || {};
}

function expandHome(p, homeDir) {
  if (!p || typeof p !== 'string') return p;
  if (p.startsWith('~/')) return join(homeDir, p.slice(2));
  if (p === '~') return homeDir;
  return p;
}

function flagOverrides(flags = {}) {
  const o = {};
  if (flags.docsDir) o.docs_dir = flags.docsDir;
  return o;
}

export function loadConfig({ cwd, homeDir, flags = {} }) {
  const globalPath = flags.configPath ||
    join(homeDir, '.docs-numbering', 'config.yaml');
  const projectPath = join(cwd, '.docs-numbering.yaml');

  const global = readYaml(globalPath);
  const project = readYaml(projectPath);

  let cfg = deepMerge(DEFAULTS, global || {});
  cfg = deepMerge(cfg, project || {});
  cfg = deepMerge(cfg, flagOverrides(flags));

  cfg.docs_dir = expandHome(cfg.docs_dir, homeDir);

  setLocale(detectLocale({ override: flags.locale, configLocale: cfg.locale }));

  return cfg;
}
