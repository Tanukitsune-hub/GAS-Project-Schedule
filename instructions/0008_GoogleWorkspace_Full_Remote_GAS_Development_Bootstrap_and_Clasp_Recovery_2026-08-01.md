# 指示番号: 0008
# Google Workspace Personal Work OS
# clasp push失敗復旧／PC手動設定完結／remote GAS development bootstrap

- Date: 2026-08-01
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Remote parent branch: `codex/0006-local-clasp-validation-gate`
- Remote parent Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/10`
- Instruction 0006 final evidence HEAD: `effffb737d365eacd71949eb7d37c2de94a599a0`
- Instruction 0007 GitHub instruction commit: `2121b71c3cb723cb6aeab56f18d17a981c3de6f8`
- Operator-reported local-only 0007 evidence commit: `c40ff47e5020c606f4d8e652a2ac6a8f5c68e1e4`
- Operator-reported local-only 0007 final HEAD: `9f21e44ce036dd06d6db9d7aeb65be3b6f9424ed`
- Operator-reported local branch: `codex/0007-local-clasp-dev-validation`
- Current candidate: Code `2.8.11-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- Current staged canonical payload: 23 files / SHA-256 `ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1`
- Development status at start: `NO_GO_LOCAL_CLASP_VALIDATION`
- Company status at start: `NO_GO_COMPANY_HANDOFF_LOCAL_VALIDATION_FAILURE`
- Historical fixed T11: `T11_SUSPENDED`; `NO_ACTIVE_COMPANY_TRANSFER`
- Instruction 0005: `SUPERSEDED_NOT_EXECUTED`
- Instruction 0007: `SUPERSEDED_BY_0008_AFTER_SAFE_PUSH_FAILURE`

## 1. Goal and mandatory execution rule

Complete, in this single Codex task, every self-PC manual configuration that is reasonably required for ongoing remote Google Apps Script development against the existing personal, non-company, synthetic Sandbox.

The target end state is:

1. GitHub connectivity restored and local-only 0007 evidence safely published;
2. the original `CLASP_PUSH_FAILED` cause safely classified without publishing raw credentials, account information, Script ID, URLs, or sensitive error text;
3. user-level Apps Script API enabled;
4. project-local clasp OAuth completed with the Google account currently signed in on the self-PC;
5. the existing personal synthetic Sandbox target locally bound and attested;
6. guarded canonical code push completed;
7. separate-directory pull-back and exact parity completed;
8. a personal standard Google Cloud project linked to the dev Apps Script project;
9. Google Apps Script API enabled in that standard Cloud project;
10. OAuth consent and Desktop OAuth client configured only for this personal dev lane;
11. an ignored local OAuth client credential used for a named clasp profile;
12. a dev-only `executionApi.access = MYSELF` manifest overlay supported without changing the canonical repository `appsscript.json`;
13. a personal API-executable deployment configured with access limited to the deploying user;
14. one guarded read-only remote runtime validation of `runQuickDiagnostic` completed if all prerequisites pass;
15. evidence, tests, GitHub Actions, normal push, and a new stacked Draft PR completed.

Do not stop after writing documentation or asking the operator to perform several unrelated setup sessions. Pause only at the exact browser or local-secret entry step that requires a person, give one minimal instruction, and continue after the operator confirms completion.

Your final report must begin and end with:

```text
指示番号: 0008
```

## 2. Explicit authorization

The repository owner explicitly authorizes, only on the self-PC and only for the existing personal/non-company/synthetic Sandbox:

- allowing Codex outbound access to GitHub and Google developer endpoints when the Codex UI requests network approval;
- using the Google account currently signed in on the self-PC;
- enabling the user-level Apps Script API for that account;
- completing local clasp OAuth;
- creating or selecting one personal standard Google Cloud project dedicated to this synthetic dev lane;
- linking the existing dev Apps Script project to that standard Cloud project;
- enabling the Google Apps Script API in that standard Cloud project;
- configuring an OAuth consent screen in Testing mode and adding only the current operator account as a test user, where the console requires it;
- creating one Desktop application OAuth client for local clasp/runtime validation;
- downloading the OAuth client JSON into an ignored local directory only;
- creating an API-executable deployment for the personal synthetic dev target with access limited to the deploying user;
- pushing code and a dev-only API-executable manifest overlay to the personal synthetic dev target;
- pulling the project back into a separate ignored directory;
- remotely invoking only `runQuickDiagnostic` after the safety gates pass.

This authorization does not permit:

- a company account, company Cloud project, company Apps Script project, company PC, production project, or real business data;
- real Gmail/Calendar processing, Task edits, Dashboard refresh, Setup, migrations, triggers, Automation, external AI, or provider configuration;
- an API executable accessible beyond the deploying user;
- secrets in GitHub, chat, PRs, issues, logs, screenshots, or reports;
- company handoff or release authorization.

## 3. Formal source and local-only evidence handling

The local commits `c40ff47...` and `9f21e44...` are operator-reported but not GitHub-resolved. Treat them as unverified local evidence until inspected.

When GitHub access is available:

1. fetch the current remote parent branch containing this instruction;
2. confirm the local branch `codex/0007-local-clasp-dev-validation` exists, is clean, and resolves exactly to `9f21e44ce036dd06d6db9d7aeb65be3b6f9424ed`;
3. confirm `c40ff47e5020c606f4d8e652a2ac6a8f5c68e1e4` is its ancestor and both descend from instruction `2121b71c3cb723cb6aeab56f18d17a981c3de6f8`;
4. inspect both commits and retain only legitimate evidence/docs/test changes with no secret, Script ID, OAuth material, URL, or local path;
5. merge the updated remote parent branch containing Instruction 0008 into the clean local branch using a normal non-rewriting merge;
6. create the dedicated branch:

```text
codex/0008-remote-gas-development-bootstrap
```

Do not rebase, amend, force-push, reset, clean, or discard the local evidence. If the reported commits are missing or inconsistent, record `LOCAL_0007_EVIDENCE_UNRESOLVED` and reconstruct only from safe evidence already available; do not fabricate the commits.

Create a new stacked Draft PR after the work is complete:

```text
base: codex/0006-local-clasp-validation-gate
head: codex/0008-remote-gas-development-bootstrap
```

Keep PR #8, #9, and #10 Open / Draft / unmerged. Do not create or continue a separate 0007 PR unless needed solely to preserve already-existing local evidence; prefer the single 0008 stacked PR.

## 4. Required repository and source review

Read in full:

1. root `README.md` and root `AGENTS.md`;
2. applicable `implementation/GoogleSpreadsheet/AGENTS.md`;
3. `CONTRIBUTING.md`, if present;
4. `CHATGPT_CODEX_GITHUB_HANDOFF_POLICY.md`;
5. current canonical documents;
6. `docs/local-clasp-setup.md`;
7. `docs/development-validation-gates.md`;
8. `docs/company-handoff.md`;
9. Instructions 0006 and 0007;
10. operator-reported 0007 local evidence, if present;
11. `.github/workflows/ci.yml` and final PR #10 workflow run/job/logs;
12. `implementation/GoogleSpreadsheet/package.json` and lockfile;
13. `.clasp.example.json`, `.clasp-dev.target.example.json`, and all ignore rules;
14. `tools/local_validation_gate.js` and `tools/local_clasp_dev.js` in full;
15. all current local-clasp, secret-scan, CI, and canonical-status tests;
16. canonical `apps-script-v2/appsscript.json`;
17. official current Google Apps Script/clasp requirements relevant to login, user-level Apps Script API, standard Cloud projects, API executables, and remote function execution;
18. PR #8, #9, and #10 refs, comments, and checks;
19. this instruction in full.

Use primary sources only for technical requirements. Record no raw browser or credential details.

## 5. First restore network and publishability

Before further Google mutation, verify outbound connectivity from the Codex execution environment to:

- `github.com` / GitHub API;
- `script.google.com`;
- `script.googleapis.com`;
- `console.cloud.google.com` only through the operator browser;
- Google OAuth endpoints used by clasp.

If the Codex UI asks for network access, instruct the operator to approve access for this task. Do not ask the operator to disable firewall, antivirus, corporate policy, or system security controls globally.

Run safe connectivity probes that do not reveal credentials. A GitHub failure must be classified as one of:

```text
GITHUB_NETWORK_ALLOWED
BLOCKED_BY_CODEX_NETWORK_POLICY
GITHUB_AUTH_REQUIRED
GITHUB_REMOTE_UNREACHABLE
```

If GitHub remains blocked, do not claim remote development setup complete. You may continue Google-local diagnosis only if it does not risk losing evidence, but final status remains `NO_GO_REMOTE_DEVELOPMENT_BOOTSTRAP`.

## 6. Pre-Google local verification

From `implementation/GoogleSpreadsheet/`, run:

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm run verify:local
pnpm run gas:stage:dev
pnpm exec clasp --version
```

Requirements:

- clean tracked worktree before any push;
- all current local checks PASS;
- all current Node suites PASS;
- canonical staged file count = 23;
- canonical payload SHA-256 = `ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1`;
- project-local clasp = `3.3.0`;
- no tracked `.clasp.json`, `.clasprc.json`, target ID, client secret, token, credential, local report, Workspace ID/URL, account identity, or local path.

Any failure is `NO_GO_LOCAL_CLASP_VALIDATION` and stops Google mutation.

## 7. Harden safe clasp failure classification before retry

The prior guard returned only `CLASP_PUSH_FAILED`, which is insufficient for safe remediation. Before authorizing another push:

1. inspect the local ignored operation record and terminal state without copying raw output into GitHub;
2. update `tools/local_clasp_dev.js` and tests, if needed, so known clasp failures are converted locally into closed categories while raw output remains local and untracked;
3. preserve only an output hash and one closed classification in evidence.

At minimum distinguish:

```text
APPS_SCRIPT_API_DISABLED
BLOCKED_BY_AUTH
DEV_TARGET_NOT_FOUND_OR_NO_ACCESS
DEV_TARGET_PROJECT_TYPE_OR_BINDING_INVALID
REMOTE_MANIFEST_REJECTED
REMOTE_PAYLOAD_REJECTED
NETWORK_OR_TLS_FAILURE
CLASP_REMOTE_CONFLICT
UNKNOWN_CLASP_PUSH_FAILURE
```

Do not weaken the no-retry rule. This instruction itself provides one new controlled retry only after the relevant prerequisite has been corrected and independently checked.

## 8. Finish user-level Apps Script API and clasp OAuth setup

Open the Apps Script user settings for the currently signed-in personal account. Ask the operator to confirm that **Google Apps Script API** access is ON.

Record only:

```text
user_level_apps_script_api: ENABLED | BLOCKED
```

Then verify the project-local clasp OAuth state. If necessary, run:

```powershell
pnpm exec clasp login
```

Ask the operator to select the currently signed-in personal account and approve. Never request a password, authorization code, token, account email, `.clasprc.json`, browser URL, or screenshot in chat.

Allowed closed outcomes:

```text
AUTHENTICATED_CURRENT_OPERATOR_ACCOUNT
BLOCKED_BY_AUTH
```

## 9. Reconfirm the existing personal synthetic target

The target must remain the existing controlled Sandbox previously used for synthetic Setup/Diagnostic testing.

Ask once for this local-only attestation:

```text
TARGET_ATTESTATION = PERSONAL_SYNTHETIC_NON_COMPANY_EXISTING_SANDBOX
```

The Script ID must be obtained from Apps Script Project Settings and entered only into ignored local files or a local hidden prompt. Do not print it.

Confirm only:

```text
target_configuration_present: true
target_kind: PERSONAL_SYNTHETIC_DEV
script_id_match: true
script_id_tracked: false
runtime_dry_run_allowed: false
```

Before the controlled push retry, perform a read-only isolated pull or status operation, using ignored temporary directories, to prove the account can access the target without changing it. Classify the result without raw output.

## 10. Controlled canonical push retry and pull-back parity

After Sections 5 through 9 pass, set only in the current terminal:

```powershell
$env:GAS_DEV_CLASP_ALLOWED = 'true'
```

Run:

```powershell
pnpm run gas:status:dev
pnpm run gas:push:dev
pnpm run gas:pull-verify:dev
pnpm run gas:status:dev
```

This is the one authorized canonical push retry after the prior failure.

Required result:

```text
target_guard: PASS
canonical_push: PASS
canonical_pullback_parity: PASS
file_count: 23
canonical_staged_payload_sha256: ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1
canonical_pulled_payload_sha256: ba70c8bce8ea35bfdb85878eb2e78b4dc6f4df7e2bf4b8336ce9a6d1be8e20d1
```

Do not use `--force`. Do not manually delete or edit remote files. A failure stops further runtime setup unless it is clearly a manual standard-Cloud/OAuth prerequisite unrelated to canonical push.

## 11. Complete personal standard Google Cloud project setup

Only after canonical push/pull parity passes, complete all manual Cloud prerequisites needed for future remote function execution.

Use or create one personal standard Google Cloud project dedicated to this synthetic dev lane. Do not use a company or production Cloud project.

The operator must complete, with Codex giving one short step at a time:

1. create/select the personal standard Cloud project;
2. record its project number and project ID only in ignored local files—not chat or GitHub;
3. open the existing Apps Script project's Project Settings;
4. switch the Apps Script project from its default Cloud project to the personal standard Cloud project by entering the project number;
5. enable the Google Apps Script API in that standard Cloud project;
6. configure the OAuth consent screen in Testing mode, using no company branding or data;
7. add only the current personal operator account as a test user if required;
8. create one OAuth client of type **Desktop application**;
9. download the client JSON into an ignored local directory such as `.clasp-dev/credentials/`;
10. ensure the credential file, project number, project ID, client ID, client secret, and URLs are ignored and never printed or committed.

Record only closed Booleans/enums:

```text
standard_cloud_project_linked: true | false
apps_script_api_enabled_in_cloud_project: true | false
oauth_consent_testing_configured: true | false
desktop_oauth_client_local_only: true | false
credential_tracked: false
```

## 12. Add a dev-only API-executable manifest overlay

The canonical repository `apps-script-v2/appsscript.json` must remain byte-unchanged.

Implement tracked tooling and tests that can generate an ignored **dev-only** staged manifest overlay with:

```json
"executionApi": {
  "access": "MYSELF"
}
```

Requirements:

- the overlay is generated only under the ignored local dev staging directory;
- the canonical source manifest hash is preserved and reported separately;
- the dev-runtime staged payload receives a separate local-only hash;
- the overlay cannot set `DOMAIN`, `ANYONE`, or `ANYONE_ANONYMOUS`;
- the overlay cannot alter OAuth scopes, advanced services, timezone, runtime, or other canonical fields;
- pull-back parity compares against the exact dev-runtime staged payload, not the canonical payload;
- CI tests the overlay generator without Google credentials;
- no secret or project identifier is embedded in the overlay.

Update local documentation and package scripts as needed, for example:

```text
gas:stage:runtime-dev
gas:push:runtime-dev
gas:pull-verify:runtime-dev
gas:test:runtime-dev
```

Do not modify historical release or transfer packages.

## 13. Local named OAuth profile for remote runtime

Use the downloaded Desktop OAuth client only from the ignored local credential directory.

Create or refresh a named local clasp profile using the project-local clasp and project scopes. Use the current clasp 3.3.0 command syntax confirmed by local `--help`; do not guess flags.

The profile must:

- use the personal standard Cloud project;
- include the script's explicit scopes plus clasp management scopes only as required;
- remain in local ignored OAuth state;
- never expose token, client ID, client secret, account email, or credential path in evidence.

Record only:

```text
named_runtime_oauth_profile: CONFIGURED | BLOCKED
project_scopes_authorized: true | false
```

## 14. Push the dev-runtime overlay and configure API executable

After the overlay, standard Cloud project, API enablement, and named OAuth profile all pass:

1. stage the dev-runtime payload;
2. guarded-push it to the same personal synthetic dev target;
3. pull it back into a separate ignored runtime verification directory;
4. verify exact 23-file parity against the dev-runtime staged payload;
5. open the Apps Script project;
6. create or update an **API executable** deployment;
7. limit execution access to **only the deploying user / MYSELF**;
8. store the deployment identifier only in ignored local configuration;
9. do not create a web app, add-on, public deployment, or company deployment.

Record only:

```text
runtime_overlay_push: PASS | FAIL | NOT_EXECUTED
runtime_overlay_pullback_parity: PASS | FAIL | NOT_EXECUTED
api_executable_deployment: CONFIGURED_MYSELF_ONLY | BLOCKED | NOT_EXECUTED
deployment_id_tracked: false
```

## 15. One safe remote runtime validation

After every previous section passes, set the explicit local runtime opt-in and execute exactly once:

```text
runQuickDiagnostic
```

Use the actual project-local clasp 3.3.0 supported remote execution command (`run-function` or other confirmed current syntax). Do not use an unsupported command merely because an older tool used it.

The runtime guard must require:

- named dev OAuth profile;
- matching personal standard Cloud project;
- API executable configured MYSELF-only;
- `TEST_MODE=true`;
- Automation disabled;
- runtime function exactly `runQuickDiagnostic`;
- all bounded-summary side-effect Booleans false;
- complete WARN/FAIL ID lists;
- no Setup, write, trigger, Gmail, Calendar, external AI, Dashboard repair, or flush.

Do not report the lower detail JSON, account information, Script ID, deployment ID, URLs, raw errors, or actual Workspace content.

A successful result may record only the closed bounded summary. A WARN is acceptable only for separately reviewed expected categories; it is not automatically a Phase 8B PASS.

## 16. GitHub publication and Actions

After local evidence is safe:

- create/update an additive audit under `audits/2026-08-01/`;
- update canonical status and validation docs;
- keep company handoff NO-GO;
- run full local verification;
- commit normally;
- normal-push `codex/0008-remote-gas-development-bootstrap`;
- create the stacked Draft PR against `codex/0006-local-clasp-validation-gate`;
- verify the actual GitHub Actions workflow starts;
- inspect every job and step;
- require all configured checks PASS;
- inspect logs for the expected current suite count and no Google lane;
- perform a detached HTTPS fresh-clone verification of the final commit;
- keep PR #8, #9, and #10 Open / Draft / unmerged.

Do not include local paths in links or the final report.

## 17. Status rules

Use the highest applicable development status:

```text
NO_GO_REMOTE_DEVELOPMENT_BOOTSTRAP
```

if GitHub, local, OAuth, target, canonical push, parity, Cloud setup, overlay, deployment, or runtime validation fails.

```text
READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION
```

only if canonical push/pull parity passes but the standard Cloud/runtime lane remains blocked.

```text
READY_FOR_REMOTE_GAS_DEVELOPMENT_REVIEW
```

only if all of the following pass:

- local verification;
- current-branch GitHub Actions;
- personal target guard;
- canonical push/pull parity;
- personal standard Cloud project linkage;
- Apps Script API enablement;
- local Desktop OAuth client/profile;
- dev-runtime overlay push/pull parity;
- MYSELF-only API executable;
- one safe read-only `runQuickDiagnostic` runtime execution;
- final fresh-clone verification.

Even at the maximum status, company handoff remains:

```text
NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW
```

No Phase 8B PASS, Phase 8C GO, production-ready, pilot-ready, release, tag, fixed transfer, or company transfer is authorized.

## 18. Required final report

The final report must include only safe closed evidence:

1. `指示番号: 0008` at beginning and end;
2. final development and company statuses;
3. GitHub connectivity classification;
4. local 0007 commit preservation result;
5. local/CI commands and exact PASS/FAIL counts;
6. safe prior-push failure classification;
7. user-level Apps Script API state;
8. OAuth state without identity;
9. target attestation and guard result;
10. canonical push/pull hashes and parity;
11. standard Cloud/manual setup Booleans;
12. canonical manifest unchanged confirmation;
13. dev-runtime overlay hash and parity;
14. API executable MYSELF-only state;
15. runtime closed bounded summary or exact blocker;
16. final commit, branch, PR URL, Actions run/job/steps, fresh-clone result;
17. all `NOT_EXECUTED` and unresolved items;
18. remaining company-side work;
19. Review Focus.

Never include a Script ID, deployment ID, Cloud project ID/number, client ID, client secret, OAuth token, account email, browser URL, local path, raw clasp output, screenshot, or real Workspace/business content.

# 指示番号: 0008 — END
