# Work 0028 report

## Outcome

Work 0028 completed the first production-capable Gemini provider boundary and
the write-time Review `review_count` repair. The candidate remains fail-closed:
TEST_MODE is `true`, Automation is `OFF`, no real Gemini request was made, and
no Gmail runtime was re-run.

Highest permitted status:

`READY_FOR_CONTROLLED_GEMINI_CREDENTIAL_CONFIGURATION_AND_SYNTHETIC_RUNTIME_VALIDATION`

BLOCKER: `NONE`

## Implementation

- Added `20_GeminiProvider.gs` as the only deployed module containing the
  Gemini Interactions endpoint and `UrlFetchApp` transport.
- Kept `07_AiAdapter.gs` provider-neutral and added a lazy GEMINI registry,
  strict AI2 response schema, fixed provider-response errors, and a bounded
  one-call guard for the private synthetic entrypoint.
- The transport is pinned to Interactions API v1 and model
  `gemini-3.6-flash`, uses `x-goog-api-key`, structured JSON response format,
  `store:false`, and no tools, browsing, streaming, background work, or
  persistence.
- Credential access is limited to the fixed opaque Script Properties reference
  `WORK_OS_V2_GEMINI_API_KEY`. No real key was created, set, rotated, deleted,
  printed, or inspected.
- The private TEST_MODE synthetic entrypoint requires the exact Work 0028
  subject/body sentinels, uses at most one provider call, and was not invoked.
- `review_required` is now returned with classification write metadata and is
  counted directly by both worker task-write paths. No stale task reread is
  used; information-only, safe NEW/ADD, unresolved, pending, conflict, and
  replay semantics remain covered.
- Added only the external-request OAuth scope. No OAuth consent, account
  switch, Setup, diagnostic, function, Calendar, trigger, deployment, or
  provider operation was performed.

## Candidate and release lineage

- Source A15: `859dc2e0b91bbdf925705c15b9e3f046c8bca7a6`
- Release B15: `61bceff51ee85e034d299d8eca6c4590568b6e82`
- Final pre-Google/report lineage head: `SELF` for this report commit, with
  the intervening `.gitignore` change limited to one-use Work 0028 local state.
- Candidate identity: Code `2.8.15-prepilot`, Schema `2.6`, AI Schema `2.0`,
  Migration `3`, TEST_MODE `true`, Automation `OFF`.
- Phase 8B: 24 payload files (23 `.gs` plus `appsscript.json`), 28 package
  files, payload hash
  `183086dcdf69cfa93ee81b0661f6544ac923bfd38fc5190da5d6fffd64b53519`.
- Phase 8C: 23 payload files (22 `.gs` plus `appsscript.json`), 26 package
  files, payload hash
  `a66eab76128b710f07a1586d48517adb0fe466e203fc7ce662d4495f2c2e361d`.
- A15 excludes generated releases; B15 is its direct child and contains only
  the release packages, contract, and release implementation record.

## Validation and CI

- Mandatory standard Codex subagent reviews completed for provider security,
  review-count dataflow, and release/inventory/placement lineage. No custom
  repository agent was invoked.
- Focused provider, worker, review-count, scope, security, clasp-native, and
  placement tests passed.
- All 62 current JavaScript test suites passed.
- `validate_apps_script_v2.js`, `git diff --check`, release checksums, source
  parity, Phase 8B/8C verifiers, lineage, and secret scans passed.
- GitHub Actions CI passed for the exact pre-Google head
  `a03e0e1d8e3e565f369acd41d58e59d82e6e60ec` in both push and PR workflows.
  The final report head was checked again before completion.

## Controlled existing-target placement

The existing personal-synthetic Apps Script target was reused. No new target,
Spreadsheet, account, auth profile, or deployment was created.

- Fresh Work 0028 state: one-use state reached `PULL_PARITY_PASS`.
- Native eligibility immediately before push: 24 files, 23 `.gs`, one
  manifest, missing 0, extra 0, preferred pull extension `.gs`.
- Guarded clasp push: exactly 1 attempt, PASS; semantic update-content evidence
  matched 24 files with missing 0 and extra 0.
- Independent isolated clasp pull: exactly 1 attempt, PASS; 24 files, 23
  `.gs`, one manifest, missing 0, extra 0, exact byte/hash parity PASS.
- Target creation attempts: 0. Real Gemini requests: 0. Gmail runtime calls:
  0. Apps Script function invocations: 0. Calendar runtime calls: 0.
- Sensitive command output, target identifiers, account identity, credentials,
  and private Google responses were suppressed and are not recorded here.

## Deferred boundary

The next separately authorized Work may configure a real Gemini credential and
run the exact TEST_MODE personal-synthetic one-message validation. That work
must re-check the candidate, credential boundary, CI, and one-use state before
any request. Work 0028 performs neither credential configuration nor Gemini
runtime validation.
