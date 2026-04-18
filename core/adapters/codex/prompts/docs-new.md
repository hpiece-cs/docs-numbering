---
description: Create a new numbered documentation file
argument-hint: <title>
---

Respond in the user's language. If the user writes in Korean, reply in Korean.

Ask the user for the title (or use `$1` if supplied), then:

1. Run `docs-numbering phases --json` to fetch valid phases.
2. Infer method and phase from the current conversation context. If unclear, ask the user.
3. Construct body from conversation context (summary + decisions).
4. Run `docs-numbering new "$1" --method=<m> --phase=<p> --stdin` with the body piped via stdin.
5. Report the created path back to the user.
