# Repository Working Rules

This file defines repository-wide development rules. Follow the latest user request and any more specific `AGENTS.md` in the directory being changed.

## GitHub Actions CI standard

- Every repository must, in principle, have a minimal GitHub Actions CI workflow at `.github/workflows/ci.yml`.
- Automate runnable tests, lint, build, syntax checks, and required file-structure checks with GitHub Actions rather than relying only on manual verification.
- Pull requests that affect executable code, scripts, models, workflows, or important specifications must pass CI before merge, in principle.
- If CI is removed or weakened, document the reason in the pull request body or related documentation.
- Never write secrets, API keys, OAuth tokens, Google credentials, or personal information directly in a workflow.
- Keep CI proportionate to the repository: run only checks whose required scripts, configuration, and dependencies actually exist.
- When reporting a completed change, Codex must state the CI status, validations run, items not validated, and remaining issues.
