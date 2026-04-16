# docs-numbering v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `@hpiece/docs-numbering`의 v1 릴리스(core CLI + Claude Code Skill 어댑터)를 TDD로 구현한다.

**Architecture:** Node.js ESM 단일 패키지. 계층형 YAML 설정을 읽어 규칙 기반으로 마크다운 문서를 생성/정리하고, git에 의존하지 않는 자체 저널/백업/체크섬 기반 롤백을 제공한다. 각 레이어(slug/naming/config/preset/journal/commands)는 독립 테스트 가능한 순수 함수 위주로 구성하여 TDD로 쌓아 올린다.

**Tech Stack:**
- Node.js 20+ (ESM)
- `commander` — CLI 파싱
- `yaml` — YAML 파싱
- `@sindresorhus/slugify` — slug 처리 (언어 옵션 지원)
- `chalk` — 컬러 출력
- `vitest` — 테스트
- `prettier` — 포맷터

**Repo 기준 경로:** 모든 상대경로는 `/Users/Work/git/claude/skills/docs-numbering/` 루트 기준.

---

## File Structure

### 생성될 파일

**패키지 루트**
- `core/package.json` — npm 패키지 메타데이터
- `core/README.md` — 사용법
- `core/.gitignore`
- `core/vitest.config.js`
- `core/bin/docs-numbering.js` — CLI 진입점

**소스 (core/src/)**
- `src/index.js` — 라이브러리 진입점 (commands 라우팅)
- `src/config/loader.js` — 계층형 YAML 설정 로더
- `src/config/defaults.js` — 기본값
- `src/config/schema.js` — 스키마 검증
- `src/naming/slug.js` — slug 생성
- `src/naming/template.js` — 파일명 패턴 렌더링
- `src/numbering/next.js` — 다음 번호 계산
- `src/presets/index.js` — 프리셋 로더
- `src/presets/bmad.yaml`
- `src/presets/gsd.yaml`
- `src/presets/wds.yaml`
- `src/presets/superpowers.yaml`
- `src/history/journal.js` — 저널 read/write
- `src/history/state.js` — state.json + lockfile
- `src/history/checksum.js` — sha256 유틸
- `src/history/backup.js` — 백업 manager
- `src/fs/atomic.js` — 원자적 파일 연산 (rename/create/delete)
- `src/commands/init.js`
- `src/commands/new.js`
- `src/commands/list.js`
- `src/commands/migrate.js`
- `src/commands/phases.js`
- `src/commands/validate.js`
- `src/commands/history.js`
- `src/commands/rollback.js`

**테스트 (core/test/)**
- `test/naming/slug.test.js`
- `test/naming/template.test.js`
- `test/config/loader.test.js`
- `test/numbering/next.test.js`
- `test/presets/index.test.js`
- `test/history/journal.test.js`
- `test/history/checksum.test.js`
- `test/history/backup.test.js`
- `test/fs/atomic.test.js`
- `test/commands/init.test.js`
- `test/commands/new.test.js`
- `test/commands/list.test.js`
- `test/commands/migrate.test.js`
- `test/commands/phases.test.js`
- `test/commands/validate.test.js`
- `test/commands/history.test.js`
- `test/commands/rollback.test.js`
- `test/helpers/tmpdir.js` — 테스트용 임시 프로젝트 생성 헬퍼

**어댑터**
- `adapters/claude-code/skills/docs-numbering/SKILL.md`
- `adapters/claude-code/commands/docs-new.md`
- `adapters/claude-code/commands/docs-migrate.md`
- `adapters/claude-code/commands/docs-rollback.md`

**설정 템플릿**
- `core/templates/default-config.yaml`

---

## Phase A: 프로젝트 부트스트랩

### Task 1: npm 패키지 초기화

**Files:**
- Create: `core/package.json`
- Create: `core/.gitignore`
- Create: `core/vitest.config.js`
- Create: `core/README.md`

- [ ] **Step 1: core 디렉토리 생성 및 package.json 작성**

```bash
mkdir -p core
```

Create `core/package.json`:
```json
{
  "name": "@hpiece/docs-numbering",
  "version": "0.1.0",
  "description": "CLI-neutral numbered markdown documentation manager for AI coding CLIs",
  "type": "module",
  "bin": {
    "docs-numbering": "bin/docs-numbering.js",
    "docnum": "bin/docs-numbering.js"
  },
  "exports": {
    ".": "./src/index.js"
  },
  "engines": {
    "node": ">=20"
  },
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "format": "prettier --write ."
  },
  "dependencies": {
    "commander": "^12.1.0",
    "yaml": "^2.6.0",
    "@sindresorhus/slugify": "^2.2.1",
    "chalk": "^5.3.0"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "prettier": "^3.3.0"
  }
}
```

- [ ] **Step 2: .gitignore / vitest.config.js / README 작성**

Create `core/.gitignore`:
```
node_modules/
.docs-numbering/
coverage/
*.log
```

Create `core/vitest.config.js`:
```js
export default {
  test: {
    include: ['test/**/*.test.js'],
    environment: 'node'
  }
};
```

Create `core/README.md`:
```markdown
# @hpiece/docs-numbering

Numbered markdown documentation manager. See `docs/superpowers/specs/2026-04-15-docs-numbering-design.md` for full design.

## Install
\`\`\`bash
npm i -g @hpiece/docs-numbering
# or: npx @hpiece/docs-numbering <command>
\`\`\`
```

- [ ] **Step 3: 의존성 설치**

Run: `cd core && npm install`
Expected: `node_modules/` 생성, `package-lock.json` 생성, 에러 없음

- [ ] **Step 4: 빈 테스트 통과 확인**

```bash
cd core && npx vitest run
```
Expected: `No test files found` 메시지 또는 0 tests passed. exit 0.

- [ ] **Step 5: 커밋은 나중에 (git 미사용). 진행 상태만 확인**

Run: `ls core/`
Expected: `package.json`, `package-lock.json`, `node_modules`, `vitest.config.js`, `README.md`, `.gitignore` 확인

---

### Task 2: CLI 진입점 뼈대

**Files:**
- Create: `core/bin/docs-numbering.js`
- Create: `core/src/index.js`
- Test: `core/test/commands/version.test.js`

- [ ] **Step 1: 버전 출력 테스트 먼저 작성**

Create `core/test/commands/version.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';

describe('CLI --version', () => {
  it('prints package version', () => {
    const out = execSync('node bin/docs-numbering.js --version', {
      cwd: new URL('../..', import.meta.url).pathname,
      encoding: 'utf8'
    });
    expect(out.trim()).toBe('0.1.0');
  });
});
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

Run: `cd core && npx vitest run test/commands/version.test.js`
Expected: FAIL (`bin/docs-numbering.js` 없음)

- [ ] **Step 3: CLI 진입점 최소 구현**

Create `core/bin/docs-numbering.js`:
```js
#!/usr/bin/env node
import { program } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')
);

program
  .name('docs-numbering')
  .description('Numbered markdown documentation manager')
  .version(pkg.version);

program.parseAsync(process.argv);
```

Create `core/src/index.js`:
```js
export const VERSION = '0.1.0';
```

- [ ] **Step 4: 실행 권한 부여 및 테스트 통과**

Run: `chmod +x core/bin/docs-numbering.js && cd core && npx vitest run test/commands/version.test.js`
Expected: PASS (1 test)

---

## Phase B: Foundation Layer (순수 함수, TDD 친화)

### Task 3: Slug 엔진

**Files:**
- Create: `core/src/naming/slug.js`
- Test: `core/test/naming/slug.test.js`

- [ ] **Step 1: 실패 테스트 작성**

Create `core/test/naming/slug.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { makeSlug } from '../../src/naming/slug.js';

describe('makeSlug', () => {
  it('preserves Korean by default', () => {
    expect(makeSlug('사용자 인증 설계', { language: 'preserve' }))
      .toBe('사용자-인증-설계');
  });

  it('romanizes Korean when language=romanize', () => {
    const out = makeSlug('사용자 인증', { language: 'romanize' });
    expect(out).toMatch(/^[a-z0-9-]+$/);
  });

  it('lowercases Latin letters only', () => {
    expect(makeSlug('User Auth 설계', { language: 'preserve', lowercase: true }))
      .toBe('user-auth-설계');
  });

  it('strips filesystem-forbidden chars', () => {
    expect(makeSlug('a/b\\c:d*e?f"g<h>i|j', { language: 'preserve' }))
      .not.toMatch(/[\/\\:*?"<>|]/);
  });

  it('respects max_length', () => {
    const long = 'a'.repeat(100);
    expect(makeSlug(long, { language: 'preserve', max_length: 20 }).length)
      .toBeLessThanOrEqual(20);
  });

  it('applies custom separator', () => {
    expect(makeSlug('hello world test', { language: 'preserve', separator: '_' }))
      .toBe('hello_world_test');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/naming/slug.test.js`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

Create `core/src/naming/slug.js`:
```js
import slugify from '@sindresorhus/slugify';

const FORBIDDEN = /[\/\\:*?"<>|]/g;

export function makeSlug(input, opts = {}) {
  const {
    language = 'preserve',
    separator = '-',
    lowercase = true,
    max_length = 50
  } = opts;

  let s = String(input).replace(FORBIDDEN, '');

  if (language === 'romanize') {
    s = slugify(s, { separator, lowercase: true });
  } else {
    // preserve: 공백만 separator로, 금지 문자만 제거
    s = s.trim().split(/\s+/).join(separator);
    if (lowercase) {
      // 라틴 문자만 소문자화: 한글/일본어 등은 그대로
      s = s.replace(/[A-Z]/g, (c) => c.toLowerCase());
    }
  }

  if (s.length > max_length) {
    s = s.slice(0, max_length).replace(new RegExp(`${separator}+$`), '');
  }
  return s;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd core && npx vitest run test/naming/slug.test.js`
Expected: PASS (6 tests)

---

### Task 4: 파일명 템플릿 엔진

**Files:**
- Create: `core/src/naming/template.js`
- Test: `core/test/naming/template.test.js`

- [ ] **Step 1: 실패 테스트 작성**

Create `core/test/naming/template.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { renderPattern } from '../../src/naming/template.js';

describe('renderPattern', () => {
  it('interpolates simple variables', () => {
    expect(renderPattern('{num}-{slug}.md', { num: 1, slug: 'auth' }))
      .toBe('1-auth.md');
  });

  it('pads num with format spec', () => {
    expect(renderPattern('{num:03d}-{slug}.md', { num: 4, slug: 'auth' }))
      .toBe('004-auth.md');
  });

  it('omits empty method/phase gracefully', () => {
    expect(renderPattern('{num:03d}-{method}-{phase}-{slug}.md',
      { num: 1, method: '', phase: '', slug: 'x' }))
      .toBe('001-x.md');
  });

  it('keeps method/phase when provided', () => {
    expect(renderPattern('{num:03d}-{method}-{phase}-{slug}.md',
      { num: 2, method: 'bmad', phase: 'prd', slug: 'auth' }))
      .toBe('002-bmad-prd-auth.md');
  });

  it('supports {date}', () => {
    expect(renderPattern('{date}-{slug}.md',
      { date: '2026-04-15', slug: 'x' }))
      .toBe('2026-04-15-x.md');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/naming/template.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `core/src/naming/template.js`:
```js
const TOKEN = /\{(\w+)(?::([^}]+))?\}/g;

function formatValue(value, spec) {
  if (!spec) return String(value);
  const m = spec.match(/^0(\d+)d$/);
  if (m && typeof value === 'number') {
    return String(value).padStart(Number(m[1]), '0');
  }
  return String(value);
}

export function renderPattern(pattern, vars) {
  // 1차 치환
  let out = pattern.replace(TOKEN, (_, key, spec) => {
    const v = vars[key];
    if (v === undefined || v === null || v === '') return '';
    return formatValue(v, spec);
  });
  // 빈 토큰으로 생긴 연속 separator 정리
  out = out.replace(/-+/g, '-').replace(/-\./g, '.').replace(/^-/, '');
  return out;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `cd core && npx vitest run test/naming/template.test.js`
Expected: PASS (5 tests)

---

### Task 5: 설정 로더 (defaults + schema + hierarchical)

**Files:**
- Create: `core/src/config/defaults.js`
- Create: `core/src/config/schema.js`
- Create: `core/src/config/loader.js`
- Create: `core/templates/default-config.yaml`
- Create: `core/test/helpers/tmpdir.js`
- Test: `core/test/config/loader.test.js`

- [ ] **Step 1: 테스트 헬퍼 작성**

Create `core/test/helpers/tmpdir.js`:
```js
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
```

- [ ] **Step 2: 실패 테스트 작성**

Create `core/test/config/loader.test.js`:
```js
import { describe, it, expect, afterEach } from 'vitest';
import { loadConfig } from '../../src/config/loader.js';
import { makeTmpProject } from '../helpers/tmpdir.js';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

function mk(files) {
  const p = makeTmpProject(files);
  cleanups.push(p.cleanup);
  return p.dir;
}

describe('loadConfig', () => {
  it('returns defaults when no config exists', () => {
    const cwd = mk({});
    const cfg = loadConfig({ cwd, homeDir: cwd, flags: {} });
    expect(cfg.docs_dir).toBe('docs/');
    expect(cfg.numbering.strategy).toBe('sequential');
    expect(cfg.slug.language).toBe('preserve');
  });

  it('project config overrides defaults', () => {
    const cwd = mk({
      '.docs-numbering.yaml': 'docs_dir: "specs/"\nslug:\n  language: romanize\n'
    });
    const cfg = loadConfig({ cwd, homeDir: cwd, flags: {} });
    expect(cfg.docs_dir).toBe('specs/');
    expect(cfg.slug.language).toBe('romanize');
    expect(cfg.slug.separator).toBe('-'); // default kept
  });

  it('flags override project config', () => {
    const cwd = mk({
      '.docs-numbering.yaml': 'docs_dir: "specs/"\n'
    });
    const cfg = loadConfig({ cwd, homeDir: cwd, flags: { docsDir: 'notes/' } });
    expect(cfg.docs_dir).toBe('notes/');
  });

  it('global config overridden by project', () => {
    const cwd = mk({
      '.docs-numbering/config.yaml': 'docs_dir: "global-docs/"\n',
      '.docs-numbering.yaml': 'docs_dir: "project-docs/"\n'
    });
    const cfg = loadConfig({ cwd, homeDir: cwd, flags: {} });
    expect(cfg.docs_dir).toBe('project-docs/');
  });

  it('expands ~ in docs_dir', () => {
    const cwd = mk({ '.docs-numbering.yaml': 'docs_dir: "~/shared"\n' });
    const cfg = loadConfig({ cwd, homeDir: '/fake/home', flags: {} });
    expect(cfg.docs_dir).toBe('/fake/home/shared');
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `cd core && npx vitest run test/config/loader.test.js`
Expected: FAIL (모듈 없음)

- [ ] **Step 4: defaults + schema 작성**

Create `core/src/config/defaults.js`:
```js
export const DEFAULTS = {
  docs_dir: 'docs/',
  naming_pattern: '{num:03d}-{method}-{phase}-{slug}.md',
  numbering: {
    strategy: 'sequential',
    start: 1,
    padding: 3,
    presets: [],
    phase_validation: 'warn',
    default_method: null
  },
  slug: {
    language: 'preserve',
    separator: '-',
    lowercase: true,
    max_length: 50
  },
  migration: {
    default_order: 'mtime',
    safety: {
      dry_run_default: true,
      backup_dir: '.docs-numbering/backup'
    }
  },
  history: {
    enabled: true,
    max_entries: 100,
    retain_days: 30,
    include_backups: true
  },
  frontmatter: {
    enabled: false,
    template: ''
  }
};
```

Create `core/src/config/schema.js`:
```js
export function deepMerge(base, override) {
  if (override === undefined || override === null) return base;
  if (typeof base !== 'object' || Array.isArray(base)) return override;
  const out = { ...base };
  for (const k of Object.keys(override)) {
    if (override[k] !== undefined) {
      out[k] = deepMerge(base[k], override[k]);
    }
  }
  return out;
}
```

- [ ] **Step 5: loader 구현**

Create `core/src/config/loader.js`:
```js
import { readFileSync, existsSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { parse } from 'yaml';
import { DEFAULTS } from './defaults.js';
import { deepMerge } from './schema.js';

function readYaml(path) {
  if (!existsSync(path)) return null;
  return parse(readFileSync(path, 'utf8')) || {};
}

function expandHome(p, homeDir) {
  if (!p || typeof p !== 'string') return p;
  if (p.startsWith('~/')) return join(homeDir, p.slice(2));
  if (p === '~') return homeDir;
  return p;
}

function flagOverrides(flags = {}) {
  const o = {};
  if (flags.docsDir) o.docs_dir = flags.docsDir;
  if (flags.configPath) {/* handled externally */}
  return o;
}

export function loadConfig({ cwd, homeDir, flags = {} }) {
  const globalPath = flags.configPath ||
    join(homeDir, '.docs-numbering', 'config.yaml');
  const projectPath = join(cwd, '.docs-numbering.yaml');

  const global = readYaml(globalPath);
  const project = readYaml(projectPath);

  let cfg = deepMerge(DEFAULTS, global || {});
  cfg = deepMerge(cfg, project || {});
  cfg = deepMerge(cfg, flagOverrides(flags));

  cfg.docs_dir = expandHome(cfg.docs_dir, homeDir);

  return cfg;
}
```

- [ ] **Step 6: default-config.yaml 템플릿 작성**

Create `core/templates/default-config.yaml`:
```yaml
docs_dir: "docs/"
naming_pattern: "{num:03d}-{method}-{phase}-{slug}.md"

numbering:
  strategy: sequential
  start: 1
  padding: 3
  presets: [bmad]
  phase_validation: warn

slug:
  language: preserve
  separator: "-"
  lowercase: true
  max_length: 50

migration:
  default_order: mtime
  safety:
    dry_run_default: true
    backup_dir: ".docs-numbering/backup"

history:
  enabled: true
  max_entries: 100
  retain_days: 30
```

- [ ] **Step 7: 테스트 통과 확인**

Run: `cd core && npx vitest run test/config/loader.test.js`
Expected: PASS (5 tests)

---

### Task 6: 프리셋 로더

**Files:**
- Create: `core/src/presets/index.js`
- Create: `core/src/presets/bmad.yaml`
- Create: `core/src/presets/gsd.yaml`
- Create: `core/src/presets/wds.yaml`
- Create: `core/src/presets/superpowers.yaml`
- Test: `core/test/presets/index.test.js`

- [ ] **Step 1: 프리셋 YAML 파일 4개 작성**

Create `core/src/presets/bmad.yaml`:
```yaml
name: bmad
phases:
  - brief
  - prd
  - architecture
  - ux-design
  - epics
  - stories
  - dev
  - review
  - retrospective
```

Create `core/src/presets/gsd.yaml`:
```yaml
name: gsd
phases:
  - new-project
  - discuss-phase
  - plan-phase
  - execute-phase
  - verify-work
  - ship
```

Create `core/src/presets/wds.yaml`:
```yaml
name: wds
phases:
  - project-setup
  - project-brief
  - trigger-mapping
  - scenarios
  - ux-design
  - agentic-development
  - asset-generation
  - design-system
  - product-evolution
```

Create `core/src/presets/superpowers.yaml`:
```yaml
name: superpowers
phases:
  - brainstorm
  - spec
  - plan
  - tdd
  - review
```

- [ ] **Step 2: 실패 테스트 작성**

Create `core/test/presets/index.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { loadPresets, mergePhases } from '../../src/presets/index.js';

describe('loadPresets', () => {
  it('loads bmad preset', () => {
    const p = loadPresets(['bmad']);
    expect(p.bmad.phases).toContain('prd');
    expect(p.bmad.phases).toContain('stories');
  });

  it('loads multiple presets', () => {
    const p = loadPresets(['bmad', 'gsd']);
    expect(Object.keys(p).sort()).toEqual(['bmad', 'gsd']);
  });

  it('throws on unknown preset', () => {
    expect(() => loadPresets(['bogus'])).toThrow(/unknown preset/i);
  });
});

describe('mergePhases', () => {
  it('returns union of all phases across loaded presets', () => {
    const phases = mergePhases(loadPresets(['bmad', 'gsd']));
    expect(phases).toContain('prd');
    expect(phases).toContain('plan-phase');
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `cd core && npx vitest run test/presets/index.test.js`
Expected: FAIL

- [ ] **Step 4: 로더 구현**

Create `core/src/presets/index.js`:
```js
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { parse } from 'yaml';

const HERE = dirname(fileURLToPath(import.meta.url));

const AVAILABLE = ['bmad', 'gsd', 'wds', 'superpowers'];

export function loadPresets(names = []) {
  const out = {};
  for (const name of names) {
    if (!AVAILABLE.includes(name)) {
      throw new Error(`unknown preset: ${name}`);
    }
    const path = join(HERE, `${name}.yaml`);
    out[name] = parse(readFileSync(path, 'utf8'));
  }
  return out;
}

export function mergePhases(presetsObj) {
  const set = new Set();
  for (const p of Object.values(presetsObj)) {
    for (const ph of p.phases) set.add(ph);
  }
  return [...set];
}

export const AVAILABLE_PRESETS = AVAILABLE;
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `cd core && npx vitest run test/presets/index.test.js`
Expected: PASS (4 tests)

---

### Task 7: 다음 번호 계산기

**Files:**
- Create: `core/src/numbering/next.js`
- Test: `core/test/numbering/next.test.js`

- [ ] **Step 1: 실패 테스트 작성**

Create `core/test/numbering/next.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { nextNumber, parseNumberFromFilename } from '../../src/numbering/next.js';

describe('parseNumberFromFilename', () => {
  it('extracts leading number', () => {
    expect(parseNumberFromFilename('001-bmad-prd-auth.md')).toBe(1);
    expect(parseNumberFromFilename('042-notes.md')).toBe(42);
  });
  it('returns null when no number', () => {
    expect(parseNumberFromFilename('readme.md')).toBeNull();
  });
});

describe('nextNumber', () => {
  it('returns start when no files', () => {
    expect(nextNumber([], { start: 1 })).toBe(1);
  });
  it('returns max+1', () => {
    expect(nextNumber(['001-a.md', '003-b.md', '002-c.md'], { start: 1 }))
      .toBe(4);
  });
  it('respects start > max', () => {
    expect(nextNumber(['001-a.md'], { start: 100 })).toBe(100);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/numbering/next.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `core/src/numbering/next.js`:
```js
export function parseNumberFromFilename(name) {
  const m = name.match(/^(\d+)(?:[-_.]|$)/);
  return m ? parseInt(m[1], 10) : null;
}

export function nextNumber(filenames, { start = 1 } = {}) {
  const nums = filenames
    .map(parseNumberFromFilename)
    .filter((n) => n !== null);
  const max = nums.length ? Math.max(...nums) : start - 1;
  return Math.max(start, max + 1);
}
```

- [ ] **Step 4: 테스트 통과**

Run: `cd core && npx vitest run test/numbering/next.test.js`
Expected: PASS (5 tests)

---

## Phase C: State / History Layer

### Task 8: 체크섬 유틸

**Files:**
- Create: `core/src/history/checksum.js`
- Test: `core/test/history/checksum.test.js`

- [ ] **Step 1: 실패 테스트**

Create `core/test/history/checksum.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { sha256OfString, sha256OfFile } from '../../src/history/checksum.js';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('sha256OfString', () => {
  it('returns deterministic hex with prefix', () => {
    expect(sha256OfString('hello')).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(sha256OfString('hello')).toBe(sha256OfString('hello'));
  });
});

describe('sha256OfFile', () => {
  it('matches string hash for same content', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cs-'));
    const f = join(dir, 'x.md');
    writeFileSync(f, 'hello');
    expect(sha256OfFile(f)).toBe(sha256OfString('hello'));
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/history/checksum.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `core/src/history/checksum.js`:
```js
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export function sha256OfString(s) {
  return 'sha256:' + createHash('sha256').update(s).digest('hex');
}

export function sha256OfFile(path) {
  return sha256OfString(readFileSync(path));
}
```

- [ ] **Step 4: 테스트 통과**

Run: `cd core && npx vitest run test/history/checksum.test.js`
Expected: PASS (2 tests)

---

### Task 9: State / Lockfile

**Files:**
- Create: `core/src/history/state.js`
- Test: `core/test/history/state.test.js` (파일명이 history/ 하위)

- [ ] **Step 1: 실패 테스트**

Create `core/test/history/state.test.js`:
```js
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
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/history/state.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `core/src/history/state.js`:
```js
import { mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync, openSync, closeSync } from 'node:fs';
import { join } from 'node:path';

function baseDir(projectDir) {
  const d = join(projectDir, '.docs-numbering');
  mkdirSync(d, { recursive: true });
  return d;
}

export async function readState(projectDir) {
  const p = join(baseDir(projectDir), 'state.json');
  if (!existsSync(p)) return {};
  return JSON.parse(readFileSync(p, 'utf8'));
}

export async function writeState(projectDir, obj) {
  const p = join(baseDir(projectDir), 'state.json');
  writeFileSync(p, JSON.stringify(obj, null, 2), 'utf8');
}

export async function withLock(projectDir, fn, { retry = true } = {}) {
  const lockPath = join(baseDir(projectDir), 'lock');
  if (existsSync(lockPath)) {
    if (!retry) throw new Error('project is locked by another process');
    // simple wait-retry loop (short)
    for (let i = 0; i < 20 && existsSync(lockPath); i++) {
      await new Promise(r => setTimeout(r, 25));
    }
    if (existsSync(lockPath)) throw new Error('project is locked by another process');
  }
  const fd = openSync(lockPath, 'wx');
  closeSync(fd);
  try {
    return await fn();
  } finally {
    if (existsSync(lockPath)) unlinkSync(lockPath);
  }
}
```

- [ ] **Step 4: 테스트 통과**

Run: `cd core && npx vitest run test/history/state.test.js`
Expected: PASS (4 tests)

---

### Task 10: 저널 (Journal) 엔트리 read/write

**Files:**
- Create: `core/src/history/journal.js`
- Test: `core/test/history/journal.test.js`

- [ ] **Step 1: 실패 테스트**

Create `core/test/history/journal.test.js`:
```js
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
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/history/journal.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `core/src/history/journal.js`:
```js
import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function historyDir(projectDir) {
  const d = join(projectDir, '.docs-numbering', 'history');
  mkdirSync(d, { recursive: true });
  return d;
}

export function makeEntryId(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}-${pad(date.getUTCMinutes())}-${pad(date.getUTCSeconds())}`;
}

export async function writeEntry(projectDir, entry) {
  const p = join(historyDir(projectDir), `${entry.id}.json`);
  writeFileSync(p, JSON.stringify(entry, null, 2), 'utf8');
}

export async function readEntry(projectDir, id) {
  const p = join(historyDir(projectDir), `${id}.json`);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

export async function listEntries(projectDir) {
  const d = historyDir(projectDir);
  const files = readdirSync(d).filter(f => f.endsWith('.json'));
  const entries = files.map(f => JSON.parse(readFileSync(join(d, f), 'utf8')));
  entries.sort((a, b) => (a.id < b.id ? 1 : -1));
  return entries;
}

export async function markStatus(projectDir, id, status) {
  const e = await readEntry(projectDir, id);
  if (!e) throw new Error(`entry not found: ${id}`);
  e.status = status;
  await writeEntry(projectDir, e);
}
```

- [ ] **Step 4: 테스트 통과**

Run: `cd core && npx vitest run test/history/journal.test.js`
Expected: PASS (4 tests)

---

### Task 11: 백업 매니저

**Files:**
- Create: `core/src/history/backup.js`
- Test: `core/test/history/backup.test.js`

- [ ] **Step 1: 실패 테스트**

Create `core/test/history/backup.test.js`:
```js
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
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/history/backup.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `core/src/history/backup.js`:
```js
import { mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

function backupRoot(projectDir, id) {
  const d = join(projectDir, '.docs-numbering', 'backup', id);
  mkdirSync(d, { recursive: true });
  return d;
}

export async function backupFile(projectDir, id, relPath) {
  const src = join(projectDir, relPath);
  const dst = join(backupRoot(projectDir, id), relPath);
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  return dst;
}

export async function restoreFile(projectDir, id, relPath) {
  const src = join(backupRoot(projectDir, id), relPath);
  const dst = join(projectDir, relPath);
  if (!existsSync(src)) throw new Error(`no backup for ${relPath} in ${id}`);
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
}
```

- [ ] **Step 4: 테스트 통과**

Run: `cd core && npx vitest run test/history/backup.test.js`
Expected: PASS (2 tests)

---

### Task 12: 원자적 파일 연산 래퍼

**Files:**
- Create: `core/src/fs/atomic.js`
- Test: `core/test/fs/atomic.test.js`

- [ ] **Step 1: 실패 테스트**

Create `core/test/fs/atomic.test.js`:
```js
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
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/fs/atomic.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `core/src/fs/atomic.js`:
```js
import { writeFileSync, renameSync, unlinkSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

export async function createFile(projectDir, relPath, content) {
  const p = join(projectDir, relPath);
  if (existsSync(p)) throw new Error(`file exists: ${relPath}`);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf8');
}

export async function renameFile(projectDir, fromRel, toRel) {
  const from = join(projectDir, fromRel);
  const to = join(projectDir, toRel);
  mkdirSync(dirname(to), { recursive: true });
  renameSync(from, to);
}

export async function deleteFile(projectDir, relPath) {
  const p = join(projectDir, relPath);
  if (existsSync(p)) unlinkSync(p);
}
```

- [ ] **Step 4: 테스트 통과**

Run: `cd core && npx vitest run test/fs/atomic.test.js`
Expected: PASS (3 tests)

---

## Phase D: Commands

각 command는 `{ cwd, homeDir, flags, stdio }` 형태의 컨텍스트를 받는 pure async 함수로 만들고, CLI 진입점이 이를 엮는다.

### Task 13: `init` command

**Files:**
- Create: `core/src/commands/init.js`
- Test: `core/test/commands/init.test.js`

- [ ] **Step 1: 실패 테스트**

Create `core/test/commands/init.test.js`:
```js
import { describe, it, expect, afterEach } from 'vitest';
import { runInit } from '../../src/commands/init.js';
import { makeTmpProject } from '../helpers/tmpdir.js';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

describe('init', () => {
  it('creates project config', async () => {
    const p = makeTmpProject({}); cleanups.push(p.cleanup);
    await runInit({ cwd: p.dir, homeDir: p.dir, flags: {} });
    const path = join(p.dir, '.docs-numbering.yaml');
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path, 'utf8')).toMatch(/docs_dir:/);
  });

  it('creates global config with --global', async () => {
    const p = makeTmpProject({}); cleanups.push(p.cleanup);
    await runInit({ cwd: p.dir, homeDir: p.dir, flags: { global: true } });
    const path = join(p.dir, '.docs-numbering', 'config.yaml');
    expect(existsSync(path)).toBe(true);
  });

  it('refuses to overwrite existing without force', async () => {
    const p = makeTmpProject({ '.docs-numbering.yaml': 'docs_dir: keep/' });
    cleanups.push(p.cleanup);
    await expect(
      runInit({ cwd: p.dir, homeDir: p.dir, flags: {} })
    ).rejects.toThrow(/exists/);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/commands/init.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `core/src/commands/init.js`:
```js
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATE = join(HERE, '..', '..', 'templates', 'default-config.yaml');

export async function runInit({ cwd, homeDir, flags = {} }) {
  const target = flags.global
    ? join(homeDir, '.docs-numbering', 'config.yaml')
    : join(cwd, '.docs-numbering.yaml');

  if (existsSync(target) && !flags.force) {
    throw new Error(`config exists: ${target} (use --force to overwrite)`);
  }

  mkdirSync(dirname(target), { recursive: true });
  const tpl = readFileSync(TEMPLATE, 'utf8');
  writeFileSync(target, tpl, 'utf8');
  return { path: target };
}
```

- [ ] **Step 4: 테스트 통과**

Run: `cd core && npx vitest run test/commands/init.test.js`
Expected: PASS (3 tests)

---

### Task 14: `phases` command

**Files:**
- Create: `core/src/commands/phases.js`
- Test: `core/test/commands/phases.test.js`

- [ ] **Step 1: 실패 테스트**

Create `core/test/commands/phases.test.js`:
```js
import { describe, it, expect, afterEach } from 'vitest';
import { runPhases } from '../../src/commands/phases.js';
import { makeTmpProject } from '../helpers/tmpdir.js';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

describe('phases', () => {
  it('returns phases for configured presets', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': 'numbering:\n  presets: [bmad, gsd]\n'
    });
    cleanups.push(p.cleanup);
    const result = await runPhases({ cwd: p.dir, homeDir: p.dir, flags: {} });
    expect(result.phases).toContain('prd');
    expect(result.phases).toContain('plan-phase');
  });

  it('filters by --method', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': 'numbering:\n  presets: [bmad, gsd]\n'
    });
    cleanups.push(p.cleanup);
    const result = await runPhases({
      cwd: p.dir, homeDir: p.dir, flags: { method: 'gsd' }
    });
    expect(result.phases).toContain('plan-phase');
    expect(result.phases).not.toContain('prd');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/commands/phases.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `core/src/commands/phases.js`:
```js
import { loadConfig } from '../config/loader.js';
import { loadPresets, mergePhases } from '../presets/index.js';

export async function runPhases({ cwd, homeDir, flags = {} }) {
  const cfg = loadConfig({ cwd, homeDir, flags });
  const names = flags.method ? [flags.method] : cfg.numbering.presets;
  const presets = loadPresets(names);
  return { method: flags.method || null, phases: mergePhases(presets), presets };
}
```

- [ ] **Step 4: 테스트 통과**

Run: `cd core && npx vitest run test/commands/phases.test.js`
Expected: PASS (2 tests)

---

### Task 15: `new` command

**Files:**
- Create: `core/src/commands/new.js`
- Test: `core/test/commands/new.test.js`

- [ ] **Step 1: 실패 테스트**

Create `core/test/commands/new.test.js`:
```js
import { describe, it, expect, afterEach } from 'vitest';
import { runNew } from '../../src/commands/new.js';
import { makeTmpProject } from '../helpers/tmpdir.js';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

const baseCfg = `
docs_dir: "docs/"
naming_pattern: "{num:03d}-{method}-{phase}-{slug}.md"
numbering:
  presets: [bmad]
  phase_validation: warn
`;

describe('new', () => {
  it('creates numbered doc with Korean title preserved', async () => {
    const p = makeTmpProject({ '.docs-numbering.yaml': baseCfg });
    cleanups.push(p.cleanup);
    const result = await runNew({
      cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'prd' },
      args: { title: '사용자 인증', content: '# 본문' }
    });
    expect(result.path).toBe('docs/001-bmad-prd-사용자-인증.md');
    expect(readFileSync(join(p.dir, result.path), 'utf8')).toBe('# 본문');
  });

  it('increments number on second call', async () => {
    const p = makeTmpProject({ '.docs-numbering.yaml': baseCfg });
    cleanups.push(p.cleanup);
    await runNew({ cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'prd' }, args: { title: 'a', content: '' } });
    const r = await runNew({ cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'prd' }, args: { title: 'b', content: '' } });
    expect(r.path).toBe('docs/002-bmad-prd-b.md');
  });

  it('rejects unknown phase under strict', async () => {
    const cfg = baseCfg.replace('phase_validation: warn', 'phase_validation: strict');
    const p = makeTmpProject({ '.docs-numbering.yaml': cfg });
    cleanups.push(p.cleanup);
    await expect(runNew({
      cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'bogus' },
      args: { title: 'x', content: '' }
    })).rejects.toThrow(/phase.*bogus/i);
  });

  it('dry-run does not write file', async () => {
    const p = makeTmpProject({ '.docs-numbering.yaml': baseCfg });
    cleanups.push(p.cleanup);
    const r = await runNew({
      cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'prd', dryRun: true },
      args: { title: 'x', content: '' }
    });
    expect(existsSync(join(p.dir, r.path))).toBe(false);
  });

  it('records journal entry on success', async () => {
    const p = makeTmpProject({ '.docs-numbering.yaml': baseCfg });
    cleanups.push(p.cleanup);
    await runNew({
      cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'prd' },
      args: { title: 'auth', content: '' }
    });
    const entries = readdirSync(join(p.dir, '.docs-numbering', 'history'));
    expect(entries.length).toBe(1);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/commands/new.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `core/src/commands/new.js`:
```js
import { readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { loadConfig } from '../config/loader.js';
import { loadPresets, mergePhases } from '../presets/index.js';
import { makeSlug } from '../naming/slug.js';
import { renderPattern } from '../naming/template.js';
import { nextNumber } from '../numbering/next.js';
import { createFile } from '../fs/atomic.js';
import { writeEntry, makeEntryId, markStatus } from '../history/journal.js';
import { withLock } from '../history/state.js';

function resolveDocsDir(cfg, cwd) {
  return isAbsolute(cfg.docs_dir) ? cfg.docs_dir : join(cwd, cfg.docs_dir);
}

function validatePhase(cfg, phase) {
  if (!phase) return;
  const mode = cfg.numbering.phase_validation;
  if (mode === 'off') return;
  const presets = loadPresets(cfg.numbering.presets);
  const allowed = mergePhases(presets);
  if (allowed.includes(phase)) return;
  if (mode === 'strict') throw new Error(`unknown phase: ${phase}`);
  if (mode === 'warn') {
    process.stderr.write(`warn: phase '${phase}' not in enabled presets\n`);
  }
}

export async function runNew({ cwd, homeDir, flags = {}, args = {} }) {
  const cfg = loadConfig({ cwd, homeDir, flags });
  const method = flags.method || cfg.numbering.default_method || '';
  const phase = flags.phase || '';
  validatePhase(cfg, phase);

  const docsAbs = resolveDocsDir(cfg, cwd);
  mkdirSync(docsAbs, { recursive: true });

  const existing = readdirSync(docsAbs).filter(f => f.endsWith('.md'));
  const num = nextNumber(existing, { start: cfg.numbering.start });

  const slug = makeSlug(args.title, cfg.slug);
  const filename = renderPattern(cfg.naming_pattern, {
    num, slug, method, phase,
    date: flags.date || new Date().toISOString().slice(0, 10)
  });

  const relPath = join(cfg.docs_dir.replace(/\/$/, '') || '.', filename)
    .split(/[\\\/]/).join('/');

  if (flags.dryRun) return { path: relPath, dryRun: true };

  return withLock(cwd, async () => {
    const id = makeEntryId();
    await writeEntry(cwd, {
      id, command: 'new', timestamp: new Date().toISOString(),
      cwd, status: 'pending',
      operations: [{ type: 'create', path: relPath }]
    });
    await createFile(cwd, relPath, args.content || '');
    await markStatus(cwd, id, 'committed');
    return { path: relPath, id };
  });
}
```

- [ ] **Step 4: 테스트 통과**

Run: `cd core && npx vitest run test/commands/new.test.js`
Expected: PASS (5 tests)

---

### Task 16: `list` command

**Files:**
- Create: `core/src/commands/list.js`
- Test: `core/test/commands/list.test.js`

- [ ] **Step 1: 실패 테스트**

Create `core/test/commands/list.test.js`:
```js
import { describe, it, expect, afterEach } from 'vitest';
import { runList } from '../../src/commands/list.js';
import { makeTmpProject } from '../helpers/tmpdir.js';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

describe('list', () => {
  it('lists numbered docs parsed into method/phase/title', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': 'docs_dir: "docs/"\n',
      'docs/001-bmad-prd-auth.md': '',
      'docs/002-gsd-plan-phase-api.md': '',
      'docs/readme.md': ''
    });
    cleanups.push(p.cleanup);
    const r = await runList({ cwd: p.dir, homeDir: p.dir, flags: {} });
    expect(r.items.length).toBe(2);
    expect(r.items[0].num).toBe(1);
    expect(r.items[0].method).toBe('bmad');
    expect(r.items[0].phase).toBe('prd');
  });

  it('filters by method', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': 'docs_dir: "docs/"\n',
      'docs/001-bmad-prd-auth.md': '',
      'docs/002-gsd-plan-phase-api.md': ''
    });
    cleanups.push(p.cleanup);
    const r = await runList({ cwd: p.dir, homeDir: p.dir, flags: { method: 'gsd' } });
    expect(r.items.length).toBe(1);
    expect(r.items[0].method).toBe('gsd');
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/commands/list.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `core/src/commands/list.js`:
```js
import { readdirSync, existsSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { loadConfig } from '../config/loader.js';

function parseItem(name) {
  // pattern: NNN-method-phase-rest.md  (method/phase optional)
  const m = name.match(/^(\d+)(?:-([a-z][\w-]*))?(?:-([a-z][\w-]*))?-?(.*)\.md$/);
  if (!m) return null;
  return {
    num: parseInt(m[1], 10),
    method: m[2] || null,
    phase: m[3] || null,
    slug: m[4] || null,
    filename: name
  };
}

function resolveDocsDir(cfg, cwd) {
  return isAbsolute(cfg.docs_dir) ? cfg.docs_dir : join(cwd, cfg.docs_dir);
}

export async function runList({ cwd, homeDir, flags = {} }) {
  const cfg = loadConfig({ cwd, homeDir, flags });
  const dir = resolveDocsDir(cfg, cwd);
  if (!existsSync(dir)) return { items: [] };
  const files = readdirSync(dir).filter(f => f.endsWith('.md'));
  let items = files.map(parseItem).filter(Boolean).sort((a, b) => a.num - b.num);
  if (flags.method) items = items.filter(i => i.method === flags.method);
  if (flags.phase) items = items.filter(i => i.phase === flags.phase);
  if (flags.range) {
    const [lo, hi] = flags.range.split('-').map(Number);
    items = items.filter(i => i.num >= lo && i.num <= hi);
  }
  return { items };
}
```

- [ ] **Step 4: 테스트 통과**

Run: `cd core && npx vitest run test/commands/list.test.js`
Expected: PASS (2 tests)

---

### Task 17: `validate` command

**Files:**
- Create: `core/src/commands/validate.js`
- Test: `core/test/commands/validate.test.js`

- [ ] **Step 1: 실패 테스트**

Create `core/test/commands/validate.test.js`:
```js
import { describe, it, expect, afterEach } from 'vitest';
import { runValidate } from '../../src/commands/validate.js';
import { makeTmpProject } from '../helpers/tmpdir.js';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

describe('validate', () => {
  it('reports no issues on clean setup', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': 'numbering:\n  presets: [bmad]\n',
      'docs/001-bmad-prd-auth.md': ''
    });
    cleanups.push(p.cleanup);
    const r = await runValidate({ cwd: p.dir, homeDir: p.dir, flags: {} });
    expect(r.issues).toEqual([]);
  });

  it('detects duplicate numbers', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': 'numbering:\n  presets: [bmad]\n',
      'docs/001-bmad-prd-a.md': '',
      'docs/001-bmad-prd-b.md': ''
    });
    cleanups.push(p.cleanup);
    const r = await runValidate({ cwd: p.dir, homeDir: p.dir, flags: {} });
    expect(r.issues.some(i => i.type === 'duplicate_number')).toBe(true);
  });

  it('detects unknown phase', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': 'numbering:\n  presets: [bmad]\n',
      'docs/001-bmad-bogus-x.md': ''
    });
    cleanups.push(p.cleanup);
    const r = await runValidate({ cwd: p.dir, homeDir: p.dir, flags: {} });
    expect(r.issues.some(i => i.type === 'unknown_phase')).toBe(true);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/commands/validate.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `core/src/commands/validate.js`:
```js
import { runList } from './list.js';
import { loadConfig } from '../config/loader.js';
import { loadPresets, mergePhases } from '../presets/index.js';

export async function runValidate({ cwd, homeDir, flags = {} }) {
  const cfg = loadConfig({ cwd, homeDir, flags });
  const { items } = await runList({ cwd, homeDir, flags: {} });
  const issues = [];

  const seen = new Map();
  for (const it of items) {
    if (seen.has(it.num)) {
      issues.push({ type: 'duplicate_number', num: it.num, files: [seen.get(it.num).filename, it.filename] });
    } else {
      seen.set(it.num, it);
    }
  }

  const allowed = new Set(mergePhases(loadPresets(cfg.numbering.presets)));
  for (const it of items) {
    if (it.phase && !allowed.has(it.phase)) {
      issues.push({ type: 'unknown_phase', phase: it.phase, filename: it.filename });
    }
  }

  return { issues };
}
```

- [ ] **Step 4: 테스트 통과**

Run: `cd core && npx vitest run test/commands/validate.test.js`
Expected: PASS (3 tests)

---

### Task 18: `migrate` command

**Files:**
- Create: `core/src/commands/migrate.js`
- Test: `core/test/commands/migrate.test.js`

- [ ] **Step 1: 실패 테스트**

Create `core/test/commands/migrate.test.js`:
```js
import { describe, it, expect, afterEach } from 'vitest';
import { runMigrate } from '../../src/commands/migrate.js';
import { makeTmpProject } from '../helpers/tmpdir.js';
import { existsSync, utimesSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

const cfg = `
docs_dir: "docs/"
naming_pattern: "{num:03d}-{slug}.md"
numbering:
  presets: [bmad]
`;

describe('migrate', () => {
  it('dry-run reports plan without renaming', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': cfg,
      'docs/beta.md': '', 'docs/alpha.md': ''
    });
    cleanups.push(p.cleanup);
    const r = await runMigrate({ cwd: p.dir, homeDir: p.dir,
      flags: { order: 'alpha' } });
    expect(r.applied).toBe(false);
    expect(r.plan.length).toBe(2);
    expect(existsSync(join(p.dir, 'docs/alpha.md'))).toBe(true);
  });

  it('apply renames in alpha order', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': cfg,
      'docs/beta.md': '', 'docs/alpha.md': ''
    });
    cleanups.push(p.cleanup);
    await runMigrate({ cwd: p.dir, homeDir: p.dir,
      flags: { order: 'alpha', apply: true } });
    const files = readdirSync(join(p.dir, 'docs')).sort();
    expect(files).toEqual(['001-alpha.md', '002-beta.md']);
  });

  it('records single journal entry for migration', async () => {
    const p = makeTmpProject({
      '.docs-numbering.yaml': cfg,
      'docs/x.md': ''
    });
    cleanups.push(p.cleanup);
    await runMigrate({ cwd: p.dir, homeDir: p.dir,
      flags: { order: 'alpha', apply: true } });
    const entries = readdirSync(join(p.dir, '.docs-numbering', 'history'));
    expect(entries.length).toBe(1);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/commands/migrate.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `core/src/commands/migrate.js`:
```js
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { loadConfig } from '../config/loader.js';
import { makeSlug } from '../naming/slug.js';
import { renderPattern } from '../naming/template.js';
import { parseNumberFromFilename } from '../numbering/next.js';
import { sha256OfFile } from '../history/checksum.js';
import { renameFile } from '../fs/atomic.js';
import { writeEntry, makeEntryId, markStatus } from '../history/journal.js';
import { withLock } from '../history/state.js';

function resolveDocsDir(cfg, cwd) {
  return isAbsolute(cfg.docs_dir) ? cfg.docs_dir : join(cwd, cfg.docs_dir);
}

function sortFiles(files, dir, order) {
  if (order === 'alpha') return [...files].sort();
  if (order === 'mtime') {
    return [...files].sort((a, b) =>
      statSync(join(dir, a)).mtimeMs - statSync(join(dir, b)).mtimeMs);
  }
  return files;
}

function inferSlug(name, cfg) {
  const stripped = name.replace(/\.md$/, '').replace(/^\d+[-_]?/, '');
  return makeSlug(stripped.replace(/[-_]+/g, ' '), cfg.slug);
}

export async function runMigrate({ cwd, homeDir, flags = {} }) {
  const cfg = loadConfig({ cwd, homeDir, flags });
  const dir = resolveDocsDir(cfg, cwd);
  const order = flags.order || cfg.migration.default_order;

  const files = readdirSync(dir).filter(f => f.endsWith('.md'));
  const sorted = sortFiles(files, dir, order);

  const start = cfg.numbering.start;
  const plan = sorted.map((name, idx) => {
    const num = start + idx;
    const slug = inferSlug(name, cfg);
    const newName = renderPattern(cfg.naming_pattern, {
      num, slug, method: '', phase: '',
      date: new Date().toISOString().slice(0, 10)
    });
    return { from: join(cfg.docs_dir.replace(/\/$/, ''), name).split(/[\\\/]/).join('/'),
             to: join(cfg.docs_dir.replace(/\/$/, ''), newName).split(/[\\\/]/).join('/') };
  }).filter(op => op.from !== op.to);

  if (!flags.apply) return { applied: false, plan };

  return withLock(cwd, async () => {
    const id = makeEntryId();
    const operations = plan.map(op => ({
      type: 'rename',
      from: op.from,
      to: op.to,
      content_hash_before: sha256OfFile(join(cwd, op.from))
    }));
    await writeEntry(cwd, {
      id, command: 'migrate', timestamp: new Date().toISOString(),
      cwd, status: 'pending', operations
    });
    // two-phase rename: to temp names first to avoid collisions
    const tmpMoves = plan.map((op, i) => ({
      from: op.from, tmp: `${op.from}.__mig_${i}__`, to: op.to
    }));
    for (const m of tmpMoves) await renameFile(cwd, m.from, m.tmp);
    for (const m of tmpMoves) await renameFile(cwd, m.tmp, m.to);
    await markStatus(cwd, id, 'committed');
    return { applied: true, plan, id };
  });
}
```

- [ ] **Step 4: 테스트 통과**

Run: `cd core && npx vitest run test/commands/migrate.test.js`
Expected: PASS (3 tests)

---

### Task 19: `history` command

**Files:**
- Create: `core/src/commands/history.js`
- Test: `core/test/commands/history.test.js`

- [ ] **Step 1: 실패 테스트**

Create `core/test/commands/history.test.js`:
```js
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
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/commands/history.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `core/src/commands/history.js`:
```js
import { listEntries } from '../history/journal.js';

export async function runHistory({ cwd, flags = {} }) {
  let entries = await listEntries(cwd);
  if (flags.limit) entries = entries.slice(0, Number(flags.limit));
  return { entries };
}
```

- [ ] **Step 4: 테스트 통과**

Run: `cd core && npx vitest run test/commands/history.test.js`
Expected: PASS (2 tests)

---

### Task 20: `rollback` command

**Files:**
- Create: `core/src/commands/rollback.js`
- Test: `core/test/commands/rollback.test.js`

- [ ] **Step 1: 실패 테스트**

Create `core/test/commands/rollback.test.js`:
```js
import { describe, it, expect, afterEach } from 'vitest';
import { runNew } from '../../src/commands/new.js';
import { runRollback } from '../../src/commands/rollback.js';
import { makeTmpProject } from '../helpers/tmpdir.js';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

let cleanups = [];
afterEach(() => { cleanups.forEach(fn => fn()); cleanups = []; });

const cfg = `
docs_dir: "docs/"
naming_pattern: "{num:03d}-{method}-{phase}-{slug}.md"
numbering:
  presets: [bmad]
`;

describe('rollback', () => {
  it('dry-run describes inverse operations', async () => {
    const p = makeTmpProject({ '.docs-numbering.yaml': cfg });
    cleanups.push(p.cleanup);
    await runNew({ cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'prd' },
      args: { title: 'auth', content: '' } });
    const r = await runRollback({ cwd: p.dir, homeDir: p.dir,
      flags: { last: true } });
    expect(r.applied).toBe(false);
    expect(r.plan[0].type).toBe('delete');
  });

  it('apply removes created file', async () => {
    const p = makeTmpProject({ '.docs-numbering.yaml': cfg });
    cleanups.push(p.cleanup);
    const created = await runNew({ cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'prd' },
      args: { title: 'auth', content: '' } });
    await runRollback({ cwd: p.dir, homeDir: p.dir,
      flags: { last: true, apply: true } });
    expect(existsSync(join(p.dir, created.path))).toBe(false);
  });

  it('rollback records its own journal entry', async () => {
    const p = makeTmpProject({ '.docs-numbering.yaml': cfg });
    cleanups.push(p.cleanup);
    await runNew({ cwd: p.dir, homeDir: p.dir,
      flags: { method: 'bmad', phase: 'prd' },
      args: { title: 'x', content: '' } });
    await runRollback({ cwd: p.dir, homeDir: p.dir,
      flags: { last: true, apply: true } });
    const entries = readdirSync(join(p.dir, '.docs-numbering', 'history'));
    expect(entries.length).toBe(2);
  });
});
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/commands/rollback.test.js`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `core/src/commands/rollback.js`:
```js
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { listEntries, readEntry, writeEntry, makeEntryId, markStatus } from '../history/journal.js';
import { sha256OfFile } from '../history/checksum.js';
import { renameFile, deleteFile } from '../fs/atomic.js';
import { restoreFile } from '../history/backup.js';
import { withLock } from '../history/state.js';

function invert(op) {
  if (op.type === 'create') return { type: 'delete', path: op.path };
  if (op.type === 'rename') return { type: 'rename', from: op.to, to: op.from, content_hash_before: op.content_hash_before };
  if (op.type === 'delete') return { type: 'restore', path: op.path, backup_id: op.backup_id };
  throw new Error(`cannot invert op: ${op.type}`);
}

async function executeInverse(cwd, op, { force }) {
  if (op.type === 'delete') {
    await deleteFile(cwd, op.path);
  } else if (op.type === 'rename') {
    if (op.content_hash_before && existsSync(join(cwd, op.from))) {
      const cur = sha256OfFile(join(cwd, op.from));
      if (cur !== op.content_hash_before && !force) {
        throw new Error(`checksum mismatch on ${op.from} (use --force)`);
      }
    }
    await renameFile(cwd, op.from, op.to);
  } else if (op.type === 'restore') {
    await restoreFile(cwd, op.backup_id, op.path);
  }
}

export async function runRollback({ cwd, homeDir, flags = {} }) {
  const entries = await listEntries(cwd);
  if (!entries.length) throw new Error('no history entries to rollback');

  let targets;
  if (flags.last || (!flags.to && !flags.range)) {
    targets = [entries[0]];
  } else if (flags.to) {
    const idx = entries.findIndex(e => e.id === flags.to);
    if (idx < 0) throw new Error(`entry not found: ${flags.to}`);
    targets = entries.slice(0, idx); // newest → until (exclusive) --to
  } else {
    throw new Error('--range not implemented in v1; use --last or --to');
  }

  const plan = targets.flatMap(e => e.operations.map(invert));
  if (!flags.apply) return { applied: false, plan };

  return withLock(cwd, async () => {
    const id = makeEntryId();
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
```

- [ ] **Step 4: 테스트 통과**

Run: `cd core && npx vitest run test/commands/rollback.test.js`
Expected: PASS (3 tests)

---

## Phase E: CLI Wiring

### Task 21: CLI 진입점에 모든 명령 연결

**Files:**
- Modify: `core/bin/docs-numbering.js`
- Test: `core/test/commands/cli-e2e.test.js`

- [ ] **Step 1: CLI e2e 테스트 작성**

Create `core/test/commands/cli-e2e.test.js`:
```js
import { describe, it, expect, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { makeTmpProject } from '../helpers/tmpdir.js';
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
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
```

- [ ] **Step 2: 실패 확인**

Run: `cd core && npx vitest run test/commands/cli-e2e.test.js`
Expected: FAIL

- [ ] **Step 3: CLI 진입점 완성**

Replace `core/bin/docs-numbering.js`:
```js
#!/usr/bin/env node
import { program } from 'commander';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { runInit } from '../src/commands/init.js';
import { runNew } from '../src/commands/new.js';
import { runList } from '../src/commands/list.js';
import { runMigrate } from '../src/commands/migrate.js';
import { runPhases } from '../src/commands/phases.js';
import { runValidate } from '../src/commands/validate.js';
import { runHistory } from '../src/commands/history.js';
import { runRollback } from '../src/commands/rollback.js';

const pkg = JSON.parse(
  readFileSync(fileURLToPath(new URL('../package.json', import.meta.url)), 'utf8')
);

const ctx = () => ({ cwd: process.cwd(), homeDir: homedir() });

function output(data, { json }) {
  if (json) process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  else if (data?.path) process.stdout.write(data.path + '\n');
  else process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}

program
  .name('docs-numbering')
  .description('Numbered markdown documentation manager')
  .version(pkg.version)
  .option('--config <path>')
  .option('--docs-dir <path>')
  .option('--json', 'JSON output');

program.command('init')
  .option('--global')
  .option('--force')
  .action(async (opts) => {
    const g = program.opts();
    const r = await runInit({ ...ctx(), flags: { ...g, ...opts } });
    output(r, g);
  });

program.command('new <title>')
  .option('--method <m>')
  .option('--phase <p>')
  .option('--content <c>')
  .option('--stdin', 'read body from stdin')
  .option('--dry-run')
  .option('--date <d>')
  .action(async (title, opts) => {
    const g = program.opts();
    let content = opts.content || '';
    if (opts.stdin) content = readFileSync(0, 'utf8');
    const r = await runNew({ ...ctx(), flags: { ...g, ...opts }, args: { title, content } });
    output(r, g);
  });

program.command('list')
  .option('--method <m>')
  .option('--phase <p>')
  .option('--range <r>')
  .action(async (opts) => {
    const g = program.opts();
    const r = await runList({ ...ctx(), flags: { ...g, ...opts } });
    output(r, g);
  });

program.command('migrate')
  .option('--order <o>')
  .option('--apply')
  .option('--no-backup')
  .action(async (opts) => {
    const g = program.opts();
    const r = await runMigrate({ ...ctx(), flags: { ...g, ...opts } });
    output(r, g);
  });

program.command('phases')
  .option('--method <m>')
  .action(async (opts) => {
    const g = program.opts();
    const r = await runPhases({ ...ctx(), flags: { ...g, ...opts } });
    output(r, g);
  });

program.command('validate')
  .action(async () => {
    const g = program.opts();
    const r = await runValidate({ ...ctx(), flags: g });
    output(r, g);
    if (r.issues.length) process.exit(3);
  });

program.command('history')
  .option('--limit <n>', '', parseInt)
  .action(async (opts) => {
    const g = program.opts();
    const r = await runHistory({ ...ctx(), flags: { ...g, ...opts } });
    output(r, g);
  });

program.command('rollback [id]')
  .option('--last')
  .option('--to <id>')
  .option('--apply')
  .option('--force')
  .action(async (id, opts) => {
    const g = program.opts();
    const flags = { ...g, ...opts };
    if (id && !flags.to) flags.to = id;
    const r = await runRollback({ ...ctx(), flags });
    output(r, g);
  });

program.parseAsync(process.argv).catch((e) => {
  process.stderr.write(`error: ${e.message}\n`);
  process.exit(1);
});
```

- [ ] **Step 4: 테스트 통과**

Run: `cd core && npx vitest run`
Expected: PASS (all tests across suite)

---

## Phase F: Claude Code 어댑터

### Task 22: SKILL.md 작성

**Files:**
- Create: `adapters/claude-code/skills/docs-numbering/SKILL.md`

- [ ] **Step 1: SKILL.md 작성**

Create `adapters/claude-code/skills/docs-numbering/SKILL.md`:
```markdown
---
name: docs-numbering
description: Use when creating, organizing, or renaming markdown documentation
  files with numbered naming conventions. Supports BMAD/GSD/WDS/superpowers
  methodologies and Korean/multilingual filenames. Trigger when user asks to
  "save this as a doc", "organize docs", "number the docs", completes a
  methodology phase that produces a deliverable document, or requests bulk
  rename/migration of .md files.
---

# docs-numbering

Numbered markdown documentation management via `@hpiece/docs-numbering` CLI.

## When to use
- User asks to save/create a markdown doc in the project.
- A methodology phase (BMAD PRD, GSD plan-phase, WDS brief, etc.) produces a
  deliverable that should become a file.
- User wants to rename/reorganize existing `.md` files.
- User mentions "번호 매겨줘", "정리해줘", "migrate", "rollback".

## How to use

### 1. Discover valid phases first
```bash
npx @hpiece/docs-numbering phases --json
```

### 2. Create a new doc
```bash
npx @hpiece/docs-numbering new "<title>" \
  --method=<bmad|gsd|wds|superpowers> \
  --phase=<phase> \
  --stdin <<'EOF'
<full markdown body>
EOF
```
Use the printed path for follow-up references.

### 3. Migrate existing docs (always dry-run first)
```bash
npx @hpiece/docs-numbering migrate --order=mtime
# show user the plan, get confirmation
npx @hpiece/docs-numbering migrate --order=mtime --apply
```

### 4. Rollback when needed
```bash
npx @hpiece/docs-numbering history --limit=10
npx @hpiece/docs-numbering rollback --last           # dry-run
npx @hpiece/docs-numbering rollback --last --apply   # confirm
```

## Do NOT
- Never write `.md` files directly to the configured `docs_dir`.
- Never rename numbered files manually; always use `migrate`.
- Never delete the `.docs-numbering/` directory.
- Never run `migrate --apply` without showing the user the dry-run plan first.

## Tips
- If config is missing, run `docs-numbering init` first.
- For Korean titles, the tool preserves them by default (`001-사용자-인증.md`).
- When `--phase` is ambiguous, ask the user rather than guessing.
```

- [ ] **Step 2: 파일 존재 확인**

Run: `ls adapters/claude-code/skills/docs-numbering/SKILL.md`
Expected: 파일이 존재하고 크기가 0보다 큼

---

### Task 23: 선택적 슬래시 커맨드 3개

**Files:**
- Create: `adapters/claude-code/commands/docs-new.md`
- Create: `adapters/claude-code/commands/docs-migrate.md`
- Create: `adapters/claude-code/commands/docs-rollback.md`

- [ ] **Step 1: 각 커맨드 파일 작성**

Create `adapters/claude-code/commands/docs-new.md`:
```markdown
---
description: Create a new numbered documentation file
---

Ask the user for the title (if not provided as argument), then:

1. Run `npx @hpiece/docs-numbering phases --json` to fetch valid phases.
2. Infer method and phase from the current conversation context. If unclear, ask the user.
3. Construct body from conversation context (summary + decisions).
4. Run:
   ```bash
   npx @hpiece/docs-numbering new "<title>" --method=<m> --phase=<p> --stdin <<EOF
   <body>
   EOF
   ```
5. Report the created path back to the user.

Arguments: $ARGUMENTS
```

Create `adapters/claude-code/commands/docs-migrate.md`:
```markdown
---
description: Normalize existing markdown docs to numbered convention
---

1. Run a dry-run first:
   ```bash
   npx @hpiece/docs-numbering migrate --order=mtime
   ```
2. Show the plan to the user in a readable format.
3. Ask for explicit confirmation ("rename N files?").
4. On confirmation, run:
   ```bash
   npx @hpiece/docs-numbering migrate --order=mtime --apply
   ```
5. Remind the user they can rollback with `/docs-rollback` if needed.

Arguments: $ARGUMENTS
```

Create `adapters/claude-code/commands/docs-rollback.md`:
```markdown
---
description: Roll back the most recent docs-numbering operation
---

1. Show recent history:
   ```bash
   npx @hpiece/docs-numbering history --limit=5
   ```
2. Run dry-run rollback of the latest entry:
   ```bash
   npx @hpiece/docs-numbering rollback --last
   ```
3. Display the inverse plan to the user.
4. On confirmation:
   ```bash
   npx @hpiece/docs-numbering rollback --last --apply
   ```

Arguments: $ARGUMENTS
```

- [ ] **Step 2: 세 파일 존재 확인**

Run: `ls adapters/claude-code/commands/`
Expected: `docs-new.md`, `docs-migrate.md`, `docs-rollback.md` 3개 파일 존재

---

## Phase G: 전체 테스트 + 수동 스모크 테스트

### Task 24: 전체 테스트 통과 확인

- [ ] **Step 1: 전체 테스트 실행**

Run: `cd core && npx vitest run`
Expected: 모든 테스트 suite PASS. 실패한 테스트 수 = 0.

- [ ] **Step 2: 수동 스모크 테스트 - 한국어 새 문서**

Run:
```bash
cd /tmp && mkdir -p dnsmoke && cd dnsmoke && \
node /Users/Work/git/claude/skills/docs-numbering/core/bin/docs-numbering.js init && \
node /Users/Work/git/claude/skills/docs-numbering/core/bin/docs-numbering.js new "사용자 인증 설계" --method=bmad --phase=prd --content="# 본문"
```
Expected: `docs/001-bmad-prd-사용자-인증-설계.md` 생성됨

- [ ] **Step 3: 수동 스모크 테스트 - 롤백**

Run:
```bash
cd /tmp/dnsmoke && \
node /Users/Work/git/claude/skills/docs-numbering/core/bin/docs-numbering.js rollback --last --apply && \
ls docs/
```
Expected: `docs/` 폴더가 비어 있음 (파일 삭제됨), 새로운 rollback 저널 엔트리가 `.docs-numbering/history/` 에 추가됨

- [ ] **Step 4: 수동 스모크 테스트 - migrate**

Run:
```bash
cd /tmp/dnsmoke && \
touch docs/alpha.md docs/beta.md && \
node /Users/Work/git/claude/skills/docs-numbering/core/bin/docs-numbering.js migrate --order=alpha --apply && \
ls docs/
```
Expected: `001-alpha.md`, `002-beta.md` 형태로 이름 변경됨

- [ ] **Step 5: 정리**

Run: `rm -rf /tmp/dnsmoke`

---

## 완료 기준 (Definition of Done for v1)

- `core/` 에서 `npx vitest run` 실행 시 모든 테스트 PASS
- Phase G의 스모크 테스트 3개 모두 기대대로 동작
- `adapters/claude-code/skills/docs-numbering/SKILL.md` 및 3개 커맨드 파일 존재
- `npx @hpiece/docs-numbering --help` 이 모든 8개 서브커맨드를 표시

## 주의사항

- v1 범위에는 `--include`, `--exclude`, `git-history` order, `interactive` order, `history clear`, frontmatter 자동 삽입이 **포함되지 않음** (스펙 §10의 제외 범위와는 별도로, 이 4개 옵션은 v1.1로 연기).
- `--profile` 플래그는 파싱은 받아도 동작하지 않음 (스펙대로 예약).
- npm 퍼블리시는 별도 릴리스 작업으로 분리 (이 플랜 외).
