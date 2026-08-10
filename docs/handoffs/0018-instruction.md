# Work 0018 — Advanced Gmail Service Byte-Body Repair

## Outcome

Repair the real Apps Script Advanced Gmail Service body representation defect exposed by Works 0015 and 0017, preserve all fail-closed/privacy/bounded-processing guarantees, create the smallest coherent successor pre-pilot candidate, and place that exact repaired payload onto the same existing personal-synthetic Apps Script target for a later user-assisted runtime retest.

Highest permitted success status:

`READY_FOR_CONTROLLED_ADVANCED_GMAIL_BYTE_BODY_RETEST`

Do not perform the Gmail runtime retest in Work 0018.

## Why Codex is needed

The residual work requires non-trivial source implementation, exact Apps Script-compatible byte handling, targeted and full executable validation, coherent candidate/release regeneration, and one bounded source placement to the already-approved existing synthetic target.

## Exact starting point

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Branch: `codex/0018-advanced-gmail-byte-body-repair`
- Starting commit: `ead4d051bc541f72ce3865ad66e0a08886989507`
- Parent Work: `0017`
- Parent report: `docs/handoffs/0017-report.md`
- Parent result: `BLOCKED_BY_ADVANCED_GMAIL_BYTE_REPRESENTATION_DEFECT`
- Existing candidate: Code `2.8.13-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- `TEST_MODE=true`
- Automation OFF
- External/production AI disabled
- Existing runtime target: only the same personal-synthetic bound Spreadsheet / Apps Script project used since Work 0010
- Work 0017 instruction-head CI: SUCCESS

## Closed runtime evidence

Work 0017 used one fresh, short, non-sensitive, attachment-free synthetic plain-text Gmail message and invoked manual import exactly once.

Safe result:

- candidate count: `1`
- processed count: `0`
- skipped count: `0`
- error count: `1`
- safe code: `E_GMAIL_BODY_DECODE`
- Gmail API calls: `5 / 20`
- PREPROCESSED: not reached
- AI: not called
- Task: not executed
- Calendar: not called
- run summary: recorded

No retry or Mock vertical occurred.

Works 0015 and 0017 failed with the same non-retryable code. Their Message State / Dead Letter entries are expected to be `DEAD` and must not be revived, edited, deleted, or used as runtime inputs in this Work.

## Revised root-cause boundary

Work 0016 assumed `MessagePartBody.data` reached Apps Script as the public REST JSON base64url string. It therefore added strict string validation and missing terminal padding before `Utilities.base64DecodeWebSafe()`.

That repair did not resolve the real runtime.

The current implementation still begins the decode path with:

`String(data || '')`

The highest-confidence revised diagnosis is that Apps Script Advanced Gmail Service translates the Gmail API `bytes` field into an already-decoded byte sequence / Int8-style array. Under that representation:

1. `String(data)` becomes comma-separated integer text;
2. the strict base64url validator rejects it;
3. even without the validator, applying base64 decoding would be a double decode;
4. the correct text path is to validate/copy the bytes and use `Utilities.newBlob(bytes).getDataAsString('UTF-8')`.

This is consistent with the public Gmail API declaring the field as `bytes` format and with independently observed Apps Script Advanced Gmail Service behavior for the same field.

Treat this as the exact implementation hypothesis to verify against code semantics and tests. Do not add a permissive catch-all fallback.

## ChatGPT-completed work

- Recorded the Work 0017 safe-stop in `docs/handoffs/0017-report.md`.
- Preserved privacy: no Gmail IDs, addresses, URLs, account identifiers, raw MIME, body text, OAuth values, target IDs, or raw Google responses are in Git.
- Confirmed the exact Work 0017 synthetic message was structurally normal and attachment-free.
- Defined the narrow dual-representation repair below.

## Required-now scope

### 1. Inspect the exact current decoder and tests

Read first:

- `implementation/GoogleSpreadsheet/apps-script-v2/05_GmailGateway.gs`
- `implementation/GoogleSpreadsheet/tests/phase2_local_test.js`
- all focused Gmail/worker tests referenced by the parent reports
- current version/release/contract files required by existing repository convention

Trace only the `MessagePartBody.data -> text/plain` path and its affected tests/release identity. Do not redesign the Gmail worker, MIME traversal, Message State, Task, Calendar, or Automation architecture.

### 2. Implement a strict dual-representation body decoder

The production source must inspect the value before any String coercion.

#### A. Empty body

- `null`, `undefined`, or an intentionally empty representation may return empty text with `transport_truncated=false` only where the existing MIME contract already permits an empty body.

#### B. Advanced-Service byte-sequence path

Support the real Apps Script Advanced Service representation through a narrow validated path.

The implementation must:

- accept only a genuine bounded byte sequence / array-like byte value that can be safely indexed in Apps Script V8;
- avoid Node-only constructors or APIs in deployed `.gs` source;
- require a finite non-negative integer `length` within a defensible runtime bound;
- reject sparse/missing elements and non-numeric values;
- require every consumed element to be an integer in either signed byte range `-128..127` or unsigned byte range `0..255`;
- normalize unsigned values `128..255` to the signed byte values expected by Apps Script Blob APIs, while preserving already-signed values;
- copy only the bounded prefix permitted by `byteLimit` and set `transport_truncated=true` when the source is longer;
- pass the validated byte array directly to `Utilities.newBlob(bytes).getDataAsString('UTF-8')`;
- never call `Utilities.base64Decode*()` for an already-materialized byte sequence;
- never serialize the bytes, body, or any fragment of them into an error, log, report, or Git evidence.

Do not accept arbitrary objects merely because `String(value)` or JSON serialization looks numeric. If an Apps Script-native array-like shape cannot be safely recognized with a narrow predicate, stop and report a BLOCKER rather than adding broad duck typing.

#### C. Explicit String/base64url path

Preserve the Work 0016 strict string path for explicit string representations used by REST-style clients or test fixtures.

It must continue to:

- accept only valid base64url alphabet and valid terminal padding structure;
- add only the exact missing `=` count;
- reject impossible length remainder `1`, misplaced/excess padding, standard-base64-only `+` or `/`, whitespace, and malformed values;
- call `Utilities.base64DecodeWebSafe()` only after strict normalization;
- retain bounded truncation behavior;
- return the same fixed privacy-safe non-retryable `E_GMAIL_BODY_DECODE` on malformed input.

#### D. Shared error and privacy contract

Any unsupported type, invalid byte element, decode failure, Blob conversion failure, malformed string, or unsafe representation must fail closed with the fixed safe code/message. Do not include input values, indices, snippets, Gmail identifiers, or raw exceptions in user-visible or tracked evidence.

### 3. Add representation-accurate regression coverage

Strengthen the Phase 2 test harness so it no longer models only the REST/base64url string path.

At minimum cover:

- signed Apps Script-style byte array containing Japanese UTF-8 text;
- unsigned `0..255` array normalized to signed bytes;
- an `Int8Array` or equivalent typed-array-like fixture where compatible with the local V8 test model;
- a narrow generic array-like fixture only if the deployed predicate intentionally supports that exact shape;
- proof that byte-sequence input never calls the base64 decoder;
- proof that string input still uses the strict base64url decoder;
- padded and unpadded string fixtures;
- URL-safe alphabet;
- invalid element types, floats, NaN/infinity, values below `-128`, values above `255`, sparse sequences, invalid length, and unsupported objects;
- empty body behavior;
- Japanese UTF-8;
- exact truncation flag and bounded output;
- attachment exclusion before body conversion;
- fixed safe error with no body/credential/identifier leakage;
- current worker PREPROCESSED/idempotency/privacy tests.

The local Utilities shim must be strict enough to fail if production code accidentally double-decodes a byte sequence.

### 4. Preserve product behavior outside the defect

Do not change:

- Gmail selection/query policy;
- exact-message label semantics;
- MIME attachment exclusion;
- Message State schema or state machine;
- Task or authority-ledger logic;
- Review flow;
- Calendar behavior;
- Automation defaults;
- external AI Provider behavior;
- Setup/Diagnostic/Dashboard behavior;
- Schema `2.6`, AI Schema `2.0`, Migration `3`, unless a concrete unavoidable compatibility reason is proven and recorded.

### 5. Candidate/release identity

Because deployed product bytes must change, create the minimal next coherent pre-pilot candidate under the existing repository convention, normally Code `2.8.14-prepilot` with unchanged Schema `2.6`, AI Schema `2.0`, and Migration `3`.

Keep source, manifest, current contract/status, checksums, deterministic packages, release manifests, verifiers, lineage, and documentation internally consistent.

Use the next valid source/release lineage identifiers under the repository's established convention. Do not rewrite or relabel Work 0016 history.

### 6. Local validation before any Google mutation

Run at minimum:

- targeted Gmail body representation/decoder tests;
- affected Phase 2 worker tests;
- all existing Gmail policy, privacy, retry/dead-letter, and relevant historical placement regressions;
- complete Node regression collection;
- complete local verification gate;
- Apps Script syntax/inventory validation;
- release/checksum/parity and direct-child lineage verification;
- secret/local-state scan;
- `git diff --check`;
- any focused fresh-checkout or committed-LF checks required by existing convention.

Record exact commands/counts/results in the report. Do not claim any check that was not run.

### 7. Pre-Google commit, push, and CI

Before any Google mutation:

1. commit the complete source/test/release repair;
2. push the exact pre-Google head;
3. require both applicable push and PR GitHub Actions runs on that exact head to succeed;
4. confirm the worktree is clean and the exact candidate/inventory is stable.

If exact-head CI is not green, do not touch Google.

### 8. Existing-target placement — one bounded sequence

Only after all local and CI prerequisites pass:

- reuse only the existing personal-synthetic Work 0010+ bound target;
- do not create a new Spreadsheet, Apps Script project, account, auth profile, deployment, or Cloud project;
- use existing non-interactive personal clasp authorization only;
- require the actual project-local clasp native eligibility gate immediately before push;
- require exactly `22` `.gs` files plus `appsscript.json`, missing `0`, extra `0`;
- perform at most one guarded push;
- require semantic evidence for all `23` canonical files;
- optionally perform at most one independent pull-back and require exact `23`-file byte/hash parity;
- do not retry after an attempt begins;
- preserve all target/account/ID details outside Git and chat evidence.

## Explicitly prohibited in Work 0018

- no Gmail search, message read, body decode runtime test, manual import, failed-message access, relabeling, deletion, or retry;
- no Mock vertical or Apps Script function invocation;
- no Task/Review/Calendar workflow;
- no Setup/Continue Setup;
- no Quick/Deep Diagnostic or Dashboard refresh;
- no trigger mutation or Automation enablement;
- no external/production AI request or configuration;
- no new target, account, auth profile, deployment, or Cloud-project change;
- no company/production resource or real data;
- no cleanup of Work 0015/0017 artifacts;
- no merge, release-to-production, pilot activation, rebase, history rewrite, or force push.

## Subagent rule for this Work

This committed handoff overrides repository custom-agent defaults for Work 0018:

- do not invoke repository-defined Luna or Terra custom agents;
- use standard Codex subagents only when materially useful for bounded, non-overlapping inspection/implementation/verification;
- do not duplicate the same review through multiple agents.

## Acceptance

PASS requires all of the following:

- the decoder distinguishes byte-sequence and string inputs before String coercion;
- real-style byte fixtures decode directly without any base64 call;
- strict string/base64url behavior remains intact;
- malformed/unsupported values fail closed with fixed privacy-safe `E_GMAIL_BODY_DECODE`;
- attachment exclusion, truncation, Message State, privacy, and worker behavior remain intact;
- coherent next pre-pilot candidate/release identity is produced;
- focused and full local validation pass;
- exact pre-Google head push/PR CI pass;
- one existing-target guarded push succeeds with exact 23-file semantic evidence;
- optional pull-back, if used, has exact parity;
- Gmail runtime operations remain `0`;
- Automation remains OFF;
- no prohibited operation occurs;
- final worktree is clean.

Highest permitted status:

`READY_FOR_CONTROLLED_ADVANCED_GMAIL_BYTE_BODY_RETEST`

## Stop/escalation conditions

Stop and report a precise BLOCKER without workaround if:

- the real Apps Script byte representation cannot be supported with a narrow, testable predicate;
- the fix would require UrlFetch, broader OAuth, a second Gmail API path, or a permissive fallback;
- candidate/release lineage cannot be made coherent;
- any local/CI/release/parity/secret check fails materially;
- the existing target or auth identity is ambiguous;
- the native inventory is not exactly 23 canonical files;
- a second push/pull/target/account would be required;
- any Gmail runtime access would be required to complete this Work;
- private values appear in tracked output or evidence.

## Git and report requirements

Create and commit:

`docs/handoffs/0018-report.md`

The report must include:

- final status and BLOCKER;
- exact root cause and representation contract implemented;
- changed files at a high level;
- candidate/release identity and lineage;
- focused/full validation and CI evidence;
- existing-target push/pull attempt counts and parity;
- explicit Gmail/runtime/AI/Calendar/Automation operation counts;
- privacy/prohibited-operation evidence;
- remaining boundary for a separately authorized fresh runtime retest.

Then:

- push all completed Work 0018 commits to `codex/0018-advanced-gmail-byte-body-repair`;
- update the Draft PR with instruction/report links, final head, candidate identity, checks, and attempt counts;
- verify final report-head GitHub Actions;
- keep the PR Draft/Open/Unmerged;
- confirm a clean worktree;
- do not merge.

Return only:

Work ID
Report path
Final commit
Branch
PR
BLOCKER status
