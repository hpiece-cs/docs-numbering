---
description: Initialize docs-numbering in the current project (auto-detect agent and install adapter)
---

Respond in the user's language. If the user writes in Korean, reply in Korean.

Run the docs-numbering installer in the **current project directory** (the user's `cwd`, not the docs-numbering repo).

1. Verify the CLI is available:
   ```bash
   docs-numbering --version
   ```
   If not found, tell the user to install it globally (`npm install -g @hpiece/docs-numbering`) and stop.

2. Run install (auto-detects `.claude/`, `.opencode/`, `AGENTS.md`, `GEMINI.md`, `.github/`, and auto-creates `.docs-numbering.yaml` if missing):
   ```bash
   docs-numbering install --json
   ```
   Pass `$ARGUMENTS` through if the user supplied flags like `--agent=claude-code`, `--all`, `--force`, or `--dry-run`.

3. Summarize the result: the config path (if freshly created), which adapters were installed, and — for `merge`-mode files — that existing content was preserved inside the `<!-- docs-numbering:start --> / <!-- docs-numbering:end -->` block.

4. If no adapters were detected, list the available ones (from the JSON response) and ask the user which to install with `--agent=<name>` or `--all`.

Arguments: $ARGUMENTS
