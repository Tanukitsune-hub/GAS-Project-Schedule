# Company handoff policy

## Current boundary

The development gate is `READY_FOR_LOCAL_CLASP_VALIDATION`: current-branch
CI and non-Google local validation passed, but the dedicated personal synthetic
dev target is not configured. Company handoff remains
`NO_GO_COMPANY_HANDOFF_PENDING_LOCAL_CLASP_VALIDATION`. There is no active
company transfer source. Instruction 0005 is
`SUPERSEDED_NOT_EXECUTED`: do not carry T11, replace five files, run a Company
Sandbox Quick Diagnostic, or perform any T11-based manual operation.

The local clasp gate is conducted only on a self PC against a personal,
synthetic, non-company development target. Its completion can reach at most
`READY_FOR_COMPANY_HANDOFF_REASSESSMENT`; it never automatically permits a
company-PC action.

## Future reassessment checklist

Only after an explicit future approval and the required local evidence may an
operator prepare a separate company-handoff instruction. That instruction must
name a newly authorized carriage source, exact byte hashes, a manual change
boundary, and a stop/rollback plan. It must not reuse this document as
authorization.

Before any company-side action, independently review:

- local non-Google verification and CI evidence;
- personal synthetic target attestation and its limitations;
- push/pull-back parity and, if applicable, safe runtime evidence;
- exact authorized source/ref and changed-file list;
- no secret, real identifier, URL, data, or screenshot storage;
- Automation and time-based triggers remain OFF; and
- a manual stop condition and recoverable rollback source.

## Company-side constraints

If a future instruction authorizes a company smoke step, it must be manual,
separately consented, minimal, and documented using only safe closed results.
It may not use the self-PC local clasp configuration, OAuth token, or dev
target. It may not create a deployment, push with clasp, alter production
configuration, enable Automation/triggers, use a provider, or process real
Gmail/Calendar/business data unless a future instruction explicitly and
independently authorizes that action.

Phase 8B PASS, Phase 8C GO, production readiness, and pilot readiness remain
not declared.
