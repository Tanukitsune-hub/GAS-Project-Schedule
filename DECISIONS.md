# Decisions

Last updated: 2026-07-31

This file records current governing decisions. Superseded detail remains
available in Git history and is not silently reinterpreted as a current gate.

## D-036 — GitHub is the formal ChatGPT–Codex handoff medium

**Decision.** Save task instructions under `instructions/`, re-read the exact
GitHub path before work, and return evidence to the same repository. A short
handoff message must name repository, branch, path, required gate, and
prohibitions. The detailed rule is
`CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`.

**Rationale.** Conversation text alone is not a durable, auditable task
specification. This prevents branch/path ambiguity and preserves historical
instructions.

**Consequence.** The exact GitHub instruction named by the current handoff is
the task-specific specification; older indexes and their numbered documents
remain historical unless explicitly selected by that handoff. No legacy
`context-hub` location participates.

## D-041 — Quick Diagnostic recognizes only canonical Setup control planes

**Decision.** The Dashboard pre-refresh surface is safe only when the exact
Setup-owned sheet protection, exact rows 1–2 header protection, and exact
three-row `DASHBOARD_LEGACY_SEED_ROWS` are present. Task validation derives all
checkbox columns from the canonical schema, and identity-empty Task rows may
contain only canonical checkbox Boolean `false` values materialized by Sheets.

**Rationale.** The real Sandbox observations showed false findings when a
valid runtime control plane and empty-checkbox representation were interpreted
by stale, hard-coded diagnostic contracts. Broadly changing FAIL to WARN, or
accepting arbitrary data with familiar keys, would weaken the safety boundary.

**Consequences.** Foreign/duplicate/malformed protections, user values,
formulas, notes, named ranges, merges, hidden state, non-default formatting,
missing/unexpected checkbox validation, `true`, string boolean, non-checkbox
data, and partial identity all remain fail-closed. S00–S80 can be preserved;
S90/S99 may resume only through normal Setup. Automation remains OFF. The
v2.8.7 A7/B7/T7 chain was verified, but its exact editor-count ownership rule
was later superseded by D-042 and `PHASE8B-DASHBOARD-01`.

## D-042 — Dashboard Protection ownership uses proven owner capability, not an editor count

**Decision.** A canonical Dashboard sheet or header Protection is safe only
when Spreadsheet owner and effective user are both available and internally
equal, `Protection.canEdit()` is true, warning-only and domain edit are false,
target audiences and unprotected ranges are empty, and geometry/description
match exactly. The explicit editor list may be empty for the proven implicit
owner, or contain exactly that owner. It may not contain a blank, foreign, or
additional editor. Shared Drive / unavailable owner remains fail-closed.

**Rationale.** Apps Script exposes the owner’s inherent edit capability
separately from the ordinary explicit editor list. Therefore
`getEditors().length === 1` is not a valid cross-runtime ownership proof and
caused the real canonical S20/S30/S40 Dashboard to fail S90.

**Consequences.** Diagnostics never expose owner/editor identities. They emit
only the closed access modes `OWNER_IMPLICIT_CAN_EDIT` or
`OWNER_EXPLICIT_EDITOR`, or safe enum reason/subreason codes and numeric
counts. Foreign editors, domain edit, target audiences, warning-only
protection, duplicate/wrong/overlapping protections, named ranges, values,
formulas, validation, notes, merges, hidden state, background, font, number
format, and seed/marker mismatch remain fail-closed. Quick Diagnostic remains
read-only. Source A8 `4140054b03c850f4a1e669b3aa562b305ef78bf5`,
direct-child Release B8 `a17d34422ed521cee81340902d9a19e2da372201`,
and fixed transfer T8 `69f843f6ea426ccb45d721a40508a35b0a59795d`
completed normal publication, GitHub resolution, and detached HTTPS
fresh-clone verification. The resulting maximum status is the carriage-only
`READY_FOR_PHASE8B_SANDBOX_RETRANSFER`; real Workspace retransfer/retest
remains `NOT_EXECUTED`.

## D-037 — Independent Task Authority Ledger with two-slot recovery

**Decision.** `タスク一覧` remains the business-facing workflow surface, while a
protected hidden `Task Authority Ledger` is the sole technical authority for
current Task recovery. Each record uses Slot A/Slot B with durable
`PREPARED` / `COMMITTED` transition metadata. Canonical JSON serialization,
bounded ledger scans, and a maximum snapshot size are mandatory.

**Compatibility rule.** A historical Schema 2.6 insertion-order hash is
accepted only when it verifies the same protected ledger slot. The next normal
write creates a canonical-hash generation. This never permits a visible Task
row, cell note, or snapshot cell to regenerate authority.

**State transitions.**

| State / event | Durable action | Recovery rule |
|---|---|---|
| `IDLE` active slot → update | Write inactive slot and transaction metadata as `PREPARED` | No Task-row write if this fails before persistence. |
| `PREPARED` → row write | Perform one full Task-row `setValues` write | Re-read ledger and Task row; promote only if prepared row is proven, otherwise roll back only if committed row is proven. |
| Row confirmed → `COMMITTED` | Promote the prepared slot and clear transaction fields | A before/after error is retried once from durable evidence; unresolved evidence is isolated. |
| Row move | Rebind only `physical_row_hint` | Do not rewrite the Task row or create a new generation. |
| Physical row deleted | Mark ledger record `ORPHANED` and clear its live physical hint | Never recreate the Task from a snapshot; exclude Worker, Review, and Calendar. |
| Missing / duplicate / invalid authority | Durable `QUARANTINED` or `UNRECOVERABLE` isolation | Do not fall back to snapshot cell, note, or raw row. |

**Migration rule.** Migration 3 may seed a Schema 2.5 record exactly once from
its independently stored legacy note anchor. Current Schema 2.6 rows never
rebaseline from editable state. Migration reuses the shared validator and a
bounded Task-ID observation pass before ledger-only orphan reconciliation.

**Risk acceptance.** Real Google Workspace failure modes—Sheet protection,
row deletion/sort behavior, installable triggers, LockService, Gmail, and
Calendar—remain `NOT_EXECUTED` after independent re-audit unless separately
authorized. `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER` prohibited reuse of the
historical P10 package while the corrected 2.8.6 chain was verified. The
  verified T6.1 ref is historical evidence. The v2.8.7 A7/B7/C7/T7 chain has
  passed its own source/release/transfer/fresh-clone verification and is
  `READY_FOR_PHASE8B_SANDBOX_RETRANSFER`. It is not execution authorization.
  The local fake runtime establishes regression evidence only.

## D-039 — Calendar authority loss requires durable arm and owned-event-only compensation

**Decision.** Immediately before external Calendar I/O, the worker must take a
short lock-held read through the same fail-closed Task Authority Ledger
validator used by all other Task consumers. A valid job writes
`DEADLINE_CALENDAR_ARMED`, its deterministic Event ID, and the current claim
fingerprint before I/O. If authority becomes excluded after that arm, the
Outbox must persist `DEADLINE_CALENDAR_AUTHORITY_COMPENSATION` and may delete
only an Event whose deterministic ID and ownership both verify.

**Rationale.** A visible Task row cannot prove authority after a concurrent
edit, deletion, or quarantine. An unmarked external side effect could be lost
across a crash or overwritten by concurrent enqueue. A foreign Event must not
be treated as a Work OS artifact.

**Consequences.** Known authority exclusion before I/O is a durable
`CANCELLED` result with zero Calendar calls. Compensation never writes a Task
acknowledgement, retains its target type through `DEAD` and manual retry, and
fails closed on a foreign Event. The protocol is specified in
`docs/CALENDAR_OUTBOX_AUTHORITY_LOSS_PROTOCOL.md`; F016 local tests provide
regression evidence only. This decision does not approve any real Calendar,
OAuth, deployment, Automation, Phase 8B, Phase 8C, production, or pilot work.

## D-040 — Setup owns Ledger control-plane establishment

**Decision.** Before any Setup authority validation that requires a hidden and
protected `Task Authority Ledger`, Setup itself must establish that control
plane idempotently.  S20 performs it after canonical schema application and
before validation; S30 reasserts it with layout controls; a completed Setup
rerun reasserts it before its pre-loop authority validation.  The operation is
limited to canonical Ledger protection and hidden visibility.

**Rationale.** The historical P10 `2.8.5-prepilot` first-time Setup created the
Ledger and its schema but invoked the strict validator before the later S30
visibility operation.  It safely stopped with
`E_TASK_AUTHORITY_LEDGER_NOT_HIDDEN` at `TASK_AUTHORITY` after S00/S10.  A
manual hide or a general runtime repair would hide the ordering defect and
expand trust outside Setup.

**Consequences.** Visibility/protection write failures are deterministic S20
failures and S20 is not recorded complete.  The validator remains fail-closed;
Worker, Review, Calendar, diagnostics, Migration, and edit restoration do not
gain a silent repair path.  The operation never trusts or regenerates
authority from a Task raw row, note, or snapshot cell.  The P10 package and
transfer evidence remain immutable historical failures.  Automation stays OFF;
the package-generation gate was `PHASE8B_SANDBOX_NO_GO_SETUP_BLOCKER` until
the separate 2.8.6 source/release/transfer chain was independently verified.
  That result and the later v2.8.7 fixed transfer ref T7 are historical.
  T7 reached the carriage-only `READY_FOR_PHASE8B_SANDBOX_RETRANSFER` status
  at that point; it is not a current execution target and never authorized a
  real Workspace action.

## D-043 — Dashboard number format is a Setup-owned deterministic control plane

**Decision.** The exact 17×3 Dashboard system block has one deterministic
plain-text format contract. Setup alone may establish it, immediately before
S90, only after canonical schema, owner-proven sheet/header Protection, exact
seed or owned/versioned state, and every other surface check are safe.

**Rationale.** The real Sandbox number-format finding was bounded exactly to
the system surface. Diagnostics correctly detected it but cannot safely infer
ownership or repair it. Broadly accepting default or arbitrary formats would
hide foreign changes and weaken the fail-closed boundary.

**Consequences.** Quick/Deep Diagnostic remain read-only and require the
format contract exactly. Empty, foreign, ambiguous, or API-unavailable states
remain fail-closed with closed non-sensitive enum/count output; no cell outside
the exact block is written. S00–S80 resume preserves existing resources,
Automation remains OFF, and real Workspace verification is `NOT_EXECUTED`.

## D-044 — Historical v2.8.9 transfer status was carriage-only after fixed-ref proof

**Decision.** Corrected Source A9.1, direct-child corrected Release B9.1, and
fixed T9 must be normal-published and independently checked from a detached
HTTPS clone before the canonical status becomes
`READY_FOR_PHASE8B_SANDBOX_RETRANSFER`.

**Rationale.** The status depends on source/release boundary proof, package
parity and checksums, raw Git-blob company-PC patch parity from fixed T8,
allow-list/provenance/secret scans, and a fresh clone—not on a previous local
report or an observed Workspace operation.

**Consequences.** The resulting status permits only carriage of the
non-sensitive Phase 8B Sandbox retransfer envelope. It does not declare Phase
8B PASS, Phase 8C GO, production readiness, or pilot readiness. Real Google
Workspace, OAuth, import, Setup, Diagnostic, Dashboard refresh, Gmail,
Calendar, deployment, trigger enablement, and Provider configuration remain
`NOT_EXECUTED`.

## D-045 — S90 format writes require explicit visibility and aligned modules

**Decision.** A permitted Setup-only write to the exact 17×3 Dashboard system
block must be followed by exactly one `SpreadsheetApp.flush()`, a newly
acquired exact Range, and a strict 51-cell canonical postcondition before S90
continues. Config, Setup, and Dashboard independently expose one matching
v2.8.10 S90 module-contract identifier; mismatch fails before a write as
`E_MODULE_VERSION_SKEW`. Flush unavailable/failure or a noncanonical reread
fails as `E_DASHBOARD_NUMBER_FORMAT_POSTCONDITION`.

**Rationale.** The real Sandbox repeated the bounded 51-cell finding after the
historical v2.8.9 transfer. The immutable v2.8.9 implementation wrote and
immediately reread without flushing or reacquiring a Range, while its fake
runtime applied writes synchronously. In addition, the manually replaced
files provided no product-level proof that all S90-critical modules were one
compatible version. The safe observation alone therefore cannot distinguish
queued-write invisibility from a partial module replacement.

**Consequences.** A canonical block performs no write and no unnecessary
flush. Quick/Deep Diagnostic remain read-only and perform no repair. Setup
evidence is restricted to a closed normalization state,
write/flush/postcondition Booleans, checked-cell count, and noncanonical count;
it excludes locale, actual format strings, content, addresses, IDs, URLs, and
identities. T9 remains immutable historical evidence but is superseded as an
execution target. A10 `33b9ecee5b0957615fcc27fc822bf7d10a74c86f`,
direct-child B10 `3f4fe6c52be7bf9c66ad221594e6271feebb57ed`, and fixed
T10 `927d8567bce64461840cc6f72fbae0c1e636a8e6` passed normal
publication and detached-clone proof. This evidence-only commit records that
closure and is not a transfer target. The resulting
`READY_FOR_PHASE8B_SANDBOX_RETRANSFER` gate is carriage-only; real Workspace
retransfer/retest remains `NOT_EXECUTED`.

## D-046 — Observed Setup evidence advances only the controlled manual-acceptance gate

**Decision.** The closed 0001 observation from one controlled non-production
Sandbox may be recorded as a PASS for Setup S00-S99, the in-Setup S90 module
alignment/normalization postcondition, and S60/S80 as Setup stages only. It
sets the current governance gate to
`READY_FOR_PHASE8B_CONTROLLED_MANUAL_ACCEPTANCE` while keeping fixed T10
`927d8567bce64461840cc6f72fbae0c1e636a8e6` immutable as the payload and
transfer anchor.

**Rationale.** The operator-reviewed observation is deliberately limited to
closed stage names, enums, Booleans, and counts. It confirms the former
51-cell Dashboard blocker did not recur in that Setup run, but does not
observe standalone diagnostics, functional edit-trigger behavior, Gmail,
Calendar reconciliation, locking, authority faults, or Provider behavior.

**Consequences.** Only separately approved, staged manual acceptance using
synthetic non-sensitive data may be proposed or executed. Automation and a
five-minute trigger remain `OFF` / `NOT_AUTHORIZED`; external AI, real data,
deployment, `clasp push`, Phase 8C, production, and pilot use remain outside
authorization. Phase 8B overall PASS is `NOT_DECLARED`. No screenshot,
identity, Workspace ID/URL, actual data, locale, or format string is retained
in the repository. The earlier Calendar safe stop is not assigned an
unobserved root cause or resource sequence.
