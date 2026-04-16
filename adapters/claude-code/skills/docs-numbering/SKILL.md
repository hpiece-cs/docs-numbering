---
name: docs-numbering
description: Use when creating, organizing, or renaming markdown documentation
  files with numbered naming conventions. Supports BMAD/GSD/WDS/superpowers
  methodologies and Korean/multilingual filenames. Trigger when user asks to
  "save this as a doc", "organize docs", "number the docs", completes a
  methodology phase that produces a deliverable document, or requests bulk
  rename/migration of .md files.
---

Respond in the user's language. If the user writes in Korean, reply in Korean.

# docs-numbering

Numbered markdown documentation management via `@hpiece/docs-numbering` CLI.

## When to use
- User asks to save/create a markdown doc in the project.
- A methodology phase (BMAD PRD, GSD plan-phase, WDS brief, etc.) produces a
  deliverable that should become a file.
- User wants to rename/reorganize existing `.md` files.
- User mentions "번호 매겨줘", "정리해줘", "migrate", "rollback".

## How to use

### 1. Discover valid phases first
```bash
docs-numbering phases --json
```

### 2. Create a new doc
```bash
docs-numbering new "<title>" \
  --method=<bmad|gsd|wds|superpowers> \
  --phase=<phase> \
  --stdin <<'EOF'
<full markdown body>
EOF
```
Use the printed path for follow-up references.

### 3. Migrate existing docs (always dry-run first)
```bash
docs-numbering migrate --order=mtime
# show user the plan, get confirmation
docs-numbering migrate --order=mtime --apply
```

### 4. Rollback when needed
```bash
docs-numbering history --limit=10
docs-numbering rollback --last           # dry-run
docs-numbering rollback --last --apply   # confirm
```

## Do NOT
- Never write `.md` files directly to the configured `docs_dir`.
- Never rename numbered files manually; always use `migrate`.
- Never delete the `.docs-numbering/` directory.
- Never run `migrate --apply` without showing the user the dry-run plan first.

## Tips
- If config is missing, run `docs-numbering init` first.
- For Korean titles, the tool preserves them by default (`001-사용자-인증.md`).
- When `--phase` is ambiguous, ask the user rather than guessing.
