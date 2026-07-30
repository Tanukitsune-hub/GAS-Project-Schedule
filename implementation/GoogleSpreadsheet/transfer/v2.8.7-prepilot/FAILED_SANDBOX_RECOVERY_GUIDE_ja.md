# Phase 8B Quick Diagnostic blocker — 安全な復旧ガイド

`PHASE8B-QUICK-DIAGNOSTIC-01`は、S00–S80完了後のread-only S90で発見された
High findingです。修正版の実Google Workspace再試験は`NOT_EXECUTED`です。

- Dashboardは正確なSetup-owned control planeと三行seedだけを安全と扱う。
- Task headerはrow 1–2 / 50 columns、checkboxはschemaの五fieldを使う。
- identity-empty rowではcanonical checkbox Boolean `false`だけを許容する。
- Quick DiagnosticはTask、Ledger、Dashboardを書き換えない。

S90がFAILならS90/S99を未完了のまま停止する。Task、Ledger、snapshot、note、
Protection、Dashboard、Gmail label、Calendar、triggerを手作業で直さない。
safe status/code/stageだけを記録し、実ID、URL、メール本文、credentials、
スクリーンショットは記録しない。
