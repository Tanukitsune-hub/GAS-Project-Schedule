# Work 0041 — Company Workspace Runtime Qualification

WORK_ID: `0041`

DISPATCH_ID: `N/A`

BALL: `USER`

STATUS: `ACTION_REQUIRED`

MODE: `QUALIFICATION`

## Outcome

Qualify the accepted Work 0039 company-install bundle on the user's company Google Workspace environment and advance it to a safely usable state using direct user-observed runtime evidence. Automation must remain OFF until the required readiness and bounded qualification evidence is satisfied.

## Already-Decided Design Choices

- GitHub `main` / Work 0039 accepted source and release remain authoritative for product bytes.
- The canonical authored source remains `implementation/GoogleSpreadsheet/apps-script-v2/`.
- The installed company bundle is the accepted Work 0039 two-paste distribution; do not regenerate or modify it merely to repeat qualification.
- User-observed company-PC runtime evidence is stronger than local/CI inference for this Work.
- Credentials and API-key values must never be copied into GitHub, chat, email, reports, screenshots, or attachments.
- Automation remains OFF until explicit readiness/qualification evidence supports enablement.
- A company Apps Script editor size failure would trigger a Strategy Reset to the pre-decided split-bundle fallback rather than repeated paste attempts; that fallback is not active because installation/setup has already progressed.

## Source of Truth

- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Accepted product baseline at Work start: `b9fb54217576a9e780d725118081037eadcf5b48`
- Work 0039 acceptance: `docs/handoffs/0039-acceptance.md`
- Work 0039 dispatch ledger: `docs/handoffs/0039-dispatches.md`
- Runtime menu: `implementation/GoogleSpreadsheet/apps-script-v2/Menu.gs`
- Runtime readiness behavior: `implementation/GoogleSpreadsheet/apps-script-v2/README.md`, `12_Triggers.gs`, and related current source.

## Accepted Evidence at Work Start

User-observed evidence reported in the company environment:

1. Initial setup has completed.
2. The required API key has been configured in Apps Script Script Properties.

The credential value was not requested, observed, recorded, or stored.

The following are not yet claimed as PASS unless separately observed during this Work:

- current personal Shadow Pilot readiness result;
- selected-provider synthetic qualification;
- major manual flow behavior;
- Automation enablement or scheduled-worker runtime.

## Required Scope

1. Observe the company-environment personal Shadow Pilot readiness result while Automation remains OFF.
2. Resolve only readiness failures that materially block safe use.
3. Perform only the minimum bounded synthetic/provider qualification required by the current readiness contract.
4. Exercise the minimum major manual flow necessary to establish company-runtime usability.
5. Enable Automation only after readiness/qualification evidence supports it and only through the explicit user-controlled menu path.
6. Record observed PASS/FAIL/NOT_EXECUTED evidence without confidential content.

## Non-Goals

- Rebuilding Work 0039 bundles without a material blocker.
- Broad hardening, refactoring, or unrelated UI work.
- Storing company message content, account identifiers, API keys, private URLs, provider payloads, or raw provider errors in GitHub/chat.
- OpenAI company-data use unless separately authorized by company data-governance policy and this Work's explicit qualification path.
- Treating CI or synthetic local tests as company-runtime PASS.

## Acceptance Criteria

Priority order:

1. Installed bundle remains saved and runnable in the company Spreadsheet/Apps Script project.
2. User-observed runtime setup remains complete.
3. `個人用Shadow Pilotの準備状態を確認` provides a bounded readiness result without enabling Automation.
4. Required provider/OAuth/formal-label/Calendar/trigger prerequisites are satisfied or any blocking item is identified precisely.
5. Required bounded provider qualification succeeds, if required by readiness.
6. Minimum major manual flow succeeds in the company environment.
7. Automation is enabled only after qualification and its first bounded runtime evidence is observed.

## Required Validation Evidence

Evidence hierarchy:

1. User-observed company Spreadsheet / Apps Script result.
2. Safe bounded status/readiness dialog output with no confidential content.
3. Safe bounded synthetic-provider qualification result.
4. Major manual-flow result.
5. Automation status/first bounded runtime result after explicit enablement.
6. Repository CI/local evidence only as supporting evidence.

Never mark an unexecuted company-runtime check PASS.

## External-Action Authorization

Current authorization is limited to user-controlled actions in the already-created company Workspace installation necessary to inspect readiness and continue qualification.

Next authorized action: run the read-only menu item `業務OS v2` -> `個人用Shadow Pilotの準備状態を確認` and report only the bounded result/status, with confidential content omitted.

Not authorized yet:

- enabling Automation;
- repeated provider requests;
- broad Gmail processing;
- destructive data changes;
- sharing credentials;
- OpenAI company-data use without separate governance authorization.

## Escalation Conditions

Strategy Reset only if a result materially blocks the Primary Outcome, including installation/runtime failure, data-integrity risk, credential/confidentiality risk, authoritative-state contradiction, or a required major flow that cannot run. Non-blocking UI/hardening issues should not stop qualification.

## Delivery

This Work is primarily user-executed company-runtime qualification. GitHub records contain bounded status/evidence only and no company secrets. Codex is not required unless a reproducible implementation defect requiring local code changes is identified.
