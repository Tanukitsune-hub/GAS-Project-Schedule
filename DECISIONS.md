# Decisions

Last updated: 2026-07-28

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

**Consequence.** The remote-publication index and its six numbered documents
are the task-specific specification for this remediation. No legacy
`context-hub` location participates.

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
Calendar—remain `NOT_EXECUTED` until independent re-audit. The local fake
runtime establishes regression evidence only.
