# Work 0041 — Calendar Runtime Remediation Report

Work ID: `0041`
Dispatch ID: `0041-CODEX-01`
BALL: `CHATGPT`
STATUS: `RETURNED`
Mode: `BUILD`
Date: `2026-09-05`

## Outcome and evidence boundary

通常の5分scheduled workerが、Review受入／Calendar関連Task編集で残った
standalone Calendar Outboxを既存上限内で処理する非ライブ候補を完成した。
日常運用のたびに手動「Calendar同期を1件処理」を要求する経路を修正した。
会社への更新・Calendar E2Eを実施したという意味ではない。

正本はpublication base `baddbd9dc728599dc095526e69ce7531b0f16bea` の
`0041-instruction.md`、`0041-dispatches.md`、`0041-user-automation-live-status.md`、
`0041-CODEX-01-calendar-runtime-remediation-instruction.md` と適用AGENTS。
Work 0039/0040 Acceptance、会社setup／対象メールのGemini処理成功、high-impact
Review policyは維持した。会社Calendar E2Eは引き続き `NOT_ACCEPTED`。

## Confirmed root cause

修正前のcanonical経路は `runScheduledWorker` → `processAutomaticBatch` →
Message backlog／新規Gmail候補の処理だった。Calendar処理はMessageのvertical
処理に従属し、元Messageが `DONE` になった後のEditHandlerが作ったdurable Outboxを
単独でdrainする段階がなかった。手動 `syncPendingCalendarJobs` は別に存在した。

修正前にreal TaskRepository／EditHandlerとfake Apps Script／Calendarを使って、
Calendar対象Taskの期限編集 → Outbox `PENDING` → Gmail候補0／Message backlog0 →
canonical scheduled invocationを実行した。結果は `COMPLETE`、
`calendar_job_count=0`、Calendar CREATE 0、Outboxは `PENDING` のままで、
「次のscheduled invocationで1件処理」のassertionがFAILした。
仮説を確認してから修正した。修正後の同経路はCREATE 1、Outbox `DONE` でPASS。

これは会社で観測された「新着0件FAILED」の原因確定ではない。

## Source changes and preserved boundaries

- `18_Worker.gs`: Message処理の後にbounded standalone drainを追加。
  既存worker lease所有権／expiryをScript Lock下で再確認し、同じsoft budgetと
  Message側処理後の残りCalendar job allowanceを共有する。
- `10_CalendarSync.gs`: 既存のCalendar target-type判定をexport。
  `processNextJob` の既存claim → lock外I/O → claim／Task／Outbox CASを再利用する。
  Calendarアルゴリズムやeligibilityは変更していない。
- due jobの正常処理、deferred RETRY、DEAD、claim contention、authority exclusion、
  CAS recoveryを区別する。失敗・PAUSEDをhealthy idleへ変換しない。
  CAS後に既にI/Oが起きた場合の返却metadataも保持する。
- `00_Config.gs`: Codeのみ `2.8.26-prepilot` → `2.8.27-prepilot`。
  Schema `2.6`／AI Schema `2.0`／Migration `3` は不変。
- current contract、active docs、test inventory、版別builder/verifierとgate routingを更新。
  Work 0037/0039の既存検証は維持し、Work 0039 release testを固定sourceのhistorical
  artifact検証として継続した。

Task authority／Review／EditHandler／Trigger／LogAndDeadLetter／schema／migration／
provider各実装とmanifestはbaselineから不変。新しいTrigger、schema、provider、
OAuth scope、fallback、Review条件緩和はない。Automation artifact defaultはOFF。
workerが既にFAILED／PAUSEDの場合に無理に追加処理を進めない安全境界も維持した。

## Validation actually executed

Full local validation HEAD: `62f1e8d255ab3906c97e81a1ea48558fd68f8fee`。
コマンドは `implementation/GoogleSpreadsheet` から実行。

| Check | Observed result |
|---|---|
| `node tests/work_0041_calendar_scheduled_drain_test.js` | 16 PASS / 0 FAIL |
| `node tests/work_0041_ci_scope_test.js` | 19 PASS / 0 FAIL |
| `pnpm run verify:tests` | 92 suites PASS / 0 FAIL; missing 0 / extra 0 |
| `node tools/validate_apps_script_v2.js` | 11 PASS / 0 FAIL |
| `pnpm run verify:local` | 13 PASS / 0 FAIL; 92 suites |
| `pnpm run verify:ci` (local execution) | 13 PASS / 0 FAIL; 92 suites |
| `node tools/verify_work_0041_release.js` | source parity / checksums / deterministic rebuild PASS |
| `node tests/local_validation_secret_scan_test.js` | 11 PASS / 0 FAIL |
| tracked secret / local-state / active and frozen package scan | PASS; 0 hits |
| source lineage / frozen preservation | PASS; 0 changed frozen paths |
| `git diff --check` and committed-range diff check | PASS; 0 whitespace errors |

Inventory fingerprint:
`3430dbfeb827e7bd2c07bec8429b4d8652fce31ddeebc1a49bbfdd7b0f060e47`。
実行した全suite名は `tests/expected_test_inventory.json` に固定されている。
Calendar、EditHandler、Worker、Trigger、Run History／idle、retry、idempotency、
authority、Gmail／Gemini／Task／Reviewの既存全regressionを含む。skipによる除外はない。

Focused evidenceには、実際のhigh-impact Review作成 → 元Message DONE → ACCEPT →
次のscheduled CREATE、Task編集CREATE／UPDATE／完了DELETE、差分なしNOOP、
standalone複数件およびMessage backlogとの合計1件上限、RETRY失敗／延期／再開、
DEAD、post-I/O CAS recoveryとduplicate防止、worker lease busy／lost、budget停止、
Calendar claim busy／expiry／所有権喪失、authority不正、手動fallbackを含む。

完全zero-workは `COMPLETE`、Calendar API 0、詳細 `log_recorded=false`、
Run Historyのread 0、`AUTOMATION_LAST_RUN_AT` heartbeatありを確認した。
新着0件でも注入したGmail system failure／Calendar failureはFAILEDとして残る。

開発時の版更新直後の全91 suiteは85 PASS／6 FAILだった。6件はactive versionを
旧版に固定したassertionであり、active metadataのみ27へ更新して全件解消した。
新release scanの初回1件は既存TestHarnessの固定 `example.invalid` redaction fixture。
既存gateと同一のexact-literal例外を継承し、credential全般を除外せず再scanと
secret-negative testをPASSさせた。最終未解消FAILは0。製品修正戦略は1つ。

## Version, release and transport

Source commit: `2a1b656fd7ecd411b61d728369b02fd5b49b28be`
Release content commit: `62f1e8d255ab3906c97e81a1ea48558fd68f8fee`
Prepared at: `2026-09-05T02:43:43Z`

`build_work_0041_release.js` は既存Work 0039 toolingの版別後継で、clean source/tool
commitを明示してGitのsource bytesから生成した。新規パスのみを使用し、generated
payloadの直接修正はしていない。生成物の `release_commit=SELF` は既存convention。

| New path under `implementation/GoogleSpreadsheet/release/` | Payload / package files |
|---|---|
| `v2.8.27-prepilot/` | 26 / 30; TEST_MODE=true, harness included |
| `v2.8.27-prepilot-phase8c/` | 25 / 29; TEST_MODE=false, harness excluded |
| `work-0041-single-file-company-install/` | 24 source sections / 6 files |

Phase 8Cの既存audited TEST_MODE／Gemini readiness transformのみを継承した。
OpenAI governanceは `NOT_APPROVED_OR_UNKNOWN` のまま、Azureは別経路・対象外。

2回貼り付け順は `Code.gs` → `appsscript.json`。
`Code.gs.txt`／`appsscript.json.txt` はそれぞれ元ファイルとbyte-identical。

- Code.gs: 1,258,896 bytes; SHA-256 `1535e6294197bebd97c4c3ff37a6c83ae866a9c28b112896da01203894993a78`
- appsscript.json: 868 bytes; SHA-256 `e546725fcfe47adfd40e094e66a6c866418cb6265441f541ee000c940d4a8afe`
- Bundle CHECKSUMS: `ec5c756c0cef2025e67a480e7e1cce6ebfba9b44136878e6339645183dd8a1e2`
- Phase 8B payload: `f1ec4f4128cd36515d8f1fddcc9c510054463dca600f4f4653b4e52e6c060c7e`
- Phase 8C payload: `526d1dd6c2a8e8e39c43dee9e843b9782cfccdeecb3c434dd0524b20f794ff06`

## Preservation and GitHub delivery

Branch: `codex/0041-calendar-runtime-remediation`
Draft PR: [#56](https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/56), OPEN / DRAFT / UNMERGED。

最初の通常pushは
`git push origin HEAD:refs/heads/codex/0041-calendar-runtime-remediation`。
remote `baddbd9...` → `62f1e8d...` のfast-forward成功後、GitHubからexact HEADと
新3 packageの全65 blob、各CHECKSUMSの実bytesをreadbackして一致した。

以下は上記source/release HEADに対して実際にcompletedとなったGitHub結果であり、
local PASSから推定したものではない。

| GitHub event | Run ID | Head SHA | Conclusion |
|---|---|---|---|
| push | [33940174431](https://github.com/Tanukitsune-hub/GAS-Project-Schedule/actions/runs/33940174431) | `62f1e8d255ab3906c97e81a1ea48558fd68f8fee` | SUCCESS |
| pull_request | [33940176385](https://github.com/Tanukitsune-hub/GAS-Project-Schedule/actions/runs/33940176385) | `62f1e8d255ab3906c97e81a1ea48558fd68f8fee` | SUCCESS |

Final report commit: `SELF` (this reportを含むcommit)。そのcommitはreport／dispatch
statusのみを更新し、上記source／releaseは変更しない。最終report-headのexact SHAと
push／PR CI readbackは、commit確定後に更新する[PR body／checks](https://github.com/Tanukitsune-hub/GAS-Project-Schedule/pull/56/checks)を参照する。

baselineに存在する歴史release全1,001ファイルのGit blob／modeは不変。
gateが保護する42ルート（旧release 39＋Work 0039 builder／verifier／templates 3）も
差分0。Work 0038／0039／0040のfrozen handoff／deliveryを変更していない。
remote archive readbackは以下に一致した。

- `archive/0038-gemini-source-baseline` → `272612831c4a46e45fdf166c65e3075ffee7dfef`
- `archive/0038-gemini-company-delivery` → `eccf27ec9f6b6fd023eca7b69279cc88741ecd9b`

mainは `baddbd9dc728599dc095526e69ce7531b0f16bea` のまま。
force-push、rebase、squash、main mergeは実施していない。

## Company no-new-mail FAILED / follow-up

実際に会社で観測されたFAILEDの原因はローカルでは再現・特定できていない。
`NEED_USER_EVIDENCE`：まず、既に存在するFAILED scheduled run **1件**の
正規化された `error_code` と `stage`（またはsubsystem）のみが必要。
新しいlive attemptやdebug採取を本dispatchから要求・実行しない。
raw error、メール／Task／Calendar内容、private URL／ID、credentialは不要・保存禁止。

- BLOCKER: 本BUILD dispatchの未解消blockerは `NONE`。
- FOLLOW_UP: ChatGPT review。その後、別途許可されたuser-controlled更新と
  Review／Task edit → 通常5分worker → Calendar E2Eの実機qualification。
  会社のno-new-mail FAILEDについて上記最小evidenceで分類する。
- OPTIONAL: `NONE`。

Work 0041全体のcompletion latchは未適用。local／GitHub CIは会社実機Acceptanceではない。

## External actions

Live Workspace/provider actions = `NOT_EXECUTED`。
会社deploy、Apps Script push、Gmail読取／処理、Calendar Event CREATE／UPDATE／DELETE、
live Trigger作成／変更／削除、Automation有効化、Gemini／OpenAI／Azure request、
OAuth変更、credential値読取／表示、company/private data取得、別Workspace target操作は
すべて `NOT_EXECUTED`。許可された外部変更はGitHub branch／Draft PRの納品のみ。

## Shared Knowledge

KNOWLEDGE_RETRIEVAL: `OBS-0002`, `RULE-0001`
KNOWLEDGE_APPLIED: `NONE`
NEW_KNOWLEDGE_CANDIDATE: `YES`

canonical `origin/main` から参照したが、今回の判断は明示dispatchと実行証拠で決めた。
capture候補：完了済みsource recordから独立して存続するdurable derived-work queueは、
scheduled consumerとidle判定にも独立して含める必要がある。共有KBへの書込はしていない。
