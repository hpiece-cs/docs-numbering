---
description: Rename existing markdown files to conform to the docs-numbering naming pattern
---

Respond in the user's language. If the user writes in Korean, reply in Korean.

1. Run `docs-numbering migrate --json` to preview rename plans.
2. Summarize the plan to the user and confirm.
3. If confirmed, run `docs-numbering migrate --apply`.
4. Report the rename history ID for possible rollback.
