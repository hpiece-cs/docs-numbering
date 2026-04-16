import { describe, it, expect, afterEach } from 'vitest';
import { makeEntryId, writeEntry, readEntry, listEntries, markStatus } from '../../src/history/journal.js';
import { makeTmpProject } from '../helpers/tmpdir.js';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });
const mk = () => { const p = makeTmpProject({}); cleanups.push(p.cleanup); return p.dir; };

describe('journal', () => {
  it('makeEntryId returns ISO-like id', () => {
    const id = makeEntryId(new Date('2026-04-15T10:23:01.000Z'));
    expect(id).toBe('2026-04-15T10-23-01');
  });

  it('write then read roundtrip', async () => {
    const dir = mk();
    const entry = {
      id: makeEntryId(new Date()),
      command: 'new',
      timestamp: new Date().toISOString(),
      status: 'pending',
      operations: [{ type: 'create', path: 'docs/001-x.md' }]
    };
    await writeEntry(dir, entry);
    const loaded = await readEntry(dir, entry.id);
    expect(loaded.command).toBe('new');
  });

  it('listEntries returns newest first', async () => {
    const dir = mk();
    await writeEntry(dir, { id: '2026-04-15T10-00-00', command: 'a', operations: [] });
    await writeEntry(dir, { id: '2026-04-15T11-00-00', command: 'b', operations: [] });
    const list = await listEntries(dir);
    expect(list[0].command).toBe('b');
  });

  it('markStatus updates status', async () => {
    const dir = mk();
    const id = '2026-04-15T12-00-00';
    await writeEntry(dir, { id, command: 'x', status: 'pending', operations: [] });
    await markStatus(dir, id, 'committed');
    const e = await readEntry(dir, id);
    expect(e.status).toBe('committed');
  });
});
