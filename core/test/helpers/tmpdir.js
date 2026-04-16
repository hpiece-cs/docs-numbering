import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export function makeTmpProject(files = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'docnum-'));
  for (const [relPath, content] of Object.entries(files)) {
    const full = join(dir, relPath);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content, 'utf8');
  }
  return {
    dir,
    cleanup: () => rmSync(dir, { recursive: true, force: true })
  };
}
