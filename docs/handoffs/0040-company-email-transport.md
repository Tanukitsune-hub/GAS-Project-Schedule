# Work 0040 — Company Email Transport

WORK_ID: `0040`

MODE: `BUILD`

BALL: `CHATGPT`

STATUS: `IN_PROGRESS`

## Primary Outcome

Deliver the accepted Work 0039 company-install transport copies to the user's verified company email address as ordinary `.txt` attachments without modifying Work 0039 product/release bytes or exposing credentials.

## Accepted inputs

- Accepted main baseline: `b9fb54217576a9e780d725118081037eadcf5b48`.
- Source files:
  - `implementation/GoogleSpreadsheet/release/work-0039-single-file-company-install/Code.gs.txt`
  - `implementation/GoogleSpreadsheet/release/work-0039-single-file-company-install/appsscript.json.txt`
- Expected SHA-256:
  - Code: `a3fcd9c11d232254dc9ed25d5052da0dbddd0b5ba7c2212ca055ea35446aa510`
  - Manifest: `e546725fcfe47adfd40e094e66a6c866418cb6265441f541ee000c940d4a8afe`

## Fastest Safe Decisive Action

Use an isolated GitHub Actions transport workflow on this branch only to copy the accepted files to `Code.txt` and `appsscript.txt`, verify the expected hashes, and upload them as a workflow artifact. Download the artifact through the GitHub connector, extract locally if a mounted file path is available, independently re-check hashes, then send through connected Gmail.

## Scope / change boundary

Allowed on `chatgpt/0040-company-email-transport` only:
- this Work record;
- a transport-only workflow under `.github/workflows/`.

Not allowed:
- Work 0039 product/source/release/bundle modification;
- Work 0038 archive/release modification;
- API keys or credentials in GitHub/email attachments;
- real OpenAI/Gemini requests;
- company Workspace deployment or Automation changes.

## Acceptance Evidence

1. Artifact source SHA checks PASS.
2. Local extracted `Code.txt` and `appsscript.txt` match the expected SHA-256 values.
3. Connected Contacts verifies the company recipient.
4. Connected Gmail send action returns success with both `.txt` attachments.
5. Work 0039/0038 source-of-truth refs remain untouched.

## Non-Goals

Company runtime qualification, OpenAI governance approval, API-key setup, deployment, and Automation enablement are separate future work.
