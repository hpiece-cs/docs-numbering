# @hpiece/docs-numbering

마크다운 문서를 **일관된 번호 규칙**으로 관리하는 CLI 도구입니다. 코어 CLI는 에이전트에 구애받지 않으며, Claude Code, Codex, OpenCode, Gemini CLI, GitHub Copilot 어댑터를 제공합니다. 한국어 파일명, 여러 개발 방법론 혼합, Git 없는 롤백을 지원합니다.

---

## 설치

### 요구사항
- Node.js **20 이상**

### 방법 1: 설치 없이 사용 (권장)
```bash
npx @hpiece/docs-numbering <command>
```

### 방법 2: 전역 설치
```bash
npm i -g @hpiece/docs-numbering
# 이후부터는:
docs-numbering <command>
# 또는 짧은 별칭:
docnum <command>
```

### 방법 3: 로컬 저장소에서 직접 실행 (npm 배포 전)
```bash
git clone https://github.com/hpiece-cs/docs-numbering.git
cd docs-numbering/core
npm install
node bin/docs-numbering.js <command>
```

---

## 빠른 시작

```bash
# 1. 프로젝트에 설정 파일 생성
docs-numbering init

# 2. 문서 생성 (한국어 OK)
docs-numbering new "사용자 인증 설계" --method=bmad --phase=prd
# → docs/001-bmad-prd-사용자-인증-설계.md 생성

# 3. 목록 확인
docs-numbering list

# 4. 실수했다면 되돌리기
docs-numbering rollback --last --apply
```

---

## 주요 개념

- **번호 규칙**: `{num:03d}-{method}-{phase}-{slug}.md` 형태. 사용자가 정의 가능.
- **방법론(method) + 단계(phase)**: 프리셋(BMAD, GSD, WDS, superpowers)이 각 방법론의 허용 phase를 제공. 서로 다른 방법론 섞어 쓸 수 있음.
- **저널 + 롤백**: 모든 작업은 `.docs-numbering/history/`에 기록되어 언제든 되돌리기 가능. Git 불필요.

---

## 명령어

### `init` — 설정 파일 생성
```bash
docs-numbering init                  # 프로젝트 루트에 .docs-numbering.yaml 생성
docs-numbering init --global         # ~/.docs-numbering/config.yaml 생성
docs-numbering init --force          # 기존 설정 덮어쓰기
```

### `new <title>` — 새 문서 생성
```bash
docs-numbering new "인증 설계" --method=bmad --phase=prd
docs-numbering new "로그인" --method=bmad --phase=stories --content="# 본문"

# AI가 긴 본문을 stdin으로 전달:
docs-numbering new "API 설계" --method=gsd --phase=plan-phase --stdin <<EOF
# API 설계
...긴 본문...
EOF

# 미리보기만 (실제 생성 안 함):
docs-numbering new "테스트" --method=bmad --phase=prd --dry-run
```

### `list` — 문서 목록
```bash
docs-numbering list
docs-numbering list --method=bmad    # BMAD 문서만
docs-numbering list --phase=prd      # PRD 단계 문서만
docs-numbering list --range=1-10     # 번호 범위
docs-numbering list --json           # JSON 출력 (AI 파싱용)
```

### `phases` — 허용 phase 확인
```bash
docs-numbering phases                # 현재 설정에서 사용 가능한 모든 phase
docs-numbering phases --method=bmad  # 특정 방법론의 phase
docs-numbering phases --json
```

### `migrate` — 기존 파일 일괄 번호 부여
```bash
# 항상 dry-run 먼저:
docs-numbering migrate --order=mtime     # 수정시간 순
docs-numbering migrate --order=alpha     # 알파벳 순

# 계획 확인 후 적용:
docs-numbering migrate --order=mtime --apply
```

### `validate` — 설정/문서 일관성 검사
```bash
docs-numbering validate
# 중복 번호, 알 수 없는 phase 등 감지
# 이슈 발견 시 exit code 3
```

### `history` — 작업 이력 조회
```bash
docs-numbering history
docs-numbering history --limit=10
docs-numbering history --json
```

### `rollback` — 되돌리기
```bash
# 가장 최근 작업 되돌리기:
docs-numbering rollback --last           # 미리보기
docs-numbering rollback --last --apply   # 실제 적용

# 특정 시점까지 되감기:
docs-numbering rollback --to=2026-04-15T10-23-01 --apply

# 체크섬 불일치(파일 외부 수정) 무시하고 강제:
docs-numbering rollback --last --apply --force
```

### 공통 옵션
```bash
--config <path>     # 설정 파일 경로 직접 지정
--docs-dir <path>   # 문서 폴더 경로 override
--json              # JSON 출력
-V, --version
-h, --help
```

---

## 설정 파일 (`.docs-numbering.yaml`)

### 최소 설정 (모두 기본값)
```yaml
docs_dir: "docs/"
```

### 전체 설정 예시
```yaml
# 문서 저장 경로 (상대/절대/~ 지원)
docs_dir: "docs/"

# 파일명 템플릿
# 변수: {num}, {num:03d}, {slug}, {filename}, {method}, {phase}, {date}
naming_pattern: "{num:03d}-{method}-{phase}-{slug}.md"

numbering:
  strategy: sequential
  start: 1
  padding: 3
  presets: [bmad, gsd]            # 활성화할 방법론 프리셋
  phase_validation: warn          # strict | warn | off
  default_method: bmad            # --method 생략 시 기본값

slug:
  language: preserve              # preserve(한국어 유지) | romanize(로마자)
  separator: "-"
  lowercase: true                 # 라틴 문자만 소문자화
  max_length: 50

migration:
  default_order: mtime            # mtime | alpha
  safety:
    dry_run_default: true

history:
  enabled: true
  max_entries: 100
  retain_days: 30
```

### 설정 우선순위 (낮음 → 높음)
1. `~/.docs-numbering/config.yaml` (전역 기본값)
2. `<프로젝트>/.docs-numbering.yaml` (프로젝트 override)
3. CLI 플래그 (`--docs-dir` 등, 최종 override)

---

## 내장 프리셋

| 프리셋 | 포함된 phase |
|---|---|
| `bmad` | brief, prd, architecture, ux-design, epics, stories, dev, review, retrospective |
| `gsd` | new-project, discuss-phase, plan-phase, execute-phase, verify-work, ship |
| `wds` | project-setup, project-brief, trigger-mapping, scenarios, ux-design, agentic-development, asset-generation, design-system, product-evolution |
| `superpowers` | brainstorm, spec, plan, tdd, review |

**여러 방법론 혼합 사용 예시**:
```yaml
numbering:
  presets: [bmad, gsd]
```
```bash
docs-numbering new "PRD" --method=bmad --phase=prd
docs-numbering new "계획" --method=gsd --phase=plan-phase
```

결과:
```
docs/001-bmad-prd-xxx.md
docs/002-gsd-plan-phase-xxx.md
```

---

## 한국어 파일명

기본값(`preserve`): `001-bmad-prd-사용자-인증.md`  
`romanize` 설정 시: `001-bmad-prd-sayongja-injeung.md`

```yaml
slug:
  language: romanize   # preserve 대신
```

파일시스템 금지 문자(`/ \ : * ? " < > |`)는 항상 자동 제거.

---

## 에이전트 연동

### 공통 전제조건

1. `docs-numbering` CLI가 PATH에 있어야 합니다 (위 설치 참고)
2. 프로젝트에서 `docs-numbering init`으로 `.docs-numbering.yaml` 생성
3. 아래에서 사용하는 에이전트에 맞는 어댑터 파일을 복사 또는 심볼릭 링크

> **심볼릭 링크 vs 복사**: 심볼릭 링크(`ln -s`)를 사용하면 소스 업데이트가 자동 반영됩니다. 독립 프로젝트라면 `cp`로 복사하세요.

### Claude Code

```bash
mkdir -p <프로젝트>/.claude/skills <프로젝트>/.claude/commands
ln -s <docs-numbering>/adapters/claude-code/skills/docs-numbering <프로젝트>/.claude/skills/docs-numbering
ln -s <docs-numbering>/adapters/claude-code/commands/*.md <프로젝트>/.claude/commands/
```
- 슬래시 커맨드: `/docs-new`, `/docs-migrate`, `/docs-rollback`
- 스킬 자동 트리거: "문서 저장해줘", "번호 매겨줘", "정리해줘" 등

### Codex / Cursor / Windsurf (AGENTS.md)

```bash
cp <docs-numbering>/adapters/agents-md/AGENTS.md <프로젝트>/AGENTS.md
```
자연어 트리거: "create doc", "organize docs", "번호 매겨줘"

### OpenCode

```bash
mkdir -p <프로젝트>/.opencode/commands
cp <docs-numbering>/adapters/opencode/commands/*.md <프로젝트>/.opencode/commands/
```
슬래시 커맨드: `/docs-new`, `/docs-migrate`, `/docs-rollback`

### Gemini CLI

```bash
cp <docs-numbering>/adapters/gemini/GEMINI.md <프로젝트>/GEMINI.md
```
자연어 트리거

### GitHub Copilot

```bash
mkdir -p <프로젝트>/.github
cp <docs-numbering>/adapters/copilot/.github/copilot-instructions.md <프로젝트>/.github/
```
자연어 트리거

### 어댑터 요약

| 에이전트 | 어댑터 | 슬래시 커맨드 | 트리거 |
|----------|--------|:-:|--------|
| Claude Code | SKILL.md + commands | `/docs-new`, `/docs-migrate`, `/docs-rollback` | 자동 + 수동 |
| OpenCode | commands | `/docs-new`, `/docs-migrate`, `/docs-rollback` | 수동 |
| Codex / Cursor / Windsurf | AGENTS.md | - | 자연어 |
| Gemini CLI | GEMINI.md | - | 자연어 |
| GitHub Copilot | copilot-instructions.md | - | 자연어 |

---

## 일반적인 워크플로

### 1. 새 프로젝트 시작
```bash
cd my-project
docs-numbering init
# .docs-numbering.yaml 수정해서 preset 선택
```

### 2. 작업하면서 문서 추가
```bash
docs-numbering new "프로젝트 브리프" --method=bmad --phase=brief
docs-numbering new "PRD" --method=bmad --phase=prd
docs-numbering new "아키텍처" --method=bmad --phase=architecture
```

### 3. 기존 프로젝트에 적용
```bash
# 기존에 아무 이름으로 쌓여있는 .md 파일들:
docs-numbering migrate --order=mtime          # 계획 확인
docs-numbering migrate --order=mtime --apply  # 실제 적용
```

### 4. 실수 복구
```bash
docs-numbering history --limit=5
docs-numbering rollback --last --apply
```

---

## 디렉토리 구조 (생성되는 파일)

```
<프로젝트 루트>/
├── .docs-numbering.yaml                    # 설정
├── .docs-numbering/
│   ├── state.json                          # 내부 상태 + lockfile
│   ├── history/
│   │   └── 2026-04-15T10-23-01.json        # 작업 기록
│   └── backup/
│       └── 2026-04-15T10-23-01/            # 삭제/덮어쓴 파일 원본
└── docs/                                   # (docs_dir 설정에 따라)
    ├── 001-bmad-prd-인증.md
    └── 002-gsd-plan-phase-api.md
```

`.gitignore` 추천:
```
.docs-numbering/state.json
.docs-numbering/backup/
# history/는 팀과 공유할지 선택
```

---

## 종료 코드

| 코드 | 의미 |
|---|---|
| 0 | 성공 |
| 1 | 일반 오류 |
| 2 | 설정 오류 (YAML 잘못됨) |
| 3 | 검증 실패 (`validate`에서 이슈 발견) |
| 4 | 사용자 취소 |

---

## 문제 해결

**Q. `npx` 실행이 느림**  
A. 전역 설치(`npm i -g`) 또는 `npx` 캐시 활용. 첫 실행 후 다음부터는 빠름.

**Q. phase가 인식되지 않음 (`warn` 메시지)**  
A. `docs-numbering phases`로 허용 phase 확인 후 `.docs-numbering.yaml`의 `numbering.presets`에 필요한 프리셋이 포함돼 있는지 확인.

**Q. 롤백했는데 파일이 복구 안 됨**  
A. `history --limit=10`으로 작업 순서 확인. `rollback --to=<id> --apply`로 특정 시점까지 연속 되감기 시도.

**Q. migrate가 원하는 순서가 아님**  
A. `--order=alpha` vs `--order=mtime` 전환. 또는 파일 이름을 미리 바꿔서 정렬 기준을 만든 뒤 실행.

**Q. 동시 실행 시 "locked" 에러**  
A. `.docs-numbering/lock` 파일이 남아있는지 확인. 크래시 후 남은 것이라면 수동 삭제 가능.

---

## 전체 설계 스펙

자세한 아키텍처/설계 근거는 저장소의 다음 문서 참고:  
`docs/superpowers/specs/2026-04-15-docs-numbering-design.md`

## 라이선스

[MIT](../LICENSE)
