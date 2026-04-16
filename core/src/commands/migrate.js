import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { loadConfig } from '../config/loader.js';
import { makeSlug } from '../naming/slug.js';
import { renderPattern } from '../naming/template.js';
import { sha256OfFile } from '../history/checksum.js';
import { renameFile } from '../fs/atomic.js';
import { writeEntry, makeEntryId, markStatus } from '../history/journal.js';
import { withLock } from '../history/state.js';

function resolveDocsDir(cfg, cwd) {
  return isAbsolute(cfg.docs_dir) ? cfg.docs_dir : join(cwd, cfg.docs_dir);
}

function sortFiles(files, dir, order) {
  if (order === 'alpha') return [...files].sort();
  if (order === 'mtime') {
    return [...files].sort((a, b) =>
      statSync(join(dir, a)).mtimeMs - statSync(join(dir, b)).mtimeMs);
  }
  return files;
}

function inferSlug(name, cfg) {
  const stripped = name.replace(/\.md$/, '').replace(/^\d+[-_]?/, '');
  return makeSlug(stripped.replace(/[-_]+/g, ' '), cfg.slug);
}

function inferFilename(name) {
  return name.replace(/\.md$/, '').replace(/^\d+[-_]?/, '');
}

export async function runMigrate({ cwd, homeDir, flags = {} }) {
  const cfg = loadConfig({ cwd, homeDir, flags });
  const dir = resolveDocsDir(cfg, cwd);
  const order = flags.order || cfg.migration.default_order;

  const files = readdirSync(dir).filter(f => f.endsWith('.md'));
  const sorted = sortFiles(files, dir, order);

  const start = cfg.numbering.start;
  const plan = sorted.map((name, idx) => {
    const num = start + idx;
    const slug = inferSlug(name, cfg);
    const filename = inferFilename(name);
    const newName = renderPattern(cfg.naming_pattern, {
      num, slug, method: '', phase: '', filename,
      date: new Date().toISOString().slice(0, 10)
    });
    return { from: join(cfg.docs_dir.replace(/\/$/, ''), name).split(/[\\\/]/).join('/'),
             to: join(cfg.docs_dir.replace(/\/$/, ''), newName).split(/[\\\/]/).join('/') };
  }).filter(op => op.from !== op.to);

  if (!flags.apply) return { applied: false, plan };

  return withLock(cwd, async () => {
    const id = makeEntryId();
    const operations = plan.map(op => ({
      type: 'rename',
      from: op.from,
      to: op.to,
      content_hash_before: sha256OfFile(join(cwd, op.from))
    }));
    await writeEntry(cwd, {
      id, command: 'migrate', timestamp: new Date().toISOString(),
      cwd, status: 'pending', operations
    });
    const tmpMoves = plan.map((op, i) => ({
      from: op.from, tmp: `${op.from}.__mig_${i}__`, to: op.to
    }));
    for (const m of tmpMoves) await renameFile(cwd, m.from, m.tmp);
    for (const m of tmpMoves) await renameFile(cwd, m.tmp, m.to);
    await markStatus(cwd, id, 'committed');
    return { applied: true, plan, id };
  });
}
