# docs-numbering

[English](README.md)

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
# 클론
git clone https://github.com/hpiece-cs/docs-numbering.git
cd docs-numbering/core && npm install && npm link

# CLI가 PATH에 없으면 추가
# zsh:
echo 'export PATH="$HOME/.npm-packages/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
# bash:
echo 'export PATH="$HOME/.npm-packages/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc

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
- **방법론 프리셋** — BMAD, GSD, WDS, Superpowers (혼합 사용 가능); 방법론 워크플로우에서 생성되는 문서에 자동으로 번호 매김 적용
- **파일명 자동 현지화** — 방법론이 생성하는 문서 파일명이 자동으로 사용자 언어로 변환; 한국어 로마자 변환 옵션 제공
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
| `install` | 감지된 에이전트에 어댑터 파일 설치 (심볼릭 링크 / 복사 / 병합) |
| `uninstall` | 설치된 어댑터 파일 제거 |

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

`install` 명령 하나로 어댑터 설치가 끝납니다 — 수동으로 `ln -s`나 `cp`를 하지 않아도 됩니다.

```bash
cd my-project

# 에이전트를 자동 감지해 어댑터 설치.
# .docs-numbering.yaml이 없으면 자동으로 생성되므로 별도 `init`이 필요 없습니다.
docs-numbering install

# 특정 에이전트 지정
docs-numbering install --agent=claude-code
docs-numbering install --agent=codex --force
docs-numbering install --all              # 지원 어댑터 모두 설치
docs-numbering install --dry-run          # 실제 쓰기 없이 미리보기
docs-numbering install --no-init          # 설정 파일 자동 생성 비활성화

# 제거
docs-numbering uninstall --agent=claude-code
docs-numbering uninstall --all
```

### 사용자 단위 설치 — 모든 프로젝트에서 `/docs-install`

`npm install -g @hpiece/docs-numbering`로 전역 설치하면 postinstall 훅이 자동으로 사용자 범위를 지원하는 에이전트들에 슬래시 커맨드를 배치합니다. 이후 어떤 프로젝트를 열든 채팅 안에서 `/docs-install`을 입력하면 해당 프로젝트가 부트스트랩됩니다.

```bash
# 'npm install -g' 시 자동 수행. 수동 실행도 가능:
docs-numbering install --user --all
```

**모든 프로젝트에서 사용 가능한 슬래시 커맨드** (사용자 범위):

| 에이전트 | 설치 위치 | 활성화되는 커맨드 |
|----------|----------|-----------------|
| Claude Code | `~/.claude/commands/` + `~/.claude/skills/docs-numbering` | `/docs-install`, `/docs-new`, `/docs-migrate`, `/docs-rollback` + 자동 트리거 스킬 |
| OpenCode | `~/.opencode/commands/` | `/docs-install`, `/docs-new`, `/docs-migrate`, `/docs-rollback` |
| Gemini CLI | `~/.gemini/commands/*.toml` | `/docs-install`, `/docs-new`, `/docs-migrate`, `/docs-rollback` |
| Codex / Cursor / Windsurf | — | **자연어**만 지원 (슬래시 커맨드 개념 없음). "docs-numbering install", "번호 매겨줘" 등 |
| GitHub Copilot | — | **자연어**만 지원 |

`/docs-install`은 현재 프로젝트에서 `docs-numbering install`을 실행해 `.docs-numbering.yaml` 생성과 프로젝트 단위 어댑터 배치를 끝냅니다 — 채팅을 떠날 필요가 없습니다.

### 지원 에이전트

| 에이전트 | 감지 조건 | 설치 대상 | 기본 모드 |
|---------|----------|----------|----------|
| Claude Code | `.claude/` | `.claude/skills/docs-numbering`, `.claude/commands/*.md` | 심볼릭 링크 |
| OpenCode | `.opencode/` | `.opencode/commands/*.md` | 복사 |
| Codex / Cursor / Windsurf | `.cursor/`, `.codex/`, `.windsurf/`, `AGENTS.md` | `AGENTS.md` | 병합 |
| Gemini CLI | `.gemini/`, `GEMINI.md` | `GEMINI.md` | 병합 |
| GitHub Copilot | `.github/` | `.github/copilot-instructions.md` | 병합 |

**모드** — `--mode=link`(심볼릭 링크, 소스 업데이트 자동 반영), `--mode=copy`(독립 스냅샷), `--mode=merge`(기존 파일을 건드리지 않고 `<!-- docs-numbering:start -->…<!-- docs-numbering:end -->` 블록만 삽입·갱신).

설치 후에는 각 에이전트에서 슬래시 커맨드(`/docs-new`, `/docs-migrate`, `/docs-rollback`) 또는 자연어 트리거("create doc", "번호 매겨줘")가 활성화됩니다.

## 문서

- [사용자 매뉴얼 (영어)](docs/USER_MANUAL.md)
- [사용자 매뉴얼 (한국어)](docs/USER_MANUAL_KO.md)
- [릴리스 노트](RELEASE.md)

## 요구사항

- Node.js 20+

## 라이선스

[MIT](LICENSE)
