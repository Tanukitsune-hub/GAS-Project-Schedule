# Current Verification Matrix — 2.8.13-prepilot

Gate: `READY_FOR_CONTROLLED_SANDBOX_VALIDATION`

| Requirement | Integrated mechanism | Primary executable evidence | Work 0002 status |
|---|---|---|---|
| Task write succeeds and ledger boundary fails | PREPARED/committed generation with rollback/recovery | `remediation_round4_test.js` | Local required |
| Missing/stale/malformed/generation-mismatched authority | mandatory ledger validator, no editable fallback | `remediation_round4_test.js`, `remediation_round5_test.js` | Local required |
| Live row and snapshot jointly tampered | ledger-only canonical hash | `remediation_round4_test.js` | Local required |
| Corrupt row in multi-row edit | per-row restore and quarantine | `remediation_round4_test.js`, `remediation_round5_test.js` | Local required |
| Task internal-ID/Japanese header corruption | canonical row 1/2 restoration | `remediation_round4_test.js` | Local required |
| Calendar enqueue/ack interruption | durable versioned Task intent and bounded recovery | Calendar failure-injection and recovery suites | Local required |
| Dashboard ownership and write visibility | exact surface ownership, flush, reacquire, readback | Phase 8B Dashboard suites | Local required; real Google pending |
| Diagnostic completeness/read-only | bounded sorted IDs, completeness flags, no write paths | T1-01 bounded-summary suite | Local required; real Google pending |
| Gmail exact-message behavior | exact-message ordering, idempotency, labels, checkpoints | Phase 2/3/6 and Gmail policy suites | Local required; real Gmail pending |
| Current version/gate/transfer state | one machine contract and active-document scan | `canonical_document_consistency_test.js` | Local required |
| Source/release parity and ancestry | A13→B13, manifests, checksums, exact transform | release verifiers and local gate | Local/fresh clone/CI required |
| Secret/local/clasp exclusion | tracked-path and content scan | `local_validation_secret_scan_test.js`, local gate | Local/fresh clone/CI required |

Historical fixed-transfer evidence remains immutable but is not current. Work
0002 has no active transfer, deployment, or company-PC target. Real Workspace,
Provider, pilot, production, and company-handoff acceptance remain pending.
