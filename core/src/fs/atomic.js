import { writeFileSync, renameSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { t } from '../i18n/index.js';

export async function createFile(projectDir, relPath, content) {
  const p = join(projectDir, relPath);
  if (existsSync(p)) throw new Error(t('errors.file_exists', { path: relPath }));
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf8');
}

export async function renameFile(projectDir, fromRel, toRel) {
  const from = join(projectDir, fromRel);
  const to = join(projectDir, toRel);
  mkdirSync(dirname(to), { recursive: true });
  renameSync(from, to);
}

export async function deleteFile(projectDir, relPath) {
  const p = join(projectDir, relPath);
  if (existsSync(p)) unlinkSync(p);
}
