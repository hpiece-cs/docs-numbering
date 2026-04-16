import { mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { t } from '../i18n/index.js';

function backupRoot(projectDir, id) {
  const d = join(projectDir, '.docs-numbering', 'backup', id);
  mkdirSync(d, { recursive: true });
  return d;
}

export async function backupFile(projectDir, id, relPath) {
  const src = join(projectDir, relPath);
  const dst = join(backupRoot(projectDir, id), relPath);
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  return dst;
}

export async function restoreFile(projectDir, id, relPath) {
  const src = join(backupRoot(projectDir, id), relPath);
  const dst = join(projectDir, relPath);
  if (!existsSync(src)) throw new Error(t('errors.no_backup', { path: relPath, id }));
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
}
