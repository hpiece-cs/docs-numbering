---
description: Initialize docs-numbering in the current project (auto-detect agent and install adapter)
---

1. Verify the docs-numbering CLI is available:
   ```bash
   docs-numbering --version
   ```
   If not found, instruct the user to install it globally with `npm install -g @hpiece/docs-numbering` and stop.

2. Run the installer (auto-detects `.claude/`, `.opencode/`, `.cursor/`, `.codex/`, `.windsurf/`, `AGENTS.md`, `GEMINI.md`, `.github/`, and auto-creates `.docs-numbering.yaml` if missing):
   ```bash
   docs-numbering install --json
   ```
   If the user supplied flags (e.g. `--agent=windsurf`, `--all`, `--force`, `--dry-run`), pass them through.

3. Summarize the result:
   a. The config path (if freshly created)
   b. Which adapters were installed
   c. For `merge`-mode files, note that existing content was preserved inside the `<!-- docs-numbering:start --> / <!-- docs-numbering:end -->` block

4. If no adapters were detected, list the available ones and ask the user which to install with `--agent=<name>` or `--all`.

Respond in the user's language. If the user writes in Korean, reply in Korean.
