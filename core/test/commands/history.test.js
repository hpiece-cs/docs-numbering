import { describe, it, expect, afterEach } from 'vitest';
import { runHistory } from '../../src/commands/history.js';
import { writeEntry } from '../../src/history/journal.js';
import { makeTmpProject } from '../helpers/tmpdir.js';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

describe('history', () => {
  it('lists entries newest first', async () => {
    const p = makeTmpProject({}); cleanups.push(p.cleanup);
    await writeEntry(p.dir, { id: '2026-04-15T10-00-00', command: 'new', operations: [] });
    await writeEntry(p.dir, { id: '2026-04-15T11-00-00', command: 'migrate', operations: [] });
    const r = await runHistory({ cwd: p.dir, homeDir: p.dir, flags: {} });
    expect(r.entries[0].command).toBe('migrate');
  });

  it('limits with --limit', async () => {
    const p = makeTmpProject({}); cleanups.push(p.cleanup);
    await writeEntry(p.dir, { id: '2026-04-15T10-00-00', command: 'a', operations: [] });
    await writeEntry(p.dir, { id: '2026-04-15T11-00-00', command: 'b', operations: [] });
    const r = await runHistory({ cwd: p.dir, homeDir: p.dir, flags: { limit: 1 } });
    expect(r.entries.length).toBe(1);
  });
});
