---
description: Roll back the most recent docs-numbering operation
---

Respond in the user's language. If the user writes in Korean, reply in Korean.

1. Show recent history:
   ```bash
   docs-numbering history --limit=5
   ```
2. Run dry-run rollback of the latest entry:
   ```bash
   docs-numbering rollback --last
   ```
3. Display the inverse plan to the user.
4. On confirmation:
   ```bash
   docs-numbering rollback --last --apply
   ```
