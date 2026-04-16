# docs-numbering User Manual

A CLI tool for managing numbered markdown documentation with methodology-aware naming conventions.

## Installation

```bash
cd core && npm install && npm link
```

Ensure `~/.npm-packages/bin` is in your PATH:
```bash
echo 'export PATH="$HOME/.npm-packages/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
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
| `{date}` | none | Date (YYYY-MM-DD) | `2026-04-15` |

**Rendering rules:**
- Empty or omitted variables are removed along with their preceding `-`
- Consecutive dashes are collapsed to a single `-`
- Leading dashes are removed

```yaml
# Default: full metadata
naming_pattern: "{num:03d}-{method}-{phase}-{slug}.md"
# → 001-bmad-prd-user-authentication.md

# Number + slug only
naming_pattern: "{num:03d}-{slug}.md"
# → 001-user-authentication.md

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
| `{slug}` | `user-auth` | Title slug |
| `{date}` | `2026-04-15` | Date |

Empty variables are omitted along with their preceding `-`.

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

## Claude Code Integration

### Setup

```bash
# Link skill and commands to your project
mkdir -p <project>/.claude/skills <project>/.claude/commands
ln -s <docs-numbering>/adapters/claude-code/skills/docs-numbering <project>/.claude/skills/docs-numbering
ln -s <docs-numbering>/adapters/claude-code/commands/docs-new.md <project>/.claude/commands/docs-new.md
ln -s <docs-numbering>/adapters/claude-code/commands/docs-migrate.md <project>/.claude/commands/docs-migrate.md
ln -s <docs-numbering>/adapters/claude-code/commands/docs-rollback.md <project>/.claude/commands/docs-rollback.md
```

### Slash Commands

| Command | Description |
|---------|-------------|
| `/docs-new` | Create a new numbered document |
| `/docs-migrate` | Migrate existing docs to numbered convention |
| `/docs-rollback` | Undo the last docs-numbering operation |

### Skill Auto-Trigger

The `docs-numbering` skill activates when you:
- Ask to save/create a markdown doc
- Complete a methodology phase producing a deliverable
- Ask to organize or number docs

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `config exists` | Use `--force` to overwrite |
| `unknown phase` | Run `phases --method=X` to see valid phases |
| `project is locked` | Delete `.docs-numbering/lock` manually |
| `checksum mismatch` on rollback | File was edited externally; use `--force` |
| `command not found: docs-numbering` | Add `~/.npm-packages/bin` to PATH |

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
