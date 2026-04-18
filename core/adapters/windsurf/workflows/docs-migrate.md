---
description: Rename existing markdown files to conform to the docs-numbering naming pattern
---

1. Preview rename plans:
   ```bash
   docs-numbering migrate --json
   ```

2. Summarize the plan to the user and confirm.

3. If confirmed, execute:
   ```bash
   docs-numbering migrate --apply
   ```

4. Report the rename history ID for possible rollback.

Respond in the user's language.
