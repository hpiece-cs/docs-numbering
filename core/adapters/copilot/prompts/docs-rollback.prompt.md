---
description: Undo a previous docs-numbering rename or create operation
---

1. Run `docs-numbering history --json` to list recent operations.
2. Help the user identify which operation to undo (or use `--last`).
3. Preview with `docs-numbering rollback --to=<id>` (or `--last`).
4. After user confirmation, re-run with `--apply`.

Respond in the user's language.
