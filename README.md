# docs-numbering

[한국어](README_KO.md)

A CLI tool for managing numbered markdown documentation with methodology-aware naming conventions. The core CLI is agent-agnostic. Ships with adapters for **Claude Code**, **OpenCode**, **Gemini CLI**, and **Copilot CLI**.

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

### 1. Install the CLI

The npm package is not yet published. Install via `npm link` from the cloned repo:

```bash
git clone https://github.com/hpiece-cs/docs-numbering.git
cd docs-numbering/core
npm install
npm link
```

The `npm link` postinstall hook auto-deploys user-scope slash commands for all supported CLIs (Claude Code / OpenCode / Gemini / Copilot CLI).

### 2. Put the CLI on PATH (if needed)

```bash
# zsh
echo 'export PATH="$HOME/.npm-packages/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
# bash
echo 'export PATH="$HOME/.npm-packages/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

Verify: `docs-numbering --version`. The CLI is also installed under the shorter alias `docnum`.

### 3. Use it in a project

```bash
cd my-project

# Bootstrap: auto-create .docs-numbering.yaml and install agent adapters.
# In a TTY, an interactive picker lets you choose which CLIs to install.
docs-numbering install

# Or run from any supported AI agent chat — no terminal needed:
#   /docs-install

# Create a numbered document
docs-numbering new "User Authentication" --method=bmad --phase=prd
# → docs/001-bmad-prd-user-authentication.md

# Bulk-rename existing docs
docs-numbering migrate --order=mtime         # preview
docs-numbering migrate --order=mtime --apply # execute

# Undo the last operation
docs-numbering rollback --last --apply
```

### 4. Uninstall (optional)

```bash
cd docs-numbering/core
npm run unlink-all
```

Removes all user-scope slash commands **and** the CLI symlink. `npm unlink -g` alone is not enough — see the [User Manual](docs/USER_MANUAL.md#installation) for details.

## Features

- **Sequential numbering** with configurable patterns
- **Methodology presets** — BMAD, GSD, WDS, Superpowers (mix and match); documents produced during methodology workflows are numbered automatically
- **Auto-localized filenames** — methodology-generated documents are automatically named in your language, not English; optional Korean romanization
- **Original filename preservation** — `{filename}` variable keeps names untouched during migration
- **History & rollback** — every operation journaled, fully reversible without Git
- **i18n** — CLI messages in English and Korean (auto-detected from OS locale)
- **Multi-agent support** — 4 adapters: Claude Code, OpenCode, Gemini CLI, Copilot CLI

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

Running `npm link` (or, once published, `npm install -g @hpiece/docs-numbering`) triggers a postinstall hook that deploys user-scope slash commands to all 4 supported CLIs. After that, `/docs-install` from any project bootstraps `.docs-numbering.yaml` without leaving the chat.

### At-a-glance

| Agent | User-scope path | Auto-setup on global install | Slash commands |
|-------|-----------------|:-:|----|
| Claude Code | `~/.claude/skills/` + `~/.claude/commands/` | ✅ | `/docs-install`, `/docs-new`, `/docs-migrate`, `/docs-rollback` |
| OpenCode | `~/.opencode/commands/` | ✅ | 동일 |
| Gemini CLI | `~/.gemini/commands/*.toml` | ✅ | 동일 |
| Copilot CLI | `~/.copilot/skills/docs-*/SKILL.md` | ✅ | 동일 |

---

### Claude Code

**Install** — automatic on `npm link` / global install:
```bash
cd docs-numbering/core && npm link
```
Deploys `~/.claude/skills/docs-numbering` + `~/.claude/commands/docs-*.md` (symlinks — updates to the repo propagate automatically).

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

**Install** — automatic on `npm link` / global install. Files: `~/.opencode/commands/docs-*.md` (copy mode).

**Bootstrap** — in OpenCode chat: `/docs-install`

**Use**
- Slash: `/docs-new`, `/docs-migrate`, `/docs-rollback`
- Direct CLI

---

### Gemini CLI

**Install** — automatic on `npm link` / global install. Files: `~/.gemini/commands/docs-*.toml` (Gemini's TOML custom command format).

**Bootstrap** — in Gemini CLI: `/docs-install`

**Use**
- Slash: `/docs-new`, `/docs-migrate`, `/docs-rollback`
- Optional per-project `GEMINI.md` merge block: `docs-numbering install --agent=gemini` in the project
- Direct CLI

---

### Copilot CLI

**Install** — automatic on `npm link` / global install. Files: `~/.copilot/skills/docs-*/SKILL.md`. Each skill folder has a `SKILL.md` whose YAML frontmatter drives the slash command.

**Bootstrap** — `/docs-install` inside Copilot CLI.

**Use**
- Slash: `/docs-install`, `/docs-new`, `/docs-migrate`, `/docs-rollback`
- Direct CLI

---

### Install command reference

```bash
# Interactive picker (TTY) — pick which CLIs to install
docs-numbering install

# Pick a subset non-interactively (comma-separated)
docs-numbering install --agent=claude-code,gemini

# Single agent
docs-numbering install --agent=claude-code

# Every supported adapter
docs-numbering install --all

# Disable the interactive picker (fall back to auto-detection)
docs-numbering install --no-interactive

# User scope (home directory) — same as the postinstall hook
docs-numbering install --user --all

# Preview / control
docs-numbering install --dry-run
docs-numbering install --force            # overwrite existing
docs-numbering install --no-init          # skip auto-creating .docs-numbering.yaml

# Remove
docs-numbering uninstall --agent=<name>
docs-numbering uninstall --agent=a,b,c    # comma-separated
docs-numbering uninstall --all
docs-numbering uninstall --user --all
```

Supported agent names: `claude-code`, `opencode`, `gemini`, `copilot`.

**Interactive picker** — When you run `docs-numbering install` with no `--agent` / `--all` in a TTY, a numbered list of all supported CLIs is printed with detected ones marked `*`. Enter comma-separated numbers or names, `a` for all, `q` to cancel, or press Enter to accept the detected set. Piped/CI environments skip the picker and fall back to auto-detection.

**Install modes** — `--mode=link` (symlink, updates flow through), `--mode=copy` (standalone), `--mode=merge` (block insertion without clobbering existing content). Defaults differ per agent; see the [User Manual](docs/USER_MANUAL.md#install--auto-install-adapters).

## Documentation

- [User Manual (English)](docs/USER_MANUAL.md)
- [User Manual (Korean)](docs/USER_MANUAL_KO.md)
- [Release Notes (English)](RELEASE.md)
- [릴리스 노트 (Korean)](RELEASE_KO.md)

## Requirements

- Node.js 20+

## License

[MIT](LICENSE)
