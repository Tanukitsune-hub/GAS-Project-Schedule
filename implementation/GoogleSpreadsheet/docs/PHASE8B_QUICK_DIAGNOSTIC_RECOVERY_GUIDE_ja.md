# Phase 8B Quick Diagnostic blocker — 安全な再開ガイド

対象: Code `2.8.7-prepilot` / Schema `2.6` / AI Schema `2.0` / Migration `3`。
この文書は、`PHASE8B-QUICK-DIAGNOSTIC-01` の修正版 package を、承認済みの
非機密 Sandbox へ持ち込む際の安全境界だけを説明する。実 Google Workspace 操作、
OAuth、Apps Script import、Setup 実行、Gmail/Calendar 操作、deployment、
`clasp push`、Automation/trigger 有効化を、この Repository から許可するものではない。

## 記録済みの安全な観測

実 Sandbox では、Ledger visibility blocker を通過した後、S00 から S80 が記録され、
S90 Quick Diagnostic で次の四つの安全な FAIL が返った。

- `DASHBOARD_LAYOUT_OWNERSHIP`
- `TASK_PROTECTIONS`
- `BLANK_ROW_BOOLEAN_VALUES`
- `TASK_VALIDATION_TYPES`

ID、URL、アカウント、Calendar/Gmail 内容、スクリーンショット、資格情報は記録しない。
修正版の実 Workspace 再試験は `NOT_EXECUTED` である。

## 修正された契約

- Dashboard は Setup 所有の正確な sheet/header protection と三行の safe seed だけを、
  explicit refresh 前の安全な状態として認識する。foreign protection、値、formula、note、
  named range、merge、hidden state、unsafe formatting は fail-closed のままである。
- Task header は row 1 と row 2、全 50 列を一つの canonical control plane とする。
- checkbox 検証は固定リストではなく schema validation plan から導出し、
  `calendar_reconcile_required` を含む五つの checkbox を検証する。
- identity-empty の事前確保行で Sheets が materialize する canonical checkbox Boolean
  `false` だけは logical Task にせず許容する。`true`、文字列 Boolean、non-checkbox data、
  partial identity、business data は fail-closed のままである。

Quick Diagnostic は read-only であり、Task、Ledger、Dashboard を修復・更新しない。

## S00–S80 完了状態からの安全な再開条件

1. 会社PCの payload が transfer package の旧/new SHA-256 と一致することを、人が確認する。
2. package が指定する更新対象だけを差し替える。未記載ファイルは byte-identical であり、
   置換しない。
3. Setup を実行する権限が別途与えられた場合だけ、既存の S00–S80 を再確認し、S90 と
   S99 のみを resume 対象とする。
4. Gmail label、dedicated Calendar、owner edit trigger、Properties を削除、複製、
   overwrite しない。Automation は OFF、five-minute trigger は OFF のままとする。
5. 修正版 S90 が FAIL なら S90/S99 を未完了のまま停止し、safe code/stage だけを記録する。

## 絶対に行わないこと

手動で Sheet、checkbox、Protection、Dashboard、Ledger、Gmail label、Calendar、trigger、
Task data を修復しない。旧 SHA-256 が一致しない、new SHA-256 を確認できない、または
Quick Diagnostic が依然 FAIL の場合は停止し、現在の状態を上書きしない。

このガイドは Phase 8B PASS、Phase 8C GO、production ready、pilot ready を意味しない。
