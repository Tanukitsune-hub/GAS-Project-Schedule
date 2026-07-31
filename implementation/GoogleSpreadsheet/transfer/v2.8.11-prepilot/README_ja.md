# v2.8.11-prepilot — T1-01 bounded summary retransfer guide (governing)

This top section governs this T11 envelope. The copied T10 text below is
historical background only and must not be used as an execution instruction.

## Authorized scope

- Historical baseline: fixed T10 `927d8567bce64461840cc6f72fbae0c1e636a8e6`.
- New payload: direct-child Release B11 `952438907e1a09092a46127dc130b3403a911db4`.
- Read `COMPANY_PC_PATCH_MANIFEST_ja.md` and its JSON first. It is the sole
  byte-level replacement list and contains the old/new SHA-256 for every
  changed payload file and the `appsscript.json` change flag.
- This package may authorize only a controlled T1-01 Quick Diagnostic
  re-observation after a separately approved, hash-verified replacement.
  It does not authorize T1-01 PASS, T1-02, Phase 8B overall PASS, Phase 8C
  GO, production ready, or pilot ready.

## Exact safe procedure for an already completed Sandbox

1. Confirm every local current file listed in the manifest matches its **old**
   SHA-256. If any does not match, STOP; do not guess its origin.
2. Replace only the listed files in the manifest replacement order. Confirm
   each resulting file matches its **new** SHA-256. Preserve every unlisted
   file. Do not change `appsscript.json` unless the manifest says it changed.
3. Reload the project UI. Do **not** run Setup, S90, S99, Dashboard refresh,
   any test harness, Gmail, Calendar, edit handler, Worker, migration, or
   automation operation. Do not manually edit a Sheet, Task, Ledger,
   Dashboard, protection, property, label, Calendar, or trigger.
4. With separate approval, invoke only the existing Quick Diagnostic menu
   action once for T1-01. Read the top `Bounded Acceptance Summary`; do not
   rely on or save the lower detail JSON.
5. Record only the allowed bounded fields in `RESULTS_TEMPLATE_ja.md`, then
   STOP. `warn_ids_complete=false`, `fail_ids_complete=false`, malformed
   output, a genuine FAIL, an unexpected side-effect Boolean, or a hash
   mismatch is `REVIEW_REQUIRED` / STOP with no repair or retry.

Automation and the five-minute trigger remain OFF/absent. A persisted
v2.8.10 version-property mismatch must remain an explicit WARN; do not rerun
Setup or silently reconcile it.

## Historical copied T10 material (nonoperative)

このフォルダはCode `2.8.10-prepilot`の非機密Phase 8B packageを、別途承認
された経路で会社PCへ搬入するためのoperator資料です。実行承認ではありません。
Automationは`OFF`のままです。

## 搬入前の確認

1. `TRANSFER_MANIFEST.md`のSource A10、Release B10、transfer self referenceを
   Gitの解決結果と照合する。
2. `TRANSFER_CHECKSUMS.sha256`でこのfolderの全non-self資料を確認する。
3. `COPY_ALLOWLIST.txt`の27 package-relative files以外をコピーしない。
4. package `CHECKSUMS.sha256`と会社PC patch manifestの旧/new SHA-256を確認
   する。1件でも不一致なら停止する。
   manifestはfixed T9とRelease B10のraw Git blob比較だけを正とし、
   差し替えファイルを推測しない。
5. Phase 8C package、repository source/tests/tools、`.clasp.json`、credential、
   実データ、ID/URL、スクリーンショットは搬入しない。

## 安全境界

- SandboxはS00～S80 complete / S90-S99 incompleteとして保持する。
- Gmail labels、専用Calendar、Properties、owner edit trigger、Task、Ledger、
  Dashboardを手動で重複・削除・上書き・修復しない。
- 別途の実行承認なしにOAuth、Provider設定、deployment、`clasp push`、
  Setup、診断、Dashboard refresh、Gmail/Calendar操作、Automation/trigger
  有効化を行わない。
- 真正なQuick Diagnostic FAIL、hash不一致、予期しない権限要求では停止し、
  `STOP_AND_ROLLBACK_CHECKLIST_ja.md`に従う。
- `E_MODULE_VERSION_SKEW`または
  `E_DASHBOARD_NUMBER_FORMAT_POSTCONDITION`では手動修復せず停止する。

これはPhase 8B PASS、Phase 8C GO、production ready、pilot readyを意味しません。

