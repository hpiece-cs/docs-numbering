---
name: docs-migrate
description: Use this skill to rename existing markdown files in the project to conform to the docs-numbering naming pattern. Trigger when the user types /docs-migrate, asks to "정리해줘", "renumber the docs", or "migrate documentation files".
allowed-tools: shell
---

# docs-migrate

Rename existing markdown files to conform to the docs-numbering naming pattern.

## Steps

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
