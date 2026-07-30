# Google Workspace Personal Work OS v2
# 2.8.7-prepilot Sandbox Quickstart

## Status and boundary

This is a `TEST_MODE=true` candidate package for independent re-audit.

- Code: `2.8.7-prepilot`
- Schema: `2.6`
- AI Schema: `2.0`
- Migration: `3`
- Task schema: `50` physical columns
- Authority store: protected hidden `Task Authority Ledger` with `21` columns
- Authority protocol: versioned two-slot `PREPARED` / Task row write /
  `COMMITTED`
- Snapshot-cell fallback: `FORBIDDEN`
- Automation: `OFF`
- Highest local status: `PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC`

Package generation does not execute a real Google Workspace test. Do not call
any real Workspace outcome `PASS` unless an independent human records the
corresponding non-sensitive evidence. This guide does not authorize deployment,
`clasp push`, production configuration, Phase 8B GO/PASS, Phase 8C GO, or a
pilot.

## 1. Preconditions

- Use only a new, non-production Spreadsheet and an approved non-production
  account.
- Use synthetic or non-sensitive data only. Do not use real email, real Tasks,
  attachments, personal information, credentials, IDs, or internal URLs.
- Keep `TEST_MODE=true` and Automation `OFF` throughout the candidate review.
- Do not configure a real provider, model, endpoint, or credential.
- Do not create a time-driven trigger or enable automation.
- Do not deploy or upload this package without the separately recorded human
  approval required by the operating environment.

If any condition cannot be met, stop and record `NOT EXECUTED` rather than
altering the package or its safety defaults.

## 2. Inspect the package before any placement

1. Open `DEPLOYMENT_MANIFEST.md` and confirm the repository, Source commit,
   versions, status cap, and authority rows above.
2. Recompute or independently check `CHECKSUMS.sha256`.
3. Confirm that `apps-script/` contains exactly 22 `.gs` files and
   `appsscript.json`.
4. Confirm that no `.clasp.json`, credential, archive, test fixture, real ID,
   or local environment file is present.
5. Stop on any mismatch. Never merge a package into an existing package folder.

## 3. Candidate sandbox review sequence

The following sequence is a manual review plan, not evidence that it ran.

1. Confirm the candidate project shows `TEST_MODE=true` and Automation `OFF`.
2. Run Setup only after the reviewer has approved its documented Sandbox-side
   effects. Setup must preserve valid authority, recover only a durable prepared
   transaction, and quarantine invalid authority; it must not silently
   rebaseline Task data.
3. Confirm canonical Task header rows 1 and 2 and the 50-column schema.
4. Confirm the `Task Authority Ledger` is hidden and protected, and contains
   the 21-column canonical schema.
5. Run Quick Diagnostic and Deep Diagnostic as observation paths. They use the
   common authority validator and must not repair by trusting visible snapshots.
6. Use the Manual Acceptance Guide to record the required authority and Setup
   fault-injection
   observations as `PASS`, `FAIL`, or `NOT EXECUTED`.

## 4. Required authority observations

For each observation, retain only safe error codes and non-sensitive evidence.

- A normal Task write must leave one durable committed ledger generation.
- A fault after `PREPARED` and a fault after the Task row write must recover
  from the ledger or quarantine; neither may create an untrusted baseline.
- Missing or malformed authority must not fall back to
  `authoritative_snapshot_json` or a cell note.
- In a mixed multi-row edit, valid-authority peers must be restored and an
  invalid row must be quarantined or unrecoverable. Isolated rows are excluded
  from Worker, Review, and Calendar processing.
- Header row 1 or 2 edits must be restored to the canonical IDs and labels.
- A current Schema 2.6 Task without authority must fail closed. Migration 3 may
  use legacy note anchoring only for the explicit Schema 2.5 migration boundary.
- On a new or S00/S10-only Sandbox, Setup must hide and protect the Ledger
  before authority validation. Do not manually hide the Ledger as a workaround;
  record a safe error and stop if the control plane cannot be established.

## 5. Stop, rollback, and reporting

1. Stop the candidate review on an authority mismatch, unexpected OAuth scope,
   unknown existing data, ownership conflict, or missing rollback source.
2. Keep Automation `OFF`; do not attempt to repair a failed authority check by
   editing raw Task rows or visible snapshots.
3. Record only safe error codes and timestamps. Never store screenshots, IDs,
   mail content, credentials, OAuth details, or internal URLs.
4. Do not delete or overwrite a pre-existing worksheet, package, or repository
   artifact as a workaround.
5. Record real Workspace items not performed as `NOT EXECUTED`.

Completion of local checks or this manual review plan leaves the maximum status
at `PHASE8B_SANDBOX_NO_GO_QUICK_DIAGNOSTIC` until remote publication and fresh-clone proof.

See [Manual Acceptance Guide](MANUAL_ACCEPTANCE_GUIDE.md) for the detailed
independent-review record.
