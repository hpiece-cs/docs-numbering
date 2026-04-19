# docs-numbering

[English](README.md)

마크다운 문서를 **일관된 번호 규칙**으로 관리하는 CLI 도구입니다. 코어 CLI는 에이전트에 구애받지 않으며, **Claude Code**, **OpenCode**, **Gemini CLI**, **Copilot CLI** 어댑터를 제공합니다.

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

### 1. CLI 설치

npm 패키지는 아직 배포 전이므로 클론 + `npm link`로 설치합니다:

```bash
git clone https://github.com/hpiece-cs/docs-numbering.git
cd docs-numbering/core
npm install
npm link
```

`npm link` 시 postinstall 훅이 지원되는 4개 CLI(Claude Code / OpenCode / Gemini / Copilot CLI)에 사용자 범위 슬래시 커맨드를 자동 배치합니다.

### 2. PATH 확인 (필요 시)

```bash
# zsh
echo 'export PATH="$HOME/.npm-packages/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
# bash
echo 'export PATH="$HOME/.npm-packages/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

확인: `docs-numbering --version` (짧은 별칭 `docnum`으로도 호출 가능)

### 3. 프로젝트에서 사용

```bash
cd my-project

# 부트스트랩: .docs-numbering.yaml 자동 생성 + 에이전트 어댑터 설치.
# TTY 환경에서는 인터랙티브 picker로 설치할 CLI를 고를 수 있음.
docs-numbering install

# 또는 지원 AI 에이전트 채팅에서 바로:
#   /docs-install

# 번호 매긴 문서 생성
docs-numbering new "사용자 인증 설계" --method=bmad --phase=prd
# → docs/001-bmad-prd-사용자-인증-설계.md

# 기존 파일 일괄 이름 변경
docs-numbering migrate --order=mtime         # 미리보기
docs-numbering migrate --order=mtime --apply # 실행

# 마지막 작업 되돌리기
docs-numbering rollback --last --apply
```

### 4. 제거 (선택)

```bash
cd docs-numbering/core
npm run unlink-all
```

사용자 범위 슬래시 커맨드와 CLI 심볼릭 링크를 **모두** 제거합니다. `npm unlink -g` 단독으로는 고아 파일이 남습니다 — 자세한 내용은 [사용자 매뉴얼](docs/USER_MANUAL_KO.md#설치) 참조.

## 주요 기능

- **순차 번호 매김** — 설정 가능한 패턴
- **방법론 프리셋** — BMAD, GSD, WDS, Superpowers (혼합 사용 가능); 방법론 워크플로우에서 생성되는 문서에 자동으로 번호 매김 적용
- **파일명 자동 현지화** — 방법론이 생성하는 문서 파일명이 자동으로 사용자 언어로 변환; 한국어 로마자 변환 옵션 제공
- **원본 파일명 보존** — `{filename}` 변수로 마이그레이션 시 기존 이름 유지
- **이력 & 롤백** — 모든 작업이 기록되어 Git 없이도 되돌리기 가능
- **다국어 (i18n)** — CLI 메시지가 OS 로케일에 따라 한국어/영어 자동 전환
- **멀티 에이전트 지원** — 4개 어댑터: Claude Code, OpenCode, Gemini CLI, Copilot CLI

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

`npm link`(향후 배포 시 `npm install -g @hpiece/docs-numbering`)의 postinstall 훅이 지원되는 4개 CLI 모두에 사용자 범위 슬래시 커맨드를 자동 배치합니다. 이후 어떤 프로젝트에서든 `/docs-install` 한 줄로 `.docs-numbering.yaml` 부트스트랩이 가능합니다.

### 한눈에 보기

| 에이전트 | 사용자 범위 경로 | 전역 설치 시 자동 설정 | 슬래시 커맨드 |
|----------|------------------|:-:|------|
| Claude Code | `~/.claude/skills/` + `~/.claude/commands/` | ✅ | `/docs-install`, `/docs-new`, `/docs-migrate`, `/docs-rollback` |
| OpenCode | `~/.opencode/commands/` | ✅ | 동일 |
| Gemini CLI | `~/.gemini/commands/*.toml` | ✅ | 동일 |
| Copilot CLI | `~/.copilot/skills/docs-*/SKILL.md` | ✅ | 동일 |

---

### Claude Code

**설치** — `npm link` / 전역 설치 시 자동:
```bash
cd docs-numbering/core && npm link
```
`~/.claude/skills/docs-numbering` + `~/.claude/commands/docs-*.md`가 배치됩니다 (심볼릭 링크 — 저장소 변경사항 자동 반영).

**프로젝트 부트스트랩** — Claude Code 채팅에서:
```
/docs-install
```
`.docs-numbering.yaml` 생성 + 프로젝트 단위 어댑터 자동 감지/설치.

**사용**
- 슬래시: `/docs-new "제목"`, `/docs-migrate`, `/docs-rollback`
- 자동 트리거 스킬: "번호 매겨줘", "문서로 저장해줘", "정리해줘" 등 자연어
- 직접 CLI: `docs-numbering new ...`

---

### OpenCode

**설치** — `npm link` / 전역 설치 시 자동. 파일: `~/.opencode/commands/docs-*.md` (copy 모드).

**부트스트랩** — OpenCode 채팅에서: `/docs-install`

**사용**
- 슬래시: `/docs-new`, `/docs-migrate`, `/docs-rollback`
- 직접 CLI

---

### Gemini CLI

**설치** — `npm link` / 전역 설치 시 자동. 파일: `~/.gemini/commands/docs-*.toml` (Gemini 커스텀 커맨드 TOML 포맷)

**부트스트랩** — Gemini CLI에서: `/docs-install`

**사용**
- 슬래시: `/docs-new`, `/docs-migrate`, `/docs-rollback`
- 프로젝트 단위 `GEMINI.md` 병합도 가능: `docs-numbering install --agent=gemini`
- 직접 CLI

---

### Copilot CLI

**설치** — `npm link` / 전역 설치 시 자동. 파일: `~/.copilot/skills/docs-*/SKILL.md`. 각 스킬 폴더의 `SKILL.md` YAML frontmatter가 슬래시 커맨드를 결정합니다.

**부트스트랩** — Copilot CLI 안에서 `/docs-install`.

**사용**
- 슬래시: `/docs-install`, `/docs-new`, `/docs-migrate`, `/docs-rollback`
- 직접 CLI

---

### install 명령 레퍼런스

```bash
# 인터랙티브 picker (TTY) — 설치할 CLI를 번호/이름으로 선택
docs-numbering install

# 비대화식으로 여러 CLI 동시 설치 (쉼표 구분)
docs-numbering install --agent=claude-code,gemini

# 단일 에이전트
docs-numbering install --agent=claude-code

# 모든 어댑터
docs-numbering install --all

# picker 비활성화 (자동 감지로 폴백)
docs-numbering install --no-interactive

# 사용자 범위(홈 디렉토리) — postinstall 훅과 동일
docs-numbering install --user --all

# 미리보기 / 제어
docs-numbering install --dry-run
docs-numbering install --force            # 기존 파일 덮어쓰기
docs-numbering install --no-init          # .docs-numbering.yaml 자동 생성 건너뛰기

# 제거
docs-numbering uninstall --agent=<이름>
docs-numbering uninstall --agent=a,b,c    # 쉼표 구분
docs-numbering uninstall --all
docs-numbering uninstall --user --all
```

지원 에이전트 이름: `claude-code`, `opencode`, `gemini`, `copilot`.

**인터랙티브 picker** — `--agent` / `--all` 없이 TTY에서 `docs-numbering install`을 실행하면 지원되는 모든 CLI 목록이 번호와 함께 출력되며, 감지된 항목은 `*`로 표시됩니다. 번호나 이름을 쉼표로 구분해 입력하거나, `a`(전체), `q`(취소), Enter(감지된 세트 선택)를 사용합니다. 파이프/CI 환경에서는 picker가 자동으로 건너뛰어지고 자동 감지로 폴백합니다.

**설치 모드** — `--mode=link`(심볼릭 링크, 소스 업데이트 자동 반영), `--mode=copy`(독립 복사본), `--mode=merge`(기존 내용 보존하며 블록 삽입). 에이전트마다 기본값이 다릅니다. 자세한 내용은 [사용자 매뉴얼](docs/USER_MANUAL_KO.md#install--어댑터-자동-설치) 참조.

## 문서

- [사용자 매뉴얼 (영어)](docs/USER_MANUAL.md)
- [사용자 매뉴얼 (한국어)](docs/USER_MANUAL_KO.md)
- [릴리스 노트 (한국어)](RELEASE_KO.md)
- [릴리스 노트 (영어)](RELEASE.md)

## 요구사항

- Node.js 20+

## 라이선스

[MIT](LICENSE)
