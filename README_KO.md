# docs-numbering

마크다운 문서를 **일관된 번호 규칙**으로 관리하는 CLI 도구입니다. 코어 CLI는 에이전트에 구애받지 않으며, **Claude Code**, **Codex**, **OpenCode**, **Gemini CLI**, **GitHub Copilot** 어댑터를 제공합니다.

## 왜 필요한가

AI 에이전트가 BMAD, GSD 같은 방법론을 따라 작업하면 매 단계마다 문서가 생성됩니다 — 브리프, PRD, 아키텍처, 스프린트 계획 등. 규칙 없이 쌓이면 파일명이 제각각이고 순서를 알 수 없습니다. `docs-numbering`은 순차 번호, 방법론 태그, 단계 라벨을 자동으로 부여합니다.

```
docs/
  001-bmad-brief-프로젝트-개요.md
  002-bmad-prd-요구사항.md
  003-gsd-plan-phase-스프린트-1.md
  004-bmad-architecture-시스템-설계.md
```

## 빠른 시작

```bash
# 설치
cd core && npm install && npm link

# CLI가 PATH에 없으면 추가
echo 'export PATH="$HOME/.npm-packages/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc

# 프로젝트에서 초기화
cd my-project
docs-numbering init

# 문서 생성
docs-numbering new "사용자 인증 설계" --method=bmad --phase=prd
# → docs/001-bmad-prd-사용자-인증-설계.md

# 기존 문서 마이그레이션
docs-numbering migrate --order=mtime         # 미리보기
docs-numbering migrate --order=mtime --apply # 실행

# 실수 되돌리기
docs-numbering rollback --last --apply
```

## 주요 기능

- **순차 번호 매김** — 설정 가능한 패턴
- **방법론 프리셋** — BMAD, GSD, WDS, Superpowers (혼합 사용 가능)
- **한국어 파일명 지원** — 한국어 유지 또는 로마자 변환 선택
- **원본 파일명 보존** — `{filename}` 변수로 마이그레이션 시 기존 이름 유지
- **이력 & 롤백** — 모든 작업이 기록되어 Git 없이도 되돌리기 가능
- **다국어 (i18n)** — CLI 메시지가 OS 로케일에 따라 한국어/영어 자동 전환
- **멀티 에이전트 지원** — Claude Code, Codex, OpenCode, Gemini CLI, Copilot 어댑터 제공

## 명령어

| 명령어 | 설명 |
|--------|------|
| `init` | 설정 초기화 |
| `new <제목>` | 번호 매긴 문서 생성 |
| `list` | 문서 조회 (방법론, 단계, 범위 필터) |
| `phases` | 활성화된 프리셋의 유효 단계 표시 |
| `migrate` | 기존 파일 일괄 이름 변경 (기본 dry-run) |
| `validate` | 중복 번호, 알 수 없는 단계 검사 |
| `history` | 작업 이력 조회 |
| `rollback` | 이전 작업 되돌리기 |

## 파일명 패턴

기본값: `{num:03d}-{method}-{phase}-{slug}.md`

| 변수 | 설명 | 예시 |
|------|------|------|
| `{num:03d}` | 0 패딩 번호 | `001` |
| `{method}` | 방법론 | `bmad` |
| `{phase}` | 단계 | `prd` |
| `{slug}` | 슬러그화된 제목 | `사용자-인증` |
| `{filename}` | 원본 파일명 (그대로 보존) | `README` |
| `{date}` | 날짜 | `2026-04-15` |

새 문서에는 `{slug}`, 기존 파일명을 유지하며 마이그레이션할 때는 `{filename}` 사용:

```yaml
# 제목을 슬러그로 변환 (기본값)
naming_pattern: "{num:03d}-{method}-{phase}-{slug}.md"

# 원본 파일명 유지
naming_pattern: "{num:03d}-{filename}.md"
```

## 프리셋

| 프리셋 | 단계 |
|--------|------|
| `bmad` | brief, prd, architecture, ux-design, epics, stories, dev, review, retrospective |
| `gsd` | new-project, discuss-phase, plan-phase, execute-phase, verify-work, ship |
| `wds` | project-setup, project-brief, trigger-mapping, scenarios, ux-design, agentic-development, asset-generation, design-system, product-evolution |
| `superpowers` | brainstorm, spec, plan, tdd, review |

## 설정

```yaml
# .docs-numbering.yaml
locale: null                    # en, ko, 또는 null (자동 감지)
docs_dir: "docs/"
naming_pattern: "{num:03d}-{method}-{phase}-{slug}.md"

numbering:
  presets: [bmad, gsd]
  phase_validation: warn        # strict | warn | off
  default_method: null

slug:
  language: preserve            # preserve | romanize
  lowercase: true
  max_length: 50
```

전체 설정 레퍼런스는 [사용자 매뉴얼](docs/USER_MANUAL_KO.md)을 참조하세요.

## 에이전트 연동

### 공통 전제조건 (모든 에이전트)

1. `docs-numbering` CLI가 설치되어 PATH에 있어야 합니다 ([빠른 시작](#빠른-시작) 참고)
2. 프로젝트에서 `docs-numbering init`으로 `.docs-numbering.yaml` 생성
3. 아래에서 사용하는 에이전트에 맞는 어댑터 파일을 복사 또는 심볼릭 링크

> **심볼릭 링크 vs 복사**: 심볼릭 링크(`ln -s`)를 사용하면 소스 업데이트가 자동 반영됩니다. 독립 프로젝트라면 `cp`로 복사하세요.

### Claude Code

```bash
mkdir -p <프로젝트>/.claude/skills <프로젝트>/.claude/commands
ln -s <docs-numbering>/adapters/claude-code/skills/docs-numbering <프로젝트>/.claude/skills/docs-numbering
ln -s <docs-numbering>/adapters/claude-code/commands/*.md <프로젝트>/.claude/commands/
```
슬래시 커맨드: `/docs-new`, `/docs-migrate`, `/docs-rollback`

### Codex / Cursor / Windsurf (AGENTS.md)

```bash
cp <docs-numbering>/adapters/agents-md/AGENTS.md <프로젝트>/AGENTS.md
```
자연어 트리거: "create doc", "organize docs", "번호 매겨줘"

### Gemini CLI

```bash
cp <docs-numbering>/adapters/gemini/GEMINI.md <프로젝트>/GEMINI.md
```

### OpenCode

```bash
mkdir -p <프로젝트>/.opencode/commands
cp <docs-numbering>/adapters/opencode/commands/*.md <프로젝트>/.opencode/commands/
```
슬래시 커맨드: `/docs-new`, `/docs-migrate`, `/docs-rollback`

### GitHub Copilot

```bash
mkdir -p <프로젝트>/.github
cp <docs-numbering>/adapters/copilot/.github/copilot-instructions.md <프로젝트>/.github/
```

## 문서

- [사용자 매뉴얼 (영어)](docs/USER_MANUAL.md)
- [사용자 매뉴얼 (한국어)](docs/USER_MANUAL_KO.md)
- [릴리스 노트](RELEASE.md)

## 요구사항

- Node.js 20+

## 라이선스

[MIT](LICENSE)
