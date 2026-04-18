---
description: Create a new numbered documentation file
---

Ask the user for the title (if not provided), then:

1. Run `docs-numbering phases --json` to fetch valid phases.
2. Infer methodology and phase from conversation context. If unclear, ask.
3. Construct body from conversation context.
4. Run `docs-numbering new "<title>" --method=<m> --phase=<p> --stdin` with the body via stdin.
5. Report the created path back to the user.

Respond in the user's language.
