# Work 0038 — Company Live Deployment

WORK_ID: `0038`

Dispatch ID: `N/A`

BALL: `CHATGPT`

STATUS: `PREPARING`

## Outcome

Deploy the already validated Code `2.8.25-prepilot` Phase 8C runtime into a new company Google Workspace Spreadsheet-bound Apps Script environment and begin controlled live operation on the company Inbox using the company-approved Gemini API.

This Work is an environment qualification and controlled live rollout, not a product redesign. The exact Phase 8C runtime bytes proven in Work 0037 are preferred so that company-vs-personal differences are attributable to environment, authorization, OAuth, Workspace policy, and real operational traffic rather than a new code change.

## Already-Decided Design Choices

- Reuse the exact Work 0037 final Phase 8C package `v2.8.25-prepilot-phase8c` unchanged unless a company-environment incompatibility is directly observed.
- Do not copy any personal Script Properties, Calendar IDs, Gmail state, Message State, Task/Review history, credentials, account IDs, `.clasp.json`, or other target-specific state.
- Create a fresh company Spreadsheet and fresh bound Apps Script project.
- Company Gemini API use is user-confirmed as approved. The credential itself must be entered only inside the company environment and must never be placed in GitHub, chat, email body, documentation, or the delivery package.
- Automation remains OFF through installation and Setup/readiness checks.
- The first successful explicit company enable establishes the durable start boundary. Messages older than that boundary are not admitted.
- Ordinary eligible Inbox mail does not require `手動/取込`.
- Hard exclusions remain: Thread-wide `手動/除外`, spam, trash, non-Inbox, Promotions, Social, clear newsletter/list mail, and Google Calendar notifications.
- One Message per five-minute scheduled run remains the throughput bound.
- Meaningful Run History uses `TIME_DRIVEN / AUTO_PILOT`; healthy idle cycles are not persisted to detailed Run History and keep only the existing heartbeat.
- Detailed Run History retention remains 90 days; Error/Dead Letter, Message State, Task/Review, Calendar state, and Task Authority evidence remain outside that retention boundary.

## Source of Truth

- Work 0037 completion: `docs/handoffs/0037-completion.md`
- Current contract: `CURRENT_CONTRACT.json`
- Exact runtime package: `implementation/GoogleSpreadsheet/release/v2.8.25-prepilot-phase8c/`
- Runtime payload: `implementation/GoogleSpreadsheet/release/v2.8.25-prepilot-phase8c/apps-script/`
- Deployment manifest/checksums in the same package directory.

## Required Scope

1. Deliver a company-transfer bundle containing every runtime file required by the Phase 8C package plus checksums, manifest, and a company deployment guide.
2. Transfer that bundle to the company PC without embedding credentials or target identifiers.
3. On the company account, create a fresh Spreadsheet and bound Apps Script project.
4. Install the exact runtime payload and manifest.
5. Configure the company-approved Gemini credential only in company Script Properties using the existing opaque property key expected by the runtime.
6. Complete Setup and observe company OAuth / Gmail / Calendar / Apps Script / provider readiness.
7. Keep Automation OFF until readiness is complete.
8. Explicitly enable Automation once and begin actual company Inbox operation if readiness is green.
9. Observe bounded operational evidence only; do not copy company message content, subjects, senders, internal URLs, IDs, credentials, or provider payloads into GitHub or chat.
10. Stop immediately on permission failures, unexpected data admission, duplicate Task/Calendar effects, unexpected Calendar ownership, schema/provider failures, or inconsistent Trigger state.

## Non-Goals

- No migration of personal-environment data or configuration.
- No modification of company-wide Google Workspace administrator policy.
- No storage of company secrets or identifiers in GitHub.
- No broad historical Inbox backfill.
- No model/provider fallback, retries, attachment ingestion expansion, or throughput increase in this Work.
- No code modification merely to bypass a company security policy or OAuth denial.

## Acceptance Criteria

Priority order:

1. **Company live end-to-end evidence:** a new eligible company Inbox Message received after company enable is automatically admitted, classified by the approved Gemini provider, and produces the intended governed Task/Review outcome without duplicate or unauthorized Calendar effects.
2. **Company readiness evidence:** fresh Setup reaches `S99_COMPLETE`; Code/Schema/Migration align; provider credential/readiness, OAuth, seven formal labels, dedicated Calendar, and Automation OFF/zero-trigger readiness are observed before enablement.
3. **Trigger evidence:** explicit enable yields exactly one canonical five-minute clock Trigger and a valid start boundary; final stop yields `CONSISTENT`, `enabled=false`, `desired_enabled=false`, zero owned clock Triggers, and no stored/canonical Trigger residue.
4. **Privacy evidence:** no company email content, personal/company identifiers, credentials, private URLs, or raw provider payloads are committed or pasted into GitHub/chat.
5. **Package identity evidence:** company-installed files match the Work 0037 Phase 8C checksums or otherwise use an independently demonstrated byte-identical transfer.

## Required Validation Evidence

Evidence hierarchy:

1. Direct observation on the company Google Workspace account/PC.
2. Company Apps Script bounded readiness/status output with sensitive values omitted.
3. Phase 8C package checksum/manifest identity.
4. GitHub CI/local evidence from Work 0037 as supporting, not substitutive, evidence.

Do not treat an unexecuted company check as PASS.

## Write Boundaries

- GitHub may receive only non-sensitive Work 0038 instructions, delivery-package provenance, bounded status, and redacted acceptance evidence.
- Company credentials, account identifiers, Spreadsheet/Script/Calendar/Gmail IDs, internal URLs, and message content stay only in the company environment.
- Existing Work 0037 frozen release/source evidence is not modified.

## External-Action Authorization

User explicitly requested actual company-PC operation and confirmed that a company-approved Gemini API is available.

Authorized company-user actions, after package transfer:

- create a fresh company Spreadsheet and bound Apps Script project;
- install the exact Work 0037 Phase 8C runtime payload;
- authorize the manifest scopes through the company Google Workspace account if allowed by company policy;
- configure the approved Gemini credential in Script Properties;
- run Setup/readiness;
- explicitly enable one five-minute Automation Trigger after readiness;
- allow newly arriving eligible company Inbox mail to be processed in normal operation;
- allow governed Task/Review output and the existing dedicated-Calendar policy;
- explicitly stop Automation and verify cleanup when directed or if a stop condition occurs.

Not authorized by this handoff:

- exposing credentials or company data outside the company environment;
- weakening filters, schema validation, Task authority, Calendar ownership, privacy, or Trigger guards;
- retry/fallback to an unapproved provider/model/endpoint;
- changing company administrator policy or bypassing a company control;
- retrospective bulk processing of pre-enable company Inbox mail.

## Delivery

A minimal delivery branch/package must contain only:

- `apps-script/` Phase 8C runtime files;
- `CHECKSUMS.sha256`;
- `DEPLOYMENT_MANIFEST.md`;
- the historical Phase 8C guide for provenance;
- `README_FIRST.md` and `COMPANY_LIVE_DEPLOYMENT_GUIDE.md` specific to Work 0038.

The transfer package must contain no `.clasp.json`, credential, account ID, private URL, or company data.

## Escalation Conditions

Stop and return to ChatGPT if any of these occurs:

- Apps Script or required manifest scopes are blocked by the company tenant;
- the company-approved Gemini API does not support the package's configured endpoint/model (`generativelanguage.googleapis.com/v1beta/interactions`, `gemini-3.6-flash`);
- the company key cannot be stored/read through Script Properties under the existing credential contract;
- Setup cannot create or verify the dedicated Calendar or Gmail labels;
- readiness is not green before enablement;
- an unexpected or sensitive message is admitted contrary to the intended company use boundary;
- duplicate Task/Review/Calendar effects or Trigger inconsistency occurs.

Do not locally patch around those conditions. They are decision-changing company-environment evidence and trigger a Strategy Reset.

## Completion Report

Work 0038 is complete only after actual company live operation is observed and an explicit stop/rollback check proves zero owned Trigger residue, unless the user explicitly elects to leave the company Automation enabled as the accepted operating state after evidence review.

WORK_ID: `0038`

Dispatch ID: `N/A`

BALL: `CHATGPT`

STATUS: `PREPARING`
