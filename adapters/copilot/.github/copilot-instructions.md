# docs-numbering

Numbered markdown documentation manager. Use the `docs-numbering` CLI to create, organize, and rename `.md` files with sequential numbering and methodology tagging.

Respond in the user's language. If the user writes in Korean, reply in Korean.

## When to use

Activate this workflow when the user:
- Asks to save, create, or organize a markdown document
- Completes a methodology phase (BMAD PRD, GSD plan-phase, WDS brief, etc.) that produces a deliverable
- Says "save this as a doc", "organize docs", "number the docs"
- Says "번호 매겨줘", "정리해줘", "migrate", "rollback"
- Requests bulk rename or migration of `.md` files

## Prerequisites

- `docs-numbering` CLI must be installed and in PATH
- Project must be initialized: `docs-numbering init`
- If config is missing, run `docs-numbering init` first

## Commands

### Create a new document

1. Run `docs-numbering phases --json` to discover valid phases.
2. Infer method and phase from the conversation context. If unclear, ask the user.
3. Construct the document body from conversation context (summary + decisions).
4. Run:
   ```bash
   docs-numbering new "<title>" --method=<bmad|gsd|wds|superpowers> --phase=<phase> --stdin <<'EOF'
   <body>
   EOF
   ```
5. Report the created file path to the user.

### Migrate existing documents

1. Always dry-run first:
   ```bash
   docs-numbering migrate --order=mtime
   ```
2. Show the plan to the user in a readable format.
3. Ask for explicit confirmation before applying.
4. On confirmation:
   ```bash
   docs-numbering migrate --order=mtime --apply
   ```

### Rollback

1. Show recent history:
   ```bash
   docs-numbering history --limit=5
   ```
2. Dry-run the rollback:
   ```bash
   docs-numbering rollback --last
   ```
3. Show the inverse plan to the user.
4. On confirmation:
   ```bash
   docs-numbering rollback --last --apply
   ```

### Other useful commands

- `docs-numbering list` — list all numbered documents
- `docs-numbering list --method=bmad` — filter by methodology
- `docs-numbering validate` — check for duplicate numbers or unknown phases
- `docs-numbering phases --json` — show valid phases from enabled presets

## Rules

- Never write `.md` files directly to the configured `docs_dir`. Always use `docs-numbering new`.
- Never rename numbered files manually. Always use `docs-numbering migrate`.
- Never delete the `.docs-numbering/` directory.
- Never run `migrate --apply` without showing the user the dry-run plan first.
- For Korean titles, the tool preserves them by default (`001-사용자-인증.md`).
- When `--phase` is ambiguous, ask the user rather than guessing.
