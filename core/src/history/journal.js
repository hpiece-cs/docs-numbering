import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { t } from '../i18n/index.js';

function historyDir(projectDir) {
  const d = join(projectDir, '.docs-numbering', 'history');
  mkdirSync(d, { recursive: true });
  return d;
}

export function makeEntryId(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}-${pad(date.getUTCMinutes())}-${pad(date.getUTCSeconds())}`;
}

export function makeUniqueEntryId(projectDir, date = new Date()) {
  const base = makeEntryId(date);
  const d = join(projectDir, '.docs-numbering', 'history');
  mkdirSync(d, { recursive: true });
  let id = base;
  let n = 1;
  while (existsSync(join(d, `${id}.json`))) {
    id = `${base}-${String(n).padStart(3, '0')}`;
    n++;
  }
  return id;
}

export async function writeEntry(projectDir, entry) {
  const p = join(historyDir(projectDir), `${entry.id}.json`);
  writeFileSync(p, JSON.stringify(entry, null, 2), 'utf8');
}

export async function readEntry(projectDir, id) {
  const p = join(historyDir(projectDir), `${id}.json`);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

export async function listEntries(projectDir) {
  const d = historyDir(projectDir);
  const files = readdirSync(d).filter(f => f.endsWith('.json'));
  const entries = files.map(f => JSON.parse(readFileSync(join(d, f), 'utf8')));
  entries.sort((a, b) => (a.id < b.id ? 1 : -1));
  return entries;
}

export async function markStatus(projectDir, id, status) {
  const e = await readEntry(projectDir, id);
  if (!e) throw new Error(t('errors.entry_not_found', { id }));
  e.status = status;
  await writeEntry(projectDir, e);
}
