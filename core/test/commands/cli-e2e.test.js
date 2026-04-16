import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { makeTmpProject } from '../helpers/tmpdir.js';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const BIN = fileURLToPath(new URL('../../bin/docs-numbering.js', import.meta.url));
let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

function run(cwd, args) {
  return execFileSync('node', [BIN, ...args], { cwd, encoding: 'utf8' });
}

describe('CLI e2e', () => {
  it('init then new then list', () => {
    const p = makeTmpProject({}); cleanups.push(p.cleanup);
    run(p.dir, ['init']);
    expect(existsSync(join(p.dir, '.docs-numbering.yaml'))).toBe(true);
    run(p.dir, ['new', '인증 설계', '--method=bmad', '--phase=prd']);
    const list = run(p.dir, ['list', '--json']);
    const items = JSON.parse(list).items;
    expect(items.length).toBe(1);
    expect(items[0].method).toBe('bmad');
  });
});
