# R5 Transfer Checksum Portability Correction

Date: 2026-07-29
Repository: `Tanukitsune-hub/GAS-Project-Schedule`
Governing instruction: `instructions/GoogleWorkspace_v2_8_5_Independent_Reaudit_and_Company_PC_Transfer_Preparation_2026-07-29.md`
Historical P7 evidence commit: `45bb4b938b02f2fd56d5d57267f4083a46f5176b`
Correction commit: `SELF`

## Finding and immediate gate

Finding: `REAUDIT-TR-01`
Severity: Medium — company-PC-transfer safety
P8 conclusion: `REAUDIT_NO_GO`

P7 introduced `TRANSFER_CHECKSUMS.sha256` using raw checkout-byte hashes. Its
new fresh clone successfully reproduced the source, package, provenance, test,
and remote checks, but the transfer-documentation hashes did not match when
text had a different line-ending checkout form. The 8B release package itself,
its `CHECKSUMS.sha256`, its payload hash, its tree hash, and the 27-file
allow-list were unaffected.

Because a company-PC operator could see a false integrity failure, P7 is not a
transfer authorization. The historical P7 commit and report are retained
unchanged; no reset, amend, rebase, force push, or unrelated revert is used.

## Correction design

`tools/verify_phase8b_transfer_envelope.ps1` defines the operator-documentation
digest as SHA-256 over UTF-8 text after normalizing `CRLF` and `CR` to `LF`.
The checksum file covers exactly the seven non-self transfer files, rejects a
self-entry, rejects duplicates or paths, and requires an exact inventory.

This is intentionally separate from release package verification. The immutable
Phase 8B package remains byte-verified by its own manifest and checksum file;
the transfer envelope is portable human/operator documentation outside that
package.

## P8 boundaries and required P9 proof

P8 changes only canonical status/audit/transfer documentation and the new
portable-checksum verifier. It changes no Apps Script payload, release package,
Phase 8C candidate, Automation setting, deployment state, or real Workspace
configuration.

Before a transfer-only READY status is restored, P8 must be normal-pushed and
verified in a new fresh clone. Then P9 may write the canonical checksum values,
restore the transfer-only gate, normal-push, resolve the final remote SHA, and
perform another fresh-clone validation of the exact final HEAD.

## Not executed

No real Google Workspace access, OAuth consent, deployment, `clasp push`,
Automation/trigger enablement, real Provider configuration, real data, or
company-PC transfer was performed.
