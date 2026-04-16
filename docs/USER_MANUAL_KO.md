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

코어 CLI는 에이전트에 구애받지 않습니다. 각 에이전트별 어댑터를 제공합니다.

### Claude Code

```bash
mkdir -p <프로젝트>/.claude/skills <프로젝트>/.claude/commands
ln -s <docs-numbering>/adapters/claude-code/skills/docs-numbering <프로젝트>/.claude/skills/docs-numbering
ln -s <docs-numbering>/adapters/claude-code/commands/docs-new.md <프로젝트>/.claude/commands/docs-new.md
ln -s <docs-numbering>/adapters/claude-code/commands/docs-migrate.md <프로젝트>/.claude/commands/docs-migrate.md
ln -s <docs-numbering>/adapters/claude-code/commands/docs-rollback.md <프로젝트>/.claude/commands/docs-rollback.md
```

- 슬래시 커맨드: `/docs-new`, `/docs-migrate`, `/docs-rollback`
- 스킬 자동 트리거: "문서 저장해줘", "번호 매겨줘", "정리해줘" 등에서 자동 활성화

### Codex / Cursor / Windsurf (AGENTS.md)

```bash
cp <docs-numbering>/adapters/agents-md/AGENTS.md <프로젝트>/AGENTS.md
```

[AGENTS.md](https://agents.md/) 오픈 표준을 사용합니다. Codex, Cursor, Windsurf 등 다수 도구가 지원합니다. 자연어 요청("create a doc", "번호 매겨줘" 등)에 반응하여 `docs-numbering` CLI를 호출합니다.

### OpenCode

```bash
mkdir -p <프로젝트>/.opencode/commands
cp <docs-numbering>/adapters/opencode/commands/*.md <프로젝트>/.opencode/commands/
```

- 슬래시 커맨드: `/docs-new`, `/docs-migrate`, `/docs-rollback`

### Gemini CLI

```bash
cp <docs-numbering>/adapters/gemini/GEMINI.md <프로젝트>/GEMINI.md
```

Gemini CLI는 프로젝트 루트의 `GEMINI.md`를 읽습니다. 자연어 요청에 반응합니다.

### GitHub Copilot

```bash
mkdir -p <프로젝트>/.github
cp <docs-numbering>/adapters/copilot/.github/copilot-instructions.md <프로젝트>/.github/
```

Copilot은 `.github/copilot-instructions.md`를 프로젝트 수준 지시문으로 읽습니다. 자연어 요청에 반응합니다.

### 어댑터 요약

| 에이전트 | 어댑터 | 슬래시 커맨드 | 트리거 |
|----------|--------|:-:|--------|
| Claude Code | SKILL.md + commands | `/docs-new`, `/docs-migrate`, `/docs-rollback` | 자동 + 수동 |
| OpenCode | commands | `/docs-new`, `/docs-migrate`, `/docs-rollback` | 수동 |
| Codex / Cursor / Windsurf | AGENTS.md | - | 자연어 |
| Gemini CLI | GEMINI.md | - | 자연어 |
| GitHub Copilot | copilot-instructions.md | - | 자연어 |

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
