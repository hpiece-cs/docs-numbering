---
description: Undo a previous docs-numbering rename or create operation
---

1. List recent operations:
   ```bash
   docs-numbering history --json
   ```

2. Help the user identify which operation to undo (or use `--last` for the most recent).

3. Preview the rollback:
   ```bash
   docs-numbering rollback --to=<id>
   ```
   Or with `--last`.

4. After user confirmation, re-run the same command with `--apply`.

Respond in the user's language.
