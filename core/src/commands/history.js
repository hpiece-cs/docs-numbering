import { listEntries } from '../history/journal.js';

export async function runHistory({ cwd, flags = {} }) {
  let entries = await listEntries(cwd);
  if (flags.limit) entries = entries.slice(0, Number(flags.limit));
  return { entries };
}
