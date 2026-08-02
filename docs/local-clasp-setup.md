# Local clasp validation setup

## Purpose and boundary

This is a self-PC validation lane for Code `2.8.11-prepilot`. It may use
`clasp` only with a personal, synthetic, non-company development Apps Script
project. It is not a Company-PC transfer procedure, a deployment procedure,
or an authorization to operate a real Workspace.

Instruction 0005 is `SUPERSEDED_NOT_EXECUTED`. T11 is immutable historical
evidence but `T11_SUSPENDED`; there is `NO_ACTIVE_COMPANY_TRANSFER`.

Instruction 0008 supersedes Instruction 0007 after its safe push failure. The
0007 attempt remains closed evidence; it is not a parity result. Instruction
0009 then published the preserved history and obtained current GitHub Actions
success. Before the one new controlled canonical retry, the current tool must
classify failures into a closed category, the operator must confirm the
user-level Apps Script API is enabled, OAuth and the existing
personal-synthetic target must be rechecked, and an isolated read-only pull
must prove target access. Company handoff remains NO-GO throughout this
bootstrap.

## Prerequisites

- Node.js 20 or later.
- The repository-local locked dependencies installed from
  `implementation/GoogleSpreadsheet/`.
- A personal synthetic development project created outside this repository.
- A local clasp login completed only on the self PC, if the operator elects to
  run the Google-authenticated lane.

Do not store an OAuth token, credential, API key, actual script ID, Company
identifier, URL, or data in the repository. `.clasp.json`, `.clasprc.json`,
`.clasp-dev/`, `.clasp-pull-verify/`, credential files, and local reports are
ignored and the local gate rejects them if tracked.

## Install and non-Google verification

Run these commands from `implementation/GoogleSpreadsheet/`:

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm run verify:local
pnpm run gas:stage:dev
```

`verify:local` runs JSON/YAML parsing, the Apps Script static validator, all
Node suites, the existing package/transfer verifiers, fixed-ref lineage, and
the strict tracked secret/local-path scan. It never calls clasp. `gas:stage:dev`
copies exactly the fixed 23-file Apps Script payload to ignored staging and
records only file hashes and counts.

## Local-only target declaration

Copy the two example files only into the ignored local development directory:

```text
.clasp.example.json                 -> .clasp-dev/.clasp.json
.clasp-dev.target.example.json      -> .clasp-dev/target.json
```

Set the same non-placeholder identifier in both local files. Set
`target_kind` exactly to `PERSONAL_SYNTHETIC_DEV`, keep `rootDir` as
`payload`, and leave `runtime_dry_run_allowed` false unless the runtime
prerequisites below are independently approved. The target guard rejects
placeholders, mismatches, non-synthetic target declarations, invalid IDs, and
an ID found in tracked content.

Every local clasp project configuration in this lane has one exact pull
extension contract:

```json
{
  "scriptExtensions": [".gs", ".js"],
  "htmlExtensions": [".html"]
}
```

`@google/clasp` 3.3.0 writes pulled server-side script files using the first
listed script extension. `.gs` must therefore remain first so the exact
23-file canonical allow-list can validate the 22 Apps Script files. Missing,
reordered, extra, malformed, or legacy conflicting extension settings are
rejected before an authenticated clasp command. This applies equally to the
ignored binding, isolated access-check pull, canonical pull-back, runtime
staging, and runtime pull-back; it does not broaden the 23-file allow-list.

After the operator has opened and locally confirmed either the established
personal synthetic Work OS project or an explicitly approved new blank
Spreadsheet-bound personal synthetic project, use the non-echoing local
binding command instead of placing an identifier in a terminal command, chat,
or file under version control:

```powershell
pnpm run gas:bind:dev
```

When the command is launched from a separate interactive window, the parent
PowerShell may collect the value with `Read-Host -AsSecureString`, pass it only
through the child process environment with source
`NON_ECHOING_PARENT_PROMPT`, and clear both the environment value and native
buffer immediately afterward. The value must never appear in command-line
arguments, tracked files, safe output, or terminal logs.

It updates only ignored local binding files, records no identifier in safe
output, sets `target_kind` to `PERSONAL_SYNTHETIC_DEV`, keeps the extension
contract above, and sets `runtime_dry_run_allowed` to `false`. Re-record the
closed prerequisites after binding; this invalidates any stale target-bound
access evidence.

The existing-target lane requires
`PERSONAL_SYNTHETIC_NON_COMPANY_EXISTING_SANDBOX` and exact canonical 23-file
read-only parity. A separately and explicitly approved new blank target uses
`PERSONAL_SYNTHETIC_NON_COMPANY_NEW_BLANK_BOUND_SHEET_SANDBOX` and
`NEW_BLANK_BOUND_SCRIPT_V1`. That preflight accepts exactly one empty/default
server script plus `appsscript.json`, rejects executable or deployment manifest
surfaces, and never broadens the established-target 23-file allow-list. After
the one guarded canonical push, the independent pull-back still requires all
23 canonical files and the fixed payload SHA-256.

When the operator explicitly replaces a prior target with this new blank
target, the existing `gas:access-recover:dev` command may remove only the known
failed, non-empty, ignored access-check workspace under the closed reason
`SUPERSEDED_BY_NEW_BLANK_BOUND_SHEET_SANDBOX`. It does not contact Google,
remove a retry marker, or reuse the prior target fingerprint.

For a new blank project, clasp 3.3.0 may require an interactive confirmation
when the canonical manifest differs. A non-interactive `Skipping push.` result
is `REMOTE_MUTATION_NOT_PERFORMED_MANIFEST_CONFIRMATION_REQUIRED`, never PASS.
After an independent pull proves the remote is still the exact blank shape, a
separate durable marker may authorize one normal interactive `clasp push`.
The operator confirms the manifest update locally; `--force` remains forbidden.
The tool then requires an independent clean-directory 23-file byte-parity pull.
The original retry marker and no-op evidence remain preserved.

If the interactive console later reports `already up to date` but the operator
did not record the prior success confirmation, do not infer success. The
one-use `gas:prove-interactive-blank-push:dev` read-only lane may establish the
result only by independently pulling the target into a clean ignored directory
and proving the exact 23-file inventory and canonical payload SHA-256. It stores
`operator_confirmation = NOT_RECORDED`; no human confirmation is fabricated.

This declaration is an operator attestation, not independent proof that a
target is non-company. That limitation is `REVIEW_REQUIRED` and must be
recorded in any handoff evidence.

## Closed failure classification and one-retry boundary

Raw clasp output is retained only in ignored local operation records. Tracked
evidence may contain only its SHA-256 and one of these closed categories:

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

The canonical retry command writes an ignored durable `ATTEMPT_STARTED`
marker before invoking clasp. If that marker already exists, the tool refuses
a second push. Do not delete or edit the marker to create another attempt.

If a read-only pull itself completes but its directory does not exactly match
the 23-file allow-list, the tool records the closed
`REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH` category plus only the output hash, exit
state, and bounded file/non-file counts. It does not retain names, contents,
payload hashes, IDs, or raw output for that partial remote payload, and it
does not consume the canonical retry marker.

The target binding is fingerprint-bound in ignored local prerequisite and
access records. Recording prerequisites or beginning an access check revokes
any earlier access PASS until a newly successful, matching read-only check has
been persisted. A later binding change or a failed check therefore cannot
reuse stale evidence to permit a canonical push.

## Guarded canonical clasp sequence

After the operator has confirmed the user-level Apps Script API is enabled,
OAuth is valid, and the target attestation still holds, record only those
closed prerequisites in the current terminal:

```powershell
$env:GAS_USER_APPS_SCRIPT_API_ENABLED = 'true'
$env:GAS_OAUTH_STATE = 'AUTHENTICATED_CURRENT_OPERATOR_ACCOUNT'
$env:GAS_TARGET_ATTESTATION = 'PERSONAL_SYNTHETIC_NON_COMPANY_EXISTING_SANDBOX'
pnpm run gas:prerequisites:dev
Remove-Item Env:GAS_USER_APPS_SCRIPT_API_ENABLED
Remove-Item Env:GAS_OAUTH_STATE
Remove-Item Env:GAS_TARGET_ATTESTATION
```

Then prove read-only access before push:

```powershell
pnpm run gas:access-check:dev
```

The access check pulls into an ignored isolated directory, accepts only the
23-file payload shape, and performs no remote write. A failed access check
stops the canonical retry.

If it stops specifically at `REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH`, do not rerun
the access check or push. First, in the Apps Script UI, independently confirm
that the already intended personal synthetic Sandbox—not a company or new
project—is open; update its identifier only through the ignored local binding
workflow and rerun the closed prerequisite command above. Then, with an
explicit local terminal opt-in, the following command may remove only the
tool-generated ignored access-check workspace after it confirms a failed,
non-empty payload shape. It does not contact Google, does not remove a retry
marker, and does not print remote file names or contents.

```powershell
$env:GAS_DEV_CLASP_ALLOWED = 'true'
$env:GAS_TARGET_ATTESTATION = 'PERSONAL_SYNTHETIC_NON_COMPANY_EXISTING_SANDBOX'
$env:GAS_ACCESS_CHECK_WORKSPACE_RECOVERY_ALLOWED = 'true'
$env:GAS_ACCESS_CHECK_WORKSPACE_RECOVERY_REASON = 'REMOTE_PULL_PAYLOAD_SHAPE_MISMATCH'
pnpm run gas:access-recover:dev
Remove-Item Env:GAS_DEV_CLASP_ALLOWED
Remove-Item Env:GAS_TARGET_ATTESTATION
Remove-Item Env:GAS_ACCESS_CHECK_WORKSPACE_RECOVERY_ALLOWED
Remove-Item Env:GAS_ACCESS_CHECK_WORKSPACE_RECOVERY_REASON
```

After a successful local-only recovery, run exactly one new read-only
`gas:access-check:dev`; only a persisted matching 23-file PASS can satisfy the
canonical-push prerequisite.

After `verify:local` passes and only on the self PC, use the explicit opt-in:

```powershell
$env:GAS_DEV_CLASP_ALLOWED = 'true'
pnpm run gas:status:dev
pnpm run gas:push:dev
pnpm run gas:pull-verify:dev
pnpm run gas:status:dev
```

The target guard runs before the remote calls. `gas:push:dev` requires a clean
Git worktree and reruns the non-Google gate. `gas:pull-verify:dev` pulls to a
separate ignored directory and requires the exact 23-file set and byte-level
payload hash to match the staged source. A repeat run may remove only a
previously validated, ignored pull-back layout; unexpected files fail closed.

If local config is absent, record `DEV_TARGET_NOT_CONFIGURED`. If clasp login
or remote access is unavailable, record `BLOCKED_BY_AUTH` or the safe
operation-specific failure code. None of those outcomes is PASS.

Instruction 0008 is that later governing instruction and authorizes exactly
one new canonical retry after the prerequisites above pass. `--force`, remote
manual deletion, and remote file repair remain prohibited.

## Dev-runtime manifest overlay

The canonical `apps-script-v2/appsscript.json` stays byte-unchanged. Generate
the separate ignored runtime payload with:

```powershell
pnpm run gas:stage:runtime-dev
```

The generator copies the same 23 files and adds only this dev-runtime field to
the staged manifest:

```json
{
  "executionApi": {
    "access": "MYSELF"
  }
}
```

The tool rejects `DOMAIN`, `ANYONE`, and `ANYONE_ANONYMOUS`; verifies all
canonical manifest fields remain identical; and records distinct canonical
manifest, runtime manifest, canonical payload, and runtime payload hashes.

Only after canonical push/pull parity may the operator configure the personal
standard-Cloud project, project API, Testing-mode OAuth consent, and one local
Desktop OAuth client. Project, deployment, OAuth, and account identifiers stay
exclusively in ignored local configuration.

Create the named profile only with the project-local clasp 3.3.0. The client
JSON must already be under the ignored `.clasp-dev/credentials/` directory:

```powershell
pnpm exec clasp --auth .clasp-dev/oauth --user personal-synthetic-runtime --project .clasp-dev login --creds .clasp-dev/credentials/client.json --use-project-scopes --include-clasp-scopes
pnpm run gas:runtime-auth-check:dev
```

The first command may open the personal-account OAuth page. The second command
records only a closed profile/scopes state and an output hash; its raw result
remains ignored locally.

Record the closed Cloud/OAuth prerequisites, then stage, push, and independently
pull back the runtime overlay. These commands require prior canonical
push/pull parity and the verified named profile:

```powershell
$env:GAS_STANDARD_CLOUD_PROJECT_LINKED = 'true'
$env:GAS_CLOUD_APPS_SCRIPT_API_ENABLED = 'true'
$env:GAS_OAUTH_CONSENT_TESTING_CONFIGURED = 'true'
$env:GAS_DESKTOP_OAUTH_CLIENT_LOCAL_ONLY = 'true'
$env:GAS_PROJECT_SCOPES_AUTHORIZED = 'true'
pnpm run gas:runtime-prerequisites:dev
@(
  'GAS_STANDARD_CLOUD_PROJECT_LINKED',
  'GAS_CLOUD_APPS_SCRIPT_API_ENABLED',
  'GAS_OAUTH_CONSENT_TESTING_CONFIGURED',
  'GAS_DESKTOP_OAUTH_CLIENT_LOCAL_ONLY',
  'GAS_PROJECT_SCOPES_AUTHORIZED'
) | ForEach-Object { Remove-Item "Env:$_" -ErrorAction SilentlyContinue }

$env:GAS_DEV_CLASP_ALLOWED = 'true'
pnpm run gas:stage:runtime-dev
pnpm run gas:push:runtime-dev
pnpm run gas:pull-verify:runtime-dev
```

The guarded runtime push supplies clasp's `--force` option only for this
ignored MYSELF-only manifest overlay. clasp 3.3.0 otherwise returns success
while skipping a non-interactive manifest update. Canonical and blank-target
pushes remain non-force, and any runtime `Skipping push.` result fails closed.

Only after runtime-overlay parity passes, create the MYSELF-only API-executable
deployment. Use a masked local prompt for its identifier and attest the final
runtime guard. The identifier is written only to ignored runtime configuration
and is never printed:

Instruction 0011 consumed its single runtime attempt before a versioned
deployment binding was verified. The result is `BLOCKED_BY_AUTH`; the corrected
versioned deployment was not retested. A local `last-test-runtime.json` record
therefore blocks a second attempt. Do not remove it or run the diagnostic again
without a later explicit instruction and corresponding tracked guard change.

Instruction 0013 is that later explicit instruction. It preserves the
Instruction 0011 record and uses a separate ignored one-use marker. First create
the marker locally, then perform one read-only deployment-list preflight. The
preflight retains raw output only under ignored local operation records and
publishes only counts and Booleans proving that the local binding matches one
visible versioned deployment and is not HEAD-only:

```powershell
pnpm run gas:prepare-runtime-retry:0013
$env:GAS_DEV_CLASP_ALLOWED = 'true'
$env:GAS_DEV_RUNTIME_ALLOWED = 'true'
pnpm run gas:preflight-runtime-retry:0013
```

If the result is not exact closed `PASS`, stop with
`CORRECTED_VERSIONED_DEPLOYMENT_NOT_PROVEN`; do not create another deployment.
Only after the preflight passes may the same terminal invoke the deployed
version exactly once:

```powershell
pnpm run gas:test:runtime-dev:0013
```

The Instruction 0013 command uses clasp `--nondev`, writes its attempt state
before the remote call, and refuses a second call. Remove the two temporary
environment variables after the command. Never delete either instruction's
attempt record to manufacture another call.

```powershell
$secret = Read-Host 'Deployment ID (local only)' -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
  $env:GAS_RUNTIME_DEPLOYMENT_ID = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
  $env:GAS_API_EXECUTABLE_MYSELF_ONLY = 'true'
  $env:GAS_TEST_MODE_CONFIRMED = 'true'
  $env:GAS_AUTOMATION_DISABLED_CONFIRMED = 'true'
  pnpm run gas:runtime-config:dev
} finally {
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
  Remove-Variable secret, ptr -ErrorAction SilentlyContinue
  @(
    'GAS_RUNTIME_DEPLOYMENT_ID',
    'GAS_API_EXECUTABLE_MYSELF_ONLY',
    'GAS_TEST_MODE_CONFIRMED',
    'GAS_AUTOMATION_DISABLED_CONFIRMED'
  ) | ForEach-Object { Remove-Item "Env:$_" -ErrorAction SilentlyContinue }
}
```

Do not paste the identifier, credential path, account identity, Cloud project
identifier, or OAuth browser URL into chat, GitHub, logs, or evidence.

```powershell
$env:GAS_DEV_CLASP_ALLOWED = 'true'
$env:GAS_DEV_RUNTIME_ALLOWED = 'true'
pnpm run gas:test:runtime-dev
```

The runtime call is exactly one `runQuickDiagnostic`. It accepts only the
bounded summary with complete WARN/FAIL IDs, false side-effect Booleans,
50 Task columns, and a hidden/protected/21-column validated Ledger. Lower
detail JSON and Workspace content are neither printed nor retained in tracked
evidence.

## Optional safe runtime dry-run

The only candidate function is the existing `runQuickDiagnostic` read-only
contract. It remains `NOT_EXECUTED` unless all of the following are true:

- the target declaration explicitly enables runtime dry-run;
- the self-PC operator sets `GAS_DEV_RUNTIME_ALLOWED=true` in that terminal;
- the Apps Script API executable/runtime prerequisites have been independently
  configured for the personal synthetic project; and
- the returned bounded summary proves every listed side-effect Boolean false.

Run only after canonical and runtime-overlay push/pull parity and the manual
Cloud/OAuth/API-executable prerequisites:

```powershell
$env:GAS_DEV_RUNTIME_ALLOWED = 'true'
pnpm run gas:test:runtime-dev
```

Instruction 0008 permits only one personal-synthetic API-executable deployment
with access limited to the deploying user. Do not create a web app, public or
company deployment, alter the canonical manifest, configure a provider,
enable Automation or triggers, or use real Gmail, Calendar, Sheet, or business
data.

## Result classification

| Evidence | Maximum status |
|---|---|
| GitHub publication or required CI is incomplete | `NO_GO_REMOTE_DEVELOPMENT_BOOTSTRAP` |
| Published CI/local pass, but canonical push/pull is incomplete or fails | `NO_GO_LOCAL_CLASP_VALIDATION` |
| Push and pull-back parity pass; runtime not run | `READY_FOR_LOCAL_CLASP_RUNTIME_VALIDATION` |
| CI, local, canonical parity, Cloud/OAuth, runtime-overlay parity, MYSELF-only deployment, safe runtime, and fresh clone pass | `READY_FOR_REMOTE_GAS_DEVELOPMENT_REVIEW` |

Every row keeps company handoff blocked. The maximum company status is
`NO_GO_COMPANY_HANDOFF_PENDING_REMOTE_DEVELOPMENT_REVIEW`. No row declares
Phase 8B PASS, Phase 8C GO, production readiness, or pilot readiness.
