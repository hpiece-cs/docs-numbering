---
description: Initialize docs-numbering in the current project (auto-detect agent and install adapter)
argument-hint: [--agent=<name>] [--all] [--force] [--dry-run]
---

Respond in the user's language. If the user writes in Korean, reply in Korean.

Run the docs-numbering installer in the **current project directory**.

1. Verify the CLI is available by running `docs-numbering --version`. If not found, tell the user to install it globally (`npm install -g @hpiece/docs-numbering`) and stop.

2. Run `docs-numbering install --json $1`. The CLI auto-detects `.claude/`, `.opencode/`, `AGENTS.md`, `GEMINI.md`, `.github/`, and auto-creates `.docs-numbering.yaml` if missing.

3. Summarize the result: the config path (if freshly created), which adapters were installed, and — for `merge`-mode files — that existing content was preserved inside the `<!-- docs-numbering:start --> / <!-- docs-numbering:end -->` block.

4. If no adapters were detected, list the available ones (from the JSON response) and ask the user which to install with `--agent=<name>` or `--all`.
