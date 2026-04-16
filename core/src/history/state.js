import { mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync, openSync, closeSync } from 'node:fs';
import { join } from 'node:path';
import { t } from '../i18n/index.js';

function baseDir(projectDir) {
  const d = join(projectDir, '.docs-numbering');
  mkdirSync(d, { recursive: true });
  return d;
}

export async function readState(projectDir) {
  const p = join(baseDir(projectDir), 'state.json');
  if (!existsSync(p)) return {};
  return JSON.parse(readFileSync(p, 'utf8'));
}

export async function writeState(projectDir, obj) {
  const p = join(baseDir(projectDir), 'state.json');
  writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
}

export async function withLock(projectDir, fn, { retry = true } = {}) {
  const lockPath = join(baseDir(projectDir), 'lock');
  if (existsSync(lockPath)) {
    if (!retry) throw new Error(t('errors.project_locked'));
    for (let i = 0; i < 20 && existsSync(lockPath); i++) {
      await new Promise(r => setTimeout(r, 25));
    }
    if (existsSync(lockPath)) throw new Error(t('errors.project_locked'));
  }
  const fd = openSync(lockPath, 'wx');
  closeSync(fd);
  try {
    return await fn();
  } finally {
    if (existsSync(lockPath)) unlinkSync(lockPath);
  }
}
