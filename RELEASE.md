# Release Notes

## v0.1.0 (2026-04-16)

Initial release.

### Features

- **Numbered document management** — Sequential numbering with configurable patterns (`{num:03d}-{method}-{phase}-{slug}.md`)
- **Methodology presets** — Built-in support for BMAD, GSD, WDS, and Superpowers with phase validation
- **Korean filename support** — Preserve Korean characters as-is or romanize to ASCII
- **Original filename preservation** — `{filename}` variable keeps existing filenames untouched during migration
- **History & rollback** — All operations journaled in `.docs-numbering/history/` with full undo support
- **Migration** — Bulk rename existing `.md` files to numbered convention with dry-run safety
- **Internationalization (i18n)** — CLI messages in English and Korean, auto-detected from OS locale
- **Multi-agent support** — Adapters for Claude Code, Codex, OpenCode, Gemini CLI, and GitHub Copilot
  - Claude Code & OpenCode: slash commands (`/docs-new`, `/docs-migrate`, `/docs-rollback`)
  - Codex / Cursor / Windsurf: AGENTS.md (natural language trigger)
  - Gemini CLI: GEMINI.md (natural language trigger)
  - GitHub Copilot: copilot-instructions.md (natural language trigger)

### Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize project configuration |
| `new <title>` | Create a new numbered document |
| `list` | Query documents with filters |
| `phases` | Show valid phases from enabled presets |
| `migrate` | Bulk rename existing files to numbered convention |
| `validate` | Check for duplicate numbers and unknown phases |
| `history` | View operation log |
| `rollback` | Undo previous operations |

### Configuration

- Project config: `.docs-numbering.yaml`
- Global config: `~/.docs-numbering/config.yaml`
- Naming pattern variables: `{num}`, `{method}`, `{phase}`, `{slug}`, `{filename}`, `{date}`
- Locale: auto-detect from `LANG` / `LC_ALL`, override with `--locale` or `DOCS_NUMBERING_LANG`

### Requirements

- Node.js 20+

### Known Limitations

- `numbering.strategy` only supports `sequential`
- `rollback --range` not yet implemented (use `--last` or `--to`)
- `migrate` only processes files inside `docs_dir` (no cross-directory import)
- npm package not yet published (`npm link` required for local use)
