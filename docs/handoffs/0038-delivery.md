# Work 0038 — Company Delivery Record

WORK_ID: `0038`

Dispatch ID: `N/A`

BALL: `USER`

STATUS: `READY_FOR_COMPANY_TRANSFER`

## Delivery package

Branch: `delivery/0038-company-live-bundle`

Commit: `ede198f216476a1864f275ea8192fa9134df7f94`

The branch is intentionally a minimal transfer tree rather than a development branch.

## Contents

- `README_FIRST.md`
- `COMPANY_LIVE_DEPLOYMENT_GUIDE.md`
- `CHECKSUMS.sha256`
- `DEPLOYMENT_MANIFEST.md`
- `PHASE8C_SANDBOX_GUIDE.md`
- `apps-script/` containing the exact Phase 8C runtime: 22 `.gs` files plus `appsscript.json`

## Identity proof

The delivery branch `apps-script/` tree is Git tree:

`864cb41ab556d9f2914e63acf49ff4926b169d00`

This is the exact same tree object used by:

`implementation/GoogleSpreadsheet/release/v2.8.25-prepilot-phase8c/apps-script/`

on the canonical Work 0037 release. Therefore the delivered runtime files are byte-identical to the validated Code `2.8.25-prepilot` Phase 8C runtime; there is no company-specific code fork in this transfer.

The original `CHECKSUMS.sha256`, `DEPLOYMENT_MANIFEST.md`, and Phase 8C guide are reused by exact Git blob identity.

## Security boundary

The bundle contains no:

- Gemini/API credential;
- `.clasp.json` or clasp login state;
- personal or company account identifier;
- Spreadsheet, Script, Calendar, Gmail, or Message ID;
- private/internal URL;
- personal or company message content;
- runtime state from the personal environment.

The company-approved Gemini credential must be entered only on the company PC in the new Apps Script project's Script Properties under `WORK_OS_V2_GEMINI_API_KEY`.

## Company runtime expectation

The unchanged validated provider contract currently expects:

- provider: `GEMINI`;
- endpoint: `https://generativelanguage.googleapis.com/v1beta/interactions`;
- model: `gemini-3.6-flash`;
- prompt version: `gemini-interactions-v1-work-os-v2`.

If the company's approved Gemini service does not allow that exact endpoint/model, stop before Automation enablement and return the bounded readiness/error token to Work 0038. Do not locally patch or substitute a provider/model.

## Transfer and next ball

The package is ready to be downloaded on or sent to the company PC. Actual company-account setup and live operation are user-controlled under `docs/handoffs/0038-instruction.md`.

WORK_ID: `0038`

Dispatch ID: `N/A`

BALL: `USER`

STATUS: `READY_FOR_COMPANY_TRANSFER`
