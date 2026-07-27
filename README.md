# Google Workspace Personal Work OS

最終更新日: 2026-07-27  
Current Version: Code `2.8.4-prepilot` / Schema `2.5` / AI Schema `2.0` / Migration `2`  
Status: `REAUDIT_NO_GO` / additional remediation required

## GitHub正本

`Tanukitsune-hub/GAS-Project-Schedule`が、context、implementation、tests、tools、release、audit、instructionsの唯一のGitHub正本です。

## 現在地

Code 2.8.4-prepilotについて、Source commit AとRelease commit Bを固定した独立再監査を完了しました。

```text
Source commit A: a7f66eb4ca5ef71dab6faaaa595964c7af73326e
Release commit B: 2c31ba8303b9988ac96c0ef29b81e64eaee0c84b
Regression: 38 suites / 556 PASS / 0 FAIL / 11 SKIPPED
Static validation: 10 PASS / 0 FAIL
Release checksum / parity: PASS
```

既存testとrelease検証はPASSしましたが、Task authoritative stateの部分失敗・欠損・multi-row復元にHigh Finding 3件、header・visualization・backup記載にMedium Finding 3件を確認しました。

```text
Phase 8B Part A～C: HOLD
Phase 8B受入完了: NO-GO
Phase 8C: NO-GO
実業務パイロット: NO-GO
Automation: OFF
```

## 読む順番

1. `CURRENT_STATUS.md`
2. `DECISIONS.md`
3. `PROJECT_CONTEXT.md`
4. `MASTER_PLAN.md`
5. `audits/2026-07-27/GoogleWorkspace_v2_8_4_Independent_Reaudit_Report_2026-07-27.md`
6. `instructions/GoogleWorkspace_v2_8_4_Next_Remediation_Work_Prompt_2026-07-27.md`
7. `implementation/GoogleSpreadsheet/AUDIT_REMEDIATION_ROUND3_IMPLEMENTATION_REPORT.md`
8. `implementation/GoogleSpreadsheet/apps-script-v2/README.md`

## 最新監査・作業指示

- [Code 2.8.4独立再監査報告](audits/2026-07-27/GoogleWorkspace_v2_8_4_Independent_Reaudit_Report_2026-07-27.md)
- [Code 2.8.4動的再現結果](audits/2026-07-27/GoogleWorkspace_v2_8_4_reaudit_dynamic_results.json)
- [Code 2.8.4独立検証結果](audits/2026-07-27/GoogleWorkspace_v2_8_4_reaudit_verification_results.json)
- [次回修正・完全再検証指示](instructions/GoogleWorkspace_v2_8_4_Next_Remediation_Work_Prompt_2026-07-27.md)

## 可視化

- [可視化インデックス](docs/visualizations/index.html)
- [タスク管理システム 全体ワークフロー](docs/visualizations/GoogleWorkspace_v2_Workflow_Overview.html)

現在のworkflow HTMLはCode 2.8.3 / Schema 2.4時点の表示を含むため、R4-05の修正対象です。architectureの概略参照に限定し、Version・Schema・Gateの正本には使用しません。

## 主要directory

- `implementation/GoogleSpreadsheet/apps-script-v2/`: Apps Script source
- `implementation/GoogleSpreadsheet/tests/`: local regression
- `implementation/GoogleSpreadsheet/tools/`: validatorとrelease tooling
- `implementation/GoogleSpreadsheet/release/`: versioned packages
- `audits/2026-07-27/`: 独立監査・動的再現・検証結果
- `instructions/`: 作業指示
- `docs/visualizations/`: HTML可視化

## Guardrails

実Provider、OAuth、実Gmail／Calendar操作、installable edit Trigger実event、LockService実競合は`NOT EXECUTED`です。credential、実メール本文、個人情報、実Workspace ID／URLをRepositoryへ保存しません。
