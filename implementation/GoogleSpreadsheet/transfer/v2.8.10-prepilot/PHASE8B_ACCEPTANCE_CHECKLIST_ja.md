# Phase 8B v2.8.10 Sandbox 再搬入 — 受入チェックリスト

- [ ] Transfer self reference、Source A10、Release B10をGitで解決できる。
- [ ] B10がA10の直接子で、package / transfer checksumが一致する。
- [ ] `COPY_ALLOWLIST.txt`の27 filesだけが対象で、Phase 8Cは除外される。
- [ ] company-PC patch manifestの全対象fileで旧/new SHA-256が一致する。
- [ ] `appsscript.json`の変更有無をJSON manifestと照合する。
- [ ] patch manifestの差し替え順に従い、Config／Setup／Dashboardの
  module contractが同一Versionであることを確認する。
- [ ] `TEST_MODE=true`、Automation `OFF`、5分trigger `OFF`を確認する。
- [ ] S00～S80 complete / S90-S99 incompleteのresume契約を確認する。
- [ ] Gmail labels、専用Calendar、Properties、owner edit triggerを重複・
  削除・上書きしない。
- [ ] 実データ、実Gmail、実Calendar、個人情報、credential、ID/URL、
  スクリーンショットを使用・保存しない。
- [ ] 真正なFAILまたはhash不一致では手動repairせず停止する。
- [ ] S90結果はclosed normalization statusとwrite/flush/postcondition
  Boolean、checked/noncanonical countだけを記録する。

別途承認されるまで全実Workspace項目は`NOT_EXECUTED`です。このchecklistは
Phase 8B PASS、Phase 8C GO、production ready、pilot readyを宣言しません。

