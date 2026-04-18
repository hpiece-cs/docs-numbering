---
description: Normalize existing markdown docs to numbered convention
---

Respond in the user's language. If the user writes in Korean, reply in Korean.

1. Run a dry-run first:
   ```bash
   docs-numbering migrate --order=mtime
   ```
2. Show the plan to the user in a readable format.
3. Ask for explicit confirmation ("rename N files?").
4. On confirmation, run:
   ```bash
   docs-numbering migrate --order=mtime --apply
   ```
5. Remind the user they can rollback if needed.
