# Phase 8B v2.8.8 Sandbox 再搬入資料

このフォルダはCode `2.8.8-prepilot`の非機密Phase 8B packageを、別途承認
された経路で会社PCへ搬入するためのoperator資料です。実行承認ではありません。
Automationは`OFF`のままです。

## 搬入前の確認

1. `TRANSFER_MANIFEST.md`のSource A8、Release B8、transfer self referenceを
   Gitの解決結果と照合する。
2. `TRANSFER_CHECKSUMS.sha256`でこのfolderの全non-self資料を確認する。
3. `COPY_ALLOWLIST.txt`の27 package-relative files以外をコピーしない。
4. package `CHECKSUMS.sha256`と会社PC patch manifestの旧/new SHA-256を確認
   する。1件でも不一致なら停止する。
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

これはPhase 8B PASS、Phase 8C GO、production ready、pilot readyを意味しません。
