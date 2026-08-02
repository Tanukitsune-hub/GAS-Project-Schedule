# Repository Working Rules

Follow the latest GitHub instruction and any more-specific `AGENTS.md` in the
directory being changed. The repository’s canonical implementation is
`implementation/GoogleSpreadsheet/`.

## GitHub Actions CI

- Keep one proportionate standard workflow at `.github/workflows/ci.yml`.
- CI must run tracked JSON/YAML validation, the Apps Script static validator,
  all current Node regression suites, and the committed non-Google local
  verification gate.
- Do not remove or weaken an existing CI check without recording the reason in
  the relevant pull request and canonical documentation.
- CI uses read-only repository permissions and must never use Google
  credentials, OAuth tokens, `.clasp.json`, `.clasprc.json`, `clasp push`, or
  any secret context.

## Codex subagent delegation

- At the start of the first non-trivial task after a checkout, branch switch,
  pull, or workspace relocation, verify that the current `HEAD` contains
  `.codex/config.toml` and the three files under `.codex/agents/`. Do not infer
  project agents from `main` when the active branch is different.
- For unfamiliar, evidence-heavy, or cross-file work, and for work likely to
  touch more than two files, explicitly spawn `luna_explorer` before changes.
  Give it one bounded question, one module, or a cluster of roughly 3-5 files.
- Use `luna_executor` only for one explicit, low-risk mechanical change set,
  preferably one or two non-overlapping files with clear acceptance criteria.
- After non-trivial implementation or before accepting a completion report,
  explicitly spawn `luna_auditor` for one invariant, test family, check family,
  or small file cluster.
- Main Codex retains requirement interpretation, architecture, authorization,
  security, Google runtime, company-handoff, and final-acceptance decisions. A
  subagent report is evidence, not approval.
- Wait for delegated agents and record the agent name, assigned scope, thread
  result, completion state, and any timeout or sandbox error in the completion
  report. Do not claim an independent audit when no usable result returned.
- If the Windows sandbox/helper returns `Access Denied` or a bounded agent
  times out, stop that agent without repeated retries, record the exact failure,
  and continue only in the main thread or after the local sandbox is repaired.
  Do not weaken repository controls or switch to full access merely to make an
  agent run.
- Machine-specific `[windows] sandbox` settings belong in the user-level Codex
  configuration, not in this repository.

## Local clasp validation and company handoff

- A project-local `@google/clasp` is for a dedicated personal, synthetic dev
  Apps Script project only. It is never a company or production target.
- Before any company handoff, an intended GAS change must pass the local
  static/regression gate and GitHub Actions; where the dedicated dev target is
  configured, it must also pass guarded local clasp push and pull-back parity.
- Company PCs do not use clasp. Their future scope is manual reflection,
  authorization review, and a separately approved minimal smoke test.
- A skipped clasp lane is a company-handoff blocker unless a later governing
  instruction explicitly records a different decision.
- A failed clasp operation must be classified locally into a closed category.
  Raw remote output may remain only in ignored local operation records; GitHub
  evidence may contain only the category and output SHA-256.
- A canonical retry must be explicitly authorized, durably marked before the
  remote call, and followed by separate-directory pull-back parity. Never
  delete a retry marker to manufacture an additional attempt.
- Remote runtime development requires a personal standard Cloud project,
  local-only named OAuth state, a dev-staged `executionApi.access = MYSELF`
  overlay, exact runtime pull-back parity, and a MYSELF-only API executable.
  The canonical `appsscript.json` must not be changed for this lane.
- A remote diagnostic validation may call only the specifically authorized
  read-only function once and must retain only its bounded closed summary.

## Information and reporting boundaries

- Never commit `.clasp.json`, `.clasprc.json`, OAuth material, API keys,
  credentials, company data, personal data, Workspace IDs, or Workspace URLs.
- Final reports must state GitHub Actions, non-Google local verification,
  clasp target guard, dev push, pull-back parity, runtime dry-run status,
  missing prerequisites, and remaining company-side checks.
- Preserve historical release, transfer, audit, and instruction artifacts.
  Do not use reset, clean, rebase, amend, force push, or unrelated revert.
