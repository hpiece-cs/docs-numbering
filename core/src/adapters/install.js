import {
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  mkdirSync,
  symlinkSync,
  copyFileSync,
  cpSync,
  lstatSync,
  unlinkSync,
  rmSync,
  realpathSync
} from 'node:fs';
import { join, dirname, relative, resolve } from 'node:path';
import { t } from '../i18n/index.js';
import {
  getAdapter,
  getAdaptersDir,
  getAdapterItems,
  getAdapterDefaultMode,
  MERGE_START,
  MERGE_END
} from './registry.js';

function resolveMode(defaultMode, requested) {
  if (!requested || requested === 'auto') return defaultMode;
  return requested;
}

function expandItems(items, adaptersDir) {
  const expanded = [];
  for (const item of items) {
    if (item.type === 'glob') {
      const dir = join(adaptersDir, item.fromDir);
      if (!existsSync(dir)) continue;
      for (const entry of readdirSync(dir)) {
        if (!item.pattern.test(entry)) continue;
        expanded.push({
          type: 'file',
          from: join(item.fromDir, entry),
          to: join(item.toDir, entry)
        });
      }
    } else {
      expanded.push(item);
    }
  }
  return expanded;
}

function ensureParent(path) {
  mkdirSync(dirname(path), { recursive: true });
}

function pathExists(p) {
  try {
    lstatSync(p);
    return true;
  } catch {
    return false;
  }
}

function installLink(srcAbs, destAbs) {
  ensureParent(destAbs);
  let destDir;
  try { destDir = realpathSync(dirname(destAbs)); }
  catch { destDir = dirname(destAbs); }
  const target = relative(destDir, srcAbs);
  symlinkSync(target, destAbs);
}

function installCopy(srcAbs, destAbs, { isDir }) {
  ensureParent(destAbs);
  if (isDir) {
    cpSync(srcAbs, destAbs, { recursive: true });
  } else {
    copyFileSync(srcAbs, destAbs);
  }
}

function installMerge(srcAbs, destAbs) {
  ensureParent(destAbs);
  const body = readFileSync(srcAbs, 'utf8').trim();
  const block = `${MERGE_START}\n${body}\n${MERGE_END}\n`;
  if (!existsSync(destAbs)) {
    writeFileSync(destAbs, block, 'utf8');
    return;
  }
  const existing = readFileSync(destAbs, 'utf8');
  const re = new RegExp(`${MERGE_START}[\\s\\S]*?${MERGE_END}\\n?`);
  if (re.test(existing)) {
    writeFileSync(destAbs, existing.replace(re, block), 'utf8');
  } else {
    const sep = existing.endsWith('\n') ? '\n' : '\n\n';
    writeFileSync(destAbs, existing + sep + block, 'utf8');
  }
}

function removeMerge(destAbs) {
  if (!existsSync(destAbs)) return 'missing';
  const existing = readFileSync(destAbs, 'utf8');
  const re = new RegExp(`\\n?${MERGE_START}[\\s\\S]*?${MERGE_END}\\n?`);
  if (!re.test(existing)) return 'no_block';
  const next = existing.replace(re, '').trimEnd();
  if (!next) {
    unlinkSync(destAbs);
    return 'removed_file';
  }
  writeFileSync(destAbs, next + '\n', 'utf8');
  return 'removed_block';
}

function removePath(destAbs, { isDir }) {
  if (!pathExists(destAbs)) return 'missing';
  const stat = lstatSync(destAbs);
  if (stat.isSymbolicLink() || !isDir) unlinkSync(destAbs);
  else rmSync(destAbs, { recursive: true, force: true });
  return 'removed';
}

function sameRealPath(a, b) {
  try {
    return realpathSync(a) === realpathSync(b);
  } catch {
    return false;
  }
}

export async function installAdapter({ cwd, baseDir, agent, mode, force, dryRun, scope }) {
  const adapter = getAdapter(agent);
  if (!adapter) throw new Error(t('errors.unknown_adapter', { name: agent }));
  if (scope === 'user' && adapter.userScope === false) {
    return { adapter: agent, scope, skipped: 'user-scope-unsupported', actions: [] };
  }
  const adaptersDir = getAdaptersDir();
  const effectiveMode = resolveMode(getAdapterDefaultMode(adapter, scope), mode);
  const items = expandItems(getAdapterItems(adapter, scope), adaptersDir);
  const installBase = baseDir || cwd;
  const actions = [];

  for (const item of items) {
    const srcAbs = resolve(adaptersDir, item.from);
    const destAbs = resolve(installBase, item.to);
    const isDir = item.type === 'dir';

    if (item.type === 'merge' || effectiveMode === 'merge') {
      actions.push({
        adapter: agent,
        mode: 'merge',
        from: item.from,
        to: item.to,
        status: dryRun ? 'dry-run' : 'ok',
        action: 'merge'
      });
      if (!dryRun) installMerge(srcAbs, destAbs);
      continue;
    }

    let relinked = false;
    if (pathExists(destAbs)) {
      if (effectiveMode === 'link' && sameRealPath(destAbs, srcAbs)) {
        actions.push({
          adapter: agent, mode: effectiveMode, from: item.from, to: item.to,
          status: 'already-linked', action: 'skip'
        });
        continue;
      }
      const isStaleSymlink =
        effectiveMode === 'link' && lstatSync(destAbs).isSymbolicLink();
      if (isStaleSymlink) {
        if (!dryRun) unlinkSync(destAbs);
        relinked = true;
      } else if (!force) {
        actions.push({
          adapter: agent, mode: effectiveMode, from: item.from, to: item.to,
          status: 'exists', action: 'skip',
          hint: t('install.exists_hint', { path: item.to })
        });
        continue;
      } else if (!dryRun) {
        removePath(destAbs, { isDir });
      }
    }

    actions.push({
      adapter: agent, mode: effectiveMode, from: item.from, to: item.to,
      status: dryRun ? 'dry-run' : (relinked ? 'relinked' : 'ok'),
      action: effectiveMode
    });
    if (dryRun) continue;

    if (effectiveMode === 'link') installLink(srcAbs, destAbs);
    else if (effectiveMode === 'copy') installCopy(srcAbs, destAbs, { isDir });
    else throw new Error(t('errors.unknown_mode', { mode: effectiveMode }));
  }

  return { adapter: agent, mode: effectiveMode, actions };
}

export async function uninstallAdapter({ cwd, baseDir, agent, dryRun, scope }) {
  const adapter = getAdapter(agent);
  if (!adapter) throw new Error(t('errors.unknown_adapter', { name: agent }));
  if (scope === 'user' && adapter.userScope === false) {
    return { adapter: agent, scope, skipped: 'user-scope-unsupported', actions: [] };
  }
  const adaptersDir = getAdaptersDir();
  const items = expandItems(getAdapterItems(adapter, scope), adaptersDir);
  const installBase = baseDir || cwd;
  const actions = [];

  for (const item of items) {
    const destAbs = resolve(installBase, item.to);
    const isDir = item.type === 'dir';

    if (item.type === 'merge') {
      actions.push({
        adapter: agent, from: item.from, to: item.to,
        status: dryRun ? 'dry-run' : (existsSync(destAbs) ? 'ok' : 'missing'),
        action: 'unmerge'
      });
      if (!dryRun) removeMerge(destAbs);
      continue;
    }

    const present = pathExists(destAbs);
    actions.push({
      adapter: agent, from: item.from, to: item.to,
      status: dryRun ? 'dry-run' : (present ? 'ok' : 'missing'),
      action: 'remove'
    });
    if (!dryRun && present) removePath(destAbs, { isDir });
  }

  return { adapter: agent, actions };
}
