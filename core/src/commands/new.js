import { readdirSync, mkdirSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { loadConfig } from '../config/loader.js';
import { loadPresets, mergePhases } from '../presets/index.js';
import { makeSlug } from '../naming/slug.js';
import { renderPattern } from '../naming/template.js';
import { nextNumber } from '../numbering/next.js';
import { createFile } from '../fs/atomic.js';
import { writeEntry, makeEntryId, markStatus } from '../history/journal.js';
import { withLock } from '../history/state.js';
import { t } from '../i18n/index.js';

function resolveDocsDir(cfg, cwd) {
  return isAbsolute(cfg.docs_dir) ? cfg.docs_dir : join(cwd, cfg.docs_dir);
}

function validatePhase(cfg, phase) {
  if (!phase) return;
  const mode = cfg.numbering.phase_validation;
  if (mode === 'off') return;
  const presets = loadPresets(cfg.numbering.presets);
  const allowed = mergePhases(presets);
  if (allowed.includes(phase)) return;
  if (mode === 'strict') throw new Error(t('errors.unknown_phase', { phase }));
  if (mode === 'warn') {
    process.stderr.write(t('warnings.phase_not_in_presets', { phase }) + '\n');
  }
}

export async function runNew({ cwd, homeDir, flags = {}, args = {} }) {
  const cfg = loadConfig({ cwd, homeDir, flags });
  const method = flags.method || cfg.numbering.default_method || '';
  const phase = flags.phase || '';
  validatePhase(cfg, phase);

  const docsAbs = resolveDocsDir(cfg, cwd);
  mkdirSync(docsAbs, { recursive: true });

  const existing = readdirSync(docsAbs).filter(f => f.endsWith('.md'));
  const num = nextNumber(existing, { start: cfg.numbering.start });

  const slug = makeSlug(args.title, cfg.slug);
  const filename = renderPattern(cfg.naming_pattern, {
    num, slug, method, phase, filename: slug,
    date: flags.date || new Date().toISOString().slice(0, 10)
  });

  const relPath = join(cfg.docs_dir.replace(/\/$/, '') || '.', filename)
    .split(/[\\\/]/).join('/');

  if (flags.dryRun) return { path: relPath, dryRun: true };

  return withLock(cwd, async () => {
    const id = makeEntryId();
    await writeEntry(cwd, {
      id, command: 'new', timestamp: new Date().toISOString(),
      cwd, status: 'pending',
      operations: [{ type: 'create', path: relPath }]
    });
    await createFile(cwd, relPath, args.content || '');
    await markStatus(cwd, id, 'committed');
    return { path: relPath, id };
  });
}
