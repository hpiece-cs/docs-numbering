---
description: Create a new numbered documentation file using docs-numbering
---

1. Ask the user for the title (if not provided as an argument).

2. Fetch valid phases:
   ```bash
   docs-numbering phases --json
   ```

3. Infer the methodology (BMAD, GSD, WDS, superpowers, etc.) and phase from the current conversation context. If unclear, ask the user.

4. Construct the document body from conversation context (summary + decisions).

5. Create the document with body piped via stdin:
   ```bash
   docs-numbering new "<title>" --method=<m> --phase=<p> --stdin <<EOF
   <body>
   EOF
   ```

6. Report the created path back to the user.

Respond in the user's language.
