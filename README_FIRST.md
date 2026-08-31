# Work 0038 Company Live Deployment Bundle

This bundle contains the exact validated Work 0037 Phase 8C runtime for Code
`2.8.25-prepilot` plus a two-paste company installation path.

## Start here: exactly two paste actions

1. Open `QUICK_INSTALL/Code.gs`, copy all of it, and paste it into the default
   Apps Script `Code.gs` file.
2. In Apps Script project settings, reveal `appsscript.json`, then copy all of
   `QUICK_INSTALL/appsscript.json` into that manifest file.

Do not create or paste 22 separate `.gs` files for the manual installation.
The files in `QUICK_INSTALL/` are ready to open and copy directly from this
delivery branch. Its `BUNDLE_PROVENANCE.json` and `CHECKSUMS.sha256` prove the
derived bundle and manifest identity.

If company email blocks `.gs` or `.json` attachments, use
`QUICK_INSTALL/Code.txt` and `QUICK_INSTALL/appsscript.txt` as transport copies.
Their bytes and contents are exactly identical to `Code.gs` and
`appsscript.json`; paste each file's contents in the same two steps above. Do
not edit or reformat the `.txt` copies.

Continue with `COMPANY_LIVE_DEPLOYMENT_GUIDE.md` for the company setup,
readiness, and controlled-operation boundaries.

## Other contents

- `apps-script/`: the unchanged 22-file modular payload for optional engineering
  use and provenance.
- `CHECKSUMS.sha256`: the original modular-package checksums.
- `DEPLOYMENT_MANIFEST.md`: the validated Phase 8C release identity.
- `PHASE8C_SANDBOX_GUIDE.md`: the original Phase 8C provenance guide.
- `COMPANY_LIVE_DEPLOYMENT_GUIDE.md`: Work 0038 company installation and
  live-operation sequence.

Important:

- This bundle contains no API key, credential, `.clasp.json`, company account ID,
  Spreadsheet/Script/Calendar ID, internal URL, or company data.
- Do not add the company Gemini API key to these files. Store it only in the
  company Apps Script Script Properties using key `WORK_OS_V2_GEMINI_API_KEY`.
- Automation is OFF by default. Do not enable it until Setup/readiness is green.
- The validated provider contract expects endpoint
  `https://generativelanguage.googleapis.com/v1beta/interactions` and model
  `gemini-3.6-flash`. If the company-approved Gemini API does not permit that
  exact endpoint/model, stop and return to Work 0038 review rather than editing
  the runtime locally.
