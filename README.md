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

`npm install -g @hpiece/docs-numbering` runs a postinstall hook that deploys user-scope slash commands for every agent that supports them. The two agents that don't (Codex/Cursor/Windsurf, GitHub Copilot) are project-scope only and driven by natural language.

### At-a-glance

| Agent | Auto-setup on global install? | Activation | Usage |
|-------|:-:|-----------|-------|
| Claude Code | ✅ `~/.claude/` | `/docs-install` | Slash commands + auto-trigger skill + natural language |
| OpenCode | ✅ `~/.opencode/` | `/docs-install` | Slash commands |
| Gemini CLI | ✅ `~/.gemini/commands/` | `/docs-install` | Slash commands (TOML) |
| Codex / Cursor / Windsurf | ❌ per-project only | `docs-numbering install --agent=codex` | Natural language |
| GitHub Copilot | ❌ per-project only | `docs-numbering install --agent=copilot` | Natural language |

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

### Codex / Cursor / Windsurf (AGENTS.md)

**Install** — per project only (no user-scope slash concept):
```bash
cd my-project
docs-numbering install --agent=codex
```
Merges a `<!-- docs-numbering:start -->…<!-- docs-numbering:end -->` block into `AGENTS.md` at the project root. Pre-existing `AGENTS.md` content is preserved.

**Use** — natural language only:
- "create a doc", "organize docs", "번호 매겨줘"
- Or ask the agent: "docs-numbering install 실행해줘" / "docs-numbering new ..."
- Direct CLI

---

### GitHub Copilot

**Install** — per project only:
```bash
cd my-project
docs-numbering install --agent=copilot
```
Merges a block into `.github/copilot-instructions.md`.

**Use** — natural language only (same as Codex). Direct CLI available.

---

### Install command reference

```bash
# Auto-detect agents in the current project
docs-numbering install

# Target a specific agent
docs-numbering install --agent=<claude-code|opencode|codex|gemini|copilot>
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
