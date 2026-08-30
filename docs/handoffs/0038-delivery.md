# Work 0038 — Company Delivery Record

WORK_ID: `0038`

Dispatch ID: `N/A`

BALL: `USER`

STATUS: `READY_FOR_COMPANY_TRANSFER`

## Delivery package

Branch: `delivery/0038-company-live-bundle`

Commit: `fd5bc3e61363dbae1ff98eda8ebbd12cdb371c76`

The branch is intentionally a minimal transfer tree rather than a development branch.

## Contents

- `README_FIRST.md`
- `COMPANY_LIVE_DEPLOYMENT_GUIDE.md`
- `CHECKSUMS.sha256`
- `DEPLOYMENT_MANIFEST.md`
- `PHASE8C_SANDBOX_GUIDE.md`
- `apps-script/` containing the exact Phase 8C runtime: 22 `.gs` files plus `appsscript.json`
- `QUICK_INSTALL/` containing the copy-ready `Code.gs`, `appsscript.json`,
  `BUNDLE_PROVENANCE.json`, and single-file `CHECKSUMS.sha256`

The preferred manual installation is exactly two paste actions:

1. paste `QUICK_INSTALL/Code.gs` into the default Apps Script `Code.gs`;
2. reveal `appsscript.json` and paste `QUICK_INSTALL/appsscript.json` into it.

No 22-file manual source recreation is required.

## Identity proof

The delivery branch `apps-script/` tree is Git tree:

`864cb41ab556d9f2914e63acf49ff4926b169d00`

This is the exact same tree object used by:

`implementation/GoogleSpreadsheet/release/v2.8.25-prepilot-phase8c/apps-script/`

on the canonical Work 0037 release. Therefore the delivered runtime files are byte-identical to the validated Code `2.8.25-prepilot` Phase 8C runtime; there is no company-specific code fork in this transfer.

The original `CHECKSUMS.sha256`, `DEPLOYMENT_MANIFEST.md`, and Phase 8C guide are reused by exact Git blob identity.

The quick-copy directory tree is `da75892220a1eb3f7148a58dec52df5237fd7d12`.
Its generated artifact identity is:

- `QUICK_INSTALL/Code.gs`: 1,190,034 bytes,
  SHA-256 `355f07522b55834353d92f69947524e356c07189e8a2ebf27ec8113709c147ce`;
- `QUICK_INSTALL/appsscript.json`: 868 bytes,
  SHA-256 `e546725fcfe47adfd40e094e66a6c866418cb6265441f541ee000c940d4a8afe`;
- `QUICK_INSTALL/BUNDLE_PROVENANCE.json`: SHA-256
  `60ef97190874f70bdbf9ff05a2a959177712d82439cd69762b3906ff79dbbec1`;
- `QUICK_INSTALL/CHECKSUMS.sha256`: SHA-256
  `38562ba40c7dbbd416ed272d8de62941c0e43c4737209193089d8c53e24d1c15`.

The single-file package was generated and parity-tested on
`codex/0038-single-file-company-install` at implementation commit `fc6db16`.
The generated provenance binds all 22 source files in explicit order to the
validated Phase 8C source commit `8364a2deb091d52ef322c9aa6cb67098f721d93e`.

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
