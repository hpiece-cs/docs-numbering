---
name: docs-new
description: Use this skill to create a new numbered markdown documentation file using the docs-numbering CLI. Trigger when the user types /docs-new, asks to "create a doc", "save this as a doc", "번호 매겨서 저장", or completes a methodology phase that produces a deliverable document.
allowed-tools: shell
---

# docs-new

Create a new numbered documentation file using docs-numbering.

## Steps

1. Ask the user for the title (if not provided as an argument).
2. Fetch valid phases:
   ```bash
   docs-numbering phases --json
   ```
3. Infer methodology (BMAD, GSD, WDS, superpowers, etc.) and phase from the current conversation context. If unclear, ask.
4. Construct the document body from conversation context (summary + decisions).
5. Create the doc with body via stdin:
   ```bash
   docs-numbering new "<title>" --method=<m> --phase=<p> --stdin <<EOF
   <body>
   EOF
   ```
6. Report the created path back to the user.

Respond in the user's language.
