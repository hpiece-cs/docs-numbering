import { describe, it, expect, afterEach } from 'vitest';
import { createFile, renameFile, deleteFile } from '../../src/fs/atomic.js';
import { makeTmpProject } from '../helpers/tmpdir.js';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

describe('atomic fs ops', () => {
  it('createFile writes content, refusing to overwrite', async () => {
    const p = makeTmpProject({}); cleanups.push(p.cleanup);
    await createFile(p.dir, 'docs/a.md', 'hi');
    expect(readFileSync(join(p.dir, 'docs/a.md'), 'utf8')).toBe('hi');
    await expect(createFile(p.dir, 'docs/a.md', 'again')).rejects.toThrow(/exists/);
  });

  it('renameFile moves', async () => {
    const p = makeTmpProject({ 'docs/a.md': 'x' }); cleanups.push(p.cleanup);
    await renameFile(p.dir, 'docs/a.md', 'docs/b.md');
    expect(existsSync(join(p.dir, 'docs/a.md'))).toBe(false);
    expect(readFileSync(join(p.dir, 'docs/b.md'), 'utf8')).toBe('x');
  });

  it('deleteFile removes', async () => {
    const p = makeTmpProject({ 'docs/a.md': 'x' }); cleanups.push(p.cleanup);
    await deleteFile(p.dir, 'docs/a.md');
    expect(existsSync(join(p.dir, 'docs/a.md'))).toBe(false);
  });
});
