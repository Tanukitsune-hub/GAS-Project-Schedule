# Google Workspace Personal Work OS

最終更新日: 2026-07-27  
Current Version: Code `2.8.4-prepilot` / Schema `2.5` / AI Schema `2.0` / Migration `2`  
Status: `READY_FOR_INDEPENDENT_REAUDIT`

## GitHub正本

`Tanukitsune-hub/GAS-Project-Schedule`が、context、implementation、tests、tools、
release、audit、instructionsの唯一のGitHub正本です。

## 現在地

Code 2.8.3独立再監査のR3-01～R3-07を修正しました。

- management列を含むeditのevent全体拒否と全47列完全復元
- Setup／Migrationのsilent rebaseline禁止
- physical row versionとbusiness Review guardの分離
- Task editからCalendar Outboxまでのdurable reconcile intent
- 1行open Reviewの明示的な再stage
- canonical文書のRepository統一
- Source Commit AとRelease Commit Bを分けたrelease provenance
- 手動Gmail exact Messageのoldest-first policy

Local evidenceは38 suites、`556 PASS / 0 FAIL / 11 SKIPPED`、static
validationは`10 PASS / 0 FAIL`です。SKIPPEDは実Provider／実Google Workspace
相当項目で、PASSへ昇格していません。

最上位statusは`READY_FOR_INDEPENDENT_REAUDIT`です。Phase 8B GO/PASS、
Phase 8C GO、Production ready、Pilot readyは宣言しません。

## 読む順番

1. `CURRENT_STATUS.md`
2. `DECISIONS.md`
3. `PROJECT_CONTEXT.md`
4. `MASTER_PLAN.md`
5. `instructions/GoogleWorkspace_v2_8_3_Next_Remediation_Work_Prompt_2026-07-27.md`
6. `implementation/GoogleSpreadsheet/AUDIT_REMEDIATION_ROUND3_IMPLEMENTATION_REPORT.md`
7. `implementation/GoogleSpreadsheet/apps-script-v2/README.md`

## 可視化

- [可視化インデックス](docs/visualizations/index.html)
- [タスク管理システム 全体ワークフロー](docs/visualizations/GoogleWorkspace_v2_Workflow_Overview.html)

ワークフロー図は外部ライブラリに依存しない単一HTMLで、全体像、自動処理、手動取込・編集、Review、Calendar同期、障害・再実行の表示を切り替えられます。

## 主要directory

- `implementation/GoogleSpreadsheet/apps-script-v2/`: Apps Script source
- `implementation/GoogleSpreadsheet/tests/`: local regression
- `implementation/GoogleSpreadsheet/tools/`: validatorとrelease tooling
- `implementation/GoogleSpreadsheet/release/`: versioned packages
- `audits/2026-07-27/`: 独立監査とRound 3 local evidence
- `instructions/`: 作業指示

## Guardrails

実Provider、OAuth、実Gmail／Calendar操作、installable edit Trigger実event、
LockService実競合は今回`NOT EXECUTED`です。credential、実メール本文、
個人情報、実Workspace ID／URLをRepositoryへ保存しません。
