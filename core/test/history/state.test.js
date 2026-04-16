import { describe, it, expect, afterEach } from 'vitest';
import { withLock, readState, writeState } from '../../src/history/state.js';
import { makeTmpProject } from '../helpers/tmpdir.js';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

function mk() {
  const p = makeTmpProject({});
  cleanups.push(p.cleanup);
  return p.dir;
}

describe('state', () => {
  it('readState returns empty object when no file', async () => {
    const dir = mk();
    expect(await readState(dir)).toEqual({});
  });

  it('writeState then readState roundtrip', async () => {
    const dir = mk();
    await writeState(dir, { last_id: 'abc' });
    expect(await readState(dir)).toEqual({ last_id: 'abc' });
  });

  it('withLock runs fn and releases lock', async () => {
    const dir = mk();
    const ran = await withLock(dir, async () => 42);
    expect(ran).toBe(42);
  });

  it('withLock rejects concurrent acquisition', async () => {
    const dir = mk();
    const slow = withLock(dir, () => new Promise(r => setTimeout(r, 50)));
    await expect(
      withLock(dir, async () => 1, { retry: false })
    ).rejects.toThrow(/locked/i);
    await slow;
  });
});
