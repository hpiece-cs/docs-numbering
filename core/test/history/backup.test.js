import { describe, it, expect, afterEach } from 'vitest';
import { backupFile, restoreFile } from '../../src/history/backup.js';
import { makeTmpProject } from '../helpers/tmpdir.js';
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

describe('backup', () => {
  it('backupFile copies file under backup/<id>/', async () => {
    const p = makeTmpProject({ 'docs/a.md': 'hello' }); cleanups.push(p.cleanup);
    const id = '2026-04-15T10-00-00';
    const rel = 'docs/a.md';
    const backupPath = await backupFile(p.dir, id, rel);
    expect(existsSync(backupPath)).toBe(true);
    expect(readFileSync(backupPath, 'utf8')).toBe('hello');
  });

  it('restoreFile writes backup content back to original path', async () => {
    const p = makeTmpProject({ 'docs/a.md': 'v1' }); cleanups.push(p.cleanup);
    const id = '2026-04-15T10-00-00';
    await backupFile(p.dir, id, 'docs/a.md');
    writeFileSync(join(p.dir, 'docs/a.md'), 'v2');
    await restoreFile(p.dir, id, 'docs/a.md');
    expect(readFileSync(join(p.dir, 'docs/a.md'), 'utf8')).toBe('v1');
  });
});
