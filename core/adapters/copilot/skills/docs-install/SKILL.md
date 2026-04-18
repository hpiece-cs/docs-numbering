---
name: docs-install
description: Use this skill to initialize docs-numbering in the current project. Auto-detects the AI agent (Claude Code, OpenCode, Codex, Cursor, Windsurf, Gemini CLI, GitHub Copilot) and installs the matching adapter. Trigger when the user types /docs-install, asks to "set up docs-numbering", "install docs-numbering adapter", or starts a new project that needs numbered documentation management.
allowed-tools: shell
---

# docs-install

Initialize docs-numbering in the current project — auto-detect the agent and install the matching adapter.

## Steps

1. Verify the CLI is available:
   ```bash
   docs-numbering --version
   ```
   If not found, instruct the user to install it globally with `npm install -g @hpiece/docs-numbering` and stop.

2. Run the installer (auto-detects supported agents and auto-creates `.docs-numbering.yaml` if missing):
   ```bash
   docs-numbering install --json
   ```
   If the user supplied flags (e.g., `--agent=copilot`, `--all`, `--force`, `--dry-run`), pass them through.

3. Summarize the result: config path (if freshly created), installed adapters, and that merge-mode files preserved existing content inside the `<!-- docs-numbering:start --> / <!-- docs-numbering:end -->` block.

4. If no adapters were detected, list the available ones and ask the user which to install.

Respond in the user's language. If the user writes in Korean, reply in Korean.
