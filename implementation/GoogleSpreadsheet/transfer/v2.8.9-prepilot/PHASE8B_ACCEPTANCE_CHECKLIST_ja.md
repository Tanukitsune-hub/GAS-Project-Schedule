# Phase 8B v2.8.9 Sandbox 再搬入 — 受入チェックリスト

- [ ] Transfer self reference、Corrected Source A9.1、Corrected Release B9.1をGitで解決できる。
- [ ] B9.1がA9.1の直接子で、package / transfer checksumが一致する。
- [ ] `COPY_ALLOWLIST.txt`の27 filesだけが対象で、Phase 8Cは除外される。
- [ ] company-PC patch manifestの全対象fileで旧/new SHA-256が一致する。
- [ ] `appsscript.json`の変更有無をJSON manifestと照合する。
- [ ] `TEST_MODE=true`、Automation `OFF`、5分trigger `OFF`を確認する。
- [ ] S00～S80 complete / S90-S99 incompleteのresume契約を確認する。
- [ ] Gmail labels、専用Calendar、Properties、owner edit triggerを重複・
  削除・上書きしない。
- [ ] 実データ、実Gmail、実Calendar、個人情報、credential、ID/URL、
  スクリーンショットを使用・保存しない。
- [ ] 真正なFAILまたはhash不一致では手動repairせず停止する。

別途承認されるまで全実Workspace項目は`NOT_EXECUTED`です。このchecklistは
Phase 8B PASS、Phase 8C GO、production ready、pilot readyを宣言しません。

