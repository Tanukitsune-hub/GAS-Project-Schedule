# Codex Repository Instructions

Policy baseline: 2026-08-07

These rules govern Codex/local implementation agents. ChatGPT may finish GitHub-only work without invoking Codex. Route B means ChatGPT edits and Codex verifies/fixes; Route C means Codex implements.

## Authority and handoff

- Follow: latest explicit user instruction; the exact handoff at its referenced ref; closest nested `AGENTS.md`; this file; then other repository docs.
- GitHub files carry the full ChatGPT–Codex instruction and report; chat is only a pointer unless GitHub is unavailable.
- Every Route B/C task must read the named `docs/handoffs/<WORK-ID>-instruction.md`. It defines outcome, scope/non-goals, decisions, targets, checks, Git/PR requirements, and stop conditions.
- If its path/ref is missing or inconsistent, do not rebuild requirements from old chat, stale handoffs, or unrelated branches. Report a BLOCKER.
- Material scope/design changes require an updated handoff/ref. Do not edit the instruction unless asked.

## Before starting implementation

1. Check `git status`, the current branch, remote, and upstream.
2. Fetch the latest remote changes.
3. Fast-forward pull when it is safe and does not overwrite, stash, commit, or otherwise disturb local work.
4. If local changes, detached HEAD, divergence, missing upstream, or another unsafe condition exists, stop before implementation and explain the state and safest next step.
5. Begin implementation only after the repository state is understood and safely synchronized, or the handoff explicitly authorizes working from the current state.

## Efficient execution

- Start with handoff-named files; inspect only applicable rules, code, tests, diffs, and history.
- Do not repeat repo-wide orientation, confirmed decisions, known summaries, or routine prose already supplied by ChatGPT.
- Build the smallest coherent end-to-end outcome. Apply YAGNI; avoid speculative features, broad refactors, parallel systems, and premature abstractions.
- Resolve routine reversible ambiguity with the simplest safe assumption and record it. Escalate only when outcome, authorization, safety, security, financial correctness, or reversibility changes materially.
- Use subagents selectively but proactively when work can be split into independent, non-overlapping exploration, implementation, or verification tasks. Never use competing writers on overlapping files or duplicate review loops.
- Prefer one run through implementation, checks, in-scope fixes, commit, push, PR update, and report.

## Subagent selection

- Use only the Luna custom subagents for delegated work unless the user explicitly instructs otherwise.
- Use `luna_explorer` for targeted repository exploration, dependency tracing, evidence gathering, and implementation planning.
- Use `luna_executor` for bounded implementation work with explicit scope and acceptance criteria.
- Use `luna_auditor` for independent validation of implementation claims, tests, documentation, and repository evidence.
- When independent work can safely proceed in parallel, proactively launch the corresponding Luna subagents instead of keeping all work in the main agent or one subagent.
- Do not select or invoke Terra custom subagents unless the user explicitly requests them.
- If the appropriate Luna role is unclear, use `luna_explorer` first.

## Implementation and checks

- Implement the primary workflow first; add only essential safety/usability. Investigation is not completion unless requested.
- Normal checks: relevant lint/type/syntax, focused tests for changed logic, one happy path, and a runnable smoke test.
- Strengthen checks for destructive work, auth/secrets, migrations, deployment, external writes, security, and financial calculations.
- After fixes, rerun affected checks/smoke only. Never conceal failures or claim unrun checks.
- BLOCKER means primary use fails, material data/security/financial risk remains, required authorization is missing, or safe continuation is impossible. Defer lesser gaps without stopping delivery.

## Git and safety

- Check status, branch, remote, and diff; preserve unrelated work and history. Use the handoff branch or a task branch; stage only in-scope files.
- Do not force-push, rewrite history, merge, release, deploy, delete data, rotate secrets, or operate external systems unless explicitly authorized in the handoff.
- Never commit secrets, credentials, personal/private production data, or machine-specific paths.
- Use repository-specific CI proportionately; do not copy tooling mechanically from another repo.

## Report and completion

- Write the complete result to `docs/handoffs/<WORK-ID>-report.md`; commit/push it with the work and link instruction/report in the PR.
- Report: outcome; changed files; material decisions/assumptions; tests/CI; trial steps; limitations/deferred; simplifications; branch/commit/PR; BLOCKER status.
- Chat reply only: Work ID, report path, commit, branch, PR, BLOCKER status. Do not duplicate the report.
- Done when primary use works end to end, critical checks pass, no BLOCKER remains, material risks/recovery are recorded, and GitHub is updated. Check consistency once, then stop.

## Repository-specific rules: Google Workspace Personal Work OS

### Canonical context

- Read `CURRENT_STATUS.md`, `DECISIONS.md`, `PROJECT_CONTEXT.md`, and `MASTER_PLAN.md` before implementation, then only the audits, legacy `instructions/`, source README, and evidence referenced by the handoff.
- Existing `instructions/`, audits, releases, and evidence remain historical/canonical records. New ChatGPT–Codex task exchange uses `docs/handoffs/`; do not rewrite historical evidence to fit a new task.
- Use the latest canonical status and gates. Passing local tests or CI never by itself authorizes production, pilot, automation, deployment, company handoff, or a GO status.

### External-action guardrails

- Default to no live Google/Workspace action. Do not access or mutate real Gmail, Calendar, Drive, Sheets, Apps Script, OAuth, Cloud project, deployment, trigger, account, or provider state unless the exact handoff explicitly authorizes the exact bounded action.
- Authorization for one call, target, function, account, or attempt does not authorize retries, fallbacks, alternate targets/functions, follow-up diagnostics, deployment, or mutation. Fail closed when evidence or authorization is incomplete.
- Do not place credentials, tokens, project/script/deployment IDs, private URLs, account details, message bodies, personal data, or raw provider errors in GitHub, chat, fixtures, reports, or logs. Use synthetic/redacted evidence.

### Implementation and validation

- Preserve Apps Script V8/browser compatibility in deployed source. Node-only APIs may be used only in clearly separated local tests/tools.
- Keep source, manifest, generated release artifacts, versions/schemas, tests, audit evidence, and canonical status consistent. Do not declare acceptance from partial parity.
- Run the relevant static validator and focused regression suites; use existing CI where applicable. Record skipped live-provider validation explicitly rather than implying coverage.
- Do not weaken fail-closed gates, privacy filters, authorization boundaries, or automation-off controls merely to make a test pass.
