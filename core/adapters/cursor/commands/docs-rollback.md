# docs-rollback

## Objective

Undo a previous docs-numbering rename or create operation.

## Steps

1. Run `docs-numbering history --json` to list recent operations.
2. Help the user identify which operation to undo (or use `--last` for the most recent).
3. Preview the rollback with `docs-numbering rollback --to=<id>` (or `--last`).
4. After user confirmation, re-run with `--apply`.

## Notes

Respond in the user's language.
