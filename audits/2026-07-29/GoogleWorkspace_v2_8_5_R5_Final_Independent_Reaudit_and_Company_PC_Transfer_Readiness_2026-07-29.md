# Google Workspace v2.8.5 R5 Final Independent Re-audit and Company-PC Transfer Readiness

Date: 2026-07-29
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Instruction: `instructions/GoogleWorkspace_v2_8_5_Independent_Reaudit_and_Company_PC_Transfer_Preparation_2026-07-29.md`
Fixed audit target: `3442ac01f5c544c2b49a40a9af170d1f432312f1`
Final status: `READY_FOR_PHASE8B_SANDBOX_TRANSFER`

## Conclusion and scope

The fixed P5 target, A5.2/B5.2 provenance, final A5.4/B5.4 correction, and
normally published P9 transfer-envelope evidence were independently checked
from a new HTTPS clone. No unresolved Critical, High, or company-PC-transfer-
safety Medium finding remains in the audited local/static scope.

This status permits only carriage of the exact non-confidential Phase 8B
package through a company-approved route. It is not Phase 8B PASS, Phase 8C
GO, production/pilot ready, OAuth consent, deployment, `clasp push`,
Automation/trigger enablement, Provider setup, or real Workspace execution.

## Git lineage and publication

| Role | SHA / independent result |
|---|---|
| Corrected Source A5.2 | `ff658bacf1e85864e4008efa32863635e446d47d`; direct parent of B5.2. |
| Corrected Release B5.2 | `d6dda2b3eb9307e7033dcdd5f4718260c4944451`; historical P5 parent. |
| Fixed P5 | `3442ac01f5c544c2b49a40a9af170d1f432312f1`; fixed-ref `REAUDIT_NO_GO` evidence retained unchanged. |
| Final Source A5.4 | `6c4f737c676b3121c42aafabe9d0c677cacd69bb`; durable Calendar compensation correction. |
| Final Release B5.4 | `3e5790672740626f3bec4592c3c7c0b86b47f3b1`; direct A5.4 child, 27 8B files / 25 8C files / one Round 5 report. |
| P6 publication | `12538796fed90eb7f95492d477cca44a5d859291`; normal publication and fresh-clone proof retained. |
| P7 historical finding | `45bb4b938b02f2fd56d5d57267f4083a46f5176b`; raw-byte checksum mismatch retained, never a transfer authorization. |
| P8 correction | `784b293c50713597a656bc7d9d1ae51fdaa26f1a`; canonical UTF-8/LF checksum verifier passed in a fresh clone. |
| P9 final-head evidence | `ab6b1db8c0d7cc3f0df6bc104cfee39392787d4b`; normal push, GitHub resolution, and fresh-clone re-audit PASS. |
| P10 report | `SELF`; records the P9 proof and transfer-only gate. |

No reset, clean, rebase, amend, force push, unrelated revert, deployment, or
real Google Workspace operation was used.

## Findings disposition

| Finding | Severity | Disposition |
|---|---|---|
| `REAUDIT-CAL-01` | High | Resolved in A5.4/B5.4: final shared-ledger validation before Calendar I/O; excluded authority is `CANCELLED` with zero I/O. |
| `REAUDIT-CAL-02` | High | Resolved in A5.4/B5.4: compensation target, deterministic owned Event ID, `DELETE`/`PENDING`, and zero Task patch survive later forced re-enqueue. |
| `REAUDIT-TR-01` | Medium | Historical P7 raw-byte portability defect; resolved by P8 canonical text hashing and P9 fresh-clone proof. |
| Critical / other High / transfer Medium | — | No unresolved finding in the local/static scope. |

## Independent validation from the P9 fresh clone

| Check | Exact result |
|---|---|
| Git lineage and remote SHA | PASS; remote and clone HEAD `ab6b1db8c0d7cc3f0df6bc104cfee39392787d4b`. |
| Full test suite | 41 suites; 611 PASS / 0 FAIL / 11 explicit fake-runtime or real-Workspace skips. |
| F016 fault injection | 12 PASS / 0 FAIL. |
| Apps Script validator | 11/11 PASS; 22 `.gs` files. |
| Remote publication consistency | 8/8 PASS. |
| PowerShell parser | 5/5 release/transfer tools parsed. |
| Phase 8B verifier | PASS; 27 package files / 23 payload; source parity, checksums, provenance, secret scan, `TEST_MODE=true`, Automation OFF. |
| Phase 8C verifier | PASS; 25 package files / 22 payload; transform parity, checksums, provenance, scope/service allow-lists, secret scan, `TEST_MODE=false`, Automation OFF. |
| Transfer envelope | PASS; seven non-self canonical UTF-8/LF checksum records, no duplicate/self/path record. |
| Allow-list and package tree | PASS; 27/27 paths and tree `1d6c78332c39734e8e5d05b30735d5379ba82b8f5d20556553064624d6292060`. |
| A5.4 rebuild byte parity | PASS; independent rebuild vs B5.4: 8B 27/27, 8C 25/25. |
| Secret/local-path scans | PASS; only three known synthetic fixtures were reviewed by the validator. |
| P8..P9 release boundary | PASS; no immutable release payload change. |

## Authority, Calendar, and Migration review

- Protected hidden 21-column `Task Authority Ledger` is the sole technical
  recovery authority; the visible 50-column Task row is a business projection.
- Slot A/Slot B `PREPARED` / one full row write / `COMMITTED` recovery is
  bounded. Snapshot cells, notes, and raw Task rows are not fallbacks.
- Setup, diagnostics, writes, edit restore, Migration 3, Worker, Review, and
  Calendar use the shared fail-closed validator; invalid authority is isolated.
- Migration 3 retains its Schema 2.5 legacy-note-only seed and no Schema 2.6
  silent rebaseline.
- Calendar arms durable Outbox intent before I/O; authority loss uses
  owned-event-only compensation and foreign Events fail closed.

## Package / transfer integrity

| Item | SHA-256 / condition |
|---|---|
| Phase 8B payload | `8c423f402ce8bb1de7aaa35ab70129b9af45c8abf1d0ccfe20dade8d44dea738` |
| Phase 8B tree | `1d6c78332c39734e8e5d05b30735d5379ba82b8f5d20556553064624d6292060` |
| Phase 8B `CHECKSUMS.sha256` | `1ecd877676d84bc6fc02bed60e090619c11b908aebd56805935edaf6c80a5a79` |
| Phase 8B manifest | `f305c8c5439cd1bfee425ea5130709380080ade5833d87b7dce29cadb73d3f66` |
| Phase 8C payload | `64e7ec4cf9d452db7c713275e0b2451ff194da9a737c539b8af96b324708ba10` |
| Transfer scope | Exact Phase 8B package plus transfer operator material only; Phase 8C, repository/source/tests/tools, credentials, real IDs/URLs, real data, and Provider settings excluded. |

## Canonical documents, limits, and review focus

The four root canonical documents, root authority/Calendar protocols,
verification matrix, source traceability, and Japanese transfer envelope agree
on Code `2.8.5-prepilot`, Schema `2.6`, AI Schema `2.0`, Migration `3`,
Automation OFF, 11 Sheets / hidden 5, 50 Task columns, 21 Ledger columns, and
the transfer-only status. Immutable package/source-copy `NO-GO` text remains
historical package-generation provenance and does not override this gate.

Real Workspace behavior, OAuth, deployment, `clasp push`, trigger/Automation
enablement, Provider setup, real data, credentials, personal information, and
unpublished information remain `NOT_EXECUTED`. Review A5.4/B5.4 and F016,
8B-only allow-list/canonical checksum, and the strict transfer-only meaning of
this status.
