# docs-numbering 설계 스펙

- **작성일**: 2026-04-15
- **패키지명**: `@hpiece/docs-numbering`
- **Claude Code 스킬명**: `docs-numbering`
- **CLI 바이너리**: `docs-numbering` (단축 별칭: `docnum`)
- **구현 언어**: Node.js
- **상태**: 초안 — 사용자 검토/승인 대기

---

## 1. 목적

여러 AI 코딩 CLI(Claude Code, Codex, OpenCode, Gemini CLI, Copilot)가 공통으로 사용할 수 있는, **CLI 중립적인 단일 도구**를 제공한다. 설정 가능한 번호 부여 규칙에 맞춰 마크다운 문서를 생성·관리하며, 신규 문서 생성과 기존 문서의 일괄 정규화를 모두 지원하고, 완전한 되돌리기(rollback) 기능을 git 의존 없이 제공한다.

## 2. 대상 사용자

다음과 같은 개인 및 소규모 팀:
- 한 프로젝트에서 둘 이상의 AI CLI를 사용
- 구조화된 개발 방법론(BMAD, GSD, WDS, superpowers 등)을 따르거나 혼합해서 사용
- 결정론적이고 규칙 기반의 파일명을 원함 — 한국어 등 비영어 파일명 포함
- 롤백 안전성을 위해 git에 의존하고 싶지 않음

## 3. 아키텍처 (B + C 하이브리드)

### 3.1 저장소 구조

```
docs-numbering/
├── core/                              # CLI 중립 핵심 (Node.js)
│   ├── package.json                   # @hpiece/docs-numbering 으로 배포
│   ├── bin/docs-numbering.js          # CLI 진입점
│   ├── src/
│   │   ├── commands/                  # new, migrate, list, init, phases,
│   │   │                              # validate, history, rollback
│   │   ├── config/                    # 계층형 설정 로더
│   │   ├── naming/                    # 템플릿 엔진 + slug 처리
│   │   ├── numbering/                 # sequential/workflow 전략
│   │   ├── migration/                 # dry-run, rename, backup
│   │   ├── history/                   # 저널, 체크섬, 롤백
│   │   └── presets/                   # bmad.yaml, gsd.yaml, wds.yaml,
│   │                                  # superpowers.yaml
│   └── templates/default-config.yaml
├── adapters/
│   ├── claude-code/                   # v1
│   │   ├── skills/docs-numbering/
│   │   │   └── SKILL.md
│   │   └── commands/                  # 선택적 슬래시 명령어
│   ├── shared/                        # v2 (Codex/OpenCode/Gemini)
│   │   ├── AGENTS.md
│   │   └── install.sh
│   └── copilot/                       # v3
│       ├── .github/copilot-instructions.md
│       └── .github/chatmodes/docs-numbering.chatmode.md
└── docs/
```

### 3.2 데이터 흐름

```
[사용자 또는 AI]
   → AI CLI (Claude Code / Codex / OpenCode / Gemini / Copilot)
   → 어댑터 (Skill / AGENTS.md / chatmode)
   → core/bin/docs-numbering.js <command> <args>
   → 설정 해석:
       ~/.docs-numbering/config.yaml          # 전역 기본값
       <프로젝트 루트>/.docs-numbering.yaml    # 프로젝트 override
       CLI 플래그                             # 최종 override
   → 명령 실행
   → 결과: <docs_dir> 아래에 파일 생성 또는 이름 변경
   → .docs-numbering/history/ 에 저널 엔트리 기록
```

### 3.3 단계적 출시

- **v1** — Claude Code Skill 어댑터 + core CLI
- **v2** — 공용 `AGENTS.md` 어댑터 (Codex, OpenCode, Gemini 커버)
- **v3** — Copilot 어댑터 (instructions + chatmode)

core는 처음부터 CLI 중립적으로 설계하며, 어댑터는 얇은 래퍼로만 존재한다.

## 4. 설정

### 4.1 우선순위 계층

1. `~/.docs-numbering/config.yaml` — 전역 기본값
2. `<프로젝트 루트>/.docs-numbering.yaml` — 프로젝트 override
3. CLI 플래그 — 최종 override

### 4.2 전체 스키마

```yaml
# 문서 저장 경로. 상대/절대/~ 경로 모두 허용.
docs_dir: "docs/"

# 파일명 템플릿.
# 사용 가능한 변수: {num}, {num:03d}, {slug}, {method}, {phase}, {date}, {ext}
naming_pattern: "{num:03d}-{method}-{phase}-{slug}.md"

numbering:
  strategy: sequential          # sequential | category | hierarchical
  start: 1
  padding: 3
  presets: [bmad, gsd]          # 활성화할 방법론 프리셋
  phase_validation: warn        # strict | warn | off
  default_method: bmad          # 선택; --method 생략 시 사용

slug:
  language: preserve            # preserve | romanize
  separator: "-"
  lowercase: true               # 라틴 문자에만 적용됨
  max_length: 50
  # 파일시스템 금지 문자는 항상 제거: / \ : * ? " < > |

migration:
  default_order: mtime          # mtime | alpha | git-history | interactive
  safety:
    dry_run_default: true
    backup_dir: ".docs-numbering/backup"

history:
  enabled: true
  max_entries: 100
  retain_days: 30
  include_backups: true

frontmatter:
  enabled: false
  template: |
    ---
    number: {num}
    method: {method}
    phase: {phase}
    title: {title}
    created: {date}
    ---
```

### 4.3 최소 설정

```yaml
docs_dir: "specs/"
```

나머지 값은 모두 기본값으로 적용된다.

### 4.4 파일명 언어 예시

설정:
```yaml
naming_pattern: "{num:03d}-{slug}.md"
slug: { language: preserve, separator: "-" }
```
`docs-numbering new "사용자 인증 설계"` → `docs/001-사용자-인증-설계.md`

`slug.language: romanize` 로 변경 시:
→ `docs/001-sayongja-injeung-seolgye.md`

## 5. 번호 부여 모델 (방식 1 + 4 조합)

- **전략**: 프로젝트 전체를 아우르는 **단일 전역 순차 번호**
- **방법론/단계는 파일명 태그로**: 프리셋이 `--method`와 `--phase`에 허용되는 값들을 제공. 순서를 강제하지는 않음.
- **근거**: 프로젝트를 하나의 폴더에서 타임라인으로 읽을 수 있게 하고, 프로파일 전환 부담을 없애며, 한 프로젝트에서 여러 방법론을 섞어 쓸 수 있게 한다.

### 5.1 결과 예시

```
docs/
  001-bmad-brief-initial-vision.md
  002-bmad-prd-auth.md
  003-bmad-architecture-system.md
  004-gsd-plan-phase-auth-api.md
  005-gsd-execute-phase-auth-api.md
  006-bmad-stories-login-flow.md
  007-gsd-verify-work-auth.md
  008-bmad-retrospective-sprint1.md
```

### 5.2 내장 프리셋 (v1)

- `bmad` — brief, prd, architecture, ux-design, epics, stories, dev, review, retrospective
- `gsd` — new-project, discuss-phase, plan-phase, execute-phase, verify-work, ship
- `wds` — project-setup, project-brief, trigger-mapping, scenarios, ux-design, agentic-development, asset-generation, design-system, product-evolution
- `superpowers` — brainstorm, spec, plan, tdd, review

각 프리셋은 `core/src/presets/` 아래 YAML 파일로 저장되며, 사용자 설정에서 확장·override 가능.

### 5.3 Phase 검증 모드

- `strict` — 알 수 없는 phase는 exit code 3으로 거부
- `warn` — 경고만 출력하고 진행
- `off` — 임의 문자열을 phase로 허용

## 6. CLI 명령어

### 6.1 공통 옵션

```
--config <path>
--docs-dir <path>
--profile <name>          # 향후 다중 프로파일 지원을 위한 예약
--json
-v, --verbose
-q, --quiet
--help, -h
```

### 6.2 명령어

#### `init [--global]`
기본 템플릿에서 `.docs-numbering.yaml`(프로젝트) 또는 `~/.docs-numbering/config.yaml`(전역)을 생성. 덮어쓰기 전 확인 프롬프트.

#### `new <title> [options]`
번호가 부여된 새 문서 생성.

옵션:
```
--method <name>
--phase <name>
--content <text>
--template <path>
--date <YYYY-MM-DD>
--stdin
--dry-run
```

동작:
1. 설정 로드, 다음 번호 계산 (`docs_dir` 내 최대 번호 + 1)
2. `phase_validation` 설정에 따라 phase 검증
3. `slug` 설정에 따라 slug 생성
4. `naming_pattern` 렌더링
5. 파일 쓰기 (활성화 시 frontmatter 포함)
6. 저널 엔트리 추가
7. 최종 경로를 stdout에 출력

예:
```bash
docs-numbering new "사용자 인증" --method=bmad --phase=prd
# docs/004-bmad-prd-사용자-인증.md
```

#### `list [options]`
기존 번호 부여된 문서 목록 조회.
```
--method <name>
--phase <name>
--range <a-b>
--json
```

#### `migrate [options]`
기존 파일을 일괄 정규화(이름 변경).
```
--order <mtime|alpha|git-history|interactive>
--apply                       # 없으면 dry-run
--no-backup
--include <glob>
--exclude <glob>
```

동작:
1. 대상 파일 수집
2. 선택된 정렬 순서로 정렬
3. 각 파일의 method/phase 추론 (프론트매터 또는 기존 파일명에서; 불확실하면 경고)
4. 새 이름 계산
5. before → after 변경사항 출력
6. `--apply` 시: 백업 생성 후 파일시스템 rename
7. 모든 rename을 묶어 하나의 저널 엔트리로 기록

git은 필수가 아님. `git-history` 정렬은 git 저장소가 감지될 때만 사용되며, 없으면 `mtime`으로 fallback.

#### `phases [--method=<name>] [--json]`
활성화된 프리셋에서 사용 가능한 phase 목록 출력.

#### `validate`
설정 스키마 검증 및 `docs_dir` 점검:
- 번호 중복
- 번호 누락(gap)
- 활성 프리셋에 없는 phase
리포트만 수행하며 수정은 하지 않음.

#### `history [--limit=N] [--json]`
과거 작업 목록 조회.

#### `rollback [<id>] [options]`
하나 이상의 작업을 되돌림.
```
--last                   # 기본값: 최신 작업
--to <id>                # 지정 id까지 되감기
--range <id1>..<id2>
--dry-run                # 기본값
--apply
--force                  # 체크섬 불일치 경고 무시
```

롤백 자체도 새 저널 엔트리로 기록됨 (롤백의 롤백 가능).

#### `history clear [--older-than=30d]`
보존 정책에 따라 오래된 저널 엔트리와 백업을 정리.

#### `version`, `help`
표준.

### 6.3 종료 코드

```
0   성공
1   일반 오류
2   설정 오류 (YAML 잘못됨, docs_dir 없음)
3   검증 실패 (strict 모드의 미등록 phase, 번호 중복 등)
4   사용자 취소 (interactive 모드 abort)
```

## 7. 이력 및 롤백 (Git 비의존)

### 7.1 디렉토리 구조

```
<프로젝트 루트>/.docs-numbering/
├── state.json                      # 현재 lock, 마지막 작업 id
├── history/
│   └── <iso-timestamp>.json        # 작업당 1개 엔트리
└── backup/
    └── <iso-timestamp>/            # 삭제/덮어쓰기된 파일 원본
```

### 7.2 저널 엔트리 포맷

```json
{
  "id": "2026-04-15T10-23-01",
  "command": "migrate",
  "timestamp": "2026-04-15T10:23:01.123Z",
  "cwd": "/abs/project/path",
  "git_commit": "a1b2c3d",
  "status": "committed",
  "operations": [
    {
      "type": "rename",
      "from": "docs/old.md",
      "to": "docs/001-bmad-brief-vision.md",
      "content_hash_before": "sha256:abc..."
    },
    {
      "type": "create",
      "path": "docs/002-bmad-prd-auth.md"
    }
  ]
}
```

### 7.3 Git 없이 확보하는 안전장치

| 위험 | 대응 |
|---|---|
| 실수로 이름 변경 | 저널에 `from`/`to` 기록 → 롤백이 역연산 |
| 실수로 생성 | 저널에 create 기록 → 롤백이 삭제 |
| 실수로 덮어씀 | 작업 전 원본을 backup으로 복사 |
| 저널 파일 손상 | 엔트리별 분리 파일 → 하나 손상돼도 나머지 정상 |
| 동시 실행 경합 | `state.json`의 lockfile 필드로 차단 |
| 작업과 롤백 사이 외부 수정 | `content_hash_before` 체크섬 비교 → `--force` 없으면 경고 |
| 작업 중간 크래시 | 엔트리를 `status: "pending"`으로 시작 → 다음 실행 시 정리 안내 |

### 7.4 Git은 선택적

git 저장소가 감지되면 저널 엔트리에 HEAD 커밋을 **참고 정보로만** 기록. `git mv`를 사용하지 않고, 커밋도 만들지 않으며, 롤백을 포함한 어떤 동작에도 git은 필요하지 않음.

## 8. 어댑터 설계

### 8.1 v1 — Claude Code Skill

위치: `adapters/claude-code/skills/docs-numbering/SKILL.md`

Frontmatter의 description이 다음 상황에서 트리거:
- 사용자가 마크다운 문서를 저장/생성 요청
- 방법론 단계가 완료되어 결과 문서가 나올 때
- 기존 `.md` 파일 정리/이름 변경 요청
- 명시적 키워드: "문서 번호 매겨줘", "재정렬", "마이그레이트"

SKILL.md가 에이전트에게 지시하는 내용:
1. `docs-numbering phases --json`으로 유효한 phase 확인
2. `docs-numbering new ... --stdin`으로 문서 생성
3. `migrate`는 항상 dry-run 먼저, 이후 apply
4. `docs_dir`에 직접 쓰지 않음
5. 파괴적 작업이 최근에 있었다면 사용자에게 롤백 옵션 안내

`adapters/claude-code/commands/` 아래 선택적 슬래시 명령어:
- `/docs-new`, `/docs-migrate`, `/docs-rollback`

### 8.2 v2 — 공용 AGENTS.md (Codex, OpenCode, Gemini CLI)

위치: `adapters/shared/AGENTS.md`

SKILL.md와 같은 규칙을 일반 에이전트 지시문 형식으로 기술. `install.sh`가 `AGENTS.md`를 프로젝트 루트에 복사하거나 심볼릭 링크 생성하고, Gemini를 위해 같은 내용의 `GEMINI.md`도 함께 생성.

OpenCode는 선택적으로 `.opencode/commands/docs.md`에 바로가기 명령어 추가.

### 8.3 v3 — Copilot

위치: `adapters/copilot/`

- `.github/copilot-instructions.md` — AGENTS.md와 동일한 규칙, Copilot 스타일로 작성
- `.github/chatmodes/docs-numbering.chatmode.md` — 문서 작업 전용 chatmode

## 9. 배포

- `@hpiece/docs-numbering`을 npm에 배포 → `npx @hpiece/docs-numbering ...` 로 설치 없이 실행 가능
- 어댑터 파일은 동일 저장소의 `adapters/` 아래 함께 배포
- `scripts/install-adapter.sh <claude-code|shared|copilot>` 헬퍼 제공

## 10. 명시적 제외 범위 (Non-goals)

- Phase 순서 강제 / 의존성 게이트 (Level 4+)
- Phase별 템플릿 + 필수 프론트매터 필드 검증 (Level 5)
- 부모-자식 문서 그래프 (Level 6)
- CI 리포트, 상태 대시보드, 시각화 (Level 7)
- 다중 프로파일(`profiles:` 설정) — `--profile` 플래그는 예약만 해두고 v1 미구현

위 항목들은 추후 추가 가능. v1은 "Level 2 + 방법론 혼합 타임라인"에 머무른다.

## 11. 미해결 사항 (구현 시점 결정)

- `@hpiece/docs-numbering`의 npm 패키지 공개 정책 (public vs scoped-public)
- Claude Code Skill을 공식 마켓플레이스에 등록할지 또는 자체 설치 방식만 유지할지
- 한국어 로마자 변환 라이브러리 선택 (`hangul-romanization` 등) vs `@sindresorhus/slugify`의 language 옵션 사용

모두 v1 설계를 막지 않는 구현 시점의 결정 사항.
