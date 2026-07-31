# 指示番号: 0005
# Google Workspace Personal Work OS v2.8.11
# T11 5ファイル再搬入／T1-01 Quick Diagnostic再観測

- Date: 2026-07-31
- Repository: `Tanukitsune-hub/GAS-Project-Schedule`
- Repository URL: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule`
- Working branch: `codex/r5-independent-reaudit-transfer-prep`
- Draft PR: `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/8`
- Instruction 0004 result / current baseline: `ec8a4dd0d883fe85069f815d5b2cf6b8ca60da80`
- Release B11 payload commit: `952438907e1a09092a46127dc130b3403a911db4`
- Fixed Transfer T11: `a3b5a5d8d851bf2d15a2738c54dc6bb31e231d33`
- Historical old-byte/hash baseline T10: `927d8567bce64461840cc6f72fbae0c1e636a8e6`
- Candidate: Code `2.8.11-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`
- Current gate: `READY_FOR_PHASE8B_T1_01_SUMMARY_RETRANSFER`
- T1-01 status before execution: `REVIEW_REQUIRED`

## 1. Authority and scope

This is a manual operator instruction for the existing completed, controlled,
non-production, synthetic/non-sensitive Google Workspace Sandbox.

It authorizes only:

1. verification and replacement of the five files listed in the fixed-T11
   patch manifest; and
2. after successful replacement, one read-only T1-01 Quick Diagnostic
   bounded-summary re-observation.

It does not authorize Codex work, Setup, `セットアップを続行`, S90/S99 rerun,
Dashboard refresh, Deep Diagnostic, Task edit, Gmail, Calendar reconciliation,
Properties or trigger work, Automation, test harnesses, Migration, repair,
OAuth, deployment, `clasp push`, Phase 8C, production, or pilot use.

## 2. Governing GitHub records

Read these fixed records before operating:

- T11 governing guide:
  `implementation/GoogleSpreadsheet/transfer/v2.8.11-prepilot/README_ja.md`
- T11 Japanese patch manifest:
  `implementation/GoogleSpreadsheet/transfer/v2.8.11-prepilot/COMPANY_PC_PATCH_MANIFEST_ja.md`
- T11 machine-readable patch manifest:
  `implementation/GoogleSpreadsheet/transfer/v2.8.11-prepilot/COMPANY_PC_PATCH_MANIFEST.json`
- T11 result template:
  `implementation/GoogleSpreadsheet/transfer/v2.8.11-prepilot/RESULTS_TEMPLATE_ja.md`
- Stop/rollback checklist:
  `implementation/GoogleSpreadsheet/transfer/v2.8.11-prepilot/STOP_AND_ROLLBACK_CHECKLIST_ja.md`

The fixed T11 manifest, not this chat, is the byte-level authority.

## 3. Preconditions

Before replacing any file, confirm all of the following:

- the target is the same Sandbox that completed Setup through `S99_COMPLETE`;
- no Setup or manual repair has been run after the prior T1-01 observation;
- Automation remains OFF and no five-minute worker trigger has been enabled;
- the five current files can be checked against the old T10 SHA-256 values;
- the B11 source files are opened at the exact fixed commit
  `952438907e1a09092a46127dc130b3403a911db4`;
- `appsscript.json` will not be changed;
- no unlisted file will be replaced.

If the old SHA-256 cannot be confirmed, record
`HASH_VERIFICATION_UNAVAILABLE` and STOP. Do not replace files based only on
file names, visible version strings, or similarity.

## 4. Exact replacement set and order

Replace only the following five files, in this exact order.

| Order | File | Old T10 SHA-256 | New B11 SHA-256 |
|---:|---|---|---|
| 1 | `00_Config.gs` | `06d5c64d55bdfa8c49e6ebe60f92867bb8864a713611f251fa4cb5ac1448cb0e` | `d61390db1f52744b36b06865fa70d3aaa6c4fafe0316a138ff0bfb939345e868` |
| 2 | `02_Setup.gs` | `46baf94979ebef33f6350bc4016fea2282a7cf4a3f45a94b2962500065df010f` | `e2b5bcc42e54e3413fe8b11ce19ac805c0736c170d050c320ba5e9c37cb9dbba` |
| 3 | `15_Dashboard.gs` | `5a6311f8a5fb61ed498af5961f946639e656b32437eddea8c7b0901a630845cc` | `c18be435239c3468493971baab82fe746de4210f7513b1677eadff3b00405353` |
| 4 | `16_Diagnostics.gs` | `c299030a10893f9d8360ccbe9b0be9149ab9bf91a12b215ea2880acc9e1a5382` | `b69eff8cc567969bf2fa00b6347009b7fdb0b38e06aa867684e8a7666c000c8c` |
| 5 | `Menu.gs` | `77e4141eb834276c475f1a4f76ab0d6cef4d49410464f2b6ad86be3303ccdaed` | `d96d7b9ba6a35cd1a9d0309fb0375699e1b1f89fbd851da86b26e680cbb59c15` |

Fixed B11 file URLs:

1. `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/blob/952438907e1a09092a46127dc130b3403a911db4/implementation/GoogleSpreadsheet/release/v2.8.11-prepilot/apps-script/00_Config.gs`
2. `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/blob/952438907e1a09092a46127dc130b3403a911db4/implementation/GoogleSpreadsheet/release/v2.8.11-prepilot/apps-script/02_Setup.gs`
3. `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/blob/952438907e1a09092a46127dc130b3403a911db4/implementation/GoogleSpreadsheet/release/v2.8.11-prepilot/apps-script/15_Dashboard.gs`
4. `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/blob/952438907e1a09092a46127dc130b3403a911db4/implementation/GoogleSpreadsheet/release/v2.8.11-prepilot/apps-script/16_Diagnostics.gs`
5. `https://github.com/Tanukitsune-hub/GAS-Project-Schedule/blob/952438907e1a09092a46127dc130b3403a911db4/implementation/GoogleSpreadsheet/release/v2.8.11-prepilot/apps-script/Menu.gs`

For each file:

1. confirm the current file matches the old SHA-256;
2. replace the whole file with the exact B11 content;
3. save;
4. confirm the resulting file matches the new SHA-256;
5. do not proceed to the next file after any mismatch.

`appsscript.json` and the other 18 payload files are byte-unchanged and must be
left untouched.

## 5. Post-replacement hold point

After all five new hashes match:

- confirm `CODE_VERSION=2.8.11-prepilot`;
- confirm `SCHEMA_VERSION=2.6`;
- confirm `AI_SCHEMA_VERSION=2.0`;
- confirm `MIGRATION_VERSION=3`;
- confirm `TEST_MODE=true`;
- confirm `AUTOMATION_ENABLED=false`;
- reload the Spreadsheet so the existing menu is refreshed.

Do not run Setup or any menu action other than the one in Section 6.
A persisted v2.8.10 version-property mismatch may appear as WARN and must not
be repaired by Setup.

## 6. One authorized Workspace action

Run exactly once:

```text
業務OS v2
→ Quick Diagnostic
```

Do not run it a second time in the same session. Do not run Deep Diagnostic or
Dashboard refresh.

The dialog must show a top section named `Bounded Acceptance Summary` before
the capped detailed JSON. Use only that top summary. Do not copy, save, or
report the lower detail JSON or a screenshot.

## 7. Required closed result

Return only the following bounded fields, as displayed by the top summary:

```text
instruction_number: 0005
action_id: T1-01
authorization: APPROVED
execution_status: REVIEW_REQUIRED | STOP | FAIL
summary_contract_id: WORK_OS_V2_DIAGNOSTIC_ACCEPTANCE_SUMMARY_V1 | UNKNOWN
status: PASS | WARN | FAIL | UNKNOWN
pass_count:
warn_count:
fail_count:
not_executed_count:
warn_check_ids:
fail_check_ids:
warn_ids_complete: true | false | UNKNOWN
fail_ids_complete: true | false | UNKNOWN
acceptance_summary_status: COMPLETE | REVIEW_REQUIRED | UNKNOWN
external_services_called: false | UNKNOWN
writes_performed: false | UNKNOWN
spreadsheet_write_performed: false | UNKNOWN
properties_write_performed: false | UNKNOWN
trigger_write_performed: false | UNKNOWN
flush_performed: false | UNKNOWN
calendar_api_called: false | UNKNOWN
gmail_api_called: false | UNKNOWN
external_ai_request_performed: false | UNKNOWN
dashboard_repair_performed: false | UNKNOWN
task_physical_column_count: 50 | UNKNOWN
task_schema_ids_state: PASS | FAIL | UNKNOWN
task_schema_headers_state: PASS | FAIL | UNKNOWN
ledger_physical_column_count: 21 | UNKNOWN
ledger_hidden_state: true | false | UNKNOWN
ledger_protection_state: true | false | UNKNOWN
ledger_authority_validator_state: PASS | FAIL | UNKNOWN
next_action_authorized: false
rollback: STOP_NO_REPAIR_NO_RETRY
```

Do not include raw messages, detail JSON, Sheet/range names, values, formulas,
IDs, URLs, account information, Calendar/Gmail content, timestamps, locale,
actual formats, credentials, or screenshots.

## 8. Stop conditions

STOP immediately, with no repair or retry, if any of the following occurs:

- old or new SHA-256 mismatch;
- a sixth file appears necessary;
- `appsscript.json` appears changed;
- unexpected authorization or OAuth prompt;
- bounded summary is absent, malformed, duplicated, incomplete, or appears
  after the capped detail section;
- `warn_ids_complete` or `fail_ids_complete` is not `true`;
- `acceptance_summary_status` is not `COMPLETE`;
- any read-only side-effect Boolean is true or unknown;
- any genuine FAIL is reported;
- Task or Ledger aggregate is unknown or inconsistent;
- any Setup, Dashboard, Gmail, Calendar, trigger, Automation, or repair action
  is suggested or initiated.

Do not delete a Calendar, Gmail label, error row, property, or trigger. Do not
rerun Quick Diagnostic to obtain a cleaner result.

## 9. Status boundary

Completing the replacement does not make T1-01 PASS. The result remains subject
to ChatGPT review and later GitHub evidence recording.

T1-02 and every later action remain unauthorized. Phase 8B overall PASS,
Phase 8C GO, production ready, and pilot ready remain `NOT_DECLARED`.

# 指示番号: 0005 — END
