import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { listEntries, readEntry, writeEntry, makeEntryId, makeUniqueEntryId, markStatus } from '../history/journal.js';
import { sha256OfFile } from '../history/checksum.js';
import { renameFile, deleteFile } from '../fs/atomic.js';
import { restoreFile } from '../history/backup.js';
import { withLock } from '../history/state.js';
import { t } from '../i18n/index.js';

function invert(op) {
  if (op.type === 'create') return { type: 'delete', path: op.path };
  if (op.type === 'rename') return { type: 'rename', from: op.to, to: op.from, content_hash_before: op.content_hash_before };
  if (op.type === 'delete') return { type: 'restore', path: op.path, backup_id: op.backup_id };
  throw new Error(t('errors.cannot_invert', { type: op.type }));
}

async function executeInverse(cwd, op, { force }) {
  if (op.type === 'delete') {
    await deleteFile(cwd, op.path);
  } else if (op.type === 'rename') {
    if (op.content_hash_before && existsSync(join(cwd, op.from))) {
      const cur = sha256OfFile(join(cwd, op.from));
      if (cur !== op.content_hash_before && !force) {
        throw new Error(t('errors.checksum_mismatch', { path: op.from }));
      }
    }
    await renameFile(cwd, op.from, op.to);
  } else if (op.type === 'restore') {
    await restoreFile(cwd, op.backup_id, op.path);
  }
}

export async function runRollback({ cwd, homeDir, flags = {} }) {
  const entries = await listEntries(cwd);
  if (!entries.length) throw new Error(t('errors.no_history'));

  let targets;
  if (flags.last || (!flags.to && !flags.range)) {
    targets = [entries[0]];
  } else if (flags.to) {
    const idx = entries.findIndex(e => e.id === flags.to);
    if (idx < 0) throw new Error(t('errors.entry_not_found', { id: flags.to }));
    targets = entries.slice(0, idx);
  } else {
    throw new Error(t('errors.range_not_implemented'));
  }

  const plan = targets.flatMap(e => e.operations.map(invert));
  if (!flags.apply) return { applied: false, plan };

  return withLock(cwd, async () => {
    const id = makeUniqueEntryId(cwd);
    await writeEntry(cwd, {
      id, command: 'rollback', timestamp: new Date().toISOString(),
      cwd, status: 'pending',
      rolled_back: targets.map(t => t.id),
      operations: plan
    });
    for (const op of plan) await executeInverse(cwd, op, { force: !!flags.force });
    await markStatus(cwd, id, 'committed');
    return { applied: true, plan, id };
  });
}
