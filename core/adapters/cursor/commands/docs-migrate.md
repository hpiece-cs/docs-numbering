# docs-migrate

## Objective

Rename existing markdown files to conform to the docs-numbering naming pattern.

## Steps

1. Run `docs-numbering migrate --json` to preview rename plans.
2. Summarize the plan to the user and confirm.
3. If confirmed, run `docs-numbering migrate --apply` to execute.
4. Report the rename history ID for possible rollback.

## Notes

Respond in the user's language.
