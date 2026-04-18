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

Adapters are installed with the built-in `install` command — no manual `ln -s`/`cp` steps needed.

```bash
cd my-project

# Auto-detect agents and install adapters.
# Creates .docs-numbering.yaml automatically if missing — no separate `init` needed.
docs-numbering install

# Or target a specific agent
docs-numbering install --agent=claude-code
docs-numbering install --agent=codex --force
docs-numbering install --all              # install every supported adapter
docs-numbering install --dry-run          # preview without writing
docs-numbering install --no-init          # don't auto-create config

# Remove
docs-numbering uninstall --agent=claude-code
docs-numbering uninstall --all
```

### One-time user-scope install (recommended for Claude Code users)

Install the Claude Code adapter **once** into your home directory, then bootstrap any project from inside the chat with `/docs-install`:

```bash
docs-numbering install --user --agent=claude-code
```

This places the skill and slash commands under `~/.claude/`, making them available in every project. After that, open Claude Code in any project and type:

```
/docs-install
```

It runs `docs-numbering install` in the current project — creating `.docs-numbering.yaml` and deploying project-level adapters — without leaving the chat. Also available: `/docs-new`, `/docs-migrate`, `/docs-rollback`.

### Supported agents

| Agent | Detection | Install target | Default mode |
|-------|-----------|----------------|--------------|
| Claude Code | `.claude/` | `.claude/skills/docs-numbering`, `.claude/commands/*.md` | symlink |
| OpenCode | `.opencode/` | `.opencode/commands/*.md` | copy |
| Codex / Cursor / Windsurf | `.cursor/`, `.codex/`, `.windsurf/`, `AGENTS.md` | `AGENTS.md` | merge |
| Gemini CLI | `.gemini/`, `GEMINI.md` | `GEMINI.md` | merge |
| GitHub Copilot | `.github/` | `.github/copilot-instructions.md` | merge |

**Modes** — `--mode=link` (symlink, updates flow through), `--mode=copy` (standalone snapshot), `--mode=merge` (insert or refresh a `<!-- docs-numbering:start -->…<!-- docs-numbering:end -->` block without clobbering existing content).

After install, slash commands (`/docs-new`, `/docs-migrate`, `/docs-rollback`) or natural-language triggers ("create doc", "번호 매겨줘") become available in the corresponding agent.

## Documentation

- [User Manual (English)](docs/USER_MANUAL.md)
- [User Manual (Korean)](docs/USER_MANUAL_KO.md)
- [Release Notes](RELEASE.md)

## Requirements

- Node.js 20+

## License

[MIT](LICENSE)
