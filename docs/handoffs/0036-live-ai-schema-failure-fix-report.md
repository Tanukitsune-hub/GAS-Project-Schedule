# Work 0036 Live AI-Schema Failure Fix Completion Report

## Outcome

`BLOCKER: NONE`

The residual live AI-schema failure boundary was repaired without weakening
canonical AI Schema 2.0 validation. The repair was tested, regenerated as
Code `2.8.21-prepilot`, placed once on the same existing personal-synthetic
Apps Script target, and independently pulled back with exact parity.

The highest permitted status is:

`READY_FOR_USER_PERSONAL_AUTOMATION_E2E`

Automation remains OFF. This Work did not retry the user-controlled E2E, run
an Apps Script function, process Gmail, make a Gemini request, mutate Task,
Review, Calendar, or triggers, run Setup or diagnostics, inspect a credential
value, or access ordinary personal Inbox mail.

## References and preserved evidence

- Instruction ref: `d330d94f9202d3a8bbb13cf2536fadb8cd031293`
- Instruction: `docs/handoffs/0036-live-ai-schema-failure-fix-instruction.md`
- Mandatory addendum: `docs/handoffs/0036-live-ai-schema-failure-fix-addendum.md`
- Historical Work 0036 reports were preserved unchanged.
- Source repair commit: `25e32a0a4a2c51a7d347534659299d5523b3477f`
- Release regeneration commit: `bda4df2ec8a21b5e4ece64609e2e50b7be12dcb5`
- Pre-placement tooling/test head: `78a27bc2cddd42eb7af826d42443006cab332c1c`
- Branch: `codex/0036-personal-automation-qualification`
- Draft PR: `#51`, kept Draft/Open/Unmerged

The frozen Code `2.8.20-prepilot` recovery packages and historical evidence
were preserved. The current candidate is Code `2.8.21-prepilot`, Schema `2.6`,
AI Schema `2.0`, Migration `3`.

## Root cause and minimal repair

The bounded live failure was `AI_RESPONSE` / `E_AI_SCHEMA` after one exact
synthetic candidate reached the real Gemini classification boundary. The
provider-facing schema projection cannot express every stricter
action-dependent canonical rule, while `WorkOsAiAdapter.validateOutput()` must
remain authoritative and fail-closed.

The repair therefore:

- hardened the Gemini prompt with exact-field, no-extra-field, action-semantic,
  deadline-basis, Calendar, and identifier constraints;
- added an exact synthetic qualification fixture contract without changing
  the general provider path;
- preserved strict canonical validation and added only a bounded allowlisted
  `canonical_schema_rule` diagnostic token;
- propagated that token through existing safe evidence surfaces without raw
  provider output, email content, identifiers, rationale, or exceptions; and
- preserved one-call/no-retry/no-fallback behavior and Message-only
  fail-closed finalization before Task/Review/Calendar work.

## Candidate and release evidence

- Phase 8B: `TEST_MODE=true`, harness included, Automation OFF
- Phase 8C: `TEST_MODE=false`, harness excluded, Automation OFF
- Canonical source payload: 23 `.gs` files plus `appsscript.json`
- Phase 8B package payload: 24 files
- Phase 8C package payload: 23 files
- Canonical source inventory SHA-256:
  `e0f57788977dbaea38225ecd0b4335ddcded11d86411da14b7a5e81c2610b7bc`
- Phase 8B bundle SHA-256:
  `42ffdc6ada448e4dcacc0b8050048d994f212069dfe6657498bb9c3a20cb5cd2`
- Phase 8C bundle SHA-256:
  `37feb8cb615ee3caa8af51e83b354a1b6cbbbbe7f03460052ac73ca499b77479`

Release builders and verifiers passed source parity, checksums, secret scan,
Phase 8C production transform, Automation-OFF checks, provenance, and
historical 2.8.20 preservation. `CURRENT_CONTRACT.json`, manifests,
checksums, source, and releases agree on the candidate.

## Local validation

- Work 0033 schema-compatibility tests: 7/7 PASS
- Work 0032 runtime-diagnostics tests: 13/13 PASS
- Work 0036 qualification tests: 24/24 PASS
- Work 0036 placement tests: 24/24 PASS
- Clasp-native inventory contract: PASS; clasp 3.3.0, `.gs` preferred
- Clasp update-content contract: PASS; one semantic update-content call in
  the local contract test
- Complete deterministic regression inventory: 78 suites, missing 0, extra 0
- Apps Script static validator: 11/11 PASS
- Complete local validation gate: 11/11 PASS
- Release verifiers: Phase 8B and Phase 8C PASS
- A21/B21/current repair lineage: PASS
- Historical 2.8.20 preservation: PASS
- Secret/local-state scan: PASS, zero hits
- `git diff --check`: PASS
- Git identity, Node, pnpm, and project-local clasp 3.3.0: configured/READY
- Existing clasp authorization: READY; identity suppressed

The local validation and clasp checks were non-Google. The required
pre-placement CI for head `78a27bc2cddd42eb7af826d42443006cab332c1c` completed
SUCCESS before placement (CI run `#448`).

## Existing-target replacement and parity

The fresh live-AI-schema lane used distinct ignored local state and did not
reuse consumed mutation state. Existing binding evidence was used only within
the committed guarded placement procedure; target and account identifiers
were suppressed.

Immediately before the source update, the actual project-local clasp
eligibility gate passed:

- eligible files: 23;
- `.gs` files: 22;
- `appsscript.json`: 1;
- missing: 0;
- extra: 0;
- `scriptExtensions`: `[".gs", ".js"]`;
- preferred pull script extension: `.gs`;
- staged payload inventory SHA-256:
  `07d78835680ebaeb2dbd843aabc831aebc6b8d8fc9c10f580a27a24c354bf201`.

The authorized external sequence completed exactly once per operation:

| Operation | Attempts | Result |
|---|---:|---|
| Guarded Phase 8C source update/push | 1 | PASS; update-content evidence, 23 files, 22 `.gs`, 1 manifest, missing 0, extra 0 |
| Independent isolated pull-back | 1 | PASS; 23 files, 22 `.gs`, 1 manifest, missing 0, extra 0 |
| Pull-back byte/hash parity | 1 | PASS; staged and pulled payload SHA-256 matched exactly |

The fresh state reached `PULL_PARITY_PASS`. No retry, fallback, second
target, alternate account, runtime function, Gmail access, Gemini request,
Calendar action, trigger mutation, Setup, diagnostic, or Automation action
followed placement. The addendum's Automation-OFF confirmation remains the
authority: status and desired state were disabled, owned clock triggers were
zero, and stored/canonical trigger residue was absent.

## Independent review and delivery

Independent standard Codex subagents performed bounded read-only provider
contract analysis, privacy/fail-closed analysis, and final source/test/release/
placement audit. The final audit checked strict canonical validation, bounded
diagnostics, release and frozen-2.8.20 preservation, the 23-file native
inventory, one-use attempt counts, pull-back parity, historical-state
non-reuse, and absence of runtime operations.

The final report-head GitHub Actions CI and the active Draft/Open/Unmerged PR
state are the publication checks recorded after this report was pushed. No
merge was performed. The next action is a separately authorized,
user-controlled personal Automation E2E using one fresh exact synthetic
fixture; ordinary personal Inbox mail remains out of scope.
