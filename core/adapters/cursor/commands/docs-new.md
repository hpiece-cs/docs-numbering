# docs-new

## Objective

Create a new numbered documentation file in the current project using the docs-numbering CLI, with method/phase inferred from conversation context.

## Steps

1. Ask the user for the title (if not provided as an argument).
2. Run `docs-numbering phases --json` to fetch valid phases.
3. Infer method (BMAD, GSD, WDS, superpowers, etc.) and phase from the current conversation context. If unclear, ask.
4. Construct the document body from conversation context (summary + decisions).
5. Run `docs-numbering new "<title>" --method=<m> --phase=<p> --stdin` with the body piped via stdin.
6. Report the created path back to the user.

## Notes

Respond in the user's language. If the user writes in Korean, reply in Korean.
