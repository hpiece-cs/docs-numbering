# docs-numbering User Manual

A CLI tool for managing numbered markdown documentation with methodology-aware naming conventions.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
  - [init](#init--initialize-configuration)
  - [new](#new-title--create-numbered-document)
  - [list](#list--query-documents)
  - [phases](#phases--show-valid-phases)
  - [migrate](#migrate--bulk-rename-existing-files)
  - [validate](#validate--check-consistency)
  - [history](#history--view-operation-log)
  - [rollback](#rollback--undo-operations)
  - [install](#install--auto-install-adapters)
  - [uninstall](#uninstall--remove-adapters)
- [Global Options](#global-options)
- [Configuration](#configuration)
  - [Config Resolution Order](#config-resolution-order)
  - [Configuration Reference](#configuration-reference) — `locale`, `docs_dir`, `naming_pattern`, `numbering.*`, `slug.*`, `migration.*`, `history.*`
  - [Full Example](#full-example)
- [Naming Pattern](#naming-pattern)
- [Presets](#presets) — BMAD, GSD, WDS, Superpowers
- [Korean Title Support](#korean-title-support)
- [Internationalization](#internationalization)
- [Agent Integration](#agent-integration) — Claude Code, Codex, OpenCode, Gemini CLI, Copilot
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

---

## Installation

The npm package is not yet published. Install from the cloned repository with `npm link`:

```bash
git clone https://github.com/hpiece-cs/docs-numbering.git
cd docs-numbering/core
npm install
npm link
```

The `npm link` postinstall hook runs `docs-numbering install --user --all --no-init` automatically, so user-scope slash commands (`/docs-install`, `/docs-new`, `/docs-migrate`, `/docs-rollback`) are deployed to all 4 supported CLIs (Claude Code, OpenCode, Gemini CLI, Copilot CLI).

**Verify the install:**
```bash
docs-numbering --version
docnum --version          # shorter alias (same binary)
```

If the command is not found, your npm global bin directory is not on PATH. Add it:

```bash
# zsh
echo 'export PATH="$HOME/.npm-packages/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
# bash
echo 'export PATH="$HOME/.npm-packages/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```

(Your exact path may differ — run `npm prefix -g` to check. Append `/bin` to that path.)

**Uninstall:**

> ⚠️ `npm unlink -g` alone does **not** remove the user-scope slash commands — npm skips lifecycle hooks (including `preuninstall`) when unlinking globally-linked packages. Use one of the methods below to avoid orphaned `/docs-*` commands in your AI CLIs.

**Recommended — one-shot clean uninstall:**
```bash
cd docs-numbering/core
npm run unlink-all
```
Runs `docs-numbering uninstall --user --all` first, then `npm unlink -g`. Removes adapters from `~/.claude/`, `~/.opencode/`, `~/.gemini/`, `~/.copilot/` and the CLI symlink.

**Two-step alternative** (equivalent):
```bash
docs-numbering uninstall --user --all           # remove slash commands / skills
cd docs-numbering/core && npm unlink -g @hpiece/docs-numbering   # remove CLI symlink
```

**Adapters only (keep CLI):**
```bash
npm run uninstall-all      # from core/
# or equivalently:
docs-numbering uninstall --user --all
```

**Recovering from a broken state** — if you already ran `npm unlink -g` first and the slash commands are orphaned, re-link and clean up properly:
```bash
cd docs-numbering/core
npm link                   # re-install the CLI
npm run unlink-all         # then full uninstall
```

## Quick Start

```bash
# Initialize in your project
cd my-project
docs-numbering init

# Create a document
docs-numbering new "User Authentication" --method=bmad --phase=prd

# List documents
docs-numbering list

# Migrate existing .md files to numbered convention
docs-numbering migrate --order=mtime         # dry-run
docs-numbering migrate --order=mtime --apply # apply
```

---

## Commands

### `init` — Initialize Configuration

```bash
docs-numbering init [--global] [--force]
```

| Flag | Description |
|------|-------------|
| `--global` | Create at `~/.docs-numbering/config.yaml` instead of project-level |
| `--force` | Overwrite existing config |

### `new <title>` — Create Numbered Document

```bash
docs-numbering new "Title" [--method=<m>] [--phase=<p>] [--stdin] [--dry-run] [--date=<d>] [--content=<c>]
```

| Flag | Description |
|------|-------------|
| `--method <m>` | Methodology: bmad, gsd, wds, superpowers |
| `--phase <p>` | Phase within methodology |
| `--content <c>` | Document body |
| `--stdin` | Read body from stdin |
| `--dry-run` | Preview filename without creating |
| `--date <d>` | Override date (YYYY-MM-DD) |

Example:
```bash
docs-numbering new "API Design" --method=gsd --phase=plan-phase --stdin <<'EOF'
# API Design Document
...
EOF
```

Output: `docs/001-gsd-plan-phase-api-design.md`

### `list` — Query Documents

```bash
docs-numbering list [--method=<m>] [--phase=<p>] [--range=<r>]
```

| Flag | Description |
|------|-------------|
| `--method <m>` | Filter by method |
| `--phase <p>` | Filter by phase |
| `--range <r>` | Filter by number range (e.g., `1-10`) |

### `phases` — Show Valid Phases

```bash
docs-numbering phases [--method=<m>]
```

Shows all phases from enabled presets. Use `--method` to filter.

### `migrate` — Bulk Rename Existing Files

```bash
docs-numbering migrate [--order=<mtime|alpha>] [--apply] [--no-backup]
```

Always runs as **dry-run** by default. Review the plan, then add `--apply`.

| Flag | Description |
|------|-------------|
| `--order <o>` | Sort by `mtime` (default) or `alpha` |
| `--apply` | Execute the migration |
| `--no-backup` | Skip backup creation |

### `validate` — Check Consistency

```bash
docs-numbering validate
```

Checks for duplicate numbers and unknown phases. Exit code 3 if issues found.

### `history` — View Operation Log

```bash
docs-numbering history [--limit=<n>]
```

### `rollback` — Undo Operations

```bash
docs-numbering rollback [--last] [--to=<id>] [--apply] [--force]
```

| Flag | Description |
|------|-------------|
| `--last` | Undo most recent operation |
| `--to <id>` | Undo all operations up to this entry |
| `--apply` | Execute (dry-run by default) |
| `--force` | Ignore checksum mismatches |

Workflow:
```bash
docs-numbering history --limit=5       # see what happened
docs-numbering rollback --last         # preview
docs-numbering rollback --last --apply # execute
```

### `install` — Auto-Install Adapters

```bash
docs-numbering install [--agent=<names>] [--all] [--mode=<link|copy|merge>] [--force] [--user] [--no-init] [--no-interactive] [--dry-run]
```

Installs adapter files (slash commands, skills, instructions) for AI agents into the current project. Replaces manual `ln -s` / `cp` steps.

**Auto-init:** If `.docs-numbering.yaml` does not exist in the project, `install` creates it automatically — you no longer need a separate `docs-numbering init` step. Use `--no-init` to opt out. `--dry-run` and `--user` scope also skip auto-init.

**User scope (`--user`):** Installs into `$HOME` instead of the current project (e.g., `~/.claude/commands/`, `~/.claude/skills/docs-numbering`). Intended as a one-time setup so slash commands like `/docs-install` are available in any project without per-project installation. Detection also runs against `$HOME`.

| Flag | Description |
|------|-------------|
| `--agent <names>` | Comma-separated list of agents: `claude-code`, `opencode`, `gemini`, `copilot`. Single or multiple. |
| `--all` | Install adapters for every supported agent |
| `--mode <mode>` | Install method (agent-specific default): `link` (symlink), `copy`, `merge` (block insertion) |
| `--force` | Overwrite existing files |
| `--user` | Install into `$HOME` instead of the current project |
| `--no-init` | Skip auto-creating `.docs-numbering.yaml` when missing |
| `--no-interactive` | Disable the interactive picker; fall back to auto-detection |
| `--dry-run` | Show the plan without writing anything (implies `--no-init`) |

**Selection precedence:** `--agent` > `--all` > interactive picker (TTY only) > auto-detection.

**Interactive picker (TTY):** If you run `docs-numbering install` with no `--agent` / `--all` in an interactive terminal, a numbered list of all supported CLIs is shown with detected ones flagged `*`. Input options:

```
Select CLIs to install (detected marked with *):
  [ 1] * claude-code  Claude Code    (detected)
  [ 2]   opencode     OpenCode
  [ 3] * gemini       Gemini CLI     (detected)
  [ 4]   copilot      Copilot CLI

numbers/names comma-separated, (a)ll, Enter=detected, (q)uit:
```

- `1,3` or `claude-code,gemini` — pick specific CLIs
- `a` / `all` — every adapter
- *(empty)* or `d` — accept the detected set
- `q` — cancel (no install)

In non-TTY contexts (piped stdin, CI, `--json`), the picker is skipped and auto-detection runs instead.

**Supported agents and behavior:**

| Agent | Detection hints | Install target(s) | Default mode |
|-------|-----------------|-------------------|--------------|
| Claude Code | `.claude/` | `.claude/skills/docs-numbering/`, `.claude/commands/docs-*.md` | `link` |
| OpenCode | `.opencode/` | `.opencode/commands/docs-*.md` | `copy` |
| Gemini CLI | `.gemini/`, `GEMINI.md` | Project: `GEMINI.md` merge block · User: `~/.gemini/commands/docs-*.toml` | `merge` (project) / `copy` (user) |
| Copilot CLI | `.copilot/` | `.copilot/skills/docs-*/SKILL.md` | `copy` |

**Install modes:**

- **`link`** — Creates symlinks pointing at the repository's adapter files. Pulling the repo auto-propagates updates. Breaks if the repo is moved.
- **`copy`** — Plain file copy. Self-contained, but updates must be reinstalled manually.
- **`merge`** — Used for root-level files (`GEMINI.md`). Inserts a `<!-- docs-numbering:start -->` … `<!-- docs-numbering:end -->` block without clobbering any pre-existing content. Reinstalling refreshes the same block — no duplication.

**Examples:**

```bash
cd my-project

# Interactive picker (TTY) — pick which CLIs to install
docs-numbering install

# Install a subset non-interactively (comma-separated)
docs-numbering install --agent=claude-code,gemini

# Single agent
docs-numbering install --agent=claude-code

# Every supported adapter
docs-numbering install --all

# Overwrite existing files
docs-numbering install --agent=claude-code --force

# Copy instead of symlink (for standalone distribution)
docs-numbering install --agent=claude-code --mode=copy

# Preview without writing (auto JSON output for scripts)
docs-numbering install --dry-run --json

# Skip the picker in a TTY (use auto-detection)
docs-numbering install --no-interactive

# One-time user-scope install — enables /docs-install in every project
docs-numbering install --user --all
docs-numbering install --user --agent=claude-code,gemini
```

### Bootstrapping from inside Claude Code

Once you've run `docs-numbering install --user --agent=claude-code` once, a `/docs-install` slash command is available in every project you open. Running it executes `docs-numbering install` in the current project directory via Claude's shell tool — so you can initialize a brand-new project without leaving the chat. Subsequently `/docs-new`, `/docs-migrate`, `/docs-rollback` (project-level) and the auto-trigger skill are also available.

**Custom adapter source:** Override the adapters directory with `DOCS_NUMBERING_ADAPTERS_DIR`. Useful when the repository is relocated or forked.

```bash
DOCS_NUMBERING_ADAPTERS_DIR=/my/fork/adapters docs-numbering install --agent=claude-code
```

### `uninstall` — Remove Adapters

```bash
docs-numbering uninstall [--agent=<names>] [--all] [--user] [--dry-run]
```

Removes adapter files previously installed with `install`.

| Flag | Description |
|------|-------------|
| `--agent <names>` | Comma-separated list of agents to uninstall |
| `--all` | Uninstall every installed adapter |
| `--user` | Remove from `$HOME` instead of the current project |
| `--dry-run` | Show the plan without deleting |

For `merge`-mode adapters, only the `docs-numbering:start`/`end` block is removed — **any other content in the file is preserved**. If the file contained nothing but the block, the file itself is removed.

```bash
# Remove a single agent
docs-numbering uninstall --agent=claude-code

# Remove multiple at once
docs-numbering uninstall --agent=opencode,gemini

# Remove all
docs-numbering uninstall --all

# Clean up user-scope install
docs-numbering uninstall --user --all
```

---

## Global Options

Available on every command:

| Flag | Description |
|------|-------------|
| `--config <path>` | Override config file path |
| `--docs-dir <path>` | Override docs directory |
| `--json` | JSON output |
| `--locale <locale>` | Override locale (en, ko) |
| `--version`, `-V` | Show version |

---

## Configuration

Config file: `.docs-numbering.yaml` (project root)

### Config Resolution Order

Settings are merged in the following order (later overrides earlier):

1. **Built-in defaults** (lowest priority)
2. **Global config**: `~/.docs-numbering/config.yaml` (created by `docs-numbering init --global`)
3. **Project config**: `.docs-numbering.yaml` in the project root
4. **CLI flags** such as `--docs-dir`, `--locale` (highest priority)

---

### Configuration Reference

#### `locale`

Language for CLI output messages. When `null`, the locale is auto-detected from the OS environment.

| Value | Description |
|-------|-------------|
| `null` | Auto-detect from OS (default) |
| `"en"` | English |
| `"ko"` | Korean |

Auto-detection order: `DOCS_NUMBERING_LANG` env > `LC_ALL` > `LC_MESSAGES` > `LANG` > `en` fallback.

```yaml
locale: null    # auto-detect from OS
locale: "ko"    # always Korean
locale: "en"    # always English
```

---

#### `docs_dir`

Directory where numbered documents are stored. Can be relative (to project root), absolute, or use `~/` for home directory.

```yaml
docs_dir: "docs/"                    # relative to project root (default)
docs_dir: "documentation/specs/"     # nested relative path
docs_dir: "/absolute/path/to/docs/"  # absolute path
docs_dir: "~/shared-docs/"           # home directory expansion
docs_dir: "./"                       # project root itself
```

The directory is created automatically if it does not exist.

---

#### `naming_pattern`

Template string that determines the generated filename. Uses `{variable}` or `{variable:format}` syntax.

**Available variables:**

| Variable | Format | Description | Example output |
|----------|--------|-------------|----------------|
| `{num}` | none | Unpadded number | `1`, `12`, `100` |
| `{num:03d}` | zero-pad 3 | 3-digit padded number | `001`, `012`, `100` |
| `{num:04d}` | zero-pad 4 | 4-digit padded number | `0001`, `0012` |
| `{num:05d}` | zero-pad 5 | 5-digit padded number | `00001` |
| `{method}` | none | Methodology name | `bmad`, `gsd` |
| `{phase}` | none | Phase name | `prd`, `plan-phase` |
| `{slug}` | none | Slugified title | `user-auth`, `api-design` |
| `{filename}` | none | Original filename (preserved as-is) | `README`, `My-Design-Doc` |
| `{date}` | none | Date (YYYY-MM-DD) | `2026-04-15` |

> **`{slug}` vs `{filename}`**: `{slug}` transforms the title (lowercase, spaces→dashes, truncation). `{filename}` preserves the original filename exactly as-is, including case, spaces, and dashes. Use `{slug}` for `new`, `{filename}` for `migrate` when you want to keep existing filenames untouched.

**Rendering rules:**
- Empty or omitted variables are removed along with their preceding `-`
- Consecutive dashes are collapsed to a single `-` (dashes inside `{filename}` are protected)
- Leading dashes are removed

```yaml
# Default: full metadata
naming_pattern: "{num:03d}-{method}-{phase}-{slug}.md"
# → 001-bmad-prd-user-authentication.md

# Number + slug only
naming_pattern: "{num:03d}-{slug}.md"
# → 001-user-authentication.md

# Preserve original filename (number only)
naming_pattern: "{num:03d}-{filename}.md"
# migrate: README.md → 001-README.md
# migrate: My-Design-Doc.md → 002-My-Design-Doc.md
# migrate: 설계서.md → 003-설계서.md

# Preserve original filename with method
naming_pattern: "{num:03d}-{method}-{filename}.md"
# migrate: README.md → 001-bmad-README.md

# Date prefix
naming_pattern: "{date}-{num:03d}-{slug}.md"
# → 2026-04-15-001-user-authentication.md

# Number only (minimal)
naming_pattern: "{num:04d}.md"
# → 0001.md

# Custom separators
naming_pattern: "[{num:03d}] {method} - {slug}.md"
# → [001] bmad - user-authentication.md
```

---

#### `numbering.strategy`

The algorithm used to assign numbers to new documents. Currently only `sequential` is supported.

```yaml
numbering:
  strategy: sequential   # assign next available number (default, only option)
```

---

#### `numbering.start`

The first number to assign when the docs directory is empty.

```yaml
numbering:
  start: 1       # first doc gets 001 (default)
  start: 0       # first doc gets 000
  start: 100     # first doc gets 100
```

---

#### `numbering.padding`

Number of digits for zero-padding. This affects the `{num:0Xd}` format specifier in `naming_pattern`.

```yaml
numbering:
  padding: 3    # 001, 002, ... 999 (default)
  padding: 2    # 01, 02, ... 99
  padding: 4    # 0001, 0002, ... 9999
```

> Note: The padding in `naming_pattern` (e.g., `{num:03d}`) takes precedence over this value.

---

#### `numbering.presets`

List of methodology presets to enable. Each preset defines a set of valid phase names. Multiple presets can be combined.

| Preset | Phases |
|--------|--------|
| `bmad` | brief, prd, architecture, ux-design, epics, stories, dev, review, retrospective |
| `gsd` | new-project, discuss-phase, plan-phase, execute-phase, verify-work, ship |
| `wds` | project-setup, project-brief, trigger-mapping, scenarios, ux-design, agentic-development, asset-generation, design-system, product-evolution |
| `superpowers` | brainstorm, spec, plan, tdd, review |

```yaml
numbering:
  presets: [bmad]                        # single preset (default)
  presets: [bmad, gsd]                   # two presets
  presets: [bmad, gsd, wds, superpowers] # all presets
  presets: []                            # no presets (phase validation disabled)
```

---

#### `numbering.phase_validation`

How strictly to validate the `--phase` value against enabled presets.

| Value | Behavior |
|-------|----------|
| `"warn"` | Print a warning to stderr but allow the phase (default) |
| `"strict"` | Throw an error and reject unknown phases |
| `"off"` | No validation at all |

```yaml
numbering:
  phase_validation: warn     # warning only (default)
  phase_validation: strict   # reject unknown phases with error
  phase_validation: "off"    # no validation
```

Example with `strict` and unknown phase:
```
$ docs-numbering new "Test" --method=bmad --phase=bogus
error: unknown phase: bogus        # (en)
오류: 알 수 없는 단계입니다: bogus   # (ko)
```

---

#### `numbering.default_method`

Default methodology name used when `--method` is not specified on the command line.

```yaml
numbering:
  default_method: null      # no default — method is empty if omitted (default)
  default_method: bmad      # use "bmad" when --method not given
  default_method: gsd       # use "gsd" when --method not given
```

Example:
```bash
# With default_method: bmad
docs-numbering new "Design Doc" --phase=prd
# → 001-bmad-prd-design-doc.md   (method auto-filled)

# Without default_method (null)
docs-numbering new "Design Doc" --phase=prd
# → 001-prd-design-doc.md        (no method in filename)
```

---

#### `slug.language`

How to handle non-Latin characters (Korean, Chinese, etc.) in document titles when generating the filename slug.

| Value | Behavior | Example input | Example output |
|-------|----------|---------------|----------------|
| `"preserve"` | Keep non-Latin characters as-is (default) | `사용자 인증` | `사용자-인증` |
| `"romanize"` | Convert Korean to Revised Romanization ASCII | `사용자 인증` | `sayongja-injeung` |

```yaml
slug:
  language: preserve    # keep Korean/CJK in filenames (default)
  language: romanize    # convert to ASCII romanization
```

> Note: `romanize` uses the Revised Romanization of Korean standard. Non-Korean non-Latin characters are handled by the underlying slugify library.

---

#### `slug.separator`

Character used to separate words in the slug.

```yaml
slug:
  separator: "-"     # hyphen (default): user-authentication
  separator: "_"     # underscore: user_authentication
  separator: "."     # dot: user.authentication
```

---

#### `slug.lowercase`

Whether to convert ASCII letters to lowercase. Non-Latin characters (Korean, etc.) are not affected.

```yaml
slug:
  lowercase: true     # "API Design" → "api-design" (default)
  lowercase: false    # "API Design" → "API-Design"
```

---

#### `slug.max_length`

Maximum character length of the slug. Longer slugs are truncated, and trailing separators are removed after truncation.

```yaml
slug:
  max_length: 50     # default
  max_length: 30     # shorter slugs
  max_length: 100    # longer slugs allowed
```

Example with `max_length: 20`:
```
"A Very Long Document Title About Authentication" → "a-very-long-document"
```

---

#### `migration.default_order`

Default sort order when running `docs-numbering migrate` without `--order`.

| Value | Behavior |
|-------|----------|
| `"mtime"` | Sort by file modification time, oldest first (default) |
| `"alpha"` | Sort alphabetically by filename |

```yaml
migration:
  default_order: mtime    # by modification time (default)
  default_order: alpha    # alphabetical
```

---

#### `migration.safety.dry_run_default`

Whether `migrate` runs as a dry-run by default (showing the plan without applying changes).

```yaml
migration:
  safety:
    dry_run_default: true     # must use --apply to execute (default, recommended)
    dry_run_default: false    # migrate applies immediately (use with caution)
```

---

#### `migration.safety.backup_dir`

Directory where original files are backed up before migration. Relative to the project root.

```yaml
migration:
  safety:
    backup_dir: ".docs-numbering/backup"    # default (inside hidden dir)
    backup_dir: ".backups/docs"             # custom location
```

---

#### `history.enabled`

Whether to record operation history (required for rollback).

```yaml
history:
  enabled: true     # record all operations (default)
  enabled: false    # no history — rollback will not be available
```

---

#### `history.max_entries`

Maximum number of history entries to keep. Oldest entries beyond this limit are automatically pruned.

```yaml
history:
  max_entries: 100    # keep last 100 operations (default)
  max_entries: 50     # smaller history
  max_entries: 500    # larger history
```

---

#### `history.retain_days`

Number of days to retain history entries before they are eligible for cleanup.

```yaml
history:
  retain_days: 30     # keep 30 days of history (default)
  retain_days: 7      # keep only 1 week
  retain_days: 90     # keep 3 months
  retain_days: 365    # keep 1 year
```

---

#### `history.include_backups`

Whether to store file backups alongside history entries. Backups are needed for restoring deleted files during rollback.

```yaml
history:
  include_backups: true     # store backups for rollback (default)
  include_backups: false    # no backups — rollback of deletes will not work
```

---

### Full Example

```yaml
locale: "ko"
docs_dir: "documentation/"
naming_pattern: "{date}-{num:03d}-{method}-{slug}.md"

numbering:
  strategy: sequential
  start: 1
  padding: 3
  presets: [bmad, gsd]
  phase_validation: strict
  default_method: bmad

slug:
  language: preserve
  separator: "-"
  lowercase: true
  max_length: 40

migration:
  default_order: alpha
  safety:
    dry_run_default: true
    backup_dir: ".docs-numbering/backup"

history:
  enabled: true
  max_entries: 200
  retain_days: 60
  include_backups: true
```

Result:
```bash
docs-numbering new "사용자 인증 설계" --phase=prd
# → documentation/2026-04-15-001-bmad-사용자-인증-설계.md
# CLI messages in Korean
# Unknown phases rejected with error
```

---

## Naming Pattern

Template variables:

| Variable | Example | Description |
|----------|---------|-------------|
| `{num:03d}` | `001` | Zero-padded number |
| `{method}` | `bmad` | Methodology name |
| `{phase}` | `prd` | Phase name |
| `{slug}` | `user-auth` | Title slug (transformed) |
| `{filename}` | `README` | Original filename (preserved as-is) |
| `{date}` | `2026-04-15` | Date |

Empty variables are omitted along with their preceding `-`.

**`{slug}` vs `{filename}`:**
- `{slug}`: Transforms the input (lowercase, spaces to dashes, truncation). Best for `new` command.
- `{filename}`: Preserves the original filename exactly — case, spaces, dashes all kept. Best for `migrate` when you want to keep existing names.
- When using `{filename}` with the `new` command, it falls back to the slug value.

---

## Presets

### BMAD
```
brief, prd, architecture, ux-design, epics, stories, dev, review, retrospective
```

### GSD
```
new-project, discuss-phase, plan-phase, execute-phase, verify-work, ship
```

### WDS
```
project-setup, project-brief, trigger-mapping, scenarios, ux-design,
agentic-development, asset-generation, design-system, product-evolution
```

### Superpowers
```
brainstorm, spec, plan, tdd, review
```

Enable multiple: `presets: [bmad, gsd, superpowers]`

---

## Korean Title Support

Korean titles are preserved by default:

```bash
docs-numbering new "사용자 인증 설계" --method=bmad --phase=prd
# → docs/001-bmad-prd-사용자-인증-설계.md
```

To romanize instead, set in config:
```yaml
slug:
  language: romanize
# → docs/001-bmad-prd-sayongja-injeung-seolgye.md
```

---

## Internationalization

CLI messages are displayed in your OS language automatically.

### Locale Detection Order
1. `--locale ko` (CLI flag)
2. `DOCS_NUMBERING_LANG=ko` (environment variable)
3. `locale: ko` in config file
4. `LC_ALL` / `LC_MESSAGES` / `LANG` (OS locale)
5. English fallback

### Override Examples
```bash
# Force Korean
DOCS_NUMBERING_LANG=ko docs-numbering rollback --last

# Force English
docs-numbering rollback --last --locale=en
```

---

## Agent Integration

The core CLI is agent-agnostic. Adapter installation is done entirely through the [`install` command](#install--auto-install-adapters). The sections below walk through install → bootstrap → usage for each supported agent.

### At-a-glance comparison

| Agent | Scope support | Auto-setup on `npm link` | Slash command path | Bootstrap |
|-------|---------------|:-:|--------------------|-----------|
| Claude Code | user + project | ✅ | `~/.claude/commands/` + `~/.claude/skills/` | `/docs-install` |
| OpenCode | user + project | ✅ | `~/.opencode/commands/` | `/docs-install` |
| Gemini CLI | user + project | ✅ | `~/.gemini/commands/*.toml` | `/docs-install` |
| Copilot CLI | user + project | ✅ | `~/.copilot/skills/*/SKILL.md` | `/docs-install` |

---

### Claude Code

**Install the CLI** (one time; see [Installation](#installation) for the full clone + `npm link` flow). The postinstall hook deploys:
- `~/.claude/skills/docs-numbering/SKILL.md` (auto-trigger skill)
- `~/.claude/commands/docs-install.md`, `docs-new.md`, `docs-migrate.md`, `docs-rollback.md`

**Bootstrap a project** — in Claude Code's chat window, type:
```
/docs-install
```
This runs `docs-numbering install` against the current project's cwd: creates `.docs-numbering.yaml`, detects the agent, and deploys project-scope adapters (symlinks under `.claude/`).

**Everyday usage**
- Slash commands: `/docs-new "title"`, `/docs-migrate`, `/docs-rollback`
- Auto-trigger skill — responds to natural language like "번호 매겨줘", "문서로 저장해줘", "organize docs", "save this as a BMAD PRD"
- Direct CLI inside a terminal session or agent shell tool: `docs-numbering new "..." --method=... --phase=...`

**Uninstall**
```bash
# User-scope commands (slash + skill)
docs-numbering uninstall --user --agent=claude-code

# Project-scope only
cd my-project && docs-numbering uninstall --agent=claude-code
```

---

### OpenCode

**Install the CLI** — same one-time clone + `npm link` step. Postinstall deploys `~/.opencode/commands/docs-*.md` (4 files, copy mode).

**Bootstrap a project** — in OpenCode chat:
```
/docs-install
```

**Everyday usage**
- Slash commands: `/docs-new`, `/docs-migrate`, `/docs-rollback`
- Direct CLI

**Uninstall**
```bash
docs-numbering uninstall --user --agent=opencode
```

---

### Gemini CLI

**Install the CLI** — one-time clone + `npm link`. Postinstall deploys `~/.gemini/commands/docs-*.toml` — 4 TOML files in Gemini's custom command format.

**Bootstrap a project** — in Gemini CLI:
```
/docs-install
```

**Everyday usage**
- Slash commands: `/docs-new`, `/docs-migrate`, `/docs-rollback`
- Direct CLI

**Optional: project-scope `GEMINI.md`**
For teams that want a committed `GEMINI.md` describing docs-numbering:
```bash
cd my-project
docs-numbering install --agent=gemini
```
This merges a block into `GEMINI.md` at the project root (merge mode — preserves existing content).

**Uninstall**
```bash
docs-numbering uninstall --user --agent=gemini
```

---

### Copilot CLI

**Install** — automatic via `npm link` / global install. Files: `~/.copilot/skills/docs-*/SKILL.md`. Each skill folder contains a `SKILL.md` with YAML frontmatter (`name` becomes the slash command, `description` triggers auto-loading, optional `allowed-tools: shell` pre-approves shell execution).

**Bootstrap** — `/docs-install` inside Copilot CLI (works from any project after global install).

**Use**
- Slash: `/docs-install`, `/docs-new`, `/docs-migrate`, `/docs-rollback`
- Direct CLI

**Uninstall**
```bash
docs-numbering uninstall --user --agent=copilot    # ~/.copilot/skills/
```

---

### Manual installation (reference)

If you can't use the `install` command (e.g., shipping adapters without the CLI), copy or symlink files directly from `core/adapters/<agent>/` inside the repository. For the root-level `GEMINI.md`, wrap the content in a `<!-- docs-numbering:start -->` … `<!-- docs-numbering:end -->` block to preserve any existing file content.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `config exists` | Use `--force` to overwrite |
| `unknown phase` | Run `phases --method=X` to see valid phases |
| `project is locked` | Delete `.docs-numbering/lock` manually |
| `checksum mismatch` on rollback | File was edited externally; use `--force` |
| `command not found: docs-numbering` | Add the npm global bin to PATH (`npm prefix -g` + `/bin`, commonly `~/.npm-packages/bin`) |
| `install` picker did not appear | Not a TTY (piped stdin, CI, `--json`), or `--agent` / `--all` / `--no-interactive` was passed. In a TTY without flags, the picker runs automatically. |
| `unknown adapter: <name>` in `install` | Valid names are `claude-code`, `opencode`, `gemini`, `copilot`. Comma-separated lists are supported (no spaces around commas). |
| `npm error 404` for `@hpiece/docs-numbering` | Package is not yet published. Install via `git clone` + `npm link` (see [Installation](#installation)). |
| Stale user-scope symlinks after moving the repo | **Fixed automatically** — link-mode adapters (Claude Code) are auto-relinked on reinstall. Re-run `docs-numbering install --user --all` or re-run `npm link` and the postinstall hook refreshes them. The action status reports `relinked`. |
| Copy-mode user-scope files stay on old version | `install` preserves existing copies (so user edits survive). To refresh OpenCode / Gemini / Copilot CLI files to the latest: `docs-numbering install --user --all --force`. |
| `/docs-*` slash commands still appear after `npm unlink -g` | npm skips `preuninstall` for globally-linked packages, so adapter files were never cleaned up. Fix: `cd docs-numbering/core && npm link && npm run unlink-all`. Prevention: always use `npm run unlink-all` instead of plain `npm unlink -g`. |

---

## Project Structure

```
<project>/
├── .docs-numbering.yaml        # Config
├── .docs-numbering/
│   ├── state.json              # Lock state
│   ├── history/                # Operation journal
│   │   └── YYYY-MM-DDTHH-mm-ss.json
│   └── backup/                 # File backups
│       └── <entry-id>/
└── docs/                       # Managed documents
    ├── 001-bmad-prd-title.md
    ├── 002-gsd-plan-api.md
    └── ...
```
