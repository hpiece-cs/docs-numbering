# docs-numbering

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
# Install
cd core && npm install && npm link

# Ensure CLI is in PATH (if not already)
echo 'export PATH="$HOME/.npm-packages/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc

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
- **Methodology presets** — BMAD, GSD, WDS, Superpowers (mix and match)
- **Korean filename support** — preserve or romanize
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

### Prerequisites (all agents)

1. `docs-numbering` CLI must be installed and in PATH (see [Quick Start](#quick-start))
2. Run `docs-numbering init` in your project to create `.docs-numbering.yaml`
3. Copy or symlink the adapter files for your agent (see below)

> **Symlink vs copy**: Use symlinks (`ln -s`) to auto-reflect source updates. Use `cp` for standalone projects that don't track the docs-numbering repo.

### Claude Code

```bash
mkdir -p <project>/.claude/skills <project>/.claude/commands
ln -s <docs-numbering>/adapters/claude-code/skills/docs-numbering <project>/.claude/skills/docs-numbering
ln -s <docs-numbering>/adapters/claude-code/commands/*.md <project>/.claude/commands/
```
Slash commands: `/docs-new`, `/docs-migrate`, `/docs-rollback`

### Codex / Cursor / Windsurf (AGENTS.md)

```bash
cp <docs-numbering>/adapters/agents-md/AGENTS.md <project>/AGENTS.md
```
Triggers on natural language: "create doc", "organize docs", "번호 매겨줘"

### Gemini CLI

```bash
cp <docs-numbering>/adapters/gemini/GEMINI.md <project>/GEMINI.md
```

### OpenCode

```bash
mkdir -p <project>/.opencode/commands
cp <docs-numbering>/adapters/opencode/commands/*.md <project>/.opencode/commands/
```
Slash commands: `/docs-new`, `/docs-migrate`, `/docs-rollback`

### GitHub Copilot

```bash
mkdir -p <project>/.github
cp <docs-numbering>/adapters/copilot/.github/copilot-instructions.md <project>/.github/
```

## Documentation

- [User Manual (English)](docs/USER_MANUAL.md)
- [User Manual (Korean)](docs/USER_MANUAL_KO.md)
- [Release Notes](RELEASE.md)

## Requirements

- Node.js 20+

## License

[MIT](LICENSE)
