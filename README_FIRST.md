# Work 0038 Company Live Deployment Bundle

This bundle contains the exact validated Work 0037 Phase 8C runtime for Code `2.8.25-prepilot` plus company-installation guidance.

Start with `COMPANY_LIVE_DEPLOYMENT_GUIDE.md`.

Contents:

- `apps-script/`: 22 `.gs` files plus `appsscript.json` required by the runtime.
- `CHECKSUMS.sha256`: canonical package checksums.
- `DEPLOYMENT_MANIFEST.md`: release identity and provenance.
- `PHASE8C_SANDBOX_GUIDE.md`: original Phase 8C provenance guide.
- `COMPANY_LIVE_DEPLOYMENT_GUIDE.md`: Work 0038 company installation and live-operation sequence.

Important:

- This bundle contains no API key, credential, `.clasp.json`, company account ID, Spreadsheet/Script/Calendar ID, internal URL, or company data.
- Do not add the company Gemini API key to these files. Store it only in the company Apps Script Script Properties using key `WORK_OS_V2_GEMINI_API_KEY`.
- Automation is OFF by default. Do not enable it until Setup/readiness is green.
- The validated provider contract expects endpoint `https://generativelanguage.googleapis.com/v1beta/interactions` and model `gemini-3.6-flash`. If the company-approved Gemini API does not permit that exact endpoint/model, stop and return to Work 0038 review rather than editing the runtime locally.
