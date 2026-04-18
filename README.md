# docs-numbering

[한국어](README_KO.md)

A CLI tool for managing numbered markdown documentation with methodology-aware naming conventions. The core CLI is agent-agnostic. Ships with adapters for **Claude Code**, **Codex**, **OpenCode**, **Gemini CLI**, and **GitHub Copilot**.

## Why

AI agents following methodologies like BMAD or GSD produce documents at every phase — briefs, PRDs, architecture specs, sprint plans. Without a convention, these files pile up with inconsistent names and no discernible order. `docs-numbering` solves this by enforcing sequential numbering, methodology tagging, and phase labeling — automatically.

```
docs/
  001-bmad-brief-project-overview.md
  002-bmad-prd-requirements.md
  003-gsd-plan-phase-sprint-1.md
  004-bmad-architecture-system-design.md
```

## Quick Start

```bash
# Clone
git clone https://github.com/hpiece-cs/docs-numbering.git
cd docs-numbering/core && npm install && npm link

# Ensure CLI is in PATH (if not already)
# zsh:
echo 'export PATH="$HOME/.npm-packages/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
# bash:
echo 'export PATH="$HOME/.npm-packages/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc

# Initialize in your project
cd my-project
docs-numbering init

# Create a document
docs-numbering new "User Authentication" --method=bmad --phase=prd
# → docs/001-bmad-prd-user-authentication.md

# Migrate existing docs
docs-numbering migrate --order=mtime         # preview
docs-numbering migrate --order=mtime --apply # execute

# Undo mistakes
docs-numbering rollback --last --apply
```

## Features

- **Sequential numbering** with configurable patterns
- **Methodology presets** — BMAD, GSD, WDS, Superpowers (mix and match); documents produced during methodology workflows are numbered automatically
- **Auto-localized filenames** — methodology-generated documents are automatically named in your language, not English; optional Korean romanization
- **Original filename preservation** — `{filename}` variable keeps names untouched during migration
- **History & rollback** — every operation journaled, fully reversible without Git
- **i18n** — CLI messages in English and Korean (auto-detected from OS locale)
- **Multi-agent support** — adapters for Claude Code, Codex, OpenCode, Gemini CLI, Copilot

## Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize configuration |
| `new <title>` | Create a numbered document |
| `list` | Query documents with filters (method, phase, range) |
| `phases` | Show valid phases from enabled presets |
| `migrate` | Bulk rename existing files (dry-run by default) |
| `validate` | Check for duplicate numbers and unknown phases |
| `history` | View operation log |
| `rollback` | Undo previous operations |
| `install` | Install adapter files for a detected agent (symlink / copy / merge) |
| `uninstall` | Remove installed adapter files for an agent |

## Naming Pattern

Default: `{num:03d}-{method}-{phase}-{slug}.md`

| Variable | Description | Example |
|----------|-------------|---------|
| `{num:03d}` | Zero-padded number | `001` |
| `{method}` | Methodology | `bmad` |
| `{phase}` | Phase | `prd` |
| `{slug}` | Slugified title | `user-auth` |
| `{filename}` | Original filename (preserved) | `README` |
| `{date}` | Date | `2026-04-15` |

Use `{slug}` for new documents, `{filename}` to preserve existing names during migration:

```yaml
# Transform title to slug (default)
naming_pattern: "{num:03d}-{method}-{phase}-{slug}.md"

# Keep original filename
naming_pattern: "{num:03d}-{filename}.md"
```

## Presets

| Preset | Phases |
|--------|--------|
| `bmad` | brief, prd, architecture, ux-design, epics, stories, dev, review, retrospective |
| `gsd` | new-project, discuss-phase, plan-phase, execute-phase, verify-work, ship |
| `wds` | project-setup, project-brief, trigger-mapping, scenarios, ux-design, agentic-development, asset-generation, design-system, product-evolution |
| `superpowers` | brainstorm, spec, plan, tdd, review |

## Configuration

```yaml
# .docs-numbering.yaml
locale: null                    # en, ko, or null (auto-detect)
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

See [User Manual](docs/USER_MANUAL.md) for full configuration reference.

## Agent Integration

`npm install -g @hpiece/docs-numbering` runs a postinstall hook that deploys user-scope slash commands for every agent that supports them — 6 of 8 surfaces work uniformly with `/docs-install` from any project. Windsurf and Copilot's VS Code Chat have no user-scope filesystem path, so they need a one-time `docs-numbering install` per project.

### At-a-glance

| Agent | Auto-setup on global install? | `/docs-install` slash | Project-scope install |
|-------|:-:|:-:|------|
| Claude Code | ✅ `~/.claude/` | ✅ | `/docs-install` or CLI |
| OpenCode | ✅ `~/.opencode/` | ✅ | `/docs-install` or CLI |
| Codex CLI | ✅ `~/.codex/prompts/` | ✅ | `/docs-install` or CLI |
| Cursor | ✅ `~/.cursor/commands/` | ✅ | `/docs-install` or CLI |
| Gemini CLI | ✅ `~/.gemini/commands/` (TOML) | ✅ | `/docs-install` or CLI |
| Copilot CLI | ✅ `~/.copilot/skills/` | ✅ | `/docs-install` or CLI |
| Windsurf | ❌ project only | ✅ (after project install) | `docs-numbering install --agent=windsurf` |
| Copilot VS Code Chat | ❌ project only (`.github/prompts/`) | ✅ (after project install) | `docs-numbering install --agent=copilot` |

---

### Claude Code

**Install** — automatic:
```bash
npm install -g @hpiece/docs-numbering
```
Deploys `~/.claude/skills/docs-numbering` + `~/.claude/commands/docs-*.md`.

**Bootstrap a project** — inside Claude Code, type:
```
/docs-install
```
Creates `.docs-numbering.yaml` and installs project-level adapters (auto-detection).

**Use**
- Slash: `/docs-new "title"`, `/docs-migrate`, `/docs-rollback`
- Auto-trigger skill: "번호 매겨줘", "문서로 저장해줘", "organize docs" 등 자연어
- Direct CLI: `docs-numbering new ...`

---

### OpenCode

**Install** — automatic on `npm install -g`. Files: `~/.opencode/commands/docs-*.md`.

**Bootstrap** — in OpenCode chat:
```
/docs-install
```

**Use**
- Slash: `/docs-new`, `/docs-migrate`, `/docs-rollback`
- Direct CLI

---

### Gemini CLI

**Install** — automatic on `npm install -g`. Files: `~/.gemini/commands/docs-*.toml` (Gemini's TOML custom command format).

**Bootstrap** — in Gemini CLI:
```
/docs-install
```

**Use**
- Slash: `/docs-new`, `/docs-migrate`, `/docs-rollback`
- Optional per-project `GEMINI.md` merge block: `docs-numbering install --agent=gemini` in the project
- Direct CLI

---

### Codex CLI

**Install** — automatic on `npm install -g`. Files: `~/.codex/prompts/docs-*.md`.

**Bootstrap** — in Codex CLI: `/docs-install`

**Use**
- Slash: `/docs-new`, `/docs-migrate`, `/docs-rollback`
- Project install (`docs-numbering install --agent=codex`) also merges `AGENTS.md` for the natural-language path
- Direct CLI

---

### Cursor

**Install** — automatic on `npm install -g`. Files: `~/.cursor/commands/docs-*.md` (also project-level `.cursor/commands/`).

**Bootstrap** — in Cursor chat: `/docs-install`

**Use**
- Slash: `/docs-new`, `/docs-migrate`, `/docs-rollback`
- Direct CLI

---

### Windsurf

**No user-scope slash path.** Install per project:
```bash
cd my-project
docs-numbering install --agent=windsurf
```
Files: `.windsurf/workflows/docs-*.md` (Windsurf walks up to git root).

**Use**
- Slash: `/docs-new`, `/docs-migrate`, `/docs-rollback`
- Direct CLI

---

### GitHub Copilot

Two surfaces with different mechanisms:

**Copilot CLI** — automatic on `npm install -g`. Files: `~/.copilot/skills/docs-*/SKILL.md`. Slash commands work in any project.

**Copilot VS Code Chat** — per project only:
```bash
cd my-project
docs-numbering install --agent=copilot
```
Installs `.github/copilot-instructions.md` (merge), `.github/prompts/docs-*.prompt.md` (slash commands for VS Code Chat), and `.github/skills/docs-*/SKILL.md` (project-level skills for Copilot CLI).

**Use**
- Slash (Copilot CLI anywhere, VS Code Chat after project install): `/docs-install`, `/docs-new`, `/docs-migrate`, `/docs-rollback`
- Natural language fallback (any Copilot): "docs-numbering install 실행해줘" 등
- Direct CLI

---

### Install command reference

```bash
# Auto-detect agents in the current project
docs-numbering install

# Target a specific agent
docs-numbering install --agent=<claude-code|opencode|codex|cursor|windsurf|gemini|copilot>
docs-numbering install --all              # every supported adapter

# User scope (home directory)
docs-numbering install --user --all       # same as postinstall hook

# Preview / control
docs-numbering install --dry-run
docs-numbering install --force            # overwrite existing
docs-numbering install --no-init          # skip auto-creating .docs-numbering.yaml

# Remove
docs-numbering uninstall --agent=<name>
docs-numbering uninstall --all
docs-numbering uninstall --user --all
```

**Install modes** — `--mode=link` (symlink, updates flow through), `--mode=copy` (standalone), `--mode=merge` (block insertion without clobbering existing content). Defaults differ per agent; see the [User Manual](docs/USER_MANUAL.md#install--auto-install-adapters).

## Documentation

- [User Manual (English)](docs/USER_MANUAL.md)
- [User Manual (Korean)](docs/USER_MANUAL_KO.md)
- [Release Notes](RELEASE.md)

## Requirements

- Node.js 20+

## License

[MIT](LICENSE)
