# Codex development workflow

This repository follows a staged, evidence-first development process.

## Main-agent authority

- The main agent retains responsibility for requirement interpretation, architecture, risk decisions, and final synthesis.
- Do not outsource final acceptance or treat a subagent summary as proof by itself.
- Preserve applicable repository instructions. More specific nested `AGENTS.md` files take precedence for their scope.

## Delegation policy

- Use `terra_explorer` before changes when the repository or task is unfamiliar, cross-file impact is likely, or evidence must be gathered.
- Use `terra_executor` only after scope, affected files, constraints, and acceptance criteria are clear.
- Use at most one write-capable agent for any overlapping file set. Do not run competing write agents on the same code path.
- Use `terra_auditor` after implementation or when validating a completion report. The auditor must remain independent and read-only.
- Wait for delegated agents to finish, then independently evaluate their evidence and conclusions in the main thread.

## Delivery standard

For change requests, follow this sequence unless the task is genuinely trivial:

1. Inspect the relevant source, specifications, tests, and repository state.
2. State the bounded implementation plan and success criteria.
3. Make the smallest in-scope change.
4. Run targeted tests and relevant regression checks.
5. Run an independent evidence-based audit.
6. Report changed files, commands and results, residual risks, and any unverified claims.

Separate verified facts, reasonable inferences, and unknowns. Do not claim completion when required validation did not run or repository evidence does not support the claim.

Do not push, merge, release, delete data, rotate secrets, or expand scope unless the user explicitly requests that external action.
