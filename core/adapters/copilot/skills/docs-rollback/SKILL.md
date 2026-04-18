---
name: docs-rollback
description: Use this skill to undo a previous docs-numbering rename or create operation. Trigger when the user types /docs-rollback, asks to "되돌려줘", "undo the last docs operation", or "rollback the docs migration".
allowed-tools: shell
---

# docs-rollback

Undo a previous docs-numbering rename or create operation.

## Steps

1. List recent operations:
   ```bash
   docs-numbering history --json
   ```
2. Help the user identify which operation to undo (or use `--last` for the most recent).
3. Preview:
   ```bash
   docs-numbering rollback --to=<id>
   ```
   Or with `--last`.
4. After user confirmation, re-run the same command with `--apply`.

Respond in the user's language.
