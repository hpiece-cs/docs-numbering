# docs-numbering 사용자 매뉴얼

번호 매김 규칙과 방법론 인식 네이밍을 지원하는 마크다운 문서 관리 CLI 도구입니다.

## 목차

- [설치](#설치)
- [빠른 시작](#빠른-시작)
- [명령어](#명령어)
  - [init](#init--설정-초기화)
  - [new](#new-title--번호-매긴-문서-생성)
  - [list](#list--문서-조회)
  - [phases](#phases--유효-단계-조회)
  - [migrate](#migrate--기존-파일-일괄-이름-변경)
  - [validate](#validate--일관성-검사)
  - [history](#history--작업-이력-조회)
  - [rollback](#rollback--작업-되돌리기)
  - [install](#install--어댑터-자동-설치)
  - [uninstall](#uninstall--어댑터-제거)
- [글로벌 옵션](#글로벌-옵션)
- [설정](#설정)
  - [설정 우선순위](#설정-우선순위)
  - [설정값 상세 레퍼런스](#설정값-상세-레퍼런스) — `locale`, `docs_dir`, `naming_pattern`, `numbering.*`, `slug.*`, `migration.*`, `history.*`
  - [전체 설정 예시](#전체-설정-예시)
- [파일명 패턴](#파일명-패턴)
- [프리셋 (방법론)](#프리셋-방법론) — BMAD, GSD, WDS, Superpowers
- [한국어 제목 지원](#한국어-제목-지원)
- [다국어 지원 (i18n)](#다국어-지원-i18n)
- [에이전트 연동](#에이전트-연동) — Claude Code, Codex, OpenCode, Gemini CLI, Copilot
- [문제 해결](#문제-해결)
- [프로젝트 구조](#프로젝트-구조)

---

## 설치

```bash
cd core && npm install && npm link
```

`~/.npm-packages/bin`이 PATH에 포함되어야 합니다:
```bash
echo 'export PATH="$HOME/.npm-packages/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

## 빠른 시작

```bash
# 프로젝트에서 초기화
cd my-project
docs-numbering init

# 문서 생성
docs-numbering new "사용자 인증" --method=bmad --phase=prd

# 문서 목록 조회
docs-numbering list

# 기존 .md 파일을 번호 매김 규칙으로 마이그레이션
docs-numbering migrate --order=mtime         # 미리보기 (dry-run)
docs-numbering migrate --order=mtime --apply # 실행
```

---

## 명령어

### `init` — 설정 초기화

```bash
docs-numbering init [--global] [--force]
```

| 플래그 | 설명 |
|--------|------|
| `--global` | 프로젝트가 아닌 글로벌 설정 (`~/.docs-numbering/config.yaml`) 생성 |
| `--force` | 기존 설정 파일 덮어쓰기 |

### `new <title>` — 번호 매긴 문서 생성

```bash
docs-numbering new "제목" [--method=<m>] [--phase=<p>] [--stdin] [--dry-run] [--date=<d>] [--content=<c>]
```

| 플래그 | 설명 |
|--------|------|
| `--method <m>` | 방법론: bmad, gsd, wds, superpowers |
| `--phase <p>` | 방법론 내 단계 |
| `--content <c>` | 문서 본문 |
| `--stdin` | 표준 입력에서 본문 읽기 |
| `--dry-run` | 파일 생성 없이 파일명만 미리보기 |
| `--date <d>` | 날짜 지정 (YYYY-MM-DD) |

예시:
```bash
docs-numbering new "API 설계" --method=gsd --phase=plan-phase --stdin <<'EOF'
# API 설계 문서
...
EOF
```

출력: `docs/001-gsd-plan-phase-api-설계.md`

### `list` — 문서 조회

```bash
docs-numbering list [--method=<m>] [--phase=<p>] [--range=<r>]
```

| 플래그 | 설명 |
|--------|------|
| `--method <m>` | 방법론으로 필터 |
| `--phase <p>` | 단계로 필터 |
| `--range <r>` | 번호 범위로 필터 (예: `1-10`) |

### `phases` — 유효 단계 조회

```bash
docs-numbering phases [--method=<m>]
```

활성화된 프리셋의 모든 단계를 표시합니다. `--method`로 특정 방법론만 필터링 가능합니다.

### `migrate` — 기존 파일 일괄 이름 변경

```bash
docs-numbering migrate [--order=<mtime|alpha>] [--apply] [--no-backup]
```

기본적으로 **dry-run**으로 실행됩니다. 계획을 확인한 후 `--apply`를 추가하세요.

| 플래그 | 설명 |
|--------|------|
| `--order <o>` | 정렬 기준: `mtime` (수정일, 기본값) 또는 `alpha` (알파벳순) |
| `--apply` | 마이그레이션 실행 |
| `--no-backup` | 백업 생성 건너뛰기 |

### `validate` — 일관성 검사

```bash
docs-numbering validate
```

중복 번호, 알 수 없는 단계 등을 검사합니다. 문제 발견 시 종료 코드 3을 반환합니다.

### `history` — 작업 이력 조회

```bash
docs-numbering history [--limit=<n>]
```

### `rollback` — 작업 되돌리기

```bash
docs-numbering rollback [--last] [--to=<id>] [--apply] [--force]
```

| 플래그 | 설명 |
|--------|------|
| `--last` | 가장 최근 작업 되돌리기 |
| `--to <id>` | 해당 항목까지 모든 작업 되돌리기 |
| `--apply` | 실행 (기본은 dry-run) |
| `--force` | 체크섬 불일치 무시 |

사용 흐름:
```bash
docs-numbering history --limit=5       # 이력 확인
docs-numbering rollback --last         # 미리보기
docs-numbering rollback --last --apply # 실행
```

### `install` — 어댑터 자동 설치

```bash
docs-numbering install [--agent=<name>] [--all] [--mode=<link|copy|merge>] [--force] [--user] [--no-init] [--dry-run]
```

각 AI 에이전트별 어댑터 파일(슬래시 커맨드, 스킬, 지시문)을 프로젝트에 자동으로 설치합니다. 수동 `ln -s`나 `cp` 없이 한 번에 끝납니다.

**자동 초기화:** `.docs-numbering.yaml`이 없으면 `install`이 자동으로 생성합니다 — 별도의 `docs-numbering init`을 먼저 실행할 필요가 없습니다. 비활성화하려면 `--no-init`을 쓰거나 `--dry-run`을 사용하세요(후자도 init을 건너뜁니다). `--user` 범위에서는 자동 초기화가 동작하지 않습니다.

**사용자 범위(`--user`):** 프로젝트 대신 `$HOME`에 설치합니다(예: `~/.claude/commands/`, `~/.claude/skills/docs-numbering`). 슬래시 커맨드(`/docs-install` 등)를 모든 프로젝트에서 쓸 수 있도록 1회성으로 배치할 때 사용합니다. 감지도 `$HOME` 기준으로 수행됩니다.

| 플래그 | 설명 |
|--------|------|
| `--agent <이름>` | 특정 에이전트 지정: `claude-code`, `opencode`, `codex`, `gemini`, `copilot` |
| `--all` | 지원하는 모든 어댑터 설치 |
| `--mode <모드>` | 설치 방식 (기본값은 에이전트별로 다름): `link`(심볼릭 링크), `copy`(복사), `merge`(블록 병합) |
| `--force` | 기존 파일이 있어도 덮어쓰기 |
| `--user` | 현재 프로젝트 대신 `$HOME`에 설치 |
| `--no-init` | `.docs-numbering.yaml`이 없어도 자동 생성하지 않음 |
| `--dry-run` | 실제 파일을 만들지 않고 계획만 표시 (`--no-init`을 내포) |

플래그가 하나도 없으면 프로젝트를 스캔해 **감지된 에이전트**에 설치합니다. 아무것도 감지되지 않으면 지원 목록만 보여줍니다.

**지원 에이전트와 동작:**

| 에이전트 | 감지 조건 | 설치 대상 | 기본 모드 |
|---------|----------|----------|----------|
| Claude Code | `.claude/` | `.claude/skills/docs-numbering`, `.claude/commands/*.md` | `link` |
| OpenCode | `.opencode/` | `.opencode/commands/*.md` | `copy` |
| Codex / Cursor / Windsurf | `.cursor/`, `.codex/`, `.windsurf/`, `AGENTS.md` | 프로젝트 루트 `AGENTS.md` | `merge` |
| Gemini CLI | `.gemini/`, `GEMINI.md` | 프로젝트 루트 `GEMINI.md` | `merge` |
| GitHub Copilot | `.github/` | `.github/copilot-instructions.md` | `merge` |

**설치 모드 설명:**

- **`link`** — 저장소의 어댑터 파일로 심볼릭 링크를 만듭니다. 저장소를 `git pull`하면 변경사항이 자동 반영됩니다. 저장소 위치가 바뀌면 링크가 깨집니다.
- **`copy`** — 파일을 그대로 복사합니다. 독립적이지만 업데이트를 수동으로 다시 받아야 합니다.
- **`merge`** — 대상이 루트 파일(`AGENTS.md` 등)일 때 사용됩니다. 기존 파일을 덮어쓰지 않고 `<!-- docs-numbering:start -->` ~ `<!-- docs-numbering:end -->` 블록으로 삽입합니다. 재설치 시 같은 블록이 갱신되므로 중복이 쌓이지 않습니다.

**예시:**

```bash
# 감지된 에이전트 자동 설치
cd my-project
docs-numbering install

# 특정 에이전트만
docs-numbering install --agent=claude-code

# 기존 파일 덮어쓰기
docs-numbering install --agent=claude-code --force

# 링크 대신 복사본 설치 (저장소와 분리하고 싶을 때)
docs-numbering install --agent=claude-code --mode=copy

# 지원하는 모든 어댑터 설치
docs-numbering install --all

# 실제 변경 없이 계획만 확인
docs-numbering install --dry-run --json

# 사용자 범위 1회 설치 — 모든 프로젝트에서 /docs-install 슬래시 커맨드 활성화
docs-numbering install --user --agent=claude-code
```

### Claude Code 안에서 부트스트랩하기

`docs-numbering install --user --agent=claude-code`를 한 번만 실행해두면 이후 어떤 프로젝트에서든 `/docs-install` 슬래시 커맨드가 활성화됩니다. 이 커맨드는 Claude의 셸 도구로 현재 프로젝트 디렉토리에서 `docs-numbering install`을 실행하므로, 채팅을 떠나지 않고도 새 프로젝트를 초기화할 수 있습니다. 이후 프로젝트 단위의 `/docs-new`, `/docs-migrate`, `/docs-rollback` 슬래시 커맨드와 자동 트리거 스킬도 함께 사용 가능해집니다.

**설치 위치 커스터마이즈:** `DOCS_NUMBERING_ADAPTERS_DIR` 환경 변수로 어댑터 소스 디렉토리를 직접 지정할 수 있습니다. 저장소를 옮기거나 포크한 경우 유용합니다.

```bash
DOCS_NUMBERING_ADAPTERS_DIR=/my/fork/adapters docs-numbering install --agent=claude-code
```

### `uninstall` — 어댑터 제거

```bash
docs-numbering uninstall [--agent=<name>] [--all] [--dry-run]
```

`install`로 설치한 어댑터 파일을 제거합니다.

| 플래그 | 설명 |
|--------|------|
| `--agent <이름>` | 특정 에이전트만 제거 |
| `--all` | 모든 어댑터 제거 |
| `--dry-run` | 실제 삭제 없이 계획만 표시 |

병합(`merge`) 모드로 설치된 경우 `docs-numbering:start`/`end` 블록만 제거되고 **나머지 기존 내용은 보존**됩니다. 파일이 블록만 담고 있었다면 파일 자체가 삭제됩니다.

```bash
# 특정 에이전트 제거
docs-numbering uninstall --agent=claude-code

# 모두 제거
docs-numbering uninstall --all
```

---

## 글로벌 옵션

모든 명령어에서 사용 가능:

| 플래그 | 설명 |
|--------|------|
| `--config <경로>` | 설정 파일 경로 지정 |
| `--docs-dir <경로>` | 문서 디렉토리 지정 |
| `--json` | JSON 형식 출력 |
| `--locale <로케일>` | 로케일 지정 (en, ko) |
| `--version`, `-V` | 버전 표시 |

---

## 설정

설정 파일: `.docs-numbering.yaml` (프로젝트 루트)

### 설정 우선순위

설정은 다음 순서로 병합됩니다 (나중 것이 이전 것을 덮어씀):

1. **내장 기본값** (최하위)
2. **글로벌 설정**: `~/.docs-numbering/config.yaml` (`docs-numbering init --global`로 생성)
3. **프로젝트 설정**: 프로젝트 루트의 `.docs-numbering.yaml`
4. **CLI 플래그** `--docs-dir`, `--locale` 등 (최상위)

---

### 설정값 상세 레퍼런스

#### `locale`

CLI 출력 메시지의 언어입니다. `null`이면 OS 환경에서 자동 감지합니다.

| 값 | 설명 |
|----|------|
| `null` | OS에서 자동 감지 (기본값) |
| `"en"` | 영어 |
| `"ko"` | 한국어 |

자동 감지 순서: `DOCS_NUMBERING_LANG` 환경변수 > `LC_ALL` > `LC_MESSAGES` > `LANG` > `en` 폴백

```yaml
locale: null    # OS에서 자동 감지
locale: "ko"    # 항상 한국어
locale: "en"    # 항상 영어
```

---

#### `docs_dir`

번호 매김 문서가 저장되는 디렉토리입니다. 프로젝트 루트 기준 상대 경로, 절대 경로, `~/` 홈 디렉토리 모두 사용 가능합니다.

```yaml
docs_dir: "docs/"                    # 프로젝트 루트 기준 상대 경로 (기본값)
docs_dir: "documentation/specs/"     # 중첩된 상대 경로
docs_dir: "/absolute/path/to/docs/"  # 절대 경로
docs_dir: "~/shared-docs/"           # 홈 디렉토리 확장
docs_dir: "./"                       # 프로젝트 루트 자체
```

디렉토리가 존재하지 않으면 자동으로 생성됩니다.

---

#### `naming_pattern`

생성되는 파일명을 결정하는 템플릿 문자열입니다. `{변수}` 또는 `{변수:형식}` 구문을 사용합니다.

**사용 가능한 변수:**

| 변수 | 형식 | 설명 | 출력 예시 |
|------|------|------|-----------|
| `{num}` | 없음 | 패딩 없는 번호 | `1`, `12`, `100` |
| `{num:03d}` | 0 패딩 3자리 | 3자리 패딩 번호 | `001`, `012`, `100` |
| `{num:04d}` | 0 패딩 4자리 | 4자리 패딩 번호 | `0001`, `0012` |
| `{num:05d}` | 0 패딩 5자리 | 5자리 패딩 번호 | `00001` |
| `{method}` | 없음 | 방법론 이름 | `bmad`, `gsd` |
| `{phase}` | 없음 | 단계 이름 | `prd`, `plan-phase` |
| `{slug}` | 없음 | 슬러그화된 제목 (변환됨) | `사용자-인증`, `api-design` |
| `{filename}` | 없음 | 원본 파일명 (그대로 보존) | `README`, `My-Design-Doc` |
| `{date}` | 없음 | 날짜 (YYYY-MM-DD) | `2026-04-15` |

> **`{slug}` vs `{filename}`**: `{slug}`는 제목을 변환합니다 (소문자화, 공백→대시, 잘림). `{filename}`은 원본 파일명을 대소문자, 공백, 대시 포함 그대로 유지합니다. `new` 명령에는 `{slug}`, 기존 파일명을 유지하며 `migrate`할 때는 `{filename}`을 사용하세요.

**렌더링 규칙:**
- 빈 값이나 생략된 변수는 앞의 `-`와 함께 제거됩니다
- 연속된 대시(`--`)는 하나(`-`)로 축소됩니다 (`{filename}` 내부의 대시는 보호됨)
- 맨 앞의 대시는 제거됩니다

```yaml
# 기본값: 전체 메타데이터 포함
naming_pattern: "{num:03d}-{method}-{phase}-{slug}.md"
# → 001-bmad-prd-사용자-인증.md

# 번호 + 슬러그만
naming_pattern: "{num:03d}-{slug}.md"
# → 001-사용자-인증.md

# 원본 파일명 보존 (번호만 추가)
naming_pattern: "{num:03d}-{filename}.md"
# migrate: README.md → 001-README.md
# migrate: My-Design-Doc.md → 002-My-Design-Doc.md
# migrate: 설계서.md → 003-설계서.md

# 원본 파일명 보존 + 방법론 추가
naming_pattern: "{num:03d}-{method}-{filename}.md"
# migrate: README.md → 001-bmad-README.md

# 날짜 접두사
naming_pattern: "{date}-{num:03d}-{slug}.md"
# → 2026-04-15-001-사용자-인증.md

# 번호만 (최소)
naming_pattern: "{num:04d}.md"
# → 0001.md

# 커스텀 구분자
naming_pattern: "[{num:03d}] {method} - {slug}.md"
# → [001] bmad - 사용자-인증.md
```

---

#### `numbering.strategy`

문서에 번호를 부여하는 알고리즘입니다. 현재는 `sequential`만 지원합니다.

```yaml
numbering:
  strategy: sequential   # 순차적 다음 번호 부여 (기본값, 유일한 옵션)
```

---

#### `numbering.start`

docs 디렉토리가 비어있을 때 첫 번째로 부여할 번호입니다.

```yaml
numbering:
  start: 1       # 첫 문서가 001 (기본값)
  start: 0       # 첫 문서가 000
  start: 100     # 첫 문서가 100
```

---

#### `numbering.padding`

번호의 0 패딩 자릿수입니다. `naming_pattern`의 `{num:0Xd}` 형식 지정자에 영향을 줍니다.

```yaml
numbering:
  padding: 3    # 001, 002, ... 999 (기본값)
  padding: 2    # 01, 02, ... 99
  padding: 4    # 0001, 0002, ... 9999
```

> 참고: `naming_pattern` 안의 패딩 (예: `{num:03d}`)이 이 값보다 우선합니다.

---

#### `numbering.presets`

활성화할 방법론 프리셋 목록입니다. 각 프리셋은 유효한 단계(phase) 이름 집합을 정의합니다. 여러 프리셋을 조합할 수 있습니다.

| 프리셋 | 단계 |
|--------|------|
| `bmad` | brief, prd, architecture, ux-design, epics, stories, dev, review, retrospective |
| `gsd` | new-project, discuss-phase, plan-phase, execute-phase, verify-work, ship |
| `wds` | project-setup, project-brief, trigger-mapping, scenarios, ux-design, agentic-development, asset-generation, design-system, product-evolution |
| `superpowers` | brainstorm, spec, plan, tdd, review |

```yaml
numbering:
  presets: [bmad]                        # 단일 프리셋 (기본값)
  presets: [bmad, gsd]                   # 두 프리셋 조합
  presets: [bmad, gsd, wds, superpowers] # 모든 프리셋
  presets: []                            # 프리셋 없음 (단계 검증 비활성화)
```

---

#### `numbering.phase_validation`

`--phase` 값을 활성화된 프리셋에 대해 얼마나 엄격하게 검증할지 설정합니다.

| 값 | 동작 |
|----|------|
| `"warn"` | 경고를 stderr에 출력하되 해당 단계 허용 (기본값) |
| `"strict"` | 에러를 발생시키고 알 수 없는 단계 거부 |
| `"off"` | 검증하지 않음 |

```yaml
numbering:
  phase_validation: warn     # 경고만 (기본값)
  phase_validation: strict   # 알 수 없는 단계는 에러로 거부
  phase_validation: "off"    # 검증 안 함
```

`strict`에서 알 수 없는 단계 사용 시:
```
$ docs-numbering new "테스트" --method=bmad --phase=bogus
오류: 알 수 없는 단계입니다: bogus
```

---

#### `numbering.default_method`

`--method`를 지정하지 않았을 때 사용할 기본 방법론 이름입니다.

```yaml
numbering:
  default_method: null      # 기본값 없음 — 생략 시 method가 비어있음 (기본값)
  default_method: bmad      # --method 없으면 "bmad" 사용
  default_method: gsd       # --method 없으면 "gsd" 사용
```

예시:
```bash
# default_method: bmad 설정 시
docs-numbering new "설계 문서" --phase=prd
# → 001-bmad-prd-설계-문서.md   (method 자동 채움)

# default_method: null 설정 시
docs-numbering new "설계 문서" --phase=prd
# → 001-prd-설계-문서.md        (파일명에 method 없음)
```

---

#### `slug.language`

문서 제목에서 파일명 슬러그를 생성할 때 비라틴 문자(한국어, 중국어 등)를 어떻게 처리할지 설정합니다.

| 값 | 동작 | 입력 예시 | 출력 예시 |
|----|------|-----------|-----------|
| `"preserve"` | 비라틴 문자를 그대로 유지 (기본값) | `사용자 인증` | `사용자-인증` |
| `"romanize"` | 한국어를 국립국어원 로마자 표기법으로 변환 | `사용자 인증` | `sayongja-injeung` |

```yaml
slug:
  language: preserve    # 한국어/CJK를 파일명에 그대로 유지 (기본값)
  language: romanize    # ASCII 로마자로 변환
```

> 참고: `romanize`는 국립국어원 로마자 표기법(Revised Romanization)을 사용합니다.

---

#### `slug.separator`

슬러그에서 단어를 구분하는 문자입니다.

```yaml
slug:
  separator: "-"     # 하이픈 (기본값): 사용자-인증
  separator: "_"     # 밑줄: 사용자_인증
  separator: "."     # 점: 사용자.인증
```

---

#### `slug.lowercase`

ASCII 문자를 소문자로 변환할지 여부입니다. 비라틴 문자(한국어 등)는 영향받지 않습니다.

```yaml
slug:
  lowercase: true     # "API Design" → "api-design" (기본값)
  lowercase: false    # "API Design" → "API-Design"
```

---

#### `slug.max_length`

슬러그의 최대 문자 길이입니다. 초과 시 잘리며, 잘린 후 끝의 구분자는 제거됩니다.

```yaml
slug:
  max_length: 50     # 기본값
  max_length: 30     # 짧은 슬러그
  max_length: 100    # 긴 슬러그 허용
```

`max_length: 20` 적용 시 예시:
```
"매우 긴 문서 제목으로 작성된 인증 설계서" → "매우-긴-문서-제목으로-작성된-인증"
```

---

#### `migration.default_order`

`docs-numbering migrate`를 `--order` 없이 실행할 때의 기본 정렬 순서입니다.

| 값 | 동작 |
|----|------|
| `"mtime"` | 파일 수정 시간 순, 오래된 것부터 (기본값) |
| `"alpha"` | 파일명 알파벳 순 |

```yaml
migration:
  default_order: mtime    # 수정 시간 순 (기본값)
  default_order: alpha    # 알파벳 순
```

---

#### `migration.safety.dry_run_default`

`migrate`를 기본적으로 dry-run(변경 없이 계획만 표시)으로 실행할지 여부입니다.

```yaml
migration:
  safety:
    dry_run_default: true     # --apply가 있어야 실행 (기본값, 권장)
    dry_run_default: false    # migrate가 바로 실행됨 (주의 필요)
```

---

#### `migration.safety.backup_dir`

마이그레이션 전 원본 파일이 백업되는 디렉토리입니다. 프로젝트 루트 기준 상대 경로입니다.

```yaml
migration:
  safety:
    backup_dir: ".docs-numbering/backup"    # 기본값 (숨김 디렉토리 안)
    backup_dir: ".backups/docs"             # 커스텀 위치
```

---

#### `history.enabled`

작업 이력 기록 여부입니다. 비활성화하면 롤백을 사용할 수 없습니다.

```yaml
history:
  enabled: true     # 모든 작업 기록 (기본값)
  enabled: false    # 이력 안 남김 — 롤백 불가
```

---

#### `history.max_entries`

보관할 최대 이력 항목 수입니다. 이 한도를 초과하면 가장 오래된 항목이 자동으로 정리됩니다.

```yaml
history:
  max_entries: 100    # 최근 100개 작업 보관 (기본값)
  max_entries: 50     # 작은 이력
  max_entries: 500    # 큰 이력
```

---

#### `history.retain_days`

이력 항목을 정리 대상이 되기 전까지 보관하는 일수입니다.

```yaml
history:
  retain_days: 30     # 30일 보관 (기본값)
  retain_days: 7      # 1주일만 보관
  retain_days: 90     # 3개월 보관
  retain_days: 365    # 1년 보관
```

---

#### `history.include_backups`

이력 항목과 함께 파일 백업을 저장할지 여부입니다. 백업은 롤백 시 삭제된 파일을 복원하는 데 필요합니다.

```yaml
history:
  include_backups: true     # 롤백을 위한 백업 저장 (기본값)
  include_backups: false    # 백업 안 함 — 삭제 작업의 롤백 불가
```

---

### 전체 설정 예시

```yaml
locale: "ko"
docs_dir: "documentation/"
naming_pattern: "{date}-{num:03d}-{method}-{slug}.md"

numbering:
  strategy: sequential
  start: 1
  padding: 3
  presets: [bmad, gsd]
  phase_validation: strict
  default_method: bmad

slug:
  language: preserve
  separator: "-"
  lowercase: true
  max_length: 40

migration:
  default_order: alpha
  safety:
    dry_run_default: true
    backup_dir: ".docs-numbering/backup"

history:
  enabled: true
  max_entries: 200
  retain_days: 60
  include_backups: true
```

결과:
```bash
docs-numbering new "사용자 인증 설계" --phase=prd
# → documentation/2026-04-15-001-bmad-사용자-인증-설계.md
# CLI 메시지는 한국어로 출력
# 알 수 없는 단계는 에러로 거부
```

---

## 파일명 패턴

템플릿 변수:

| 변수 | 예시 | 설명 |
|------|------|------|
| `{num:03d}` | `001` | 0으로 채운 번호 |
| `{method}` | `bmad` | 방법론 이름 |
| `{phase}` | `prd` | 단계 이름 |
| `{slug}` | `사용자-인증` | 제목 슬러그 (변환됨) |
| `{filename}` | `README` | 원본 파일명 (그대로 보존) |
| `{date}` | `2026-04-15` | 날짜 |

빈 변수는 앞의 `-`와 함께 생략됩니다.

**`{slug}` vs `{filename}`:**
- `{slug}`: 입력을 변환 (소문자화, 공백→대시, 잘림). `new` 명령에 적합.
- `{filename}`: 원본 파일명 그대로 유지 — 대소문자, 공백, 대시 모두 보존. 기존 파일을 `migrate`할 때 적합.
- `new` 명령에서 `{filename}`을 사용하면 slug 값으로 대체됩니다.

---

## 프리셋 (방법론)

### BMAD
```
brief, prd, architecture, ux-design, epics, stories, dev, review, retrospective
```

### GSD
```
new-project, discuss-phase, plan-phase, execute-phase, verify-work, ship
```

### WDS
```
project-setup, project-brief, trigger-mapping, scenarios, ux-design,
agentic-development, asset-generation, design-system, product-evolution
```

### Superpowers
```
brainstorm, spec, plan, tdd, review
```

여러 프리셋 동시 사용: `presets: [bmad, gsd, superpowers]`

---

## 한국어 제목 지원

한국어 제목은 기본적으로 그대로 유지됩니다:

```bash
docs-numbering new "사용자 인증 설계" --method=bmad --phase=prd
# → docs/001-bmad-prd-사용자-인증-설계.md
```

로마자로 변환하려면 설정에서:
```yaml
slug:
  language: romanize
# → docs/001-bmad-prd-sayongja-injeung-seolgye.md
```

---

## 다국어 지원 (i18n)

CLI 메시지가 OS 언어 설정에 따라 자동으로 표시됩니다.

### 로케일 감지 우선순위
1. `--locale ko` (CLI 플래그)
2. `DOCS_NUMBERING_LANG=ko` (환경 변수)
3. 설정 파일의 `locale: ko`
4. `LC_ALL` / `LC_MESSAGES` / `LANG` (OS 로케일)
5. 영어 폴백

### 지정 예시
```bash
# 한국어 강제
DOCS_NUMBERING_LANG=ko docs-numbering rollback --last

# 영어 강제
docs-numbering rollback --last --locale=en
```

### 메시지 예시

| 상황 | 한국어 | 영어 |
|------|--------|------|
| 설정 파일 존재 | 설정 파일이 이미 존재합니다 | config exists |
| 알 수 없는 단계 | 알 수 없는 단계입니다 | unknown phase |
| 프로젝트 잠김 | 다른 프로세스가 프로젝트를 잠그고 있습니다 | project is locked by another process |
| 체크섬 불일치 | 체크섬이 일치하지 않습니다 | checksum mismatch |
| 이력 없음 | 롤백할 히스토리 항목이 없습니다 | no history entries to rollback |

---

## 에이전트 연동

코어 CLI는 에이전트에 구애받지 않습니다. 어댑터 설치는 [`install` 명령](#install--어댑터-자동-설치) 하나로 끝납니다.

### 권장 워크플로우

```bash
cd my-project
docs-numbering install           # 자동 init + 자동 감지 + 설치
```

한 명령으로 모든 단계가 끝납니다: `.docs-numbering.yaml`이 없으면 `install`이 먼저 생성한 뒤 어댑터를 배치합니다. `docs-numbering init`을 별도로 실행하는 건 설정 파일만 만들고 어댑터는 필요 없을 때나 `--global` 옵션을 쓸 때에 한합니다.

`install`이 현재 프로젝트를 스캔해 `.claude/`, `.opencode/`, `.github/`, `AGENTS.md`, `GEMINI.md` 등을 확인하고 해당 어댑터를 알맞은 방식(심볼릭 링크 / 복사 / 블록 병합)으로 배치합니다.

**에이전트 채팅 안에서** (Claude Code, OpenCode, Codex 등): 에이전트에게 "프로젝트 디렉토리에서 `docs-numbering install` 실행해줘"라고 요청하면 됩니다. 터미널로 전환할 필요 없이 에이전트가 Bash/셸 도구로 바로 실행합니다. 이미 에이전트 세션 안에 있을 때의 최초 설치 권장 방식입니다.

특정 에이전트만 원할 때:
```bash
docs-numbering install --agent=claude-code
docs-numbering install --agent=opencode
docs-numbering install --agent=codex      # AGENTS.md
docs-numbering install --agent=gemini     # GEMINI.md
docs-numbering install --agent=copilot    # .github/copilot-instructions.md
```

지원하는 모든 에이전트에 한 번에 적용:
```bash
docs-numbering install --all
```

> 전체 플래그와 모드 설명(`link`/`copy`/`merge`), 감지 규칙, 병합 블록 마커는 [`install` 명령 섹션](#install--어댑터-자동-설치)을 참조하세요.

### 어댑터 요약

| 에이전트 | 설치 대상 | 기본 모드 | 활성화 방식 |
|----------|----------|----------|-------------|
| Claude Code | `.claude/skills/docs-numbering`, `.claude/commands/*.md` | `link` | 슬래시 커맨드 (`/docs-new`, `/docs-migrate`, `/docs-rollback`) + 스킬 자동 트리거 |
| OpenCode | `.opencode/commands/*.md` | `copy` | 슬래시 커맨드 (`/docs-new`, `/docs-migrate`, `/docs-rollback`) |
| Codex / Cursor / Windsurf | `AGENTS.md` (루트) | `merge` | 자연어 트리거 ("create a doc", "번호 매겨줘" 등) |
| Gemini CLI | `GEMINI.md` (루트) | `merge` | 자연어 트리거 |
| GitHub Copilot | `.github/copilot-instructions.md` | `merge` | 자연어 트리거 |

### 수동 설치 (참고)

`install` 명령을 사용할 수 없는 환경(예: CLI 없이 어댑터만 이식)에서는 저장소의 `adapters/<에이전트>/` 아래 파일을 직접 복사하거나 심볼릭 링크해도 동일하게 동작합니다. 루트 파일(`AGENTS.md`, `GEMINI.md`, `copilot-instructions.md`)은 기존 내용을 유지하려면 `<!-- docs-numbering:start -->` ~ `<!-- docs-numbering:end -->` 블록 형태로 삽입하세요.

---

## 문제 해결

| 문제 | 해결 |
|------|------|
| `설정 파일이 이미 존재합니다` | `--force`로 덮어쓰기 |
| `알 수 없는 단계입니다` | `phases --method=X`로 유효 단계 확인 |
| `다른 프로세스가 프로젝트를 잠그고 있습니다` | `.docs-numbering/lock` 파일 수동 삭제 |
| `체크섬이 일치하지 않습니다` | 외부에서 파일 수정됨. `--force`로 롤백 |
| `command not found: docs-numbering` | `~/.npm-packages/bin`을 PATH에 추가 |

---

## 프로젝트 구조

```
<프로젝트>/
├── .docs-numbering.yaml        # 설정
├── .docs-numbering/
│   ├── state.json              # 잠금 상태
│   ├── history/                # 작업 이력
│   │   └── YYYY-MM-DDTHH-mm-ss.json
│   └── backup/                 # 파일 백업
│       └── <항목-id>/
└── docs/                       # 관리 대상 문서
    ├── 001-bmad-prd-사용자-인증.md
    ├── 002-gsd-plan-api-설계.md
    └── ...
```
