# docs-install

## Objective

Initialize docs-numbering in the current project — auto-detect the agent and install the matching adapter.

## Steps

1. Verify the CLI is available by running `docs-numbering --version`. If not found, tell the user to install it globally with `npm install -g @hpiece/docs-numbering` and stop.

2. Run `docs-numbering install --json`. The CLI auto-detects `.claude/`, `.opencode/`, `.cursor/`, `.codex/`, `.windsurf/`, `AGENTS.md`, `GEMINI.md`, `.github/`, and auto-creates `.docs-numbering.yaml` if missing. If the user supplied flags (e.g., `--agent=cursor`, `--all`, `--force`, `--dry-run`), pass them through.

3. Summarize the result: the config path (if freshly created), which adapters were installed, and — for `merge`-mode files — that existing content was preserved inside the `<!-- docs-numbering:start --> / <!-- docs-numbering:end -->` block.

4. If no adapters were detected, list the available ones (from the JSON response) and ask the user which to install.

## Notes

Respond in the user's language. If the user writes in Korean, reply in Korean.
