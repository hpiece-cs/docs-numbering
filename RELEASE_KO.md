# 릴리스 노트

## v0.1.1 (2026-04-18)

### 새 기능

- **`install` / `uninstall` 명령** — 프로젝트 내 에이전트를 자동 감지해 어댑터를 심볼릭 링크/복사/병합 모드로 배포. 모든 수동 `ln -s`/`cp` 작업을 대체
- **자동 초기화** — `install` 실행 시 `.docs-numbering.yaml`이 없으면 자동으로 생성 (비활성화는 `--no-init`)
- **`--user` 범위** — 어댑터를 `$HOME`에 설치해 모든 프로젝트에서 사용 가능
- **전역 postinstall 훅** — `npm install -g`만으로 6개 CLI에 사용자 범위 슬래시 커맨드 자동 배치
- **공통 `/docs-install` 슬래시** — 에이전트 채팅 안에서 어떤 프로젝트든 부트스트랩 (터미널로 나갈 필요 없음)
- **에이전트별 네이티브 슬래시 경로 지원**:
  - Claude Code: `~/.claude/commands/` + `~/.claude/skills/docs-numbering`
  - OpenCode: `~/.opencode/commands/`
  - Codex CLI: `~/.codex/prompts/`
  - Cursor: `~/.cursor/commands/`
  - Gemini CLI: `~/.gemini/commands/*.toml`
  - Copilot CLI: `~/.copilot/skills/*/SKILL.md`
  - Windsurf: `.windsurf/workflows/` (프로젝트 단위만)
  - Copilot VS Code Chat: `.github/prompts/*.prompt.md` (프로젝트 단위만)
- **Codex/Cursor/Windsurf 어댑터 분리** — 묶여 있던 단일 어댑터를 3개 독립 어댑터로 분리. 각자 자체 슬래시 경로 보유

### 리팩터

- `adapters/` 디렉토리를 `core/adapters/`로 이동해 npm publish 시 포함되도록 수정
- `package.json`에 `files` 필드 명시로 배포 매니페스트 명시화
- 어댑터 레지스트리에 `userScope`, `userItems`, `userDefaultMode` 필드 추가
- `installAdapter` / `uninstallAdapter`에 `baseDir`, `scope` 파라미터 도입

## v0.1.0 (2026-04-16)

최초 릴리스.

### 새 기능

- **번호 매김 문서 관리** — 설정 가능한 패턴(`{num:03d}-{method}-{phase}-{slug}.md`)으로 순차 번호 부여
- **방법론 프리셋** — BMAD, GSD, WDS, Superpowers 빌트인 지원 + 단계 검증
- **한글 파일명 지원** — 한글 그대로 보존 또는 ASCII 로마자 변환 선택
- **원본 파일명 보존** — `{filename}` 변수로 마이그레이션 시 기존 파일명 유지
- **이력 & 롤백** — 모든 작업이 `.docs-numbering/history/`에 기록되어 완전 되돌리기 가능
- **마이그레이션** — 기존 `.md` 파일을 번호 규칙에 맞게 일괄 이름 변경, dry-run 안전 지원
- **국제화 (i18n)** — CLI 메시지 영/한 지원, OS 로케일 자동 감지
- **다중 에이전트 지원** — Claude Code, Codex, OpenCode, Gemini CLI, GitHub Copilot 어댑터 제공
  - Claude Code & OpenCode: 슬래시 커맨드 (`/docs-new`, `/docs-migrate`, `/docs-rollback`)
  - Codex / Cursor / Windsurf: AGENTS.md (자연어 트리거)
  - Gemini CLI: GEMINI.md (자연어 트리거)
  - GitHub Copilot: copilot-instructions.md (자연어 트리거)

### 명령어

| 명령 | 설명 |
|------|------|
| `init` | 프로젝트 설정 초기화 |
| `new <title>` | 번호 매겨진 새 문서 생성 |
| `list` | 필터로 문서 조회 |
| `phases` | 활성화된 프리셋의 유효 단계 표시 |
| `migrate` | 기존 파일을 번호 규칙으로 일괄 이름 변경 |
| `validate` | 중복 번호, 알 수 없는 단계 검사 |
| `history` | 작업 이력 조회 |
| `rollback` | 이전 작업 되돌리기 |

### 설정

- 프로젝트 설정: `.docs-numbering.yaml`
- 글로벌 설정: `~/.docs-numbering/config.yaml`
- 파일명 패턴 변수: `{num}`, `{method}`, `{phase}`, `{slug}`, `{filename}`, `{date}`
- 로케일: `LANG` / `LC_ALL`에서 자동 감지, `--locale` 또는 `DOCS_NUMBERING_LANG`으로 재정의

### 요구사항

- Node.js 20+

### 알려진 제한

- `numbering.strategy`는 `sequential`만 지원
- `rollback --range` 미구현 (`--last` 또는 `--to` 사용)
- `migrate`는 `docs_dir` 내부 파일만 처리 (디렉토리 간 이동 없음)
- npm 패키지 미배포 (로컬에서는 `npm link` 필요)
