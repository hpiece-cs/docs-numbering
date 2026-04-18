---
description: Initialize docs-numbering in the current project (auto-detect agent and install adapter)
---

Run the docs-numbering installer in the **current project directory**.

1. Verify the CLI is available by running `docs-numbering --version`. If not found, instruct the user to install it globally with `npm install -g @hpiece/docs-numbering` and stop.

2. Run `docs-numbering install --json` (auto-detects supported agents and auto-creates `.docs-numbering.yaml` if missing). Pass any user-supplied flags through.

3. Summarize: config path (if freshly created), installed adapters, and that merge-mode files preserved existing content inside the `<!-- docs-numbering:start --> / <!-- docs-numbering:end -->` block.

4. If no adapters were detected, list the available ones and ask the user which to install with `--agent=<name>` or `--all`.

Respond in the user's language. If the user writes in Korean, reply in Korean.
