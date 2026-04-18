---
description: Create a new numbered documentation file
---

Respond in the user's language. If the user writes in Korean, reply in Korean.

Ask the user for the title (if not provided as argument), then:

1. Run `docs-numbering phases --json` to fetch valid phases.
2. Infer method and phase from the current conversation context. If unclear, ask the user.
3. Construct body from conversation context (summary + decisions).
4. Run:
   ```bash
   docs-numbering new "<title>" --method=<m> --phase=<p> --stdin <<EOF
   <body>
   EOF
   ```
5. Report the created path back to the user.

Arguments: $ARGUMENTS
